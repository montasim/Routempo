package com.montasim.routempo.feature.settings

import androidx.compose.runtime.Immutable
import com.montasim.routempo.core.designsystem.RoutempoThemeMode
import java.text.Normalizer
import java.time.Instant
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.util.Locale

@Immutable
data class SettingsAccountUi(
    val name: String,
    val email: String,
    val timezone: String,
)

@Immutable
data class ReminderSettingsUi(
    val routineRemindersEnabled: Boolean,
    val reminderTime: String,
    val reminderOffsetMinutes: Int,
    val weeklySummaryEnabled: Boolean,
)

@Immutable
data class CategorySettingsUi(
    val id: String,
    val name: String,
    val routineCount: Int,
    val colorHex: String = DEFAULT_CATEGORY_COLOR,
)

@Immutable
data class CategoryDraft(
    val name: String,
    val colorHex: String,
)

data class CategoryValidation(
    val normalizedName: String,
    val normalizedColorHex: String,
    val nameError: String? = null,
    val colorError: String? = null,
) {
    val isValid: Boolean get() = nameError == null && colorError == null
}

@Immutable
data class TimezoneOptionUi(
    val id: String,
    val locationLabel: String,
    val offsetLabel: String,
) {
    val displayLabel: String get() = "$locationLabel · $offsetLabel"

    fun matches(query: String): Boolean {
        val normalizedQuery = query.trim()
        return normalizedQuery.isEmpty() ||
            id.contains(normalizedQuery, ignoreCase = true) ||
            locationLabel.contains(normalizedQuery, ignoreCase = true) ||
            offsetLabel.contains(normalizedQuery, ignoreCase = true)
    }
}

enum class SettingsProvider(val displayName: String, val taskLabel: String) {
    Google("Google", "Tasks"),
    Microsoft("Microsoft", "To Do"),
}

enum class ProviderConnectionStatus {
    Checking,
    Unconfigured,
    SignInOnly,
    Disconnected,
    Connecting,
    Connected,
    Expired,
    Error,
}

enum class IntegrationResourceUi(val displayName: String) {
    Calendar("Calendar"),
    Tasks("Tasks"),
}

enum class IntegrationActionUi(val displayName: String) {
    Import("Import"),
    Export("Export"),
}

@Immutable
data class IntegrationOperation(
    val resource: IntegrationResourceUi,
    val action: IntegrationActionUi,
)

@Immutable
data class ProviderSettingsUi(
    val provider: SettingsProvider,
    val status: ProviderConnectionStatus,
    val detail: String? = null,
    val activeOperation: IntegrationOperation? = null,
)

enum class NotificationPermissionStatus {
    NotRequired,
    NotRequested,
    Granted,
    Denied,
    Blocked,
}

@Immutable
data class AppInfoUi(
    val versionName: String,
    val versionCode: String? = null,
)

@Immutable
data class RoutempoSettingsUiState(
    val account: SettingsAccountUi? = null,
    val reminders: ReminderSettingsUi =
        ReminderSettingsUi(
            routineRemindersEnabled = false,
            reminderTime = "At scheduled time",
            reminderOffsetMinutes = 0,
            weeklySummaryEnabled = false,
        ),
    val themeMode: RoutempoThemeMode = RoutempoThemeMode.System,
    val categories: List<CategorySettingsUi> = emptyList(),
    val providers: List<ProviderSettingsUi> = emptyList(),
    val notificationPermission: NotificationPermissionStatus = NotificationPermissionStatus.NotRequested,
    val appInfo: AppInfoUi = AppInfoUi(versionName = "—"),
    val isLoading: Boolean = false,
    val isOffline: Boolean = false,
    val isMutating: Boolean = false,
    val errorMessage: String? = null,
)

