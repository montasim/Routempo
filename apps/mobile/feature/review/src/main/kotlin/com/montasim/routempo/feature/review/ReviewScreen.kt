package com.montasim.routempo.feature.review

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.FilterList
import androidx.compose.material.icons.outlined.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.designsystem.RoutempoOfflineBanner
import com.montasim.routempo.core.designsystem.routempoColors
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.LogStatus

@Composable
fun ReviewScreen(
    state: ReviewUiState,
    onEvent: (ReviewEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxSize()) {
        PrimaryTabRow(selectedTabIndex = state.selectedTab.ordinal) {
            Tab(
                selected = state.selectedTab == ReviewTab.INSIGHTS,
                onClick = { onEvent(ReviewEvent.SelectTab(ReviewTab.INSIGHTS)) },
                text = { Text("Insights") },
            )
            Tab(
                selected = state.selectedTab == ReviewTab.LOGS,
                onClick = { onEvent(ReviewEvent.SelectTab(ReviewTab.LOGS)) },
                text = { Text("Logs") },
            )
        }
        Box(Modifier.weight(1f)) {
            when (state.selectedTab) {
                ReviewTab.INSIGHTS -> InsightsScreen(
                    state = state.insights,
                    onSelectRange = { onEvent(ReviewEvent.SelectInsightsRange(it)) },
                    onRetry = { onEvent(ReviewEvent.RetryInsights) },
                    onRefresh = { onEvent(ReviewEvent.RefreshInsights) },
                )
                ReviewTab.LOGS -> LogsScreen(state.logs, onEvent)
            }
        }
    }
}

@Composable
@OptIn(ExperimentalMaterial3Api::class)
fun LogsScreen(
    state: LogsUiState,
    onEvent: (ReviewEvent) -> Unit,
    modifier: Modifier = Modifier,
) {
    when (state.surfaceState()) {
        ReviewSurfaceState.LOADING -> RoutempoLoadingState("Loading behavior logs", modifier.fillMaxSize())
        ReviewSurfaceState.FAILURE -> RoutempoErrorState(
            title = "Logs are unavailable",
            message = state.errorMessage ?: "Unable to load logs.",
            modifier = modifier.fillMaxSize(),
            retryLabel = "Retry",
            onRetry = { onEvent(ReviewEvent.RetryLogs) },
        )
        ReviewSurfaceState.EMPTY,
        ReviewSurfaceState.CONTENT,
        -> PullToRefreshBox(
            isRefreshing = state.isRefreshing,
            onRefresh = { onEvent(ReviewEvent.RefreshLogs) },
            modifier = modifier.fillMaxSize(),
        ) {
            LogsContent(state, onEvent, Modifier)
        }
    }

    state.selectedLog?.let { log ->
        LogDetailSheet(
            log = log,
            onDismiss = { onEvent(ReviewEvent.CloseLogDetails) },
            onEdit = { onEvent(ReviewEvent.EditLog(log)) },
            onDelete = { onEvent(ReviewEvent.RequestDeleteLog(log)) },
        )
    }
    state.editor?.let { editor ->
        LogEditorSheet(
            state = editor,
            categories = state.categoryOptions,
            onDraftChanged = { onEvent(ReviewEvent.ChangeLogDraft(it)) },
            onDismiss = { onEvent(ReviewEvent.DismissLogEditor) },
            onSave = { onEvent(ReviewEvent.SaveLog) },
        )
    }
    state.deleteCandidate?.let { log ->
        DeleteLogConfirmation(
            log = log,
            deleting = state.isDeleting,
            onDismiss = { onEvent(ReviewEvent.CancelDeleteLog) },
            onConfirm = { onEvent(ReviewEvent.ConfirmDeleteLog) },
        )
    }
}

