package com.montasim.routempo.core.model

import java.text.Normalizer
import java.time.DateTimeException
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle
import java.util.Locale

const val ROUTEMPO_BACKUP_FORMAT = "routempo-data-export"
const val ROUTEMPO_BACKUP_VERSION = 1

enum class BackupValidationCode {
    UNSUPPORTED_FORMAT,
    UNSUPPORTED_VERSION,
    INVALID_VALUE,
    TOO_MANY_ITEMS,
    DUPLICATE_ID,
    DUPLICATE_CATEGORY,
    MISSING_REFERENCE,
    INVALID_RECURRENCE,
}

data class BackupValidationIssue(
    val code: BackupValidationCode,
    val path: String,
    val message: String,
)

/** Side effects of a successful restore which are not represented by [BackupArchive]. */
enum class BackupRestoreImplication {
    /** Existing Google/Microsoft item-to-routine sync links are discarded by restore. */
    PROVIDER_SYNC_LINKS_RESET,
}

data class BackupPreflightResult(
    val issues: List<BackupValidationIssue>,
    val implications: Set<BackupRestoreImplication>,
) {
    val canRestore: Boolean get() = issues.isEmpty()
}

/**
 * Validates a decoded archive without I/O or mutation. Call this before showing restore
 * confirmation and again immediately before sending the archive to the server.
 */
