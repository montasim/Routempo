package com.montasim.routempo.feature.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AccountCircle
import androidx.compose.material.icons.rounded.Backup
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.CloudDownload
import androidx.compose.material.icons.rounded.CloudUpload
import androidx.compose.material.icons.rounded.Description
import androidx.compose.material.icons.rounded.Info
import androidx.compose.material.icons.rounded.Logout
import androidx.compose.material.icons.rounded.Notifications
import androidx.compose.material.icons.rounded.Palette
import androidx.compose.material.icons.rounded.PrivacyTip
import androidx.compose.material.icons.rounded.Schedule
import androidx.compose.material.icons.rounded.SupportAgent
import androidx.compose.material.icons.rounded.Tag
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoDimens
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.designsystem.RoutempoOfflineBanner
import com.montasim.routempo.core.designsystem.RoutempoSemanticRow
import com.montasim.routempo.core.designsystem.RoutempoThemeMode
import com.montasim.routempo.core.designsystem.routempoColors

@Immutable
data class RoutempoSettingsCallbacks(
    val onRetry: () -> Unit,
    val onProfileClick: () -> Unit,
    val onRoutineRemindersChanged: (Boolean) -> Unit,
    val onReminderTimeClick: () -> Unit,
    val onReminderOffsetClick: () -> Unit,
    val onWeeklySummaryChanged: (Boolean) -> Unit,
    val onThemeModeChanged: (RoutempoThemeMode) -> Unit,
    val onCategoriesClick: () -> Unit,
    val onProviderClick: (SettingsProvider) -> Unit,
    val onNotificationPermissionClick: () -> Unit,
    val onBackupExport: () -> Unit,
    val onBackupRestoreRequest: () -> Unit,
    val onCsvExport: () -> Unit,
    val onTerms: () -> Unit,
    val onPrivacy: () -> Unit,
    val onSupport: () -> Unit,
    val onSignOutRequest: () -> Unit,
)

@Composable
fun RoutempoSettingsScreen(
    state: RoutempoSettingsUiState,
    callbacks: RoutempoSettingsCallbacks,
    modifier: Modifier = Modifier,
) {
    when {
        state.isLoading && state.account == null ->
            RoutempoLoadingState(
                message = stringResource(R.string.settings_loading),
                modifier = modifier.fillMaxSize(),
            )

        state.errorMessage != null && state.account == null ->
            RoutempoErrorState(
                title = stringResource(R.string.settings_error_title),
                message = state.errorMessage,
                retryLabel = stringResource(R.string.settings_retry),
                onRetry = callbacks.onRetry,
                modifier = modifier.fillMaxSize(),
            )

        else -> SettingsContent(state = state, callbacks = callbacks, modifier = modifier)
    }
}

