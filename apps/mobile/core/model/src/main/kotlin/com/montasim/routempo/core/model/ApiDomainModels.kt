package com.montasim.routempo.core.model

import java.util.UUID

data class ApiPage<T>(
    val items: List<T>,
    val total: Int,
    val nextCursor: String?,
)

data class PageQuery(
    val cursor: String? = null,
    val limit: Int = 50,
) {
    init {
        require(limit in 1..200) { "limit must be between 1 and 200" }
        require(cursor == null || cursor.all(Char::isDigit)) { "cursor must be a decimal offset" }
    }
}

@JvmInline
value class IdempotencyKey(val value: String) {
    init {
        require(value.length in 8..200) { "Idempotency key must contain 8 to 200 characters" }
        require(value.all { it.code in 0x21..0x7e }) { "Idempotency key must use visible ASCII characters" }
    }

    companion object {
        fun create(): IdempotencyKey = IdempotencyKey(UUID.randomUUID().toString())
    }
}

data class BearerSession(
    val token: String,
    val expiresAt: String,
    val accountId: String? = null,
)

data class User(
    val id: String,
    val name: String,
    val email: String,
    val image: String?,
)

data class AuthResult(
    val session: BearerSession,
    val user: User,
)

data class CurrentUser(
    val user: User,
    val settings: UserSettings,
)

data class UserSettings(
    val name: String,
    val timezone: String,
    val defaultReminderMinutes: Int,
    val routineRemindersEnabled: Boolean,
    val weeklySummaryEnabled: Boolean,
)

data class SettingsPatch(
    val name: String? = null,
    val timezone: String? = null,
    val defaultReminderMinutes: Int? = null,
    val routineRemindersEnabled: Boolean? = null,
    val weeklySummaryEnabled: Boolean? = null,
) {
    init {
        require(
            name != null || timezone != null || defaultReminderMinutes != null ||
                routineRemindersEnabled != null || weeklySummaryEnabled != null,
        ) { "At least one setting is required" }
    }
}

data class Category(
    val id: String,
    val name: String,
    val routineCount: Int,
    val createdAt: String,
)

enum class RecurrenceType { NONE, DAILY, WEEKLY, MONTHLY, YEARLY }

data class RecurrenceRules(
    val daysOfWeek: List<Int>? = null,
    val dayOfMonth: Int? = null,
    val month: Int? = null,
)