fun BackupArchive.validateForRestore(): BackupPreflightResult {
    val issues = mutableListOf<BackupValidationIssue>()
    fun issue(code: BackupValidationCode, path: String, message: String) {
        issues += BackupValidationIssue(code, path, message)
    }

    if (format != ROUTEMPO_BACKUP_FORMAT) {
        issue(BackupValidationCode.UNSUPPORTED_FORMAT, "format", "Unsupported backup format")
    }
    if (version != ROUTEMPO_BACKUP_VERSION) {
        issue(BackupValidationCode.UNSUPPORTED_VERSION, "version", "Unsupported backup version")
    }
    requireDateTime(exportedAt, "exportedAt", issues)

    maxItems(data.routines.size, 1_000, "data.routines", issues)
    maxItems(data.categories.size, 500, "data.categories", issues)
    maxItems(data.logs.size, 10_000, "data.logs", issues)
    maxItems(data.occurrences.size, 10_000, "data.occurrences", issues)

    requireText(data.settings.name, 80, "data.settings.name", issues)
    requireTimeZone(data.settings.timezone, "data.settings.timezone", issues)
    if (data.settings.reminder !in REMINDERS) {
        issue(BackupValidationCode.INVALID_VALUE, "data.settings.reminder", "Unsupported reminder interval")
    }

    val normalizedCategories = mutableMapOf<String, Int>()
    data.categories.forEachIndexed { index, category ->
        val path = "data.categories[$index]"
        requireText(category, 60, path, issues)
        val normalized = normalizeCategory(category)
        val previous = normalizedCategories.putIfAbsent(normalized, index)
        if (normalized.isNotEmpty() && previous != null) {
            issue(
                BackupValidationCode.DUPLICATE_CATEGORY,
                path,
                "Category duplicates data.categories[$previous] after normalization",
            )
        }
    }

    val routineIds = mutableSetOf<String>()
    data.routines.forEachIndexed { index, routine ->
        val root = "data.routines[$index]"
        requireText(routine.id, 200, "$root.id", issues)
        if (routine.id.isNotEmpty() && !routineIds.add(routine.id)) {
            issue(BackupValidationCode.DUPLICATE_ID, "$root.id", "Duplicate routine ID")
        }
        requireClockTime(routine.time, "$root.time", issues)
        requireText(routine.title, 120, "$root.title", issues)
        requireOptionalText(routine.note, 160, "$root.note", issues)
        requireText(routine.category, 60, "$root.category", issues)
        val startDate = requireDate(routine.startDate, "$root.startDate", issues)
        val endDate = routine.endDate?.let { requireDate(it, "$root.endDate", issues) }
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            issue(BackupValidationCode.INVALID_VALUE, "$root.endDate", "End date precedes start date")
        }
        if (routine.status !in ROUTINE_STATUSES) {
            issue(BackupValidationCode.INVALID_VALUE, "$root.status", "Unsupported routine status")
        }
        validateRecurrence(routine, root, issues)
    }

    val logIds = mutableSetOf<String>()
    data.logs.forEachIndexed { index, log ->
        val root = "data.logs[$index]"
        requireText(log.id, 200, "$root.id", issues)
        if (log.id.isNotEmpty() && !logIds.add(log.id)) {
            issue(BackupValidationCode.DUPLICATE_ID, "$root.id", "Duplicate log ID")
        }
        requireDate(log.date, "$root.date", issues)
        requireText(log.eventTime, 30, "$root.eventTime", issues)
        requireText(log.title, 100, "$root.title", issues)
        requireText(log.category, 60, "$root.category", issues)
        requireText(log.scheduled, 30, "$root.scheduled", issues)
        requireOptionalText(log.actual, 30, "$root.actual", issues)
        requireOptionalText(log.variance, 80, "$root.variance", issues)
        if (log.status !in OUTCOME_STATUSES) {
            issue(BackupValidationCode.INVALID_VALUE, "$root.status", "Unsupported log status")
        }
        requireDateTime(log.recordedAt, "$root.recordedAt", issues)
        requireText(log.actor, 120, "$root.actor", issues)
        requireText(log.source, 80, "$root.source", issues)
        requireTimeZone(log.timezone, "$root.timezone", issues)
        requireOptionalText(log.snapshot, 240, "$root.snapshot", issues)
    }

    val occurrenceKeys = mutableSetOf<Pair<String, String>>()
    data.occurrences.forEachIndexed { index, occurrence ->
        val root = "data.occurrences[$index]"
        requireText(occurrence.routineId, 200, "$root.routineId", issues)
        requireDate(occurrence.date, "$root.date", issues)
        if (occurrence.routineId.isNotEmpty() && occurrence.routineId !in routineIds) {
            issue(BackupValidationCode.MISSING_REFERENCE, "$root.routineId", "Occurrence references an unknown routine")
        }
        val key = occurrence.routineId to occurrence.date
        if (!occurrenceKeys.add(key)) {
            issue(BackupValidationCode.DUPLICATE_ID, root, "Duplicate routine/date occurrence")
        }
        if (occurrence.status !in OUTCOME_STATUSES) {
            issue(BackupValidationCode.INVALID_VALUE, "$root.status", "Unsupported occurrence status")
        }
        occurrence.resolvedAt?.let { requireDateTime(it, "$root.resolvedAt", issues) }
        requireDateTime(occurrence.updatedAt, "$root.updatedAt", issues)
    }

    return BackupPreflightResult(
        issues = issues,
        implications = setOf(BackupRestoreImplication.PROVIDER_SYNC_LINKS_RESET),
    )
}