@Composable
private fun SettingsContent(
    state: RoutempoSettingsUiState,
    callbacks: RoutempoSettingsCallbacks,
    modifier: Modifier,
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(RoutempoDimens.screenGutter),
        verticalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing24),
    ) {
        if (state.isOffline) {
            item(key = "offline") {
                RoutempoOfflineBanner(
                    title = stringResource(R.string.settings_offline_title),
                    message = stringResource(R.string.settings_offline_message),
                    retryLabel = stringResource(R.string.settings_retry),
                    onRetry = callbacks.onRetry,
                )
            }
        }
        if (state.errorMessage != null) {
            item(key = "inline-error") {
                RoutempoErrorState(
                    title = stringResource(R.string.settings_update_error_title),
                    message = state.errorMessage,
                    retryLabel = stringResource(R.string.settings_retry),
                    onRetry = callbacks.onRetry,
                )
            }
        }

        item(key = "account") {
            SettingsSection(title = stringResource(R.string.settings_account_and_reminders)) {
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_profile),
                    supportingText =
                        state.account?.let {
                            "${it.name} · ${timezoneOption(it.timezone)?.displayLabel ?: it.timezone}"
                        }
                            ?: stringResource(R.string.settings_profile_unavailable),
                    onClick = callbacks.onProfileClick,
                    enabled = state.account != null && !state.isMutating,
                    leadingContent = {
                        state.account?.let { AccountInitialsAvatar(it) }
                            ?: SettingsIcon(Icons.Rounded.AccountCircle)
                    },
                )
                HorizontalDivider()
                SettingsSwitchRow(
                    title = stringResource(R.string.settings_routine_reminders),
                    supportingText = reminderOffsetLabel(state.reminders.reminderOffsetMinutes),
                    checked = state.reminders.routineRemindersEnabled,
                    enabled = !state.isMutating,
                    onCheckedChange = callbacks.onRoutineRemindersChanged,
                    icon = Icons.Rounded.Notifications,
                )
                HorizontalDivider()
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_reminder_time),
                    supportingText = state.reminders.reminderTime,
                    enabled = state.reminders.routineRemindersEnabled && !state.isMutating,
                    onClick = callbacks.onReminderTimeClick,
                    leadingContent = { SettingsIcon(Icons.Rounded.Schedule) },
                )
                HorizontalDivider()
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_reminder_offset),
                    supportingText = reminderOffsetLabel(state.reminders.reminderOffsetMinutes),
                    enabled = state.reminders.routineRemindersEnabled && !state.isMutating,
                    onClick = callbacks.onReminderOffsetClick,
                    leadingContent = { SettingsIcon(Icons.Rounded.Schedule) },
                )
                HorizontalDivider()
                SettingsSwitchRow(
                    title = stringResource(R.string.settings_weekly_summary),
                    supportingText = stringResource(R.string.settings_weekly_summary_detail),
                    checked = state.reminders.weeklySummaryEnabled,
                    enabled = !state.isMutating,
                    onCheckedChange = callbacks.onWeeklySummaryChanged,
                    icon = Icons.Rounded.Description,
                )
            }
        }

        item(key = "appearance") {
            SettingsSection(title = stringResource(R.string.settings_appearance)) {
                RoutempoThemeMode.entries.forEachIndexed { index, mode ->
                    ThemeChoiceRow(
                        mode = mode,
                        selected = state.themeMode == mode,
                        enabled = !state.isMutating,
                        onSelect = { callbacks.onThemeModeChanged(mode) },
                    )
                    if (index != RoutempoThemeMode.entries.lastIndex) HorizontalDivider()
                }
            }
        }

        item(key = "organization") {
            SettingsSection(title = stringResource(R.string.settings_organization)) {
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_categories),
                    supportingText =
                        pluralStringResource(
                            R.plurals.settings_category_count,
                            state.categories.size,
                            state.categories.size,
                        ),
                    onClick = callbacks.onCategoriesClick,
                    enabled = !state.isMutating,
                    leadingContent = { SettingsIcon(Icons.Rounded.Tag) },
                )
            }
        }

        item(key = "integrations") {
            SettingsSection(title = stringResource(R.string.settings_integrations)) {
                state.providers.sortedBy { it.provider.ordinal }.forEachIndexed { index, provider ->
                    RoutempoSemanticRow(
                        title = provider.provider.displayName,
                        supportingText = providerStatusLabel(provider),
                        onClick = { callbacks.onProviderClick(provider.provider) },
                        enabled = provider.status != ProviderConnectionStatus.Checking && !state.isMutating,
                        leadingContent = { ProviderLetter(provider.provider) },
                    )
                    if (index != state.providers.lastIndex) HorizontalDivider()
                }
            }
        }

        item(key = "notifications") {
            SettingsSection(title = stringResource(R.string.settings_notifications_section)) {
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_notification_permission),
                    supportingText = notificationPermissionLabel(state.notificationPermission),
                    enabled =
                        state.notificationPermission != NotificationPermissionStatus.NotRequired &&
                            !state.isMutating,
                    onClick = callbacks.onNotificationPermissionClick,
                    leadingContent = { SettingsIcon(Icons.Rounded.Notifications) },
                )
            }
        }

        item(key = "data") {
            SettingsSection(title = stringResource(R.string.settings_data)) {
                SettingsActionRow(
                    title = stringResource(R.string.settings_export_backup),
                    icon = Icons.Rounded.CloudDownload,
                    enabled = !state.isMutating,
                    onClick = callbacks.onBackupExport,
                )
                HorizontalDivider()
                SettingsActionRow(
                    title = stringResource(R.string.settings_restore_backup),
                    icon = Icons.Rounded.CloudUpload,
                    enabled = !state.isMutating,
                    onClick = callbacks.onBackupRestoreRequest,
                )
                HorizontalDivider()
                SettingsActionRow(
                    title = stringResource(R.string.settings_export_csv),
                    icon = Icons.Rounded.Backup,
                    enabled = !state.isMutating,
                    onClick = callbacks.onCsvExport,
                )
            }
        }

        item(key = "about") {
            SettingsSection(title = stringResource(R.string.settings_about)) {
                RoutempoSemanticRow(
                    title = stringResource(R.string.settings_version),
                    supportingText =
                        listOfNotNull(state.appInfo.versionName, state.appInfo.versionCode)
                            .joinToString(" · "),
                    leadingContent = { SettingsIcon(Icons.Rounded.Info) },
                )
                HorizontalDivider()
                SettingsActionRow(
                    title = stringResource(R.string.settings_terms),
                    icon = Icons.Rounded.Description,
                    onClick = callbacks.onTerms,
                )
                HorizontalDivider()
                SettingsActionRow(
                    title = stringResource(R.string.settings_privacy),
                    icon = Icons.Rounded.PrivacyTip,
                    onClick = callbacks.onPrivacy,
                )
                HorizontalDivider()
                SettingsActionRow(
                    title = stringResource(R.string.settings_support),
                    icon = Icons.Rounded.SupportAgent,
                    onClick = callbacks.onSupport,
                )
            }
        }

        item(key = "sign-out") {
            SettingsActionRow(
                title = stringResource(R.string.settings_sign_out),
                icon = Icons.Rounded.Logout,
                enabled = !state.isMutating,
                danger = true,
                onClick = callbacks.onSignOutRequest,
            )
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing8)) {
        Text(
            text = title,
            modifier = Modifier.semantics { heading() },
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.routempoColors.elevated),
            content = { Column(content = content) },
        )
    }
}