data class Routine(
    val id: String,
    val title: String,
    val note: String,
    val categoryId: String,
    val categoryName: String,
    val startDate: String,
    val scheduledTime: String,
    val recurrenceType: RecurrenceType,
    val recurrenceRules: RecurrenceRules,
    val endDate: String?,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

data class RoutineWrite(
    val title: String,
    val categoryId: String,
    val startDate: String,
    val scheduledTime: String,
    val recurrenceType: RecurrenceType,
    val note: String = "",
    val recurrenceRules: RecurrenceRules = RecurrenceRules(),
    val endDate: String? = null,
    val isActive: Boolean = true,
)

data class RoutinePatch(
    val title: String? = null,
    val note: String? = null,
    val categoryId: String? = null,
    val startDate: String? = null,
    val scheduledTime: String? = null,
    val recurrenceType: RecurrenceType? = null,
    val recurrenceRules: RecurrenceRules? = null,
    val endDate: String? = null,
    val clearEndDate: Boolean = false,
    val isActive: Boolean? = null,
) {
    init {
        require(
            title != null || note != null || categoryId != null || startDate != null ||
                scheduledTime != null || recurrenceType != null || recurrenceRules != null ||
                endDate != null || clearEndDate || isActive != null,
        ) { "At least one routine field is required" }
    }
}

data class RoutineQuery(
    val includeInactive: Boolean = true,
    val categoryId: String? = null,
    val page: PageQuery = PageQuery(),
)

enum class OccurrenceStatus { PENDING, COMPLETED, SKIPPED, MISSED }

data class RoutineOccurrence(
    val id: String,
    val routineId: String,
    val title: String,
    val category: String,
    val date: String,
    val scheduledTime: String,
    val timezone: String,
    val status: OccurrenceStatus,
    val resolvedAt: String?,
    val updatedAt: String,
)

data class OccurrenceQuery(
    val date: String? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val status: OccurrenceStatus? = null,
    val page: PageQuery = PageQuery(),
)

data class OccurrenceResolution(
    val actualTime: String? = null,
    val note: String = "",
)

data class OccurrenceGeneration(
    val generated: Int,
    val startDate: String,
    val endDate: String,
)

enum class LogStatus { COMPLETED, SKIPPED, MISSED }

data class BehaviorLog(
    val id: String,
    val routineId: String?,
    val date: String,
    val eventTime: String,
    val title: String,
    val category: String,
    val scheduledTime: String,
    val actualTime: String?,
    val variance: String,
    val status: LogStatus,
    val recordedAt: String,
    val actor: String,
    val source: String,
    val timezone: String,
    val note: String,
)

data class LogWrite(
    val date: String,
    val eventTime: String,
    val title: String,
    val category: String,
    val scheduledTime: String,
    val status: LogStatus,
    val routineId: String? = null,
    val actualTime: String? = null,
    val note: String = "",
)

data class LogPatch(
    val routineId: String? = null,
    val clearRoutineId: Boolean = false,
    val date: String? = null,
    val eventTime: String? = null,
    val title: String? = null,
    val category: String? = null,
    val scheduledTime: String? = null,
    val actualTime: String? = null,
    val clearActualTime: Boolean = false,
    val status: LogStatus? = null,
    val note: String? = null,
) {
    init {
        require(
            routineId != null || clearRoutineId || date != null || eventTime != null || title != null ||
                category != null || scheduledTime != null || actualTime != null || clearActualTime ||
                status != null || note != null,
        ) { "At least one log field is required" }
    }
}

data class LogQuery(
    val startDate: String? = null,
    val endDate: String? = null,
    val routineId: String? = null,
    val category: String? = null,
    val status: LogStatus? = null,
    val page: PageQuery = PageQuery(),
)

data class OutcomeSummary(
    val completed: Int,
    val skipped: Int,
    val missed: Int,
    val total: Int,
    val completionPercentage: Int,
    val unrecorded: Int = 0,
)

data class AnalyticsDay(val date: String, val outcomes: OutcomeSummary)

data class CategoryAnalytics(
    val category: String,
    val routineCount: Int,
    val outcomes: OutcomeSummary,
)

data class Analytics(
    val startDate: String,
    val endDate: String,
    val completionPercentage: Int,
    val outcomes: OutcomeSummary,
    val series: List<AnalyticsDay>,
    val categories: List<CategoryAnalytics>,
    val generatedAt: String,
)

data class AnalyticsQuery(
    val range: Int = 7,
    val startDate: String? = null,
    val endDate: String? = null,
) {
    init {
        require(range in setOf(7, 30, 90)) { "range must be 7, 30, or 90" }
    }
}

enum class IntegrationProvider { GOOGLE, MICROSOFT }
enum class IntegrationResource { CALENDAR, TASKS }
enum class IntegrationAction { IMPORT, EXPORT }

data class ProviderState(
    val connected: Boolean,
    val ready: Boolean,
    val configured: Boolean,
)

data class IntegrationStatuses(
    val google: ProviderState,
    val microsoft: ProviderState,
)

data class IntegrationSyncResult(
    val imported: Int? = null,
    val exported: Int? = null,
    val skipped: Int,
    val failures: List<String> = emptyList(),
)

data class IntegrationConnect(
    val browserUrl: String,
    val expiresInSeconds: Int,
)

data class CsvExport(val content: String, val suggestedFilename: String?)

data class BackupArchive(
    val format: String,
    val version: Int,
    val exportedAt: String,
    val data: BackupData,
)

data class BackupData(
    val routines: List<BackupRoutine>,
    val categories: List<String>,
    val settings: BackupSettings,
    val logs: List<BackupLog>,
    val occurrences: List<BackupOccurrence> = emptyList(),
)

data class BackupSettings(
    val name: String,
    val timezone: String,
    val reminder: String,
    val notifications: Boolean,
    val weeklySummary: Boolean,
)

data class BackupRoutine(
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

data class BackupLog(
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

data class BackupOccurrence(
    val routineId: String,
    val date: String,
    val status: String,
    val resolvedAt: String?,
    val updatedAt: String,
)
