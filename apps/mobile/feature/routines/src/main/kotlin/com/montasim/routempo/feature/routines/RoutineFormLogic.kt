package com.montasim.routempo.feature.routines

import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.RecurrenceRules
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineWrite
import java.text.Normalizer
import java.time.LocalDate
import java.time.LocalTime
import java.time.Month
import java.time.format.DateTimeParseException
import java.util.Locale

const val ROUTINE_TITLE_MAX_LENGTH = 120
const val ROUTINE_NOTE_MAX_LENGTH = 160
const val ROUTINE_CATEGORY_MAX_LENGTH = 60

enum class RoutineFormField {
    TITLE,
    START_DATE,
    SCHEDULED_TIME,
    CATEGORY_ID,
    NOTE,
    WEEKLY_DAYS,
    DAY_OF_MONTH,
    MONTH,
    END_DATE,
    CATEGORY_NAME,
}

data class RoutineFormDraft(
    val title: String,
    val startDate: String,
    val scheduledTime: String,
    val categoryId: String,
    val note: String,
    val recurrenceType: RecurrenceType,
    val weeklyDays: Set<Int> = emptySet(),
    val dayOfMonth: String = "",
    val month: String = "",
    val endDate: String = "",
)

data class RoutineFormValidation(
    val errors: Map<RoutineFormField, String> = emptyMap(),
) {
    val isValid: Boolean get() = errors.isEmpty()

    operator fun get(field: RoutineFormField): String? = errors[field]
}

data class CategoryNameValidation(
    val normalizedName: String,
    val duplicate: Category? = null,
    val error: String? = null,
) {
    val isValid: Boolean get() = error == null
}

data class RecurrenceSeed(
    val weeklyDays: Set<Int>,
    val dayOfMonth: Int,
    val month: Int,
)

fun validateRoutineDraft(
    draft: RoutineFormDraft,
    savedZoneToday: LocalDate,
    existingRoutine: Routine? = null,
): RoutineFormValidation {
    val errors = linkedMapOf<RoutineFormField, String>()
    val title = draft.title.trim()
    when {
        title.isEmpty() -> errors[RoutineFormField.TITLE] = "Routine name is required."
        title.length > ROUTINE_TITLE_MAX_LENGTH ->
            errors[RoutineFormField.TITLE] = "Use $ROUTINE_TITLE_MAX_LENGTH characters or fewer."
    }

    val parsedStart = parseIsoDate(draft.startDate)
    if (parsedStart == null) {
        errors[RoutineFormField.START_DATE] = "Enter a valid date as YYYY-MM-DD."
    } else {
        val existingStart = existingRoutine?.startDate?.let(::parseIsoDate)
        val keepsLegacyStart = existingStart != null && parsedStart == existingStart
        if (parsedStart.isBefore(savedZoneToday) && !keepsLegacyStart) {
            errors[RoutineFormField.START_DATE] = "New routines cannot start before $savedZoneToday."
        }
    }

    if (parseApiTime(draft.scheduledTime) == null) {
        errors[RoutineFormField.SCHEDULED_TIME] = "Enter a valid 24-hour time as HH:mm."
    }
    if (draft.categoryId.isBlank()) {
        errors[RoutineFormField.CATEGORY_ID] = "Choose a category."
    }
    if (draft.note.length > ROUTINE_NOTE_MAX_LENGTH) {
        errors[RoutineFormField.NOTE] = "Use $ROUTINE_NOTE_MAX_LENGTH characters or fewer."
    }

    val day = draft.dayOfMonth.toIntOrNull()
    val month = draft.month.toIntOrNull()
    when (draft.recurrenceType) {
        RecurrenceType.WEEKLY -> {
            if (draft.weeklyDays.isEmpty() || draft.weeklyDays.any { it !in 0..6 }) {
                errors[RoutineFormField.WEEKLY_DAYS] = "Select at least one valid day."
            }
        }

        RecurrenceType.MONTHLY -> {
            if (day == null || day !in 1..31) {
                errors[RoutineFormField.DAY_OF_MONTH] = "Enter a day from 1 to 31."
            }
        }

        RecurrenceType.YEARLY -> {
            if (month == null || month !in 1..12) {
                errors[RoutineFormField.MONTH] = "Enter a month from 1 to 12."
            }
            if (day == null || day !in 1..31) {
                errors[RoutineFormField.DAY_OF_MONTH] = "Enter a valid day of the month."
            } else if (month != null && month in 1..12 && day > Month.of(month).maxLength()) {
                // maxLength deliberately admits February 29, which is scheduled only in leap years.
                errors[RoutineFormField.DAY_OF_MONTH] = "That month never has day $day."
            }
        }

        RecurrenceType.NONE,
        RecurrenceType.DAILY,
        -> Unit
    }

    if (draft.recurrenceType != RecurrenceType.NONE && draft.endDate.isNotBlank()) {
        val parsedEnd = parseIsoDate(draft.endDate)
        when {
            parsedEnd == null -> errors[RoutineFormField.END_DATE] = "Enter a valid date as YYYY-MM-DD."
            parsedStart != null && parsedEnd.isBefore(parsedStart) ->
                errors[RoutineFormField.END_DATE] = "End date cannot be before the start date."
        }
    }
    return RoutineFormValidation(errors)
}

