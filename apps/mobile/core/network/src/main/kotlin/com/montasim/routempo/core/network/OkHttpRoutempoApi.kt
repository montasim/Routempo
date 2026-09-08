package com.montasim.routempo.core.network

import com.montasim.routempo.core.model.Analytics
import com.montasim.routempo.core.model.AnalyticsQuery
import com.montasim.routempo.core.model.ApiPage
import com.montasim.routempo.core.model.AuthResult
import com.montasim.routempo.core.model.BackupArchive
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CsvExport
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.IdempotencyKey
import com.montasim.routempo.core.model.IntegrationAction
import com.montasim.routempo.core.model.IntegrationConnect
import com.montasim.routempo.core.model.IntegrationProvider
import com.montasim.routempo.core.model.IntegrationResource
import com.montasim.routempo.core.model.IntegrationStatuses
import com.montasim.routempo.core.model.IntegrationSyncResult
import com.montasim.routempo.core.model.LogPatch
import com.montasim.routempo.core.model.LogQuery
import com.montasim.routempo.core.model.LogWrite
import com.montasim.routempo.core.model.OccurrenceGeneration
import com.montasim.routempo.core.model.OccurrenceQuery
import com.montasim.routempo.core.model.OccurrenceResolution
import com.montasim.routempo.core.model.PageQuery
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.RoutinePatch
import com.montasim.routempo.core.model.RoutineQuery
import com.montasim.routempo.core.model.RoutineWrite
import com.montasim.routempo.core.model.SettingsPatch
import com.montasim.routempo.core.model.UserSettings
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerializationStrategy
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody

internal class OkHttpRoutempoApi(
    private val baseUrl: HttpUrl,
    private val client: OkHttpClient,
    private val sessions: BearerSessionStore,
    private val json: Json,
) : RoutempoApi {

    override fun socialSignInUrl(provider: IntegrationProvider, redirectUri: String): String =
        url("auth", "social", "start")
            .addQueryParameter("provider", provider.wire())
            .addQueryParameter("redirectUri", redirectUri)
            .build()
            .toString()

    override suspend fun signInWithGoogle(idToken: String, nonce: String?): AuthResult {
        val data = envelope(
            Request.Builder().url(url("auth", "google").build()).public().post(
                body(GoogleTokenRequestDto(idToken, nonce), GoogleTokenRequestDto.serializer()),
            ).build(),
            AuthDataDto.serializer(),
        ).data
        return data.toDomain().also { sessions.write(it.session) }
    }

    override suspend fun exchangeSocialCode(code: String, redirectUri: String): AuthResult {
        val data = envelope(
            Request.Builder().url(url("auth", "social", "exchange").build()).public().post(
                body(SocialExchangeRequestDto(code, redirectUri), SocialExchangeRequestDto.serializer()),
            ).build(),
            AuthDataDto.serializer(),
        ).data
        return data.toDomain().also { sessions.write(it.session) }
    }

    override suspend fun currentUser(): CurrentUser = envelope(
        get("auth", "me"),
        CurrentUserDataDto.serializer(),
    ).data.toDomain()

    override suspend fun logout(idempotencyKey: IdempotencyKey): Boolean {
        val revoked = envelope(
            mutation(Request.Builder().url(url("auth", "logout").build()).post(EMPTY_BODY), idempotencyKey),
            RevokedDataDto.serializer(),
        ).data.revoked
        sessions.clear()
        return revoked
    }

    override suspend fun settings(): UserSettings = envelope(
        get("settings"), SettingsDataDto.serializer(),
    ).data.settings.toDomain()

    override suspend fun updateSettings(patch: SettingsPatch, idempotencyKey: IdempotencyKey): UserSettings =
        envelope(
            mutation(
                Request.Builder().url(url("settings").build()).patch(body(patch.toDto(), SettingsPatchDto.serializer())),
                idempotencyKey,
            ),
            SettingsDataDto.serializer(),
        ).data.settings.toDomain()

    override suspend fun categories(page: PageQuery): ApiPage<Category> {
        val request = Request.Builder().url(url("categories").page(page).build()).get().build()
        val result = envelope(request, CategoriesDataDto.serializer())
        val values = result.data.categories.map { it.toDomain() }
        return ApiPage(values, result.meta.total ?: values.size, result.meta.nextCursor)
    }

    override suspend fun createCategory(name: String, idempotencyKey: IdempotencyKey): Category = envelope(
        mutation(
            Request.Builder().url(url("categories").build()).post(body(CategoryWriteDto(name), CategoryWriteDto.serializer())),
            idempotencyKey,
        ),
        CategoryDataDto.serializer(),
    ).data.category.toDomain()

    override suspend fun renameCategory(id: String, name: String, idempotencyKey: IdempotencyKey): Category = envelope(
        mutation(
            Request.Builder().url(url("categories", id).build()).patch(body(CategoryWriteDto(name), CategoryWriteDto.serializer())),
            idempotencyKey,
        ),
        CategoryDataDto.serializer(),
    ).data.category.toDomain()

    override suspend fun deleteCategory(id: String, idempotencyKey: IdempotencyKey): Category = envelope(
        mutation(Request.Builder().url(url("categories", id).build()).delete(), idempotencyKey),
        DeletedCategoryDataDto.serializer(),
    ).data.category.toDomain()

    override suspend fun routines(query: RoutineQuery): ApiPage<Routine> {
        val target = url("routines")
            .addQueryParameter("includeInactive", query.includeInactive.toString())
            .apply { query.categoryId?.let { addQueryParameter("categoryId", it) } }
            .page(query.page)
            .build()
        val result = envelope(Request.Builder().url(target).get().build(), RoutinesDataDto.serializer())
        val values = result.data.routines.map { it.toDomain() }
        return ApiPage(values, result.meta.total ?: values.size, result.meta.nextCursor)
    }

    override suspend fun createRoutine(routine: RoutineWrite, idempotencyKey: IdempotencyKey): Routine = envelope(
        mutation(
            Request.Builder().url(url("routines").build()).post(body(routine.toDto(), RoutineWriteDto.serializer())),
            idempotencyKey,
        ), RoutineDataDto.serializer(),
    ).data.routine.toDomain()

    override suspend fun updateRoutine(id: String, patch: RoutinePatch, idempotencyKey: IdempotencyKey): Routine = envelope(
        mutation(
            Request.Builder().url(url("routines", id).build()).patch(body(patch.toDto(), RoutinePatchDto.serializer())),
            idempotencyKey,
        ), RoutineDataDto.serializer(),
    ).data.routine.toDomain()

    override suspend fun deleteRoutine(id: String, idempotencyKey: IdempotencyKey): Routine = envelope(
        mutation(Request.Builder().url(url("routines", id).build()).delete(), idempotencyKey),
        DeletedRoutineDataDto.serializer(),
    ).data.routine.toDomain()

    override suspend fun occurrences(query: OccurrenceQuery): ApiPage<RoutineOccurrence> {
        val target = url("occurrences").apply {
            query.date?.let { addQueryParameter("date", it) }
            query.startDate?.let { addQueryParameter("startDate", it) }
            query.endDate?.let { addQueryParameter("endDate", it) }
            query.status?.let { addQueryParameter("status", it.name.lowercase()) }
        }.page(query.page).build()
        val result = envelope(Request.Builder().url(target).get().build(), OccurrencesDataDto.serializer())
        val values = result.data.occurrences.map { it.toDomain() }
        return ApiPage(values, result.meta.total ?: values.size, result.meta.nextCursor)
    }

    override suspend fun generateOccurrences(idempotencyKey: IdempotencyKey): OccurrenceGeneration = envelope(
        mutation(Request.Builder().url(url("occurrences", "generate").build()).post(EMPTY_BODY), idempotencyKey),
        OccurrenceGenerationDto.serializer(),
    ).data.toDomain()

    override suspend fun completeOccurrence(
        id: String,
        resolution: OccurrenceResolution,
        idempotencyKey: IdempotencyKey,
    ) = resolveOccurrence(id, "complete", resolution, idempotencyKey)

    override suspend fun skipOccurrence(
        id: String,
        resolution: OccurrenceResolution,
        idempotencyKey: IdempotencyKey,
    ) = resolveOccurrence(id, "skip", resolution, idempotencyKey)

    private suspend fun resolveOccurrence(
        id: String,
        action: String,
        resolution: OccurrenceResolution,
        idempotencyKey: IdempotencyKey,
    ): RoutineOccurrence = envelope(
        mutation(
            Request.Builder().url(url("occurrences", id, action).build()).post(
                body(resolution.toDto(), OccurrenceResolutionDto.serializer()),
            ), idempotencyKey,
        ), OccurrenceDataDto.serializer(),
    ).data.occurrence.toDomain()

    override suspend fun revertOccurrence(id: String, idempotencyKey: IdempotencyKey): RoutineOccurrence = envelope(
        mutation(Request.Builder().url(url("occurrences", id, "revert").build()).post(EMPTY_BODY), idempotencyKey),
        OccurrenceDataDto.serializer(),
    ).data.occurrence.toDomain()

    override suspend fun logs(query: LogQuery): ApiPage<BehaviorLog> {
        val target = url("logs").apply {
            query.startDate?.let { addQueryParameter("startDate", it) }
            query.endDate?.let { addQueryParameter("endDate", it) }
            query.routineId?.let { addQueryParameter("routineId", it) }
            query.category?.let { addQueryParameter("category", it) }
            query.status?.let { addQueryParameter("status", it.name.lowercase()) }
        }.page(query.page).build()
        val result = envelope(Request.Builder().url(target).get().build(), LogsDataDto.serializer())
        val values = result.data.logs.map { it.toDomain() }
        return ApiPage(values, result.meta.total ?: values.size, result.meta.nextCursor)
    }

    override suspend fun createLog(log: LogWrite, idempotencyKey: IdempotencyKey): BehaviorLog = envelope(
        mutation(
            Request.Builder().url(url("logs").build()).post(body(log.toDto(), LogWriteDto.serializer())),
            idempotencyKey,
        ), LogDataDto.serializer(),
    ).data.log.toDomain()

    override suspend fun updateLog(id: String, patch: LogPatch, idempotencyKey: IdempotencyKey): BehaviorLog = envelope(
        mutation(
            Request.Builder().url(url("logs", id).build()).patch(body(patch.toDto(), LogPatchDto.serializer())),
            idempotencyKey,
        ), LogDataDto.serializer(),
    ).data.log.toDomain()

    override suspend fun deleteLog(id: String, idempotencyKey: IdempotencyKey): BehaviorLog = envelope(
        mutation(Request.Builder().url(url("logs", id).build()).delete(), idempotencyKey),
        DeletedLogDataDto.serializer(),
    ).data.log.toDomain()

    override suspend fun analytics(query: AnalyticsQuery): Analytics {
        val target = url("analytics").addQueryParameter("range", query.range.toString()).apply {
            query.startDate?.let { addQueryParameter("startDate", it) }
            query.endDate?.let { addQueryParameter("endDate", it) }
        }.build()
        return envelope(Request.Builder().url(target).get().build(), AnalyticsDataDto.serializer()).data.analytics.toDomain()
    }

    override suspend fun backup(): BackupArchive = envelope(
        get("backup"), BackupDataEnvelopeDto.serializer(),
    ).data.backup.toDomain()

    override fun encodeBackup(archive: BackupArchive): String =
        json.encodeToString(BackupArchiveDto.serializer(), archive.toDto())

    override fun decodeBackup(content: String): BackupArchive =
        json.decodeFromString(BackupArchiveDto.serializer(), content).toDomain()

    override suspend fun restoreBackup(archive: BackupArchive, idempotencyKey: IdempotencyKey) {
        envelope(
            mutation(
                Request.Builder().url(url("backup").build()).put(body(archive.toDto(), BackupArchiveDto.serializer())),
                idempotencyKey,
            ), RestoredDto.serializer(),
        )
    }

    override suspend fun exportLogs(startDate: String?, endDate: String?): CsvExport {
        val target = url("export").apply {
            startDate?.let { addQueryParameter("startDate", it) }
            endDate?.let { addQueryParameter("endDate", it) }
        }.build()
        return withContext(Dispatchers.IO) {
            client.newCall(Request.Builder().url(target).get().build()).execute().use { response ->
                val value = response.body.string()
                if (!response.isSuccessful) throwProblem(response.code, response.header(REQUEST_ID), value)
                CsvExport(value, response.header("Content-Disposition")?.filename())
            }
        }
    }

    override suspend fun integrationStatuses(): IntegrationStatuses = envelope(
        get("integrations"), ProvidersDataDto.serializer(),
    ).data.providers.toDomain()

    override suspend fun syncIntegration(
        action: IntegrationAction,
        provider: IntegrationProvider,
        resource: IntegrationResource,
        idempotencyKey: IdempotencyKey,
    ): IntegrationSyncResult = envelope(
        mutation(
            Request.Builder().url(url("integrations").build()).post(
                body(
                    IntegrationSyncRequestDto(action.name.lowercase(), provider.wire(), resource.name.lowercase()),
                    IntegrationSyncRequestDto.serializer(),
                ),
            ), idempotencyKey,
        ), IntegrationSyncResultDto.serializer(),
    ).data.toDomain()

    override suspend fun createIntegrationConnect(
        provider: IntegrationProvider,
        redirectUri: String,
        idempotencyKey: IdempotencyKey,
    ): IntegrationConnect = envelope(
        mutation(
            Request.Builder().url(url("integrations", provider.wire(), "connect").build()).post(
                body(RedirectUriDto(redirectUri), RedirectUriDto.serializer()),
            ), idempotencyKey,
        ), IntegrationConnectDto.serializer(),
    ).data.toDomain()

    override suspend fun disconnectIntegration(
        provider: IntegrationProvider,
        idempotencyKey: IdempotencyKey,
    ): Boolean = envelope(
        mutation(Request.Builder().url(url("integrations", provider.wire()).build()).delete(), idempotencyKey),
        DisconnectedDto.serializer(),
    ).data.disconnected

    private fun get(vararg path: String): Request = Request.Builder().url(url(*path).build()).get().build()

    private fun url(vararg path: String): HttpUrl.Builder = baseUrl.newBuilder().apply {
        path.forEach(::addPathSegment)
    }

    private fun HttpUrl.Builder.page(page: PageQuery): HttpUrl.Builder = apply {
        page.cursor?.let { addQueryParameter("cursor", it) }
        addQueryParameter("limit", page.limit.toString())
    }

    private fun mutation(builder: Request.Builder, key: IdempotencyKey): Request =
        builder.header("Idempotency-Key", key.value).build()

    private fun Request.Builder.public(): Request.Builder = tag(AuthPolicy::class.java, AuthPolicy.PUBLIC)

    private fun <T> body(value: T, serializer: SerializationStrategy<T>): RequestBody =
        json.encodeToString(serializer, value).toRequestBody(JSON_MEDIA_TYPE)

    private suspend fun <T> envelope(
        request: Request,
        serializer: KSerializer<T>,
    ): ApiEnvelope<T> = withContext(Dispatchers.IO) {
        client.newCall(request).execute().use { response ->
            val value = response.body.string()
            if (!response.isSuccessful) throwProblem(response.code, response.header(REQUEST_ID), value)
            runCatching { json.decodeFromString(ApiEnvelope.serializer(serializer), value) }
                .getOrElse {
                    val requestId = response.header(REQUEST_ID)
                    throw ApiException(
                        response.code,
                        ApiProblem(
                            status = response.code,
                            detail = "The server returned an unreadable success response",
                            code = "INVALID_SUCCESS_RESPONSE",
                            requestId = requestId,
                        ),
                        requestId,
                    )
                }
        }
    }

    private fun throwProblem(status: Int, requestId: String?, value: String): Nothing {
        val decoded = runCatching { json.decodeFromString(ApiProblem.serializer(), value) }.getOrElse {
            ApiProblem(status = status, detail = "The server returned an unreadable error response", code = "HTTP_$status", requestId = requestId)
        }
        throw ApiException(status, decoded, requestId ?: decoded.requestId)
    }

    private fun IntegrationProvider.wire() = name.lowercase()
    private fun String.filename(): String? = Regex("filename=\"?([^\";]+)").find(this)?.groupValues?.getOrNull(1)

    private companion object {
        val EMPTY_BODY = ByteArray(0).toRequestBody(null)
    }
}
