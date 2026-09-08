package com.montasim.routempo.feature.review

import androidx.compose.runtime.Immutable
import com.montasim.routempo.core.model.Analytics
import com.montasim.routempo.core.model.AnalyticsQuery
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.CategoryAnalytics
import com.montasim.routempo.core.model.LogPatch
import com.montasim.routempo.core.model.LogQuery
import com.montasim.routempo.core.model.LogStatus
import com.montasim.routempo.core.model.LogWrite
import com.montasim.routempo.core.model.OutcomeSummary
import com.montasim.routempo.core.model.PageQuery
import java.time.LocalDate
import java.time.LocalTime
import java.util.Locale
import kotlin.math.roundToInt

enum class ReviewTab { INSIGHTS, LOGS }

enum class ReviewSurfaceState { LOADING, FAILURE, EMPTY, CONTENT }

enum class InsightsEmptyReason { NO_ACCOUNT_ACTIVITY, NO_OUTCOMES_IN_RANGE }

enum class InsightsRange(val days: Int, val label: String) {
    SEVEN(7, "7 days"),
    THIRTY(30, "30 days"),
    NINETY(90, "90 days"),
}

@Immutable
data class InsightsUiState(
    val range: InsightsRange = InsightsRange.SEVEN,
    val analytics: Analytics? = null,
    val hasLoaded: Boolean = false,
    val emptyReason: InsightsEmptyReason = InsightsEmptyReason.NO_OUTCOMES_IN_RANGE,
    val isLoading: Boolean = false,
    val isStale: Boolean = false,
    val errorMessage: String? = null,
)

@Immutable
data class LogFilters(
    val startDate: String = "",
    val endDate: String = "",
    val routineId: String? = null,
    val category: String? = null,
    val status: LogStatus? = null,
) {
    val isActive: Boolean
        get() = startDate.isNotBlank() || endDate.isNotBlank() || routineId != null || category != null || status != null
}

enum class LogFilterField { START_DATE, END_DATE }

@Immutable
data class LogFilterValidation(
    val errors: Map<LogFilterField, String> = emptyMap(),
) {
    val isValid: Boolean get() = errors.isEmpty()
    operator fun get(field: LogFilterField): String? = errors[field]
}

@Immutable
data class LogFilterOption(val value: String, val label: String)

@Immutable
data class LogOutcomeCounts(
    val all: Int = 0,
    val completed: Int = 0,
    val skipped: Int = 0,
    val missed: Int = 0,
)

@Immutable
data class LogDraft(
    val routineId: String? = null,
    val date: String = "",
    val eventTime: String = "",
    val title: String = "",
    val category: String = "",
    val scheduledTime: String = "",
    val actualTime: String = "",
    val status: LogStatus = LogStatus.COMPLETED,
    val note: String = "",
)

@Immutable
data class LogValidation(
    val errors: Map<LogField, String> = emptyMap(),
) {
    val isValid: Boolean get() = errors.isEmpty()
    operator fun get(field: LogField): String? = errors[field]
}

enum class LogField { DATE, EVENT_TIME, TITLE, CATEGORY, SCHEDULED_TIME, ACTUAL_TIME, NOTE }

@Immutable
data class LogEditorUiState(
    val logId: String? = null,
    val draft: LogDraft = LogDraft(),
    val validation: LogValidation = LogValidation(),
    val showValidation: Boolean = false,
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
)

@Immutable
data class LogsUiState(
    val logs: List<BehaviorLog> = emptyList(),
    val hasLoaded: Boolean = false,
    val outcomeCounts: LogOutcomeCounts? = null,
    val filters: LogFilters = LogFilters(),
    val filtersExpanded: Boolean = false,
    val categoryOptions: List<String> = emptyList(),
    val routineOptions: List<LogFilterOption> = emptyList(),
    val selectedLog: BehaviorLog? = null,
    val editor: LogEditorUiState? = null,
    val deleteCandidate: BehaviorLog? = null,
    val isDeleting: Boolean = false,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val isStale: Boolean = false,
    val errorMessage: String? = null,
    val nextCursor: String? = null,
    val isLoadingNextPage: Boolean = false,
    val paginationErrorMessage: String? = null,
)