fun RoutineFormDraft.toRoutineWrite(isActive: Boolean = true): RoutineWrite {
    val rules =
        when (recurrenceType) {
            RecurrenceType.WEEKLY -> RecurrenceRules(daysOfWeek = weeklyDays.sorted())
            RecurrenceType.MONTHLY -> RecurrenceRules(dayOfMonth = requireNotNull(dayOfMonth.toIntOrNull()))
            RecurrenceType.YEARLY ->
                RecurrenceRules(
                    dayOfMonth = requireNotNull(dayOfMonth.toIntOrNull()),
                    month = requireNotNull(month.toIntOrNull()),
                )
            RecurrenceType.NONE,
            RecurrenceType.DAILY,
            -> RecurrenceRules()
        }
    return RoutineWrite(
        title = title.trim(),
        categoryId = categoryId,
        startDate = startDate,
        scheduledTime = scheduledTime,
        recurrenceType = recurrenceType,
        note = note.trim(),
        recurrenceRules = rules,
        endDate = if (recurrenceType == RecurrenceType.NONE) null else endDate.ifBlank { null },
        isActive = isActive,
    )
}

fun defaultRecurrenceSeed(startDate: LocalDate): RecurrenceSeed =
    RecurrenceSeed(
        weeklyDays = setOf(startDate.dayOfWeek.value % 7),
        dayOfMonth = startDate.dayOfMonth,
        month = startDate.monthValue,
    )

fun reconcileRecurrenceSeed(
    previousStartDate: LocalDate,
    newStartDate: LocalDate,
    recurrenceType: RecurrenceType,
    current: RecurrenceSeed,
): RecurrenceSeed {
    val previousSeed = defaultRecurrenceSeed(previousStartDate)
    val nextSeed = defaultRecurrenceSeed(newStartDate)
    return when (recurrenceType) {
        RecurrenceType.WEEKLY ->
            if (current.weeklyDays == previousSeed.weeklyDays) current.copy(weeklyDays = nextSeed.weeklyDays) else current
        RecurrenceType.MONTHLY ->
            if (current.dayOfMonth == previousSeed.dayOfMonth) current.copy(dayOfMonth = nextSeed.dayOfMonth) else current
        RecurrenceType.YEARLY ->
            if (current.dayOfMonth == previousSeed.dayOfMonth && current.month == previousSeed.month) {
                current.copy(dayOfMonth = nextSeed.dayOfMonth, month = nextSeed.month)
            } else {
                current
            }
        RecurrenceType.NONE,
        RecurrenceType.DAILY,
        -> current
    }
}

