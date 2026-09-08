package com.montasim.routempo.feature.plan

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ChevronLeft
import androidx.compose.material.icons.outlined.ChevronRight
import androidx.compose.material.icons.outlined.EventAvailable
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.PrimaryTabRow
import androidx.compose.material3.Tab
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.feature.routines.RoutineListScreen
import com.montasim.routempo.feature.routines.RoutinesUiState
import java.time.LocalDate
import java.time.format.DateTimeFormatter

enum class PlanTab { SCHEDULE, ROUTINES }

@Immutable
data class PlanUiState(
    val selectedTab: PlanTab = PlanTab.SCHEDULE,
    val selectedDate: LocalDate = LocalDate.now(),
    val today: LocalDate = LocalDate.now(),
    val occurrences: List<RoutineOccurrence> = emptyList(),
    val routines: List<Routine> = emptyList(),
    val isLoading: Boolean = false,
    val isStale: Boolean = false,
    val errorMessage: String? = null,
)

@Composable
fun PlanScreen(
    state: PlanUiState,
    busyRoutineIds: Set<String> = emptySet(),
    onTabSelected: (PlanTab) -> Unit,
    onDateSelected: (LocalDate) -> Unit,
    onPreviousWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onAddRoutine: (LocalDate) -> Unit,
    onOpenOccurrence: (RoutineOccurrence) -> Unit,
    onOpenRoutine: (Routine) -> Unit,
    onEditRoutine: (Routine) -> Unit,
    onToggleRoutine: (Routine) -> Unit,
    onDeleteRoutine: (Routine) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier.fillMaxSize()) {
        PrimaryTabRow(selectedTabIndex = state.selectedTab.ordinal) {
            PlanTab.entries.forEach { tab ->
                Tab(
                    selected = tab == state.selectedTab,
                    onClick = { onTabSelected(tab) },
                    text = { Text(if (tab == PlanTab.SCHEDULE) "Schedule" else "All routines") },
                )
            }
        }
        if (state.selectedTab == PlanTab.ROUTINES) {
            RoutineListScreen(
                state = RoutinesUiState(state.routines, state.isLoading, state.errorMessage, busyRoutineIds),
                onAdd = { onAddRoutine(state.today) },
                onOpen = onOpenRoutine,
                onEdit = onEditRoutine,
                onToggleActive = onToggleRoutine,
                onDelete = onDeleteRoutine,
                onRetry = onRetry,
                modifier = Modifier.fillMaxSize(),
            )
        } else {
            ScheduleContent(state, onDateSelected, onPreviousWeek, onNextWeek, onAddRoutine, onOpenOccurrence, onRetry)
        }
    }
}

@Composable
private fun ScheduleContent(
    state: PlanUiState,
    onDateSelected: (LocalDate) -> Unit,
    onPreviousWeek: () -> Unit,
    onNextWeek: () -> Unit,
    onAddRoutine: (LocalDate) -> Unit,
    onOpenOccurrence: (RoutineOccurrence) -> Unit,
    onRetry: () -> Unit,
) {
    val weekStart = state.selectedDate.minusDays(3)
    val week = (0L..6L).map(weekStart::plusDays)
    val selectedOccurrences = state.occurrences.filter { it.date == state.selectedDate.toString() }
    Column(Modifier.fillMaxSize()) {
        if (state.isStale) {
            Text(
                "Showing saved data — reconnect to refresh",
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                color = MaterialTheme.colorScheme.tertiary,
                style = MaterialTheme.typography.labelLarge,
            )
        }
        Card(Modifier.padding(16.dp)) {
            Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onPreviousWeek) { Icon(Icons.Outlined.ChevronLeft, "Previous week") }
                    Text(
                        "${week.first().format(DateTimeFormatter.ofPattern("MMM d"))} – ${week.last().format(DateTimeFormatter.ofPattern("MMM d"))}",
                        style = MaterialTheme.typography.titleSmall,
                    )
                    IconButton(onClick = onNextWeek) { Icon(Icons.Outlined.ChevronRight, "Next week") }
                }
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    week.forEach { date ->
                        val selected = date == state.selectedDate
                        Column(
                            modifier =
                                Modifier
                                    .weight(1f)
                                    .clickable { onDateSelected(date) }
                                    .semantics { this.selected = selected }
                                    .padding(vertical = 8.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                        ) {
                            Text(date.format(DateTimeFormatter.ofPattern("EEE")), style = MaterialTheme.typography.labelSmall)
                            Text(
                                date.dayOfMonth.toString(),
                                color = if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                            )
                        }
                    }
                }
            }
        }

        when {
            state.isLoading && selectedOccurrences.isEmpty() -> RoutempoLoadingState("Loading schedule", Modifier.fillMaxSize())
            state.errorMessage != null && selectedOccurrences.isEmpty() -> RoutempoErrorState("Schedule unavailable", state.errorMessage, Modifier.fillMaxSize(), "Retry", onRetry)
            selectedOccurrences.isEmpty() -> {
                val past = state.selectedDate.isBefore(state.today)
                RoutempoEmptyState(
                    title = if (past) "This day was open" else "This day is open",
                    message = if (past) "New routines cannot start in the past." else "Add a routine for ${state.selectedDate.format(DateTimeFormatter.ofPattern("MMMM d"))}.",
                    icon = Icons.Outlined.EventAvailable,
                    actionLabel = if (past) null else "Add routine",
                    onAction = if (past) null else ({ onAddRoutine(state.selectedDate) }),
                    modifier = Modifier.fillMaxSize(),
                )
            }
            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 4.dp, 16.dp, 104.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    item {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text(state.selectedDate.format(DateTimeFormatter.ofPattern("EEEE, MMMM d")), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                Text("${selectedOccurrences.size} scheduled", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (!state.selectedDate.isBefore(state.today)) {
                                Button(onClick = { onAddRoutine(state.selectedDate) }) { Icon(Icons.Outlined.Add, null); Text("Add") }
                            }
                        }
                    }
                    items(selectedOccurrences.sortedWith(compareBy(RoutineOccurrence::scheduledTime, RoutineOccurrence::title)), key = { it.id }) { occurrence ->
                        Card(onClick = { onOpenOccurrence(occurrence) }) {
                            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                Text(occurrence.scheduledTime, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                                Column {
                                    Text(occurrence.title, fontWeight = FontWeight.SemiBold)
                                    Text(occurrence.category, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
