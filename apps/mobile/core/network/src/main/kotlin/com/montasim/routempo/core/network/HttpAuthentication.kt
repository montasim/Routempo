package com.montasim.routempo.core.network

import com.montasim.routempo.core.model.BearerSession
import java.time.ZoneId
import java.util.UUID
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import okhttp3.Authenticator
import okhttp3.HttpUrl
import okhttp3.Interceptor
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.Route

internal enum class AuthPolicy { PUBLIC, PROTECTED }

internal class RequestIdInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val identified = if (request.header(REQUEST_ID) == null) {
            request.newBuilder().header(REQUEST_ID, UUID.randomUUID().toString()).build()
        } else {
            request
        }
        return chain.proceed(identified)
    }
}

/** Lets the server initialize an empty first-login timezone before any dated resource is read. */
internal class DeviceTimezoneInterceptor(
    private val timezone: () -> String = { ZoneId.systemDefault().id },
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.tag(AuthPolicy::class.java) == AuthPolicy.PUBLIC || request.header(DEVICE_TIMEZONE) != null) {
            return chain.proceed(request)
        }
        return chain.proceed(request.newBuilder().header(DEVICE_TIMEZONE, timezone()).build())
    }
}

internal class BearerInterceptor(private val sessions: BearerSessionStore) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.tag(AuthPolicy::class.java) == AuthPolicy.PUBLIC || request.header("Authorization") != null) {
            return chain.proceed(request)
        }
        val session = runBlocking { sessions.read() } ?: return chain.proceed(request)
        return chain.proceed(request.newBuilder().header("Authorization", "Bearer ${session.token}").build())
    }
}

/** OkHttp invokes this concurrently; the monitor and token double-check make refresh single-flight. */
internal class RefreshingAuthenticator(
    private val baseUrl: HttpUrl,
    private val sessions: BearerSessionStore,
    private val refreshClient: OkHttpClient,
    private val json: Json,
) : Authenticator {
    private val refreshMonitor = Any()

    override fun authenticate(route: Route?, response: Response): Request? {
        if (responseCount(response) >= 2) return null
        val failedAuthorization = response.request.header("Authorization") ?: return null
        val failedToken = failedAuthorization.removePrefix("Bearer ")

        synchronized(refreshMonitor) {
            val current = runBlocking { sessions.read() } ?: return null
            if (current.token != failedToken) return response.request.withBearer(current.token)

            val refreshRequest = Request.Builder()
                .url(baseUrl.newBuilder().addPathSegments("auth/refresh").build())
                .post("".toRequestBody(JSON_MEDIA_TYPE))
                .header("Authorization", "Bearer ${current.token}")
                .header(REQUEST_ID, UUID.randomUUID().toString())
                .tag(AuthPolicy::class.java, AuthPolicy.PUBLIC)
                .build()
            var terminalAuthFailure = false
            val refreshed = runCatching {
                refreshClient.newCall(refreshRequest).execute().use { refreshResponse ->
                    if (refreshResponse.code == 401 || refreshResponse.code == 403) {
                        terminalAuthFailure = true
                        return@use null
                    }
                    if (!refreshResponse.isSuccessful) return@use null
                    val body = refreshResponse.body.string()
                    json.decodeFromString(ApiEnvelope.serializer(AuthDataDto.serializer()), body).data
                }
            }.getOrNull()

            if (refreshed == null) {
                if (terminalAuthFailure) runBlocking { sessions.clear() }
                return null
            }
            val session = BearerSession(refreshed.session.token, refreshed.session.expiresAt, refreshed.user.id)
            runBlocking { sessions.write(session) }
            return response.request.withBearer(session.token)
        }
    }

    private fun responseCount(response: Response): Int {
        var current: Response? = response
        var count = 0
        while (current != null) {
            count += 1
            current = current.priorResponse
        }
        return count
    }

    private fun Request.withBearer(token: String) = newBuilder().header("Authorization", "Bearer $token").build()
}

internal val JSON_MEDIA_TYPE = "application/json; charset=utf-8".toMediaType()
internal const val REQUEST_ID = "X-Request-Id"
internal const val DEVICE_TIMEZONE = "X-Routempo-Timezone"
