package com.montasim.routempo.core.network

import com.montasim.routempo.core.model.Analytics
import com.montasim.routempo.core.model.AnalyticsDay
import com.montasim.routempo.core.model.AuthResult
import com.montasim.routempo.core.model.BackupArchive
import com.montasim.routempo.core.model.BackupData
import com.montasim.routempo.core.model.BackupLog
import com.montasim.routempo.core.model.BackupOccurrence
import com.montasim.routempo.core.model.BackupRoutine
import com.montasim.routempo.core.model.BackupSettings
import com.montasim.routempo.core.model.BearerSession
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CategoryAnalytics
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.IntegrationConnect
import com.montasim.routempo.core.model.IntegrationStatuses
import com.montasim.routempo.core.model.IntegrationSyncResult
import com.montasim.routempo.core.model.LogPatch
import com.montasim.routempo.core.model.LogStatus
import com.montasim.routempo.core.model.LogWrite
import com.montasim.routempo.core.model.OccurrenceGeneration
import com.montasim.routempo.core.model.OccurrenceResolution
import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.OutcomeSummary
import com.montasim.routempo.core.model.ProviderState
import com.montasim.routempo.core.model.RecurrenceRules
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.RoutinePatch
import com.montasim.routempo.core.model.RoutineWrite
import com.montasim.routempo.core.model.SettingsPatch
import com.montasim.routempo.core.model.User
import com.montasim.routempo.core.model.UserSettings
import kotlinx.serialization.json.JsonNull
import kotlinx.serialization.json.JsonPrimitive

internal fun UserDto.toDomain() = User(id, name, email, image)
internal fun SessionDto.toDomain() = BearerSession(token, expiresAt)
internal fun AuthDataDto.toDomain() = AuthResult(session.toDomain().copy(accountId = user.id), user.toDomain())
internal fun CurrentUserDataDto.toDomain() = CurrentUser(user.toDomain(), settings.toDomain())
internal fun SettingsDto.toDomain() = UserSettings(name, timezone, defaultReminderMinutes, routineRemindersEnabled, weeklySummaryEnabled)
internal fun SettingsPatch.toDto() = SettingsPatchDto(name, timezone, defaultReminderMinutes, routineRemindersEnabled, weeklySummaryEnabled)

internal fun CategoryDto.toDomain() = Category(id, name, routineCount, createdAt)
internal fun RecurrenceRulesDto.toDomain() = RecurrenceRules(daysOfWeek, dayOfMonth, month)
internal fun RecurrenceRules.toDto() = RecurrenceRulesDto(daysOfWeek, dayOfMonth, month)
internal fun RecurrenceType.toWire() = name.lowercase()

internal fun RoutineDto.toDomain() = Routine(
    id, title, note, categoryId, categoryName, startDate, scheduledTime,
    RecurrenceType.valueOf(recurrenceType.uppercase()), recurrenceRules.toDomain(), endDate,
    isActive, createdAt, updatedAt,
)

internal fun RoutineWrite.toDto() = RoutineWriteDto(
    title, note, categoryId, startDate, scheduledTime, recurrenceType.toWire(),
    recurrenceRules.toDto(), endDate, isActive,
)

internal fun RoutinePatch.toDto() = RoutinePatchDto(
    title = title,
    note = note,
    categoryId = categoryId,
    startDate = startDate,
    scheduledTime = scheduledTime,
    recurrenceType = recurrenceType?.toWire(),
    recurrenceRules = recurrenceRules?.toDto(),
    endDate = when {
        clearEndDate -> JsonNull
        endDate != null -> JsonPrimitive(endDate)
        else -> null
    },
    isActive = isActive,
)

internal fun OccurrenceDto.toDomain() = RoutineOccurrence(
    id, routineId, title, category, date, scheduledTime, timezone,
    OccurrenceStatus.valueOf(status.uppercase()), resolvedAt, updatedAt,
)
internal fun OccurrenceResolution.toDto() = OccurrenceResolutionDto(actualTime, note)
internal fun OccurrenceGenerationDto.toDomain() = OccurrenceGeneration(generated, startDate, endDate)

