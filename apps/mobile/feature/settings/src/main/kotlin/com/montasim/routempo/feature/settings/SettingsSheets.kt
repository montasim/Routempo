@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.montasim.routempo.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ListAlt
import androidx.compose.material.icons.rounded.ArrowDownward
import androidx.compose.material.icons.rounded.ArrowUpward
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.Delete
import androidx.compose.material.icons.rounded.Edit
import androidx.compose.material.icons.rounded.Search
import androidx.compose.material.icons.rounded.Tag
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.ExposedDropdownMenuAnchorType
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoConfirmationSheet
import com.montasim.routempo.core.designsystem.RoutempoDimens
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoModalSheet
import com.montasim.routempo.core.designsystem.RoutempoSemanticRow
import com.montasim.routempo.core.designsystem.RoutempoRowSemantics
import com.montasim.routempo.core.designsystem.routempoColors
import java.util.TimeZone

data class ProfileSettingsDraft(
    val name: String,
    val timezone: String,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSettingsSheet(
    account: SettingsAccountUi,
    supportedTimezones: List<String>,
    isSaving: Boolean,
    onSave: (ProfileSettingsDraft) -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    deviceTimezoneId: String = TimeZone.getDefault().id,
) {
    var name by rememberSaveable(account.name) { mutableStateOf(account.name) }
    val options = remember(supportedTimezones) { timezoneOptions(supportedTimezones) }
    val initialTimezone = options.firstOrNull { it.id == account.timezone }
    var timezoneId by rememberSaveable(account.timezone) { mutableStateOf(account.timezone) }
    var timezoneQuery by
        rememberSaveable(account.timezone) {
            mutableStateOf(initialTimezone?.displayLabel ?: account.timezone)
        }
    var timezoneExpanded by rememberSaveable { mutableStateOf(false) }
    val selectedTimezone = options.firstOrNull { it.id == timezoneId }
    val effectiveQuery =
        timezoneQuery.takeUnless { selectedTimezone != null && it == selectedTimezone.displayLabel }.orEmpty()
    val timezoneOptions =
        options
            .filter { it.matches(effectiveQuery) }
            .take(50)
    val timezoneValid = selectedTimezone != null
    val deviceTimezone = remember(deviceTimezoneId) { timezoneOption(deviceTimezoneId) }
    val deviceTimezoneSupported = options.any { it.id == deviceTimezoneId }
    val nameError =
        when {
            name.isBlank() -> stringResource(R.string.settings_name_required)
            name.trim().length > 80 -> stringResource(R.string.settings_name_too_long)
            else -> null
        }

    RoutempoModalSheet(
        title = stringResource(R.string.settings_profile),
        onDismissRequest = { if (!isSaving) onDismissRequest() },
        modifier = modifier,
    ) {
        Text(
            text = stringResource(R.string.settings_profile_detail),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            value = name,
            onValueChange = { if (it.length <= 80) name = it },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing16),
            label = { Text(stringResource(R.string.settings_name)) },
            supportingText = nameError?.let { { Text(it) } },
            isError = nameError != null,
            singleLine = true,
            enabled = !isSaving,
        )
        OutlinedTextField(
            value = account.email,
            onValueChange = {},
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
            label = { Text(stringResource(R.string.settings_email)) },
            supportingText = { Text(stringResource(R.string.settings_email_managed)) },
            enabled = false,
            singleLine = true,
        )
        ExposedDropdownMenuBox(
            expanded = timezoneExpanded,
            onExpandedChange = { if (!isSaving) timezoneExpanded = !timezoneExpanded },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
        ) {
            OutlinedTextField(
                value = timezoneQuery,
                onValueChange = { query ->
                    timezoneQuery = query
                    timezoneId =
                        options
                            .firstOrNull {
                                it.id.equals(query.trim(), ignoreCase = true) ||
                                    it.displayLabel.equals(query.trim(), ignoreCase = true)
                            }?.id.orEmpty()
                    timezoneExpanded = true
                },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .menuAnchor(ExposedDropdownMenuAnchorType.PrimaryEditable, enabled = !isSaving),
                label = { Text(stringResource(R.string.settings_timezone)) },
                supportingText =
                    if (!timezoneValid) {
                        { Text(stringResource(R.string.settings_timezone_select_valid)) }
                    } else {
                        { Text(selectedTimezone.id) }
                    },
                isError = !timezoneValid,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(timezoneExpanded) },
                enabled = !isSaving,
            )
            ExposedDropdownMenu(
                expanded = timezoneExpanded,
                onDismissRequest = { timezoneExpanded = false },
            ) {
                timezoneOptions.forEach { option ->
                    DropdownMenuItem(
                        text = {
                            Column {
                                Text(option.displayLabel)
                                Text(
                                    text = option.id,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        },
                        onClick = {
                            timezoneId = option.id
                            timezoneQuery = option.displayLabel
                            timezoneExpanded = false
                        },
                    )
                }
            }
        }
        Text(
            text = stringResource(R.string.settings_device_timezone),
            modifier = Modifier.padding(top = RoutempoDimens.spacing12),
            style = MaterialTheme.typography.labelLarge,
        )
        Text(
            text = deviceTimezone?.displayLabel ?: deviceTimezoneId,
            style = MaterialTheme.typography.bodyMedium,
        )
        Text(
            text = deviceTimezoneId,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedButton(
            onClick = {
                val option = options.first { it.id == deviceTimezoneId }
                timezoneId = option.id
                timezoneQuery = option.displayLabel
            },
            enabled = deviceTimezoneSupported && !isSaving,
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing8),
        ) {
            Text(stringResource(R.string.settings_use_device_timezone))
        }
        Button(
            onClick = { onSave(ProfileSettingsDraft(name.trim(), timezoneId)) },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = RoutempoDimens.spacing20)
                    .heightIn(min = RoutempoDimens.primaryActionHeight),
            enabled = nameError == null && timezoneValid && !isSaving,
        ) {
            if (isSaving) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
            } else {
                Text(stringResource(R.string.settings_save_changes))
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReminderConfigurationSheet(
    current: ReminderSettingsUi,
    modifier: Modifier = Modifier,
    reminderTimeOptions: List<String>,
    reminderOffsetOptions: List<Int> = listOf(0, 5, 10, 15, 20, 30, 45, 60),
    isSaving: Boolean,
    onSave: (ReminderSettingsUi) -> Unit,
    onDismissRequest: () -> Unit,
) {
    var enabled by rememberSaveable { mutableStateOf(current.routineRemindersEnabled) }
    var reminderTime by rememberSaveable { mutableStateOf(current.reminderTime) }
    var offset by rememberSaveable { mutableIntStateOf(current.reminderOffsetMinutes) }
    var weekly by rememberSaveable { mutableStateOf(current.weeklySummaryEnabled) }
    var timeExpanded by rememberSaveable { mutableStateOf(false) }
    var offsetExpanded by rememberSaveable { mutableStateOf(false) }

    RoutempoModalSheet(
        title = stringResource(R.string.settings_reminders_title),
        onDismissRequest = { if (!isSaving) onDismissRequest() },
        modifier = modifier,
    ) {
        LabeledSwitch(
            title = stringResource(R.string.settings_routine_reminders),
            checked = enabled,
            enabled = !isSaving,
            onCheckedChange = { enabled = it },
        )
        ExposedDropdownMenuBox(
            expanded = timeExpanded,
            onExpandedChange = { if (enabled && !isSaving) timeExpanded = !timeExpanded },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
        ) {
            OutlinedTextField(
                value = reminderTime,
                onValueChange = {},
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .menuAnchor(
                            ExposedDropdownMenuAnchorType.PrimaryNotEditable,
                            enabled = enabled && !isSaving,
                        ),
                readOnly = true,
                label = { Text(stringResource(R.string.settings_reminder_time)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(timeExpanded) },
                enabled = enabled && !isSaving,
            )
            ExposedDropdownMenu(expanded = timeExpanded, onDismissRequest = { timeExpanded = false }) {
                reminderTimeOptions.distinct().forEach { option ->
                    DropdownMenuItem(
                        text = { Text(option) },
                        onClick = {
                            reminderTime = option
                            timeExpanded = false
                        },
                    )
                }
            }
        }
        ExposedDropdownMenuBox(
            expanded = offsetExpanded,
            onExpandedChange = { if (enabled && !isSaving) offsetExpanded = !offsetExpanded },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
        ) {
            OutlinedTextField(
                value = reminderOffsetLabel(offset),
                onValueChange = {},
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .menuAnchor(
                            ExposedDropdownMenuAnchorType.PrimaryNotEditable,
                            enabled = enabled && !isSaving,
                        ),
                readOnly = true,
                label = { Text(stringResource(R.string.settings_reminder_offset)) },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(offsetExpanded) },
                enabled = enabled && !isSaving,
            )
            ExposedDropdownMenu(expanded = offsetExpanded, onDismissRequest = { offsetExpanded = false }) {
                reminderOffsetOptions.distinct().sorted().forEach { option ->
                    DropdownMenuItem(
                        text = { Text(reminderOffsetLabel(option)) },
                        onClick = {
                            offset = option
                            offsetExpanded = false
                        },
                    )
                }
            }
        }
        LabeledSwitch(
            title = stringResource(R.string.settings_weekly_summary),
            checked = weekly,
            enabled = !isSaving,
            onCheckedChange = { weekly = it },
            modifier = Modifier.padding(top = RoutempoDimens.spacing12),
        )
        Button(
            onClick = {
                onSave(
                    ReminderSettingsUi(
                        routineRemindersEnabled = enabled,
                        reminderTime = reminderTime,
                        reminderOffsetMinutes = offset,
                        weeklySummaryEnabled = weekly,
                    ),
                )
            },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = RoutempoDimens.spacing20)
                    .heightIn(min = RoutempoDimens.primaryActionHeight),
            enabled = !isSaving,
        ) {
            Text(stringResource(R.string.settings_save_changes))
        }
    }
}

@Composable
fun CategoryManagementSheet(
    categories: List<CategorySettingsUi>,
    busyCategoryIds: Set<String>,
    onAdd: () -> Unit,
    onEdit: (CategorySettingsUi) -> Unit,
    onDeleteRequest: (CategorySettingsUi) -> Unit,
    onMove: (categoryId: String, newIndex: Int) -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
) {
    var query by rememberSaveable { mutableStateOf("") }
    val filtered = categories.filter { it.name.contains(query.trim(), ignoreCase = true) }
    RoutempoModalSheet(
        title = stringResource(R.string.settings_categories),
        onDismissRequest = onDismissRequest,
        modifier = modifier,
    ) {
        Text(
            stringResource(R.string.settings_categories_detail),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing16),
            label = { Text(stringResource(R.string.settings_search_categories)) },
            leadingIcon = { Icon(Icons.Rounded.Search, contentDescription = null) },
            singleLine = true,
        )
        Button(
            onClick = onAdd,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = RoutempoDimens.spacing12)
                    .heightIn(min = RoutempoDimens.primaryActionHeight),
        ) {
            Text(stringResource(R.string.settings_add_category))
        }
        if (filtered.isEmpty()) {
            RoutempoEmptyState(
                title = stringResource(R.string.settings_no_categories),
                message = stringResource(R.string.settings_no_categories_detail),
            )
        } else {
            Column(modifier = Modifier.padding(top = RoutempoDimens.spacing12)) {
                filtered.forEachIndexed { filteredIndex, category ->
                    val actualIndex = categories.indexOfFirst { it.id == category.id }
                    val busy = category.id in busyCategoryIds
                    RoutempoSemanticRow(
                        title = category.name,
                        supportingText =
                            pluralStringResource(
                                R.plurals.settings_routine_count,
                                category.routineCount,
                                category.routineCount,
                            ),
                        enabled = !busy,
                        semantics =
                            RoutempoRowSemantics(
                                disabledReason = if (busy) stringResource(R.string.settings_category_updating) else null,
                            ),
                        leadingContent = { CategorySwatch(category.colorHex) },
                        trailingContent = {
                            IconButton(
                                onClick = { onMove(category.id, actualIndex - 1) },
                                enabled = !busy && query.isBlank() && actualIndex > 0,
                            ) {
                                Icon(
                                    Icons.Rounded.ArrowUpward,
                                    contentDescription = stringResource(R.string.settings_move_category_up, category.name),
                                )
                            }
                            IconButton(
                                onClick = { onMove(category.id, actualIndex + 1) },
                                enabled = !busy && query.isBlank() && actualIndex < categories.lastIndex,
                            ) {
                                Icon(
                                    Icons.Rounded.ArrowDownward,
                                    contentDescription = stringResource(R.string.settings_move_category_down, category.name),
                                )
                            }
                            IconButton(onClick = { onEdit(category) }, enabled = !busy) {
                                Icon(
                                    Icons.Rounded.Edit,
                                    contentDescription = stringResource(R.string.settings_edit_category, category.name),
                                )
                            }
                            IconButton(
                                onClick = { onDeleteRequest(category) },
                                enabled = !busy && category.routineCount == 0,
                            ) {
                                Icon(
                                    Icons.Rounded.Delete,
                                    contentDescription =
                                        if (category.routineCount == 0) {
                                            stringResource(R.string.settings_delete_category, category.name)
                                        } else {
                                            stringResource(R.string.settings_category_in_use, category.name)
                                        },
                                )
                            }
                        },
                    )
                    if (filteredIndex != filtered.lastIndex) HorizontalDivider()
                }
            }
        }
    }
}