@Immutable
data class ReviewUiState(
    val selectedTab: ReviewTab = ReviewTab.INSIGHTS,
    val insights: InsightsUiState = InsightsUiState(),
    val logs: LogsUiState = LogsUiState(),
)

sealed interface ReviewEvent {
    data class SelectTab(val tab: ReviewTab) : ReviewEvent
    data class SelectInsightsRange(val range: InsightsRange) : ReviewEvent
    data object RetryInsights : ReviewEvent
    data object RefreshInsights : ReviewEvent

    data object ToggleLogFilters : ReviewEvent
    data class ChangeLogFilters(val filters: LogFilters) : ReviewEvent
    data object ApplyLogFilters : ReviewEvent
    data object ClearLogFilters : ReviewEvent
    data object RefreshLogs : ReviewEvent
    data object RetryLogs : ReviewEvent
    data object LoadMoreLogs : ReviewEvent
    data object RetryLogPage : ReviewEvent

    data class OpenLog(val log: BehaviorLog) : ReviewEvent
    data object CloseLogDetails : ReviewEvent
    data object AddLog : ReviewEvent
    data class EditLog(val log: BehaviorLog) : ReviewEvent
    data object DismissLogEditor : ReviewEvent
    data class ChangeLogDraft(val draft: LogDraft) : ReviewEvent
    data object SaveLog : ReviewEvent
    data class RequestDeleteLog(val log: BehaviorLog) : ReviewEvent
    data object CancelDeleteLog : ReviewEvent
    data object ConfirmDeleteLog : ReviewEvent
}

fun validateLogDraft(draft: LogDraft): LogValidation {
    val errors = buildMap {
        if (runCatching { LocalDate.parse(draft.date) }.isFailure) put(LogField.DATE, "Use YYYY-MM-DD")
        if (!isTime(draft.eventTime)) put(LogField.EVENT_TIME, "Use 24-hour HH:mm")
        if (draft.title.trim().isEmpty()) put(LogField.TITLE, "Title is required")
        else if (draft.title.trim().length > 100) put(LogField.TITLE, "Use 100 characters or fewer")
        if (draft.category.trim().isEmpty()) put(LogField.CATEGORY, "Category is required")
        else if (draft.category.trim().length > 60) put(LogField.CATEGORY, "Use 60 characters or fewer")
        if (!isTime(draft.scheduledTime)) put(LogField.SCHEDULED_TIME, "Use 24-hour HH:mm")
        if (draft.actualTime.isNotBlank() && !isTime(draft.actualTime)) put(LogField.ACTUAL_TIME, "Use 24-hour HH:mm")
        if (draft.note.trim().length > 240) put(LogField.NOTE, "Use 240 characters or fewer")
    }
    return LogValidation(errors)
}

fun validateLogFilters(filters: LogFilters): LogFilterValidation {
    val startDate = filters.startDate.parseOptionalDate()
    val endDate = filters.endDate.parseOptionalDate()
    val errors = buildMap {
        if (filters.startDate.isNotBlank() && startDate == null) {
            put(LogFilterField.START_DATE, "Use YYYY-MM-DD")
        }
        if (filters.endDate.isNotBlank() && endDate == null) {
            put(LogFilterField.END_DATE, "Use YYYY-MM-DD")
        } else if (startDate != null && endDate != null && endDate < startDate) {
            put(LogFilterField.END_DATE, "End date must be on or after start date")
        }
    }
    return LogFilterValidation(errors)
}

fun LogDraft.toLogWriteOrNull(): LogWrite? {
    if (!validateLogDraft(this).isValid) return null
    return LogWrite(
        routineId = routineId,
        date = date,
        eventTime = eventTime,
        title = title.trim(),
        category = category.trim(),
        scheduledTime = scheduledTime,
        actualTime = actualTime.ifBlank { null },
        status = status,
        note = note.trim(),
    )
}

fun LogDraft.toLogPatchOrNull(): LogPatch? {
    if (!validateLogDraft(this).isValid) return null
    return LogPatch(
        routineId = routineId,
        clearRoutineId = routineId == null,
        date = date,
        eventTime = eventTime,
        title = title.trim(),
        category = category.trim(),
        scheduledTime = scheduledTime,
        actualTime = actualTime.ifBlank { null },
        clearActualTime = actualTime.isBlank(),
        status = status,
        note = note.trim(),
    )
}

