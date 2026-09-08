package com.montasim.routempo.core.data

import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.RecurrenceRules
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.User
import com.montasim.routempo.core.model.UserSettings
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

class ProductSnapshotCodec(
    private val json: Json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = true
    },
) {
    fun encode(accountId: String, snapshot: ProductSnapshot): String {
        validateAccount(accountId, snapshot)
        return json.encodeToString(
            StoredEnvelope(
                schemaVersion = CURRENT_SCHEMA_VERSION,
                accountId = accountId,
                snapshot = snapshot.toStored(),
            ),
        )
    }

    fun decode(accountId: String, payload: String): ProductSnapshot? {
        if (accountId.isBlank() || payload.isBlank()) return null
        return runCatching {
            val envelope = json.decodeFromString<StoredEnvelope>(payload)
            require(envelope.schemaVersion == CURRENT_SCHEMA_VERSION)
            require(envelope.accountId == accountId)
            val snapshot = envelope.snapshot.toDomain()
            validateAccount(accountId, snapshot)
            snapshot
        }.getOrNull()
    }

    private fun validateAccount(accountId: String, snapshot: ProductSnapshot) {
        require(accountId.isNotBlank()) { "Account ID is required" }
        require(snapshot.currentUser.user.id == accountId) {
            "Snapshot user does not match its cache account"
        }
    }

    private companion object {
        const val CURRENT_SCHEMA_VERSION = 1
    }
}

@Serializable
private data class StoredEnvelope(
    val schemaVersion: Int,
    val accountId: String,
    val snapshot: StoredSnapshot,
)

@Serializable
private data class StoredSnapshot(
    val currentUser: StoredCurrentUser,
    val routines: List<StoredRoutine>,
    val categories: List<StoredCategory>,
    val occurrences: List<StoredOccurrence>,
    val cachedAtEpochMillis: Long,
)

@Serializable private data class StoredCurrentUser(val user: StoredUser, val settings: StoredSettings)
@Serializable private data class StoredUser(val id: String, val name: String, val email: String, val image: String? = null)
@Serializable
private data class StoredSettings(
    val name: String,
    val timezone: String,
    val defaultReminderMinutes: Int,
    val routineRemindersEnabled: Boolean,
    val weeklySummaryEnabled: Boolean,
)

@Serializable
private data class StoredCategory(
    val id: String,
    val name: String,
    val routineCount: Int,
    val createdAt: String,
)

@Serializable
private data class StoredRules(
    val daysOfWeek: List<Int>? = null,
    val dayOfMonth: Int? = null,
    val month: Int? = null,
)

@Serializable
private data class StoredRoutine(
    val id: String,
    val title: String,
    val note: String,
    val categoryId: String,
    val categoryName: String,
    val startDate: String,
    val scheduledTime: String,
    val recurrenceType: String,
    val recurrenceRules: StoredRules,
    val endDate: String? = null,
    val isActive: Boolean,
    val createdAt: String,
    val updatedAt: String,
)

@Serializable
private data class StoredOccurrence(
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

private fun ProductSnapshot.toStored() = StoredSnapshot(
    currentUser = StoredCurrentUser(
        user = StoredUser(currentUser.user.id, currentUser.user.name, currentUser.user.email, currentUser.user.image),
        settings = StoredSettings(
            currentUser.settings.name,
            currentUser.settings.timezone,
            currentUser.settings.defaultReminderMinutes,
            currentUser.settings.routineRemindersEnabled,
            currentUser.settings.weeklySummaryEnabled,
        ),
    ),
    routines = routines.map { routine ->
        StoredRoutine(
            routine.id,
            routine.title,
            routine.note,
            routine.categoryId,
            routine.categoryName,
            routine.startDate,
            routine.scheduledTime,
            routine.recurrenceType.name.lowercase(),
            StoredRules(
                routine.recurrenceRules.daysOfWeek,
                routine.recurrenceRules.dayOfMonth,
                routine.recurrenceRules.month,
            ),
            routine.endDate,
            routine.isActive,
            routine.createdAt,
            routine.updatedAt,
        )
    },
    categories = categories.map { StoredCategory(it.id, it.name, it.routineCount, it.createdAt) },
    occurrences = occurrences.map {
        StoredOccurrence(
            it.id,
            it.routineId,
            it.title,
            it.category,
            it.date,
            it.scheduledTime,
            it.timezone,
            it.status.name.lowercase(),
            it.resolvedAt,
            it.updatedAt,
        )
    },
    cachedAtEpochMillis = cachedAtEpochMillis,
)

private fun StoredSnapshot.toDomain() = ProductSnapshot(
    currentUser = CurrentUser(
        user = User(currentUser.user.id, currentUser.user.name, currentUser.user.email, currentUser.user.image),
        settings = UserSettings(
            currentUser.settings.name,
            currentUser.settings.timezone,
            currentUser.settings.defaultReminderMinutes,
            currentUser.settings.routineRemindersEnabled,
            currentUser.settings.weeklySummaryEnabled,
        ),
    ),
    routines = routines.map { routine ->
        Routine(
            routine.id,
            routine.title,
            routine.note,
            routine.categoryId,
            routine.categoryName,
            routine.startDate,
            routine.scheduledTime,
            RecurrenceType.valueOf(routine.recurrenceType.uppercase()),
            RecurrenceRules(
                routine.recurrenceRules.daysOfWeek,
                routine.recurrenceRules.dayOfMonth,
                routine.recurrenceRules.month,
            ),
            routine.endDate,
            routine.isActive,
            routine.createdAt,
            routine.updatedAt,
        )
    },
    categories = categories.map { Category(it.id, it.name, it.routineCount, it.createdAt) },
    occurrences = occurrences.map {
        RoutineOccurrence(
            it.id,
            it.routineId,
            it.title,
            it.category,
            it.date,
            it.scheduledTime,
            it.timezone,
            OccurrenceStatus.valueOf(it.status.uppercase()),
            it.resolvedAt,
            it.updatedAt,
        )
    },
    cachedAtEpochMillis = cachedAtEpochMillis,
)