@Composable
private fun LogsContent(state: LogsUiState, onEvent: (ReviewEvent) -> Unit, modifier: Modifier) {
    val counts = state.outcomeCounts ?: countLogOutcomes(state.logs)
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 104.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Behavior logs", Modifier.semantics { heading() }, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("${state.logs.size} loaded", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Row {
                    IconButton(onClick = { onEvent(ReviewEvent.RefreshLogs) }, enabled = !state.isRefreshing) {
                        if (state.isRefreshing) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(24.dp).semantics { contentDescription = "Refreshing logs" },
                                strokeWidth = 2.dp,
                            )
                        } else {
                            Icon(Icons.Outlined.Refresh, "Refresh logs")
                        }
                    }
                    IconButton(onClick = { onEvent(ReviewEvent.ToggleLogFilters) }) {
                        Icon(Icons.Outlined.FilterList, if (state.filters.isActive) "Edit active filters" else "Filter logs")
                    }
                    Button(onClick = { onEvent(ReviewEvent.AddLog) }) {
                        Icon(Icons.Outlined.Add, contentDescription = null)
                        Text("Add")
                    }
                }
            }
        }
        item { LogOutcomeHeader(counts) }
        if (state.filtersExpanded) item { LogFilterPanel(state, onEvent) }
        if (state.isStale) {
            item {
                RoutempoOfflineBanner(
                    title = "Showing saved logs",
                    message = "New outcomes may not appear until you reconnect.",
                    retryLabel = "Refresh",
                    onRetry = { onEvent(ReviewEvent.RefreshLogs) },
                )
            }
        }
        if (state.errorMessage != null && (state.logs.isNotEmpty() || state.isStale)) {
            item {
                RoutempoErrorState(
                    title = "Could not refresh logs",
                    message = state.errorMessage,
                    retryLabel = "Try again",
                    onRetry = { onEvent(ReviewEvent.RefreshLogs) },
                )
            }
        }
        if (state.logs.isEmpty()) {
            item {
                val staleWithoutCache = state.isStale && !state.hasLoaded
                RoutempoEmptyState(
                    title = when {
                        staleWithoutCache -> "No saved logs"
                        state.filters.isActive -> "No logs match"
                        else -> "No behavior logs yet"
                    },
                    message = when {
                        staleWithoutCache -> "Reconnect and refresh to check your behavior history."
                        state.filters.isActive -> "Adjust or clear the filters to see more outcomes."
                        else -> "Resolved routines and manual entries appear here."
                    },
                    actionLabel = when {
                        staleWithoutCache -> "Refresh"
                        state.filters.isActive -> "Clear filters"
                        else -> "Add log"
                    },
                    onAction = {
                        onEvent(
                            when {
                                staleWithoutCache -> ReviewEvent.RefreshLogs
                                state.filters.isActive -> ReviewEvent.ClearLogFilters
                                else -> ReviewEvent.AddLog
                            },
                        )
                    },
                )
            }
        } else {
            items(state.logs, key = { it.id }) { log ->
                LogRow(log) { onEvent(ReviewEvent.OpenLog(log)) }
            }
        }
        item {
            when {
                state.isLoadingNextPage -> Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.Center) {
                    CircularProgressIndicator(Modifier.semantics { contentDescription = "Loading more logs" })
                }
                state.paginationErrorMessage != null -> Card(
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer),
                ) {
                    Row(
                        Modifier.fillMaxWidth().padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(state.paginationErrorMessage, Modifier.weight(1f), color = MaterialTheme.colorScheme.onErrorContainer)
                        TextButton(onClick = { onEvent(ReviewEvent.RetryLogPage) }) { Text("Retry page") }
                    }
                }
                state.nextCursor != null -> OutlinedButton(
                    onClick = { onEvent(ReviewEvent.LoadMoreLogs) },
                    modifier = Modifier.fillMaxWidth(),
                ) { Text("Load more") }
                state.hasLoaded && state.logs.isNotEmpty() -> Text(
                    text = if (state.filters.isActive) "End of filtered logs" else "End of behavior logs",
                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }
    }
}

@Composable
private fun LogOutcomeHeader(counts: LogOutcomeCounts) {
    Card {
        FlowRow(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 14.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            OutcomeCount("All", counts.all)
            OutcomeCount("Completed", counts.completed)
            OutcomeCount("Skipped", counts.skipped)
            OutcomeCount("Missed", counts.missed)
        }
    }
}

@Composable
private fun OutcomeCount(label: String, count: Int) {
    Column(Modifier.semantics { contentDescription = "$label logs $count" }) {
        Text(count.toString(), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
        Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelMedium)
    }
}

