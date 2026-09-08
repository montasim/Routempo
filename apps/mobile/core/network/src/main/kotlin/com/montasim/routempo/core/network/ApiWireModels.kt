package com.montasim.routempo.core.network

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class ApiEnvelope<T>(val data: T, val meta: ApiMeta)

@Serializable
data class ApiMeta(
    val requestId: String,
    val apiVersion: String,
    val serverTime: String,
    val total: Int? = null,
    val nextCursor: String? = null,
)

@Serializable
data class ApiProblem(
    val type: String = "about:blank",
    val title: String = "Request failed",
    val status: Int,
    val detail: String,
    val instance: String = "",
    val code: String,
    val requestId: String? = null,
    val errors: List<ApiFieldError> = emptyList(),
)

@Serializable
data class ApiFieldError(val path: String, val message: String)

class ApiException(
    val statusCode: Int,
    val problem: ApiProblem,
    val responseRequestId: String?,
) : Exception(problem.detail)

@Serializable data class UserDto(val id: String, val name: String, val email: String, val image: String? = null)
@Serializable data class SessionDto(val token: String, val expiresAt: String)
@Serializable data class AuthDataDto(val session: SessionDto, val user: UserDto)
@Serializable data class GoogleTokenRequestDto(val idToken: String, val nonce: String? = null)
@Serializable data class SocialExchangeRequestDto(val code: String, val redirectUri: String)

@Serializable
data class SettingsDto(
    val name: String,
    val timezone: String,
    val defaultReminderMinutes: Int,
    val routineRemindersEnabled: Boolean,
    val weeklySummaryEnabled: Boolean,
)

@Serializable
data class SettingsPatchDto(
    val name: String? = null,
    val timezone: String? = null,
    val defaultReminderMinutes: Int? = null,
    val routineRemindersEnabled: Boolean? = null,
    val weeklySummaryEnabled: Boolean? = null,
)

@Serializable data class CurrentUserDataDto(val user: UserDto, val settings: SettingsDto)
@Serializable data class SettingsDataDto(val settings: SettingsDto)
@Serializable data class RevokedDataDto(val revoked: Boolean)

@Serializable
data class CategoryDto(val id: String, val name: String, val routineCount: Int, val createdAt: String)
@Serializable data class CategoriesDataDto(val categories: List<CategoryDto>)
@Serializable data class CategoryDataDto(val category: CategoryDto)
@Serializable data class CategoryWriteDto(val name: String)
@Serializable data class DeletedCategoryDataDto(val deleted: Boolean, val category: CategoryDto)

@Serializable
data class RecurrenceRulesDto(
    val daysOfWeek: List<Int>? = null,
    val dayOfMonth: Int? = null,
    val month: Int? = null,
)