internal fun LogDto.toDomain() = BehaviorLog(
    id, routineId, date, eventTime, title, category, scheduledTime, actualTime, variance,
    LogStatus.valueOf(status.uppercase()), recordedAt, actor, source, timezone, note,
)
internal fun LogWrite.toDto() = LogWriteDto(
    routineId, date, eventTime, title, category, scheduledTime, actualTime,
    status.name.lowercase(), note,
)
internal fun LogPatch.toDto() = LogPatchDto(
    routineId = when {
        clearRoutineId -> JsonNull
        routineId != null -> JsonPrimitive(routineId)
        else -> null
    },
    date = date,
    eventTime = eventTime,
    title = title,
    category = category,
    scheduledTime = scheduledTime,
    actualTime = when {
        clearActualTime -> JsonNull
        actualTime != null -> JsonPrimitive(actualTime)
        else -> null
    },
    status = status?.name?.lowercase(),
    note = note,
)

private fun OutcomeSummaryDto.toDomain() =
    OutcomeSummary(completed, skipped, missed, total, completionPercentage, unrecorded)
private fun AnalyticsDayDto.toDomain() = AnalyticsDay(
    date,
    OutcomeSummary(completed, skipped, missed, total, completionPercentage, unrecorded),
)
private fun CategoryAnalyticsDto.toDomain() = CategoryAnalytics(
    category,
    routineCount,
    OutcomeSummary(completed, skipped, missed, total, completionPercentage, unrecorded),
)
internal fun AnalyticsDto.toDomain() = Analytics(
    startDate, endDate, completionPercentage, outcomes.toDomain(), series.map { it.toDomain() },
    categories.map { it.toDomain() }, generatedAt,
)

private fun ProviderStateDto.toDomain() = ProviderState(connected, ready, configured)
internal fun ProvidersDto.toDomain() = IntegrationStatuses(google.toDomain(), microsoft.toDomain())
internal fun IntegrationSyncResultDto.toDomain() = IntegrationSyncResult(imported, exported, skipped, failures)
internal fun IntegrationConnectDto.toDomain() = IntegrationConnect(browserUrl, expiresInSeconds)

internal fun BackupArchiveDto.toDomain() = BackupArchive(format, version, exportedAt, data.toDomain())
internal fun BackupDataDto.toDomain() = BackupData(
    routines.map { it.toDomain() }, categories, settings.toDomain(), logs.map { it.toDomain() },
    occurrences.map { it.toDomain() },
)
internal fun BackupSettingsDto.toDomain() = BackupSettings(name, timezone, reminder, notifications, weeklySummary)
internal fun BackupRoutineDto.toDomain() = BackupRoutine(
    id, time, title, note, category, startDate, repeat, repeatOnDay, repeatOnDays,
    repeatOnDate, repeatOnMonth, endDate, status, enabled,
)
internal fun BackupLogDto.toDomain() = BackupLog(
    id, date, eventTime, title, category, scheduled, actual, variance, status, recordedAt,
    actor, source, timezone, snapshot,
)
internal fun BackupOccurrenceDto.toDomain() = BackupOccurrence(routineId, date, status, resolvedAt, updatedAt)

internal fun BackupArchive.toDto() = BackupArchiveDto(format, version, exportedAt, data.toDto())
internal fun BackupData.toDto() = BackupDataDto(
    routines.map { it.toDto() }, categories, settings.toDto(), logs.map { it.toDto() },
    occurrences.map { it.toDto() },
)
internal fun BackupSettings.toDto() = BackupSettingsDto(name, timezone, reminder, notifications, weeklySummary)
internal fun BackupRoutine.toDto() = BackupRoutineDto(
    id, time, title, note, category, startDate, repeat, repeatOnDay, repeatOnDays,
    repeatOnDate, repeatOnMonth, endDate, status, enabled,
)
internal fun BackupLog.toDto() = BackupLogDto(
    id, date, eventTime, title, category, scheduled, actual, variance, status, recordedAt,
    actor, source, timezone, snapshot,
)
internal fun BackupOccurrence.toDto() = BackupOccurrenceDto(routineId, date, status, resolvedAt, updatedAt)