@Composable
private fun LogFilterPanel(state: LogsUiState, onEvent: (ReviewEvent) -> Unit) {
    val filters = state.filters
    val validation = validateLogFilters(filters)
    Card {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text("Filter logs", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = filters.startDate,
                    onValueChange = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(startDate = it))) },
                    modifier = Modifier.weight(1f),
                    label = { Text("From") },
                    supportingText = { Text(validation[LogFilterField.START_DATE] ?: "YYYY-MM-DD") },
                    isError = validation[LogFilterField.START_DATE] != null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
                    singleLine = true,
                )
                OutlinedTextField(
                    value = filters.endDate,
                    onValueChange = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(endDate = it))) },
                    modifier = Modifier.weight(1f),
                    label = { Text("To") },
                    supportingText = { Text(validation[LogFilterField.END_DATE] ?: "YYYY-MM-DD") },
                    isError = validation[LogFilterField.END_DATE] != null,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
                    singleLine = true,
                )
            }
            Text("Outcome", style = MaterialTheme.typography.titleSmall)
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = filters.status == null,
                    onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(status = null))) },
                    label = { Text("All") },
                )
                LogStatus.entries.forEach { status ->
                    FilterChip(
                        selected = filters.status == status,
                        onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(status = status))) },
                        label = { Text(status.label()) },
                    )
                }
            }
            if (state.categoryOptions.isNotEmpty()) {
                Text("Category", style = MaterialTheme.typography.titleSmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = filters.category == null,
                        onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(category = null))) },
                        label = { Text("All") },
                    )
                    sortedCategoryLabels(state.categoryOptions).forEach { category ->
                        FilterChip(
                            selected = filters.category == category,
                            onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(category = category))) },
                            label = { Text(category) },
                        )
                    }
                }
            }
            if (state.routineOptions.isNotEmpty()) {
                Text("Routine", style = MaterialTheme.typography.titleSmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FilterChip(
                        selected = filters.routineId == null,
                        onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(routineId = null))) },
                        label = { Text("All") },
                    )
                    state.routineOptions.forEach { option ->
                        FilterChip(
                            selected = filters.routineId == option.value,
                            onClick = { onEvent(ReviewEvent.ChangeLogFilters(filters.copy(routineId = option.value))) },
                            label = { Text(option.label, maxLines = 1, overflow = TextOverflow.Ellipsis) },
                        )
                    }
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                TextButton(onClick = { onEvent(ReviewEvent.ClearLogFilters) }, enabled = filters.isActive) { Text("Clear") }
                Button(
                    onClick = { onEvent(ReviewEvent.ApplyLogFilters) },
                    enabled = validation.isValid && !state.isLoading && !state.isRefreshing,
                ) { Text("Apply") }
            }
        }
    }
}