@Composable
fun CategoryEditorSheet(
    category: CategorySettingsUi?,
    existingCategoryNames: Collection<String>,
    isSaving: Boolean,
    onSave: (CategoryDraft) -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    serverError: String? = null,
) {
    var name by rememberSaveable(category?.id) { mutableStateOf(category?.name.orEmpty()) }
    var colorHex by rememberSaveable(category?.id) { mutableStateOf(category?.colorHex ?: DEFAULT_CATEGORY_COLOR) }
    var submitted by rememberSaveable { mutableStateOf(false) }
    val validation =
        validateCategoryDraft(
            CategoryDraft(name, colorHex),
            existingNames = existingCategoryNames,
            currentName = category?.name,
        )
    RoutempoModalSheet(
        title =
            if (category == null) {
                stringResource(R.string.settings_add_category)
            } else {
                stringResource(R.string.settings_rename_category)
            },
        onDismissRequest = { if (!isSaving) onDismissRequest() },
        modifier = modifier,
    ) {
        OutlinedTextField(
            value = name,
            onValueChange = { if (it.length <= CATEGORY_NAME_MAX_LENGTH) name = it },
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing8),
            label = { Text(stringResource(R.string.settings_category_name)) },
            supportingText =
                if (submitted && validation.nameError != null) {
                    { Text(validation.nameError) }
                } else {
                    { Text(stringResource(R.string.settings_category_name_limit, name.length, CATEGORY_NAME_MAX_LENGTH)) }
                },
            isError = submitted && validation.nameError != null,
            enabled = !isSaving,
            singleLine = true,
        )
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            CategorySwatch(validation.normalizedColorHex)
            OutlinedTextField(
                value = colorHex,
                onValueChange = { if (it.length <= 7) colorHex = it },
                modifier = Modifier.weight(1f),
                label = { Text(stringResource(R.string.settings_category_color)) },
                supportingText =
                    if (submitted && validation.colorError != null) {
                        { Text(validation.colorError) }
                    } else {
                        { Text(stringResource(R.string.settings_category_color_example)) }
                    },
                isError = submitted && validation.colorError != null,
                enabled = !isSaving,
                singleLine = true,
            )
        }
        if (serverError != null) {
            Text(
                serverError,
                modifier = Modifier.padding(top = RoutempoDimens.spacing8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
            )
        }
        Button(
            onClick = {
                submitted = true
                if (validation.isValid) {
                    onSave(CategoryDraft(validation.normalizedName, validation.normalizedColorHex))
                }
            },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = RoutempoDimens.spacing20)
                    .heightIn(min = RoutempoDimens.primaryActionHeight),
            enabled = !isSaving,
        ) {
            Text(
                if (category == null) {
                    stringResource(R.string.settings_add_category)
                } else {
                    stringResource(R.string.settings_save_changes)
                },
            )
        }
    }
}