@Serializable
data class RoutineDto(
    val id: String,
    val title: String,
    val note: String,
    val categoryId: String,
    val categoryName: String,
    val startDate: String,
    val scheduledTime: String,
    val recurrenceType: String,
    val recurrenceRules: RecurrenceRulesDto = RecurrenceRulesDto(),
    val endDate: String? = null,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
data class RoutineWriteDto(
    val title: String,
    val note: String,
    val categoryId: String,
    val startDate: String,
    val scheduledTime: String,
    val recurrenceType: String,
    val recurrenceRules: RecurrenceRulesDto,
    val endDate: String? = null,
    val isActive: Boolean,
)

@Serializable
data class RoutinePatchDto(
    val title: String? = null,
    val note: String? = null,
    val categoryId: String? = null,
    val startDate: String? = null,
    val scheduledTime: String? = null,
    val recurrenceType: String? = null,
    val recurrenceRules: RecurrenceRulesDto? = null,
    val endDate: JsonElement? = null,
    val isActive: Boolean? = null,
)

@Serializable data class RoutinesDataDto(val routines: List<RoutineDto>)
@Serializable data class RoutineDataDto(val routine: RoutineDto)
@Serializable data class DeletedRoutineDataDto(val deleted: Boolean, val routine: RoutineDto)

@Serializable
data class OccurrenceDto(
    val id: String,
    val routineId: String,
    val title: String,
    val category: String,
    val date: String,
    val scheduledTime: String,
    val timezone: String,
    val status: String,
    val resolvedAt: String? = null,
    val updatedAt: String,
)

@Serializable data class OccurrencesDataDto(val occurrences: List<OccurrenceDto>)
@Serializable data class OccurrenceDataDto(val occurrence: OccurrenceDto)
@Serializable data class OccurrenceResolutionDto(val actualTime: String? = null, val note: String = "")
@Serializable data class OccurrenceGenerationDto(val generated: Int, val startDate: String, val endDate: String)

@Serializable
data class LogDto(
    val id: String,
    val routineId: String? = null,
    val date: String,
    val eventTime: String,
    val title: String,
    val category: String,
    val scheduledTime: String,
    val actualTime: String? = null,
    val variance: String,
    val status: String,
    val recordedAt: String,
    val actor: String,
    val source: String,
    val timezone: String,
    val note: String,
)

@Serializable
data class LogWriteDto(
    val routineId: String? = null,
    val date: String,
    val eventTime: String,
    val title: String,
    val category: String,
    val scheduledTime: String,
    val actualTime: String? = null,
    val status: String,
    val note: String,
)

@Serializable
data class LogPatchDto(
    val routineId: JsonElement? = null,
    val date: String? = null,
    val eventTime: String? = null,
    val title: String? = null,
    val category: String? = null,
    val scheduledTime: String? = null,
    val actualTime: JsonElement? = null,
    val status: String? = null,
    val note: String? = null,
)

@Serializable data class LogsDataDto(val logs: List<LogDto>)
@Serializable data class LogDataDto(val log: LogDto)
@Serializable data class DeletedLogDataDto(val deleted: Boolean, val log: LogDto)

@Serializable
data class OutcomeSummaryDto(
    val completed: Int,
    val skipped: Int,
    val missed: Int,
    val total: Int,
    val completionPercentage: Int,
    val unrecorded: Int = 0,
)

@Serializable
data class AnalyticsDayDto(
    val date: String,
    val completed: Int,
    val skipped: Int,
    val missed: Int,
    val total: Int,
    val completionPercentage: Int,
    val unrecorded: Int = 0,
)

@Serializable
data class CategoryAnalyticsDto(
    val category: String,
    val routineCount: Int,
    val completed: Int,
    val skipped: Int,
    val missed: Int,
    val total: Int,
    val completionPercentage: Int,
    val unrecorded: Int = 0,
)

@Serializable
data class AnalyticsDto(
    val startDate: String,
    val endDate: String,
    val completionPercentage: Int,
    val outcomes: OutcomeSummaryDto,
    val series: List<AnalyticsDayDto>,
    val categories: List<CategoryAnalyticsDto>,
    val generatedAt: String,
)
@Serializable data class AnalyticsDataDto(val analytics: AnalyticsDto)

@Serializable data class ProviderStateDto(val connected: Boolean, val ready: Boolean, val configured: Boolean)
@Serializable data class ProvidersDto(val google: ProviderStateDto, val microsoft: ProviderStateDto)
@Serializable data class ProvidersDataDto(val providers: ProvidersDto)
@Serializable data class IntegrationSyncRequestDto(val action: String, val provider: String, val resource: String)
@Serializable data class IntegrationSyncResultDto(
    val imported: Int? = null,
    val exported: Int? = null,
    val skipped: Int,
    val failures: List<String> = emptyList(),
)
@Serializable data class RedirectUriDto(val redirectUri: String)
@Serializable data class IntegrationConnectDto(val browserUrl: String, val expiresInSeconds: Int)
@Serializable data class DisconnectedDto(val disconnected: Boolean)
@Serializable data class RestoredDto(val restored: Boolean)

@Serializable
data class BackupArchiveDto(
    val format: String,
    val version: Int,
    val exportedAt: String,
    val data: BackupDataDto,
)
@Serializable data class BackupDataEnvelopeDto(val backup: BackupArchiveDto)

@Serializable
data class BackupDataDto(
    val routines: List<BackupRoutineDto>,
    val categories: List<String>,
    val settings: BackupSettingsDto,
    val logs: List<BackupLogDto>,
    val occurrences: List<BackupOccurrenceDto> = emptyList(),
)

@Serializable
data class BackupSettingsDto(
    val name: String,
    val timezone: String,
    val reminder: String,
    val notifications: Boolean,
    val weeklySummary: Boolean,
)

@Serializable
data class BackupRoutineDto(
    val id: String,
    val time: String,
    val title: String,
    val note: String,
    val category: String,
    val startDate: String,
    val repeat: String,
    val repeatOnDay: Int? = null,
    val repeatOnDays: List<Int>? = null,
    val repeatOnDate: Int? = null,
    val repeatOnMonth: Int? = null,
    val endDate: String? = null,
    val status: String,
    val enabled: Boolean,
)

@Serializable
data class BackupLogDto(
    val id: String,
    val date: String,
    val eventTime: String,
    val title: String,
    val category: String,
    val scheduled: String,
    val actual: String,
    val variance: String,
    val status: String,
    val recordedAt: String,
    val actor: String,
    val source: String,
    val timezone: String,
    val snapshot: String,
)

@Serializable
data class BackupOccurrenceDto(
    val routineId: String,
    val date: String,
    val status: String,
    val resolvedAt: String? = null,
    val updatedAt: String,
)