@Composable
private fun LogRow(log: BehaviorLog, onOpen: () -> Unit) {
    Card(onClick = onOpen) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(log.title, fontWeight = FontWeight.SemiBold, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(
                    "${log.date} · ${log.eventTime} · ${log.category}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            StatusPill(log.status)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogDetailSheet(
    log: BehaviorLog,
    onDismiss: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
) {
    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Text(log.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                StatusPill(log.status)
            }
            Text("Immutable audit identifiers", style = MaterialTheme.typography.titleSmall)
            SelectionContainer { DetailLine("Log ID", log.id) }
            SelectionContainer { DetailLine("Routine ID", log.routineId ?: "None — manual log") }
            DetailLine("Date", "${log.date} at ${log.eventTime}")
            DetailLine("Category", log.category)
            DetailLine("Scheduled", log.scheduledTime)
            DetailLine("Actual", log.actualTime ?: "Not recorded")
            DetailLine("Variance", log.variance)
            DetailLine("Timezone", log.timezone)
            DetailLine("Recorded", "${log.recordedAt} by ${log.actor}")
            DetailLine("Source", log.source)
            if (log.note.isNotBlank()) DetailLine("Note", log.note)
            HorizontalDivider()
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = onEdit, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Outlined.Edit, contentDescription = null)
                    Text("Edit")
                }
                OutlinedButton(onClick = onDelete, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Outlined.Delete, contentDescription = null)
                    Text("Delete")
                }
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun DetailLine(label: String, value: String) {
    Column {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LogEditorSheet(
    state: LogEditorUiState,
    categories: List<String>,
    onDraftChanged: (LogDraft) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit,
) {
    val draft = state.draft
    fun error(field: LogField) = if (state.showValidation) state.validation[field] else null
    ModalBottomSheet(onDismissRequest = { if (!state.isSaving) onDismiss() }) {
        LazyColumn(
            contentPadding = PaddingValues(20.dp, 4.dp, 20.dp, 40.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item { Text(if (state.logId == null) "Add behavior log" else "Edit behavior log", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold) }
            item {
                OutlinedTextField(
                    value = draft.title,
                    onValueChange = { onDraftChanged(draft.copy(title = it.take(100))) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Title") },
                    isError = error(LogField.TITLE) != null,
                    supportingText = { Text(error(LogField.TITLE) ?: "${draft.title.length}/100") },
                    enabled = !state.isSaving,
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    EditorField(draft.date, { onDraftChanged(draft.copy(date = it)) }, "Date", error(LogField.DATE), Modifier.weight(1f), state.isSaving)
                    EditorField(draft.eventTime, { onDraftChanged(draft.copy(eventTime = it)) }, "Event time", error(LogField.EVENT_TIME), Modifier.weight(1f), state.isSaving)
                }
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    EditorField(draft.scheduledTime, { onDraftChanged(draft.copy(scheduledTime = it)) }, "Scheduled", error(LogField.SCHEDULED_TIME), Modifier.weight(1f), state.isSaving)
                    EditorField(draft.actualTime, { onDraftChanged(draft.copy(actualTime = it)) }, "Actual (optional)", error(LogField.ACTUAL_TIME), Modifier.weight(1f), state.isSaving)
                }
            }
            item {
                OutlinedTextField(
                    value = draft.category,
                    onValueChange = { onDraftChanged(draft.copy(category = it.take(60))) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Category") },
                    isError = error(LogField.CATEGORY) != null,
                    supportingText = { Text(error(LogField.CATEGORY) ?: "${draft.category.length}/60") },
                    enabled = !state.isSaving,
                )
                if (categories.isNotEmpty()) {
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        sortedCategoryLabels(categories).forEach { category ->
                            FilterChip(
                                selected = draft.category == category,
                                onClick = { onDraftChanged(draft.copy(category = category)) },
                                label = { Text(category) },
                                enabled = !state.isSaving,
                            )
                        }
                    }
                }
            }
            item {
                Text("Outcome", style = MaterialTheme.typography.titleSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    LogStatus.entries.forEach { status ->
                        FilterChip(
                            selected = draft.status == status,
                            onClick = { onDraftChanged(draft.copy(status = status)) },
                            label = { Text(status.label()) },
                            enabled = !state.isSaving,
                        )
                    }
                }
            }
            item {
                OutlinedTextField(
                    value = draft.note,
                    onValueChange = { onDraftChanged(draft.copy(note = it.take(240))) },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Note (optional)") },
                    minLines = 3,
                    isError = error(LogField.NOTE) != null,
                    supportingText = { Text(error(LogField.NOTE) ?: "${draft.note.length}/240") },
                    enabled = !state.isSaving,
                )
            }
            state.errorMessage?.let { message -> item { Text(message, color = MaterialTheme.colorScheme.error) } }
            item {
                Button(onClick = onSave, modifier = Modifier.fillMaxWidth(), enabled = !state.isSaving) {
                    Text(if (state.isSaving) "Saving…" else "Save log")
                }
            }
        }
    }
}

@Composable
private fun EditorField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    error: String?,
    modifier: Modifier,
    saving: Boolean,
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier,
        label = { Text(label) },
        supportingText = { Text(error ?: if (label == "Date") "YYYY-MM-DD" else "HH:mm") },
        isError = error != null,
        enabled = !saving,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Ascii),
        singleLine = true,
    )
}

@Composable
fun DeleteLogConfirmation(
    log: BehaviorLog,
    deleting: Boolean,
    onDismiss: () -> Unit,
    onConfirm: () -> Unit,
) {
    AlertDialog(
        onDismissRequest = { if (!deleting) onDismiss() },
        title = { Text("Delete this log?") },
        text = { Text("${log.title} on ${log.date} will be removed. Its routine will not change.") },
        confirmButton = { TextButton(onClick = onConfirm, enabled = !deleting) { Text(if (deleting) "Deleting…" else "Delete") } },
        dismissButton = { TextButton(onClick = onDismiss, enabled = !deleting) { Text("Cancel") } },
    )
}

@Composable
private fun StatusPill(status: LogStatus) {
    val color = status.color()
    Card(
        colors = CardDefaults.cardColors(containerColor = color.copy(alpha = 0.14f), contentColor = color),
        modifier = Modifier.semantics { contentDescription = "Outcome ${status.label()}" },
    ) { Text(status.label(), Modifier.padding(horizontal = 10.dp, vertical = 6.dp), style = MaterialTheme.typography.labelMedium) }
}

@Composable
private fun LogStatus.color(): Color = when (this) {
    LogStatus.COMPLETED -> MaterialTheme.routempoColors.completed
    LogStatus.SKIPPED -> MaterialTheme.routempoColors.skipped
    LogStatus.MISSED -> MaterialTheme.routempoColors.missed
}

private fun LogStatus.label(): String = name.lowercase().replaceFirstChar(Char::uppercase)