@Composable
fun ProviderIntegrationSheet(
    provider: ProviderSettingsUi,
    onConnect: (SettingsProvider) -> Unit,
    onSync: (SettingsProvider, IntegrationResourceUi, IntegrationActionUi) -> Unit,
    onDisconnectRequest: (SettingsProvider) -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val busy = provider.activeOperation != null || provider.status == ProviderConnectionStatus.Connecting
    RoutempoModalSheet(
        title = stringResource(R.string.settings_provider_integration, provider.provider.displayName),
        onDismissRequest = { if (!busy) onDismissRequest() },
        modifier = modifier,
    ) {
        Text(
            stringResource(R.string.settings_provider_detail),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        SurfaceStatus(provider)
        if (provider.status == ProviderConnectionStatus.Connected) {
            IntegrationResourceCard(
                provider = provider,
                resource = IntegrationResourceUi.Calendar,
                title = stringResource(R.string.settings_calendar),
                icon = Icons.Rounded.CalendarMonth,
                onSync = onSync,
            )
            IntegrationResourceCard(
                provider = provider,
                resource = IntegrationResourceUi.Tasks,
                title = provider.provider.taskLabel,
                icon = Icons.AutoMirrored.Rounded.ListAlt,
                onSync = onSync,
            )
            TextButton(
                onClick = { onDisconnectRequest(provider.provider) },
                modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
                enabled = !busy,
            ) {
                Text(
                    stringResource(R.string.settings_disconnect_provider, provider.provider.displayName),
                    color = MaterialTheme.colorScheme.error,
                )
            }
        } else {
            Button(
                onClick = { onConnect(provider.provider) },
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = RoutempoDimens.spacing16)
                        .heightIn(min = RoutempoDimens.primaryActionHeight),
                enabled =
                    !busy &&
                        provider.status !in
                            setOf(
                                ProviderConnectionStatus.Checking,
                                ProviderConnectionStatus.Unconfigured,
                            ),
            ) {
                Text(
                    if (provider.status == ProviderConnectionStatus.Expired) {
                        stringResource(R.string.settings_reconnect_provider, provider.provider.displayName)
                    } else {
                        stringResource(R.string.settings_connect_provider, provider.provider.displayName)
                    },
                )
            }
        }
    }
}

