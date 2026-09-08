package com.montasim.routempo.feature.today

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.RadioButtonUnchecked
import androidx.compose.material.icons.outlined.Replay
import androidx.compose.material.icons.outlined.Schedule
import androidx.compose.material.icons.outlined.SkipNext
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.semantics.toggleableState
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.state.ToggleableState
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.RoutineOccurrence
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.temporal.TemporalAdjusters
import java.util.Locale

enum class TodayEmptyKind {
    NO_ROUTINES,
    NO_OCCURRENCES,
    OFFLINE_NO_CACHE,
    FAILURE,
}

@Immutable
data class TodayOccurrenceDetails(
    val note: String? = null,
    val localizedTime: String? = null,
)

@Immutable
data class TodayWeekDaySummary(
    val date: LocalDate,
    val completed: Int,
    val total: Int,
) {
    init {
        require(completed >= 0 && total >= 0 && completed <= total)
    }
}

@Immutable
data class TodayUiState(
    val greeting: String = "Today",
    val dateLabel: String = "",
    val occurrences: List<RoutineOccurrence> = emptyList(),
    val weekCompleted: Int = 0,
    val weekTotal: Int = 0,
    val isLoading: Boolean = false,
    val isStale: Boolean = false,
    val errorMessage: String? = null,
    val busyOccurrenceIds: Set<String> = emptySet(),
    /** Explicitly distinguishes valid empty results. Null retains the legacy no-routines behavior. */
    val emptyKind: TodayEmptyKind? = null,
    val occurrenceDetails: Map<String, TodayOccurrenceDetails> = emptyMap(),
    val weekDays: List<TodayWeekDaySummary> = emptyList(),
)

fun buildTodayWeek(
    occurrences: List<RoutineOccurrence>,
    dateInWeek: LocalDate,
): List<TodayWeekDaySummary> {
    val monday = dateInWeek.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
    return (0L..6L).map { offset ->
        val date = monday.plusDays(offset)
        val forDate = occurrences.filter { runCatching { LocalDate.parse(it.date) }.getOrNull() == date }
        TodayWeekDaySummary(
            date = date,
            completed = forDate.count { it.status == OccurrenceStatus.COMPLETED },
            total = forDate.size,
        )
    }
}

fun localizedTime(
    scheduledTime: String,
    locale: Locale = Locale.getDefault(),
): String =
    runCatching {
        LocalTime.parse(scheduledTime).format(DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(locale))
    }.getOrDefault(scheduledTime)

@Composable
fun TodayScreen(
    state: TodayUiState,
    onRetry: () -> Unit,
    onAddRoutine: () -> Unit,
    onOpenOccurrence: (RoutineOccurrence) -> Unit,
    onComplete: (RoutineOccurrence) -> Unit,
    onSkip: (RoutineOccurrence) -> Unit,
    onRevert: (RoutineOccurrence) -> Unit,
    modifier: Modifier = Modifier,
) {
    when {
        state.isLoading && state.occurrences.isEmpty() ->
            RoutempoLoadingState(message = "Loading today's routines", modifier = modifier.fillMaxSize())
        state.occurrences.isEmpty() && state.emptyKind == TodayEmptyKind.OFFLINE_NO_CACHE ->
            RoutempoErrorState(
                title = "You're offline",
                message = "Connect to the internet to load today for the first time.",
                retryLabel = "Try again",
                onRetry = onRetry,
                modifier = modifier.fillMaxSize(),
            )
        state.occurrences.isEmpty() && (state.emptyKind == TodayEmptyKind.FAILURE || state.errorMessage != null) ->
            RoutempoErrorState(
                title = "Today is unavailable",
                message = state.errorMessage ?: "We couldn't load today's routines.",
                retryLabel = "Try again",
                onRetry = onRetry,
                modifier = modifier.fillMaxSize(),
            )
        state.occurrences.isEmpty() && state.emptyKind == TodayEmptyKind.NO_OCCURRENCES ->
            RoutempoEmptyState(
                title = "Nothing scheduled today",
                message = "Your routines are taking a day off. You can add another whenever it helps.",
                actionLabel = "Add routine",
                onAction = onAddRoutine,
                modifier = modifier.fillMaxSize(),
            )
        state.occurrences.isEmpty() ->
            RoutempoEmptyState(
                title = "No routines yet",
                message = "Add your first routine to give today a little structure.",
                actionLabel = "Add routine",
                onAction = onAddRoutine,
                modifier = modifier.fillMaxSize(),
            )
        else -> TodayContent(state, onOpenOccurrence, onComplete, onSkip, onRevert, modifier)
    }
}