@Composable
private fun SettingsSwitchRow(
    title: String,
    supportingText: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    icon: ImageVector,
) {
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .toggleable(
                    value = checked,
                    enabled = enabled,
                    role = Role.Switch,
                    onValueChange = onCheckedChange,
                ).padding(horizontal = RoutempoDimens.spacing16, vertical = RoutempoDimens.spacing8),
        horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SettingsIcon(icon)
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleSmall)
            Text(
                supportingText,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        Switch(checked = checked, onCheckedChange = null, enabled = enabled)
    }
}

@Composable
private fun ThemeChoiceRow(
    mode: RoutempoThemeMode,
    selected: Boolean,
    enabled: Boolean,
    onSelect: () -> Unit,
) {
    val label =
        when (mode) {
            RoutempoThemeMode.System -> stringResource(R.string.settings_theme_system)
            RoutempoThemeMode.Light -> stringResource(R.string.settings_theme_light)
            RoutempoThemeMode.Dark -> stringResource(R.string.settings_theme_dark)
        }
    Row(
        modifier =
            Modifier
                .fillMaxWidth()
                .selectable(
                    selected = selected,
                    enabled = enabled,
                    role = Role.RadioButton,
                    onClick = onSelect,
                ).semantics { stateDescription = if (selected) "Selected" else "Not selected" }
                .padding(horizontal = RoutempoDimens.spacing16, vertical = RoutempoDimens.spacing8),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        SettingsIcon(Icons.Rounded.Palette)
        Text(
            text = label,
            modifier = Modifier.weight(1f).padding(horizontal = RoutempoDimens.spacing12),
            style = MaterialTheme.typography.titleSmall,
        )
        RadioButton(selected = selected, onClick = null, enabled = enabled)
    }
}

@Composable
private fun SettingsActionRow(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    enabled: Boolean = true,
    danger: Boolean = false,
) {
    RoutempoSemanticRow(
        title = title,
        onClick = onClick,
        enabled = enabled,
        leadingContent = { SettingsIcon(icon, danger = danger) },
        trailingContent = {
            Icon(
                Icons.Rounded.ChevronRight,
                contentDescription = null,
                tint = if (danger) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
            )
        },
    )
}

@Composable
private fun SettingsIcon(
    icon: ImageVector,
    danger: Boolean = false,
) {
    Surface(
        modifier = Modifier.size(40.dp),
        color = MaterialTheme.routempoColors.soft,
        contentColor = if (danger) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
        shape = CircleShape,
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.padding(10.dp))
    }
}

@Composable
private fun ProviderLetter(provider: SettingsProvider) {
    Surface(
        modifier = Modifier.size(40.dp),
        color = MaterialTheme.routempoColors.soft,
        contentColor = MaterialTheme.colorScheme.onSurface,
        shape = CircleShape,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(
                provider.displayName.first().toString(),
                style = MaterialTheme.typography.titleSmall,
            )
        }
    }
}

@Composable
private fun AccountInitialsAvatar(account: SettingsAccountUi) {
    Surface(
        modifier = Modifier.size(40.dp),
        color = MaterialTheme.colorScheme.primaryContainer,
        contentColor = MaterialTheme.colorScheme.onPrimaryContainer,
        shape = CircleShape,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(
                text = accountInitials(account.name, account.email),
                style = MaterialTheme.typography.titleSmall,
            )
        }
    }
}

private fun notificationPermissionLabel(status: NotificationPermissionStatus): String =
    when (status) {
        NotificationPermissionStatus.NotRequired -> "Allowed by this Android version"
        NotificationPermissionStatus.NotRequested -> "Not requested"
        NotificationPermissionStatus.Granted -> "Allowed"
        NotificationPermissionStatus.Denied -> "Not allowed · Tap to try again"
        NotificationPermissionStatus.Blocked -> "Blocked · Open system settings"
    }