@Composable
private fun SurfaceStatus(provider: ProviderSettingsUi) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(top = RoutempoDimens.spacing16)
                .background(MaterialTheme.routempoColors.soft, MaterialTheme.shapes.medium)
                .padding(RoutempoDimens.spacing16),
    ) {
        Text(
            providerStatusLabel(provider),
            modifier = Modifier.semantics { heading() },
            style = MaterialTheme.typography.titleSmall,
        )
        if (provider.detail != null) {
            Text(
                provider.detail,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun IntegrationResourceCard(
    provider: ProviderSettingsUi,
    resource: IntegrationResourceUi,
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onSync: (SettingsProvider, IntegrationResourceUi, IntegrationActionUi) -> Unit,
) {
    val busy = provider.activeOperation != null
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .padding(top = RoutempoDimens.spacing12)
                .background(MaterialTheme.routempoColors.elevated, MaterialTheme.shapes.medium)
                .padding(RoutempoDimens.spacing16),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
            Text(
                title,
                modifier = Modifier.padding(start = RoutempoDimens.spacing12),
                style = MaterialTheme.typography.titleSmall,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing12),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing8),
        ) {
            IntegrationActionUi.entries.forEach { action ->
                OutlinedButton(
                    onClick = { onSync(provider.provider, resource, action) },
                    modifier = Modifier.weight(1f).heightIn(min = RoutempoDimens.minimumTouchTarget),
                    enabled = !busy,
                ) {
                    val active = provider.activeOperation == IntegrationOperation(resource, action)
                    if (active) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), strokeWidth = 2.dp)
                    } else {
                        Text(action.displayName)
                    }
                }
            }
        }
    }
}