@Composable
private fun TodayContent(
    state: TodayUiState,
    onOpenOccurrence: (RoutineOccurrence) -> Unit,
    onComplete: (RoutineOccurrence) -> Unit,
    onSkip: (RoutineOccurrence) -> Unit,
    onRevert: (RoutineOccurrence) -> Unit,
    modifier: Modifier,
) {
    val pending = state.occurrences.filter { it.status == OccurrenceStatus.PENDING }
    val resolved = state.occurrences.filter { it.status != OccurrenceStatus.PENDING }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 12.dp, 16.dp, 104.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text(state.greeting, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            if (state.dateLabel.isNotBlank()) {
                Text(state.dateLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            if (state.isStale) {
                Text(
                    "Showing saved data — reconnect to refresh",
                    modifier = Modifier.padding(top = 8.dp),
                    color = MaterialTheme.colorScheme.tertiary,
                    style = MaterialTheme.typography.labelLarge,
                )
            }
        }
        item {
            WeeklyProgressCard(
                completed = state.weekCompleted,
                total = state.weekTotal,
                days = state.weekDays,
            )
        }
        if (pending.isNotEmpty()) {
            item { SectionHeader("Incomplete", pending.size) }
            items(pending, key = { it.id }) { occurrence ->
                OccurrenceRow(
                    occurrence = occurrence,
                    details = state.occurrenceDetails[occurrence.id],
                    busy = occurrence.id in state.busyOccurrenceIds,
                    onOpen = { onOpenOccurrence(occurrence) },
                    onComplete = { onComplete(occurrence) },
                    onSkip = { onSkip(occurrence) },
                    onRevert = { onRevert(occurrence) },
                )
            }
        } else {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(18.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Icon(Icons.Outlined.CheckCircle, contentDescription = null)
                        Column {
                            Text("All done", fontWeight = FontWeight.Bold)
                            Text("Every routine for today is resolved.")
                        }
                    }
                }
            }
        }
        if (resolved.isNotEmpty()) {
            item { SectionHeader("Completed and skipped", resolved.size) }
            items(resolved, key = { it.id }) { occurrence ->
                OccurrenceRow(
                    occurrence = occurrence,
                    details = state.occurrenceDetails[occurrence.id],
                    busy = occurrence.id in state.busyOccurrenceIds,
                    onOpen = { onOpenOccurrence(occurrence) },
                    onComplete = { onComplete(occurrence) },
                    onSkip = { onSkip(occurrence) },
                    onRevert = { onRevert(occurrence) },
                )
            }
        }
    }
}