fun validateCategoryName(
    value: String,
    categories: Collection<Category>,
): CategoryNameValidation {
    val normalized = normalizeCategoryName(value)
    val duplicate = categories.firstOrNull { categoryNameKey(it.name) == categoryNameKey(normalized) }
    val error =
        when {
            normalized.isEmpty() -> "Category name is required."
            normalized.length > ROUTINE_CATEGORY_MAX_LENGTH -> "Use $ROUTINE_CATEGORY_MAX_LENGTH characters or fewer."
            duplicate != null -> "That category already exists. It has been selected."
            else -> null
        }
    return CategoryNameValidation(normalizedName = normalized, duplicate = duplicate, error = error)
}

fun normalizeCategoryName(value: String): String {
    val normalized = Normalizer.normalize(value, Normalizer.Form.NFKC)
    return buildString(normalized.length) {
        var pendingSpace = false
        normalized.forEach { character ->
            if (character.isWhitespace() || Character.isSpaceChar(character)) {
                if (isNotEmpty()) pendingSpace = true
            } else {
                if (pendingSpace) append(' ')
                append(character)
                pendingSpace = false
            }
        }
    }
}

fun categoryNameKey(value: String): String =
    normalizeCategoryName(value)
        .uppercase(Locale.ROOT)
        .lowercase(Locale.ROOT)

fun categoryMatchesSearch(name: String, query: String): Boolean =
    categoryNameKey(name).contains(categoryNameKey(query))

fun routineFormFieldForServerPath(path: String): RoutineFormField? {
    val leaf = path.substringAfterLast('.').substringAfterLast('/').substringBefore('[').lowercase(Locale.ROOT)
    return when (leaf) {
        "title" -> RoutineFormField.TITLE
        "startdate", "start_date" -> RoutineFormField.START_DATE
        "scheduledtime", "scheduled_time", "time" -> RoutineFormField.SCHEDULED_TIME
        "categoryid", "category_id" -> RoutineFormField.CATEGORY_ID
        "note" -> RoutineFormField.NOTE
        "daysofweek", "days_of_week" -> RoutineFormField.WEEKLY_DAYS
        "dayofmonth", "day_of_month" -> RoutineFormField.DAY_OF_MONTH
        "month" -> RoutineFormField.MONTH
        "enddate", "end_date" -> RoutineFormField.END_DATE
        "name", "categoryname", "category_name" -> RoutineFormField.CATEGORY_NAME
        else -> null
    }
}

fun recurrenceSummary(routine: Routine): String =
    when (routine.recurrenceType) {
        RecurrenceType.NONE -> "Once"
        RecurrenceType.DAILY -> "Daily"
        RecurrenceType.WEEKLY -> {
            val labels = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
            val days = routine.recurrenceRules.daysOfWeek.orEmpty().mapNotNull(labels::getOrNull)
            if (days.isEmpty()) "Weekly" else "Weekly on ${days.joinToString()}"
        }
        RecurrenceType.MONTHLY -> "Monthly on day ${routine.recurrenceRules.dayOfMonth ?: "—"}"
        RecurrenceType.YEARLY -> {
            val month = routine.recurrenceRules.month?.takeIf { it in 1..12 }?.let { Month.of(it).name.lowercase().replaceFirstChar(Char::uppercase) } ?: "—"
            "Yearly on $month ${routine.recurrenceRules.dayOfMonth ?: "—"}"
        }
    }

private fun parseIsoDate(value: String): LocalDate? {
    if (!value.matches(Regex("\\d{4}-\\d{2}-\\d{2}"))) return null
    return try {
        LocalDate.parse(value)
    } catch (_: DateTimeParseException) {
        null
    }
}

private fun parseApiTime(value: String): LocalTime? {
    if (!value.matches(Regex("(?:[01]\\d|2[0-3]):[0-5]\\d"))) return null
    return try {
        LocalTime.parse(value)
    } catch (_: DateTimeParseException) {
        null
    }
}