fun LogFilters.toQueryOrNull(cursor: String? = null, limit: Int = 50): LogQuery? {
    if (!validateLogFilters(this).isValid) return null
    return LogQuery(
        startDate = startDate.ifBlank { null },
        endDate = endDate.ifBlank { null },
        routineId = routineId,
        category = category,
        status = status,
        page = PageQuery(cursor, limit),
    )
}

fun LogFilters.toQuery(cursor: String? = null, limit: Int = 50): LogQuery =
    requireNotNull(toQueryOrNull(cursor, limit)) { "Log filters contain an invalid date range" }

fun InsightsRange.toQuery() = AnalyticsQuery(range = days)

fun BehaviorLog.toDraft() = LogDraft(
    routineId = routineId,
    date = date,
    eventTime = eventTime,
    title = title,
    category = category,
    scheduledTime = scheduledTime,
    actualTime = actualTime.orEmpty(),
    status = status,
    note = note,
)

fun filterLogs(logs: List<BehaviorLog>, filters: LogFilters): List<BehaviorLog> = logs.filter { log ->
    (filters.startDate.isBlank() || log.date >= filters.startDate) &&
        (filters.endDate.isBlank() || log.date <= filters.endDate) &&
        (filters.routineId == null || log.routineId == filters.routineId) &&
        (filters.category == null || log.category.equals(filters.category, ignoreCase = true)) &&
        (filters.status == null || log.status == filters.status)
}

fun summarizeLogs(logs: List<BehaviorLog>): OutcomeSummary {
    val completed = logs.count { it.status == LogStatus.COMPLETED }
    val skipped = logs.count { it.status == LogStatus.SKIPPED }
    val missed = logs.count { it.status == LogStatus.MISSED }
    val total = logs.size
    return OutcomeSummary(
        completed = completed,
        skipped = skipped,
        missed = missed,
        total = total,
        completionPercentage = if (total == 0) 0 else (completed * 100.0 / total).roundToInt(),
    )
}

fun countLogOutcomes(logs: List<BehaviorLog>): LogOutcomeCounts {
    val summary = summarizeLogs(logs)
    return LogOutcomeCounts(
        all = summary.total,
        completed = summary.completed,
        skipped = summary.skipped,
        missed = summary.missed,
    )
}

fun InsightsUiState.surfaceState(): ReviewSurfaceState = when {
    analytics != null && analytics.outcomes.total > 0 -> ReviewSurfaceState.CONTENT
    analytics != null -> ReviewSurfaceState.EMPTY
    errorMessage != null && !isStale -> ReviewSurfaceState.FAILURE
    isStale || hasLoaded -> ReviewSurfaceState.EMPTY
    else -> ReviewSurfaceState.LOADING
}

fun LogsUiState.surfaceState(): ReviewSurfaceState = when {
    logs.isNotEmpty() -> ReviewSurfaceState.CONTENT
    errorMessage != null && !isStale -> ReviewSurfaceState.FAILURE
    isStale -> ReviewSurfaceState.EMPTY
    isLoading || !hasLoaded -> ReviewSurfaceState.LOADING
    else -> ReviewSurfaceState.EMPTY
}

fun sortedCategoryAnalytics(categories: List<CategoryAnalytics>): List<CategoryAnalytics> =
    categories.sortedWith(
        compareByDescending<CategoryAnalytics> { it.outcomes.total }
            .thenBy { it.category.lowercase(Locale.ROOT) }
            .thenBy { it.category },
    )

fun sortedCategoryLabels(categories: List<String>): List<String> =
    categories
        .asSequence()
        .map(String::trim)
        .filter(String::isNotEmpty)
        .sortedWith(compareBy<String> { it.lowercase(Locale.ROOT) }.thenBy { it })
        .distinctBy { it.lowercase(Locale.ROOT) }
        .toList()

private fun String.parseOptionalDate(): LocalDate? =
    if (isBlank()) null else runCatching { LocalDate.parse(this) }.getOrNull()

private fun isTime(value: String): Boolean =
    value.matches(Regex("^([01]\\d|2[0-3]):[0-5]\\d$")) && runCatching { LocalTime.parse(value) }.isSuccess