@Composable
fun DeleteCategoryConfirmationSheet(
    category: CategorySettingsUi,
    busy: Boolean,
    onConfirm: (CategorySettingsUi) -> Unit,
    onDismissRequest: () -> Unit,
) {
    RoutempoConfirmationSheet(
        title = stringResource(R.string.settings_delete_category_title),
        message = stringResource(R.string.settings_delete_category_message, category.name),
        confirmLabel = stringResource(R.string.settings_delete_category_confirm),
        cancelLabel = stringResource(R.string.settings_cancel),
        onConfirm = { onConfirm(category) },
        onDismissRequest = onDismissRequest,
        busy = busy,
    )
}

@Composable
fun DisconnectProviderConfirmationSheet(
    provider: SettingsProvider,
    busy: Boolean,
    onConfirm: (SettingsProvider) -> Unit,
    onDismissRequest: () -> Unit,
) {
    RoutempoConfirmationSheet(
        title = stringResource(R.string.settings_disconnect_title, provider.displayName),
        message = stringResource(R.string.settings_disconnect_message, provider.displayName),
        confirmLabel = stringResource(R.string.settings_disconnect_confirm),
        cancelLabel = stringResource(R.string.settings_cancel),
        onConfirm = { onConfirm(provider) },
        onDismissRequest = onDismissRequest,
        busy = busy,
    )
}