@Composable
private fun WeeklyProgressCard(
    completed: Int,
    total: Int,
    days: List<TodayWeekDaySummary>,
) {
    val percent = if (total == 0) 0 else completed * 100 / total
    Card {
        Column(Modifier.fillMaxWidth().padding(18.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Column {
                    Text("This week", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("$completed of $total completed", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                Text("$percent%", style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.primary)
            }
            Spacer(Modifier.height(14.dp))
            androidx.compose.material3.LinearProgressIndicator(
                progress = { percent / 100f },
                modifier = Modifier.fillMaxWidth(),
            )
            if (days.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    days.take(7).forEach { day ->
                        val done = day.total > 0 && day.completed == day.total
                        Column(
                            modifier =
                                Modifier.weight(1f).semantics {
                                    contentDescription =
                                        "${day.date.dayOfWeek.name.lowercase().replaceFirstChar(Char::uppercase)}, " +
                                        "${day.completed} of ${day.total} completed"
                                },
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(
                                day.date.dayOfWeek.name.take(3).lowercase().replaceFirstChar(Char::uppercase),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Spacer(Modifier.height(6.dp))
                            Card(
                                colors =
                                    CardDefaults.cardColors(
                                        containerColor =
                                            if (done) MaterialTheme.colorScheme.primaryContainer
                                            else MaterialTheme.colorScheme.surfaceVariant,
                                    ),
                            ) {
                                Row(
                                    modifier = Modifier.size(36.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.Center,
                                ) {
                                    when {
                                        done -> Icon(Icons.Outlined.CheckCircle, contentDescription = null, modifier = Modifier.size(18.dp))
                                        day.completed > 0 -> Text("${day.completed}/${day.total}", style = MaterialTheme.typography.labelSmall)
                                        else -> Text("–", color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String, count: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(count.toString(), color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun OccurrenceRow(
    occurrence: RoutineOccurrence,
    details: TodayOccurrenceDetails?,
    busy: Boolean,
    onOpen: () -> Unit,
    onComplete: () -> Unit,
    onSkip: () -> Unit,
    onRevert: () -> Unit,
) {
    var confirmingSkip by remember(occurrence.id) { mutableStateOf(false) }
    Card(onClick = onOpen, enabled = !busy) {
        Column(Modifier.fillMaxWidth().padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                FilledIconButton(
                    onClick = if (occurrence.status == OccurrenceStatus.PENDING) onComplete else onRevert,
                    enabled = !busy,
                    modifier =
                        Modifier.semantics {
                            role = Role.Checkbox
                            toggleableState =
                                if (occurrence.status == OccurrenceStatus.COMPLETED) ToggleableState.On
                                else ToggleableState.Off
                            stateDescription =
                                when (occurrence.status) {
                                    OccurrenceStatus.PENDING -> "Not completed"
                                    OccurrenceStatus.COMPLETED -> "Completed"
                                    OccurrenceStatus.SKIPPED -> "Skipped"
                                    OccurrenceStatus.MISSED -> "Missed"
                                }
                            contentDescription =
                                if (occurrence.status == OccurrenceStatus.PENDING) {
                                    "Complete ${occurrence.title}"
                                } else {
                                    "Revert ${occurrence.title} to pending"
                                }
                        },
                ) {
                    Icon(
                        when (occurrence.status) {
                            OccurrenceStatus.PENDING -> Icons.Outlined.RadioButtonUnchecked
                            OccurrenceStatus.COMPLETED -> Icons.Outlined.CheckCircle
                            OccurrenceStatus.SKIPPED -> Icons.Outlined.SkipNext
                            OccurrenceStatus.MISSED -> Icons.Outlined.Replay
                        },
                        contentDescription = null,
                    )
                }
                Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    Text(occurrence.title, maxLines = 2, overflow = TextOverflow.Ellipsis, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.Schedule, contentDescription = null)
                        Text(
                            "${details?.localizedTime ?: localizedTime(occurrence.scheduledTime)} · ${occurrence.category}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    details?.note?.takeIf(String::isNotBlank)?.let { note ->
                        Text(
                            note,
                            maxLines = 2,
                            overflow = TextOverflow.Ellipsis,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                if (occurrence.status == OccurrenceStatus.PENDING) {
                    IconButton(onClick = { confirmingSkip = true }, enabled = !busy) {
                        Icon(Icons.Outlined.SkipNext, contentDescription = "Skip ${occurrence.title}")
                    }
                }
            }
            if (busy) {
                HorizontalDivider(Modifier.padding(top = 10.dp))
                Text("Saving…", modifier = Modifier.padding(top = 8.dp), style = MaterialTheme.typography.labelMedium)
            }
        }
    }
    if (confirmingSkip) {
        AlertDialog(
            onDismissRequest = { confirmingSkip = false },
            title = { Text("Skip ${occurrence.title}?") },
            text = { Text("This marks today's occurrence as skipped. You can revert it later.") },
            confirmButton = {
                Button(
                    onClick = {
                        confirmingSkip = false
                        onSkip()
                    },
                ) { Text("Skip") }
            },
            dismissButton = {
                TextButton(onClick = { confirmingSkip = false }) { Text("Cancel") }
            },
        )
    }
}