private fun validateRecurrence(
    routine: BackupRoutine,
    root: String,
    issues: MutableList<BackupValidationIssue>,
) {
    fun recurrenceIssue(path: String, message: String) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_RECURRENCE, "$root.$path", message)
    }
    if (routine.repeat !in REPEATS) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, "$root.repeat", "Unsupported recurrence")
        return
    }
    routine.repeatOnDay?.let { if (it !in 0..6) recurrenceIssue("repeatOnDay", "Weekday must be between 0 and 6") }
    routine.repeatOnDays?.let { days ->
        if (days.size > 7) recurrenceIssue("repeatOnDays", "At most seven weekdays are allowed")
        if (days.any { it !in 0..6 }) recurrenceIssue("repeatOnDays", "Weekdays must be between 0 and 6")
        if (days.distinct().size != days.size) recurrenceIssue("repeatOnDays", "Weekdays must not repeat")
    }
    routine.repeatOnDate?.let { if (it !in 1..31) recurrenceIssue("repeatOnDate", "Day of month must be between 1 and 31") }
    routine.repeatOnMonth?.let { if (it !in 1..12) recurrenceIssue("repeatOnMonth", "Month must be between 1 and 12") }
    when (routine.repeat) {
        "weekly" -> if (routine.repeatOnDay == null && routine.repeatOnDays.isNullOrEmpty()) {
            recurrenceIssue("repeatOnDays", "Weekly recurrence requires at least one weekday")
        }
        "monthly" -> if (routine.repeatOnDate == null) {
            recurrenceIssue("repeatOnDate", "Monthly recurrence requires a day of month")
        }
        "yearly" -> {
            if (routine.repeatOnMonth == null) recurrenceIssue("repeatOnMonth", "Yearly recurrence requires a month")
            if (routine.repeatOnDate == null) recurrenceIssue("repeatOnDate", "Yearly recurrence requires a day of month")
            if (routine.repeatOnMonth != null && routine.repeatOnDate != null &&
                !isPossibleMonthDay(routine.repeatOnMonth, routine.repeatOnDate)
            ) recurrenceIssue("repeatOnDate", "Day does not exist in the selected month")
        }
    }
}

private fun maxItems(size: Int, maximum: Int, path: String, issues: MutableList<BackupValidationIssue>) {
    if (size > maximum) issues += BackupValidationIssue(BackupValidationCode.TOO_MANY_ITEMS, path, "At most $maximum items are allowed")
}

private fun requireText(value: String, maximum: Int, path: String, issues: MutableList<BackupValidationIssue>) {
    if (value.isBlank() || value.length > maximum) issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must contain 1 to $maximum characters")
}

private fun requireOptionalText(value: String, maximum: Int, path: String, issues: MutableList<BackupValidationIssue>) {
    if (value.length > maximum) issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must contain at most $maximum characters")
}

private fun requireDate(value: String, path: String, issues: MutableList<BackupValidationIssue>): LocalDate? =
    try {
        LocalDate.parse(value, STRICT_DATE)
    } catch (_: DateTimeException) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must be an ISO calendar date")
        null
    }

private fun requireDateTime(value: String, path: String, issues: MutableList<BackupValidationIssue>) {
    try {
        OffsetDateTime.parse(value, DateTimeFormatter.ISO_OFFSET_DATE_TIME)
    } catch (_: DateTimeException) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must be an ISO date-time with an offset")
    }
}

private fun requireClockTime(value: String, path: String, issues: MutableList<BackupValidationIssue>) {
    if (value.length !in 1..30 || (!TIME_24.matches(value) && !TIME_12.matches(value))) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must be a valid 24-hour or AM/PM time")
    }
}

private fun requireTimeZone(value: String, path: String, issues: MutableList<BackupValidationIssue>) {
    try {
        ZoneId.of(value)
    } catch (_: DateTimeException) {
        issues += BackupValidationIssue(BackupValidationCode.INVALID_VALUE, path, "Must be a valid time zone")
    }
}

private fun normalizeCategory(value: String) =
    Normalizer.normalize(value, Normalizer.Form.NFKC).trim().lowercase(Locale.US)
private fun isPossibleMonthDay(month: Int, day: Int) = day <= java.time.Month.of(month).maxLength()

private val STRICT_DATE = DateTimeFormatter.ISO_LOCAL_DATE.withResolverStyle(ResolverStyle.STRICT)
private val TIME_24 = Regex("^(?:[01]\\d|2[0-3]):[0-5]\\d$")
private val TIME_12 = Regex("^(?:[1-9]|1[0-2]):[0-5]\\d\\s(?:AM|PM)$", RegexOption.IGNORE_CASE)
private val REMINDERS = setOf("0", "5", "10", "15", "20", "30", "45", "60")
private val REPEATS = setOf("none", "daily", "weekly", "monthly", "yearly")
private val ROUTINE_STATUSES = setOf("pending", "completed", "skipped")
private val OUTCOME_STATUSES = setOf("completed", "skipped", "missed")