@Composable
fun RestoreBackupConfirmationSheet(
    filename: String?,
    busy: Boolean,
    onConfirm: () -> Unit,
    onDismissRequest: () -> Unit,
    warningMessage: String? = null,
) {
    RoutempoConfirmationSheet(
        title = stringResource(R.string.settings_restore_title),
        message =
            (if (filename.isNullOrBlank()) {
                stringResource(R.string.settings_restore_message)
            } else {
                stringResource(R.string.settings_restore_file_message, filename)
            }) + warningMessage?.let { "\n\n$it" }.orEmpty(),
        confirmLabel = stringResource(R.string.settings_restore_confirm),
        cancelLabel = stringResource(R.string.settings_cancel),
        onConfirm = onConfirm,
        onDismissRequest = onDismissRequest,
        busy = busy,
    )
}

@Composable
fun SignOutConfirmationSheet(
    busy: Boolean,
    onConfirm: () -> Unit,
    onDismissRequest: () -> Unit,
) {
    RoutempoConfirmationSheet(
        title = stringResource(R.string.settings_sign_out_title),
        message = stringResource(R.string.settings_sign_out_message),
        confirmLabel = stringResource(R.string.settings_sign_out),
        cancelLabel = stringResource(R.string.settings_cancel),
        onConfirm = onConfirm,
        onDismissRequest = onDismissRequest,
        busy = busy,
    )
}

@Composable
private fun LabeledSwitch(
    title: String,
    checked: Boolean,
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(title, modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleSmall)
        Switch(checked = checked, onCheckedChange = onCheckedChange, enabled = enabled)
    }
}

@Composable
private fun CategorySwatch(colorHex: String) {
    val color = categoryColorOrDefault(colorHex)
    Box(
        modifier =
            Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(color),
        contentAlignment = Alignment.Center,
    ) {
        Icon(Icons.Rounded.Tag, contentDescription = null, tint = Color.White)
    }
}

internal fun categoryColorOrDefault(colorHex: String): Color {
    val normalized = normalizeCategoryColor(colorHex) ?: DEFAULT_CATEGORY_COLOR
    return Color(0xFF000000 or normalized.drop(1).toLong(16))
}