fun validateCategoryDraft(
    draft: CategoryDraft,
    existingNames: Collection<String>,
    currentName: String? = null,
): CategoryValidation {
    val name = normalizeCategoryName(draft.name)
    val color = normalizeCategoryColor(draft.colorHex)
    val duplicate =
        existingNames.any {
            normalizeCategoryName(it).equals(name, ignoreCase = true) &&
                !normalizeCategoryName(it).equals(currentName?.let(::normalizeCategoryName), ignoreCase = true)
        }
    val nameError =
        when {
            name.isEmpty() -> "Category name is required."
            name.length > CATEGORY_NAME_MAX_LENGTH -> "Use $CATEGORY_NAME_MAX_LENGTH characters or fewer."
            duplicate -> "A category with this name already exists."
            else -> null
        }
    val colorError = if (color == null) "Use a six-digit color such as #178449." else null
    return CategoryValidation(
        normalizedName = name,
        normalizedColorHex = color ?: draft.colorHex.trim(),
        nameError = nameError,
        colorError = colorError,
    )
}

private fun normalizeCategoryName(value: String): String =
    Normalizer.normalize(value, Normalizer.Form.NFKC).trim().replace(Regex("\\s+"), " ")

fun normalizeCategoryColor(value: String): String? {
    val candidate = value.trim().uppercase().let { if (it.startsWith("#")) it else "#$it" }
    return candidate.takeIf { it.matches(Regex("^#[0-9A-F]{6}$")) }
}

fun reminderOffsetLabel(minutes: Int): String =
    when (minutes) {
        0 -> "At scheduled time"
        60 -> "1 hour before"
        else -> "$minutes minutes before"
    }

fun providerStatusLabel(provider: ProviderSettingsUi): String =
    when (provider.status) {
        ProviderConnectionStatus.Checking -> "Checking connection"
        ProviderConnectionStatus.Unconfigured -> "Unavailable"
        ProviderConnectionStatus.SignInOnly -> "Grant calendar and task access"
        ProviderConnectionStatus.Disconnected -> "Not connected"
        ProviderConnectionStatus.Connecting -> "Connecting"
        ProviderConnectionStatus.Connected -> "Connected"
        ProviderConnectionStatus.Expired -> "Reconnect required"
        ProviderConnectionStatus.Error -> provider.detail ?: "Connection unavailable"
    }

fun timezoneOption(
    id: String,
    now: Instant = Instant.now(),
): TimezoneOptionUi? =
    runCatching {
        val zoneId = ZoneId.of(id)
        TimezoneOptionUi(
            id = id,
            locationLabel = timezoneLocationLabel(id),
            offsetLabel = utcOffsetLabel(zoneId.rules.getOffset(now)),
        )
    }.getOrNull()

fun timezoneOptions(
    ids: Collection<String>,
    now: Instant = Instant.now(),
): List<TimezoneOptionUi> =
    ids
        .distinct()
        .mapNotNull { timezoneOption(it, now) }
        .sortedWith(compareBy(TimezoneOptionUi::locationLabel, TimezoneOptionUi::id))

fun accountInitials(
    name: String,
    email: String = "",
): String {
    val source = name.trim().ifEmpty { email.substringBefore('@').trim() }
    val words = source.split(Regex("[\\s._-]+"), limit = 3).filter(String::isNotBlank)
    val initials =
        when {
            words.size >= 2 -> "${words.first().first()}${words.last().first()}"
            words.size == 1 -> words.first().take(2)
            else -> "?"
        }
    return initials.uppercase(Locale.ROOT)
}

private fun timezoneLocationLabel(id: String): String {
    if (id == "UTC" || id == "GMT" || id == "Etc/UTC") return "UTC"
    val parts = id.split('/')
    val city = parts.last().replace('_', ' ')
    return if (parts.size > 2) {
        "$city, ${parts.drop(1).dropLast(1).joinToString(" ") { it.replace('_', ' ') }}"
    } else {
        city
    }
}

private fun utcOffsetLabel(offset: ZoneOffset): String =
    if (offset == ZoneOffset.UTC) {
        "UTC"
    } else {
        "UTC${DateTimeFormatter.ofPattern("xxx").format(offset)}"
    }

const val CATEGORY_NAME_MAX_LENGTH = 60
const val DEFAULT_CATEGORY_COLOR = "#178449"
