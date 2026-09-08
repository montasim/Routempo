package com.montasim.routempo.core.network

import com.montasim.routempo.core.model.BearerSession
import com.montasim.routempo.core.model.AnalyticsQuery
import com.montasim.routempo.core.model.IdempotencyKey
import com.montasim.routempo.core.model.PageQuery
import com.montasim.routempo.core.model.RoutinePatch
import java.util.concurrent.atomic.AtomicInteger
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import okhttp3.mockwebserver.Dispatcher
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import okhttp3.mockwebserver.RecordedRequest
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class OkHttpRoutempoApiTest {
    private lateinit var server: MockWebServer
    private lateinit var sessions: InMemoryBearerSessionStore
    private lateinit var api: RoutempoApi

    @Before
    fun setUp() {
        server = MockWebServer().apply { start() }
        sessions = InMemoryBearerSessionStore(BearerSession("old-session-token", "2026-08-13T00:00:00.000Z"))
        api = RoutempoNetwork.create(server.url("/api/v1/").toString(), sessions)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `maps a paged envelope and adds bearer and request id`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200).setBody(fixture("categories-page.json")))

        val page = api.categories(PageQuery(cursor = "1", limit = 1))

        assertEquals(3, page.total)
        assertEquals("2", page.nextCursor)
        assertEquals("Learning", page.items.single().name)
        val request = server.takeRequest()
        assertEquals("Bearer old-session-token", request.getHeader("Authorization"))
        assertNotNull(request.getHeader("X-Request-Id"))
        assertNotNull(request.getHeader("X-Routempo-Timezone"))
        assertEquals("1", request.requestUrl?.queryParameter("cursor"))
        assertEquals("1", request.requestUrl?.queryParameter("limit"))
    }

    @Test
    fun `reuses the exact caller supplied idempotency key and request body`() = runBlocking {
        repeat(2) { server.enqueue(MockResponse().setResponseCode(201).setBody(fixture("category.json"))) }
        val key = IdempotencyKey("logical-create-learning")

        api.createCategory("Learning", key)
        api.createCategory("Learning", key)

        val first = server.takeRequest()
        val retry = server.takeRequest()
        assertEquals(key.value, first.getHeader("Idempotency-Key"))
        assertEquals(key.value, retry.getHeader("Idempotency-Key"))
        assertEquals(first.body.readUtf8(), retry.body.readUtf8())
    }

    @Test
    fun `public sign in omits an existing bearer and saves the returned session`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200).setBody(fixture("auth-refresh.json")))

        val result = api.signInWithGoogle("a-valid-google-id-token-value")

        assertEquals("new-session-token", result.session.token)
        assertEquals("new-session-token", sessions.read()?.token)
        assertEquals("user-1", sessions.read()?.accountId)
        assertEquals(null, server.takeRequest().getHeader("Authorization"))
    }

    @Test
    fun `clear end date is encoded as explicit null while absent fields stay omitted`() {
        val encoded = RoutempoNetwork.defaultJson.encodeToString(
            RoutinePatchDto.serializer(),
            RoutinePatch(clearEndDate = true).toDto(),
        )

        assertEquals("{\"endDate\":null}", encoded)
    }

    @Test
    fun `maps scheduled and unrecorded analytics outcomes`() = runBlocking {
        server.enqueue(MockResponse().setResponseCode(200).setBody(fixture("analytics.json")))

        val analytics = api.analytics(AnalyticsQuery(range = 7))

        assertEquals(4, analytics.outcomes.total)
        assertEquals(1, analytics.outcomes.unrecorded)
        assertEquals(1, analytics.series.single().outcomes.unrecorded)
        assertEquals(1, analytics.categories.single().outcomes.unrecorded)
        assertEquals("7", server.takeRequest().requestUrl?.queryParameter("range"))
    }

    @Test
    fun `decodes field problems without losing request diagnostics`() = runBlocking {
        server.enqueue(
            MockResponse().setResponseCode(422)
                .setHeader("Content-Type", "application/problem+json")
                .setHeader("X-Request-Id", "header-request")
                .setBody(fixture("problem-validation.json")),
        )

        val error = runCatching { api.createCategory("", IdempotencyKey.create()) }.exceptionOrNull()

        assertTrue(error is ApiException)
        error as ApiException
        assertEquals("VALIDATION_ERROR", error.problem.code)
        assertEquals("recurrenceRules.daysOfWeek", error.problem.errors.single().path)
        assertEquals("header-request", error.responseRequestId)
    }

    @Test
    fun `wraps malformed success envelopes as a protocol problem`() = runBlocking {
        server.enqueue(
            MockResponse().setResponseCode(200)
                .setHeader("X-Request-Id", "broken-success")
                .setBody("{\"data\":{}}"),
        )

        val error = runCatching { api.settings() }.exceptionOrNull()

        assertTrue(error is ApiException)
        error as ApiException
        assertEquals("INVALID_SUCCESS_RESPONSE", error.problem.code)
        assertEquals("broken-success", error.responseRequestId)
    }

    @Test
    fun `collapses concurrent unauthorized responses into one refresh`() = runBlocking {
        val refreshes = AtomicInteger()
        server.dispatcher = object : Dispatcher() {
            override fun dispatch(request: RecordedRequest): MockResponse = when (request.requestUrl?.encodedPath) {
                "/api/v1/auth/refresh" -> {
                    refreshes.incrementAndGet()
                    Thread.sleep(100)
                    MockResponse().setResponseCode(200).setBody(fixture("auth-refresh.json"))
                }
                "/api/v1/settings" -> if (request.getHeader("Authorization") == "Bearer old-session-token") {
                    MockResponse().setResponseCode(401).setBody(
                        """{"type":"about:blank","title":"Unauthorized","status":401,"detail":"expired","instance":"/api/v1/settings","code":"UNAUTHORIZED"}""",
                    )
                } else {
                    MockResponse().setResponseCode(200).setBody(fixture("settings.json"))
                }
                else -> MockResponse().setResponseCode(404)
            }
        }

        val values = listOf(async { api.settings() }, async { api.settings() }).awaitAll()

        assertEquals(1, refreshes.get())
        assertEquals(listOf("Asia/Dhaka", "Asia/Dhaka"), values.map { it.timezone })
        assertEquals("new-session-token", sessions.read()?.token)
        assertEquals("user-1", sessions.read()?.accountId)
    }

    @Test
    fun `transient refresh failure preserves the bound session for retry`() = runBlocking {
        sessions.write(BearerSession("old-session-token", "2026-08-13T00:00:00.000Z", "user-1"))
        server.enqueue(MockResponse().setResponseCode(401).setBody(unauthorizedBody()))
        server.enqueue(MockResponse().setResponseCode(503).setBody("service unavailable"))

        runCatching { api.settings() }

        assertEquals("old-session-token", sessions.read()?.token)
        assertEquals("user-1", sessions.read()?.accountId)
    }

    @Test
    fun `terminal refresh rejection clears the session`() = runBlocking {
        sessions.write(BearerSession("old-session-token", "2026-08-13T00:00:00.000Z", "user-1"))
        server.enqueue(MockResponse().setResponseCode(401).setBody(unauthorizedBody()))
        server.enqueue(MockResponse().setResponseCode(401).setBody(unauthorizedBody()))

        runCatching { api.settings() }

        assertEquals(null, sessions.read())
    }

    private fun unauthorizedBody() =
        """{"type":"about:blank","title":"Unauthorized","status":401,"detail":"expired","instance":"/api/v1/settings","code":"UNAUTHORIZED"}"""

    private fun fixture(name: String): String = checkNotNull(
        javaClass.classLoader?.getResource("fixtures/$name"),
    ).readText()
}
