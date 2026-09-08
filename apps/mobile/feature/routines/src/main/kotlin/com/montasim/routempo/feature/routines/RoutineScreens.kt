package com.montasim.routempo.feature.routines

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.Delete
import androidx.compose.material.icons.outlined.Edit
import androidx.compose.material.icons.outlined.Pause
import androidx.compose.material.icons.outlined.PlayArrow
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.RoutineWrite
import com.montasim.routempo.core.model.OccurrenceStatus
import java.time.LocalDate

@Immutable
data class RoutinesUiState(
    val routines: List<Routine> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val busyRoutineIds: Set<String> = emptySet(),
)

@Composable
fun RoutineListScreen(
    state: RoutinesUiState,
    onAdd: () -> Unit,
    onOpen: (Routine) -> Unit,
    onEdit: (Routine) -> Unit,
    onToggleActive: (Routine) -> Unit,
    onDelete: (Routine) -> Unit,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
) {
    when {
        state.isLoading && state.routines.isEmpty() ->
            RoutempoLoadingState("Loading routines", modifier.fillMaxSize())
        state.errorMessage != null && state.routines.isEmpty() ->
            RoutempoErrorState("Routines are unavailable", state.errorMessage, modifier, "Retry", onRetry)
        state.routines.isEmpty() ->
            RoutempoEmptyState("No routines yet", "Create a routine and choose when it repeats.", modifier.fillMaxSize(), actionLabel = "Add routine", onAction = onAdd)
        else -> {
            val active = state.routines.filter(Routine::isActive)
            val paused = state.routines.filterNot(Routine::isActive)
            LazyColumn(
                modifier = modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 12.dp, 16.dp, 104.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                        Column {
                            Text("All routines", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                            Text("${state.routines.size} total", color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Button(onClick = onAdd) { Icon(Icons.Outlined.Add, null); Text("Add") }
                    }
                }
                if (active.isNotEmpty()) {
                    item { RoutineSectionTitle("Active", active.size) }
                    items(active, key = { it.id }) { routine ->
                        RoutineCard(routine, routine.id in state.busyRoutineIds, onOpen, onEdit, onToggleActive, onDelete)
                    }
                }
                if (paused.isNotEmpty()) {
                    item { RoutineSectionTitle("Paused", paused.size) }
                    items(paused, key = { it.id }) { routine ->
                        RoutineCard(routine, routine.id in state.busyRoutineIds, onOpen, onEdit, onToggleActive, onDelete)
                    }
                }
            }
        }
    }
}

@Composable
private fun RoutineSectionTitle(title: String, count: Int) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(count.toString(), color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun RoutineCard(
    routine: Routine,
    busy: Boolean,
    onOpen: (Routine) -> Unit,
    onEdit: (Routine) -> Unit,
    onToggleActive: (Routine) -> Unit,
    onDelete: (Routine) -> Unit,
) {
    var toggleSubmitted by remember(routine.id, routine.isActive) { mutableStateOf(false) }
    var observedBusy by remember(routine.id, routine.isActive) { mutableStateOf(false) }
    LaunchedEffect(busy) {
        if (busy) {
            observedBusy = true
        } else if (observedBusy) {
            toggleSubmitted = false
            observedBusy = false
        }
    }
    val actionBusy = busy || toggleSubmitted
    Card(onClick = { onOpen(routine) }, enabled = !busy) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text(routine.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold)
                Text(
                    "${routine.scheduledTime} · ${recurrenceLabel(routine.recurrenceType)} · ${routine.categoryName}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                if (!routine.isActive) Text("Paused", color = MaterialTheme.colorScheme.tertiary, style = MaterialTheme.typography.labelMedium)
            }
            IconButton(onClick = { onEdit(routine) }, enabled = !busy) { Icon(Icons.Outlined.Edit, "Edit ${routine.title}") }
            IconButton(
                onClick = {
                    toggleSubmitted = true
                    onToggleActive(routine)
                },
                enabled = !actionBusy,
            ) {
                Icon(if (routine.isActive) Icons.Outlined.Pause else Icons.Outlined.PlayArrow, if (routine.isActive) "Pause ${routine.title}" else "Resume ${routine.title}")
            }
            IconButton(onClick = { onDelete(routine) }, enabled = !busy) { Icon(Icons.Outlined.Delete, "Delete ${routine.title}") }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoutineEditorSheet(
    categories: List<Category>,
    initial: Routine? = null,
    suggestedStartDate: String = LocalDate.now().toString(),
    isSaving: Boolean = false,
    serverError: String? = null,
    onDismiss: () -> Unit,
    onCreateCategory: (String) -> Unit,
    onSave: (RoutineWrite) -> Unit,
    savedZoneToday: LocalDate = LocalDate.now(),
    serverFieldErrors: Map<RoutineFormField, String> = emptyMap(),
) {
    val initialStartDate =
        remember(initial?.id, suggestedStartDate, savedZoneToday) {
            runCatching { LocalDate.parse(initial?.startDate ?: suggestedStartDate) }.getOrDefault(savedZoneToday)
        }
    val initialSeed = remember(initial?.id, initialStartDate) { defaultRecurrenceSeed(initialStartDate) }
    var title by rememberSaveable(initial?.id) { mutableStateOf(initial?.title.orEmpty()) }
    var note by rememberSaveable(initial?.id) { mutableStateOf(initial?.note.orEmpty()) }
    var startDate by rememberSaveable(initial?.id) { mutableStateOf(initialStartDate.toString()) }
    var lastValidStartDate by remember(initial?.id) { mutableStateOf(initialStartDate) }
    var time by rememberSaveable(initial?.id) { mutableStateOf(initial?.scheduledTime ?: "08:00") }
    var recurrence by rememberSaveable(initial?.id) { mutableStateOf(initial?.recurrenceType ?: RecurrenceType.DAILY) }
    var categoryId by rememberSaveable(initial?.id) { mutableStateOf(initial?.categoryId ?: categories.firstOrNull()?.id.orEmpty()) }
    var endDate by rememberSaveable(initial?.id) { mutableStateOf(initial?.endDate.orEmpty()) }
    var monthlyDay by rememberSaveable(initial?.id) {
        mutableStateOf((initial?.recurrenceRules?.dayOfMonth ?: initialSeed.dayOfMonth).toString())
    }
    var yearlyMonth by rememberSaveable(initial?.id) {
        mutableStateOf((initial?.recurrenceRules?.month ?: initialSeed.month).toString())
    }
    var weeklyDays by remember(initial?.id) {
        mutableStateOf(initial?.recurrenceRules?.daysOfWeek?.toSet() ?: initialSeed.weeklyDays)
    }
    var categorySearch by rememberSaveable(initial?.id) { mutableStateOf("") }
    var newCategory by rememberSaveable { mutableStateOf("") }
    var categoryCreateAttempted by rememberSaveable { mutableStateOf(false) }
    var pendingCategoryKey by rememberSaveable { mutableStateOf<String?>(null) }
    var attempted by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(categories) {
        if (categoryId.isBlank()) categoryId = categories.firstOrNull()?.id.orEmpty()
    }
    LaunchedEffect(categories, pendingCategoryKey) {
        val pending = pendingCategoryKey ?: return@LaunchedEffect
        categories.firstOrNull { categoryNameKey(it.name) == pending }?.let {
            categoryId = it.id
            newCategory = ""
            categoryCreateAttempted = false
            pendingCategoryKey = null
        }
    }

    val draft =
        RoutineFormDraft(
            title = title,
            startDate = startDate,
            scheduledTime = time,
            categoryId = categoryId,
            note = note,
            recurrenceType = recurrence,
            weeklyDays = weeklyDays,
            dayOfMonth = monthlyDay,
            month = yearlyMonth,
            endDate = endDate,
        )
    val validation = validateRoutineDraft(draft, savedZoneToday, initial)
    fun fieldError(field: RoutineFormField): String? =
        (if (attempted) validation[field] else null) ?: serverFieldErrors[field]

    val categoryNameValidation = validateCategoryName(newCategory, categories)
    val filteredCategories = categories.filter { categoryMatchesSearch(it.name, categorySearch) }

    ModalBottomSheet(onDismissRequest = { if (!isSaving) onDismiss() }) {
        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp, 4.dp, 20.dp, 40.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Text(if (initial == null) "Add routine" else "Edit routine", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            }
            item {
                OutlinedTextField(
                    value = title,
                    onValueChange = { if (it.length <= ROUTINE_TITLE_MAX_LENGTH) title = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Routine name") },
                    supportingText = { Text(fieldError(RoutineFormField.TITLE) ?: "${title.length}/$ROUTINE_TITLE_MAX_LENGTH") },
                    isError = fieldError(RoutineFormField.TITLE) != null,
                    enabled = !isSaving,
                    singleLine = true,
                )
            }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = startDate,
                        onValueChange = { value ->
                            startDate = value
                            runCatching { LocalDate.parse(value) }.getOrNull()?.let { parsed ->
                                val currentSeed =
                                    RecurrenceSeed(
                                        weeklyDays = weeklyDays,
                                        dayOfMonth = monthlyDay.toIntOrNull() ?: -1,
                                        month = yearlyMonth.toIntOrNull() ?: -1,
                                    )
                                val reconciled =
                                    reconcileRecurrenceSeed(
                                        previousStartDate = lastValidStartDate,
                                        newStartDate = parsed,
                                        recurrenceType = recurrence,
                                        current = currentSeed,
                                    )
                                weeklyDays = reconciled.weeklyDays
                                monthlyDay = reconciled.dayOfMonth.takeIf { it > 0 }?.toString().orEmpty()
                                yearlyMonth = reconciled.month.takeIf { it > 0 }?.toString().orEmpty()
                                lastValidStartDate = parsed
                            }
                        },
                        modifier = Modifier.weight(1f),
                        label = { Text("Start date") },
                        supportingText = { Text(fieldError(RoutineFormField.START_DATE) ?: "YYYY-MM-DD") },
                        isError = fieldError(RoutineFormField.START_DATE) != null,
                        enabled = !isSaving,
                        singleLine = true,
                    )
                    OutlinedTextField(
                        value = time,
                        onValueChange = { time = it },
                        modifier = Modifier.weight(1f),
                        label = { Text("Time") },
                        supportingText = { Text(fieldError(RoutineFormField.SCHEDULED_TIME) ?: "HH:mm") },
                        isError = fieldError(RoutineFormField.SCHEDULED_TIME) != null,
                        enabled = !isSaving,
                        singleLine = true,
                    )
                }
            }
            item {
                Text("Repeat", style = MaterialTheme.typography.titleSmall)
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    RecurrenceType.entries.forEach { type ->
                        FilterChip(
                            selected = recurrence == type,
                            onClick = {
                                if (recurrence != type) {
                                    recurrence = type
                                    val seed = defaultRecurrenceSeed(lastValidStartDate)
                                    when (type) {
                                        RecurrenceType.WEEKLY -> weeklyDays = seed.weeklyDays
                                        RecurrenceType.MONTHLY -> monthlyDay = seed.dayOfMonth.toString()
                                        RecurrenceType.YEARLY -> {
                                            monthlyDay = seed.dayOfMonth.toString()
                                            yearlyMonth = seed.month.toString()
                                        }
                                        else -> Unit
                                    }
                                }
                            },
                            label = { Text(recurrenceLabel(type)) },
                            enabled = !isSaving,
                        )
                    }
                }
            }
            if (recurrence == RecurrenceType.WEEKLY) {
                item {
                    Text("Days of week", style = MaterialTheme.typography.titleSmall)
                    FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat").forEachIndexed { index, day ->
                            FilterChip(
                                selected = index in weeklyDays,
                                onClick = { weeklyDays = if (index in weeklyDays && weeklyDays.size > 1) weeklyDays - index else weeklyDays + index },
                                label = { Text(day) },
                                enabled = !isSaving,
                            )
                        }
                    }
                    fieldError(RoutineFormField.WEEKLY_DAYS)?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                }
            }
            if (recurrence == RecurrenceType.MONTHLY || recurrence == RecurrenceType.YEARLY) {
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        if (recurrence == RecurrenceType.YEARLY) {
                            OutlinedTextField(
                                yearlyMonth,
                                { yearlyMonth = it.filter(Char::isDigit).take(2) },
                                Modifier.weight(1f),
                                label = { Text("Month 1–12") },
                                supportingText = fieldError(RoutineFormField.MONTH)?.let { message -> ({ Text(message) }) },
                                isError = fieldError(RoutineFormField.MONTH) != null,
                                enabled = !isSaving,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            )
                        }
                        OutlinedTextField(
                            monthlyDay,
                            { monthlyDay = it.filter(Char::isDigit).take(2) },
                            Modifier.weight(1f),
                            label = { Text("Day 1–31") },
                            supportingText = fieldError(RoutineFormField.DAY_OF_MONTH)?.let { message -> ({ Text(message) }) },
                            isError = fieldError(RoutineFormField.DAY_OF_MONTH) != null,
                            enabled = !isSaving,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        )
                    }
                }
            }
            if (recurrence != RecurrenceType.NONE) {
                item {
                    OutlinedTextField(
                        endDate,
                        { endDate = it },
                        Modifier.fillMaxWidth(),
                        label = { Text("End date (optional)") },
                        supportingText = { Text(fieldError(RoutineFormField.END_DATE) ?: "YYYY-MM-DD") },
                        isError = fieldError(RoutineFormField.END_DATE) != null,
                        enabled = !isSaving,
                    )
                }
            }
            item {
                Text("Category", style = MaterialTheme.typography.titleSmall)
                OutlinedTextField(
                    value = categorySearch,
                    onValueChange = { categorySearch = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Search categories") },
                    enabled = !isSaving,
                    singleLine = true,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    filteredCategories.forEach { category ->
                        FilterChip(selected = categoryId == category.id, onClick = { categoryId = category.id }, label = { Text(category.name) }, enabled = !isSaving)
                    }
                }
                if (filteredCategories.isEmpty()) {
                    Text("No matching categories", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                fieldError(RoutineFormField.CATEGORY_ID)?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
            item {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        newCategory,
                        {
                            newCategory = it
                            categoryCreateAttempted = false
                        },
                        Modifier.weight(1f),
                        label = { Text("New category") },
                        supportingText = {
                            val error =
                                (if (categoryCreateAttempted) categoryNameValidation.error else null)
                                    ?: serverFieldErrors[RoutineFormField.CATEGORY_NAME]
                            if (error != null) Text(error) else Text("${normalizeCategoryName(newCategory).length}/$ROUTINE_CATEGORY_MAX_LENGTH")
                        },
                        isError =
                            (categoryCreateAttempted && categoryNameValidation.error != null) ||
                                serverFieldErrors[RoutineFormField.CATEGORY_NAME] != null,
                        enabled = !isSaving,
                        singleLine = true,
                    )
                    OutlinedButton(
                        onClick = {
                            categoryCreateAttempted = true
                            val result = validateCategoryName(newCategory, categories)
                            if (result.duplicate != null) {
                                categoryId = result.duplicate.id
                            } else if (result.isValid) {
                                pendingCategoryKey = categoryNameKey(result.normalizedName)
                                onCreateCategory(result.normalizedName)
                            }
                        },
                        enabled = !isSaving,
                    ) { Text("Create") }
                }
            }
            item {
                OutlinedTextField(
                    note,
                    { if (it.length <= ROUTINE_NOTE_MAX_LENGTH) note = it },
                    Modifier.fillMaxWidth(),
                    label = { Text("Note (optional)") },
                    supportingText = { Text(fieldError(RoutineFormField.NOTE) ?: "${note.length}/$ROUTINE_NOTE_MAX_LENGTH") },
                    isError = fieldError(RoutineFormField.NOTE) != null,
                    minLines = 2,
                    enabled = !isSaving,
                )
            }
            if (serverError != null) item { Text(serverError, color = MaterialTheme.colorScheme.error) }
            item {
                Button(
                    onClick = {
                        attempted = true
                        if (validation.isValid) {
                            onSave(draft.toRoutineWrite(isActive = initial?.isActive ?: true))
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isSaving,
                ) { Text(if (isSaving) "Saving…" else if (initial == null) "Create routine" else "Save changes") }
            }
        }
    }
}

@Composable
fun DeleteRoutineConfirmation(routine: Routine, onDismiss: () -> Unit, onConfirm: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delete ${routine.title}?") },
        text = { Text("The routine and future schedule will be removed. Existing behavior logs are retained.") },
        confirmButton = { TextButton(onClick = onConfirm) { Text("Delete") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } },
    )
}

@Composable
fun RoutineDetailDialog(
    routine: Routine,
    onDismiss: () -> Unit,
    onEdit: (Routine) -> Unit,
    onToggleActive: (Routine) -> Unit,
    onDelete: (Routine) -> Unit,
    busy: Boolean = false,
) {
    var toggleSubmitted by remember(routine.id, routine.isActive) { mutableStateOf(false) }
    var observedBusy by remember(routine.id, routine.isActive) { mutableStateOf(false) }
    LaunchedEffect(busy) {
        if (busy) {
            observedBusy = true
        } else if (observedBusy) {
            toggleSubmitted = false
            observedBusy = false
        }
    }
    val actionBusy = busy || toggleSubmitted
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(routine.title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("${routine.scheduledTime} · ${recurrenceSummary(routine)}")
                Text("Category: ${routine.categoryName}")
                Text("Starts ${routine.startDate}${routine.endDate?.let { " · ends $it" }.orEmpty()}")
                Text(if (routine.isActive) "Active" else "Paused", color = MaterialTheme.colorScheme.primary)
                if (routine.note.isNotBlank()) Text(routine.note, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        },
        confirmButton = {
            TextButton(onClick = { onDismiss(); onEdit(routine) }, enabled = !busy) { Text("Edit") }
        },
        dismissButton = {
            Row {
                TextButton(
                    onClick = {
                        toggleSubmitted = true
                        onDismiss()
                        onToggleActive(routine)
                    },
                    enabled = !actionBusy,
                ) {
                    Text(if (routine.isActive) "Pause" else "Resume")
                }
                TextButton(onClick = { onDismiss(); onDelete(routine) }, enabled = !busy) {
                    Text("Delete", color = MaterialTheme.colorScheme.error)
                }
            }
        },
    )
}

@Composable
fun OccurrenceDetailDialog(
    occurrence: RoutineOccurrence,
    allowResolution: Boolean,
    busy: Boolean,
    onDismiss: () -> Unit,
    onComplete: (RoutineOccurrence) -> Unit,
    onSkip: (RoutineOccurrence) -> Unit,
    onRevert: (RoutineOccurrence) -> Unit,
    routine: Routine? = null,
    routineBusy: Boolean = false,
    onEditRoutine: ((Routine) -> Unit)? = null,
    onToggleRoutine: ((Routine) -> Unit)? = null,
    onDeleteRoutine: ((Routine) -> Unit)? = null,
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(occurrence.title) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("${occurrence.date} at ${occurrence.scheduledTime}")
                Text("Category: ${occurrence.category}")
                Text("Status: ${occurrence.status.name.lowercase().replaceFirstChar(Char::uppercase)}")
                Text("Timezone: ${occurrence.timezone}", color = MaterialTheme.colorScheme.onSurfaceVariant)
                occurrence.resolvedAt?.let { Text("Resolved: $it", color = MaterialTheme.colorScheme.onSurfaceVariant) }
                if (!allowResolution) Text("Outcomes can only be recorded from Today on the current date.")
                routine?.let { definition ->
                    Text("Routine definition", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                    Text("${definition.scheduledTime} · ${recurrenceSummary(definition)}")
                    Text("Current category: ${definition.categoryName}")
                    Text("Starts ${definition.startDate}${definition.endDate?.let { " · ends $it" }.orEmpty()}")
                    Text(if (definition.isActive) "Active" else "Paused", color = MaterialTheme.colorScheme.primary)
                    if (definition.note.isNotBlank()) {
                        Text(definition.note, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    if (onEditRoutine != null || onToggleRoutine != null || onDeleteRoutine != null) {
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            onEditRoutine?.let { edit ->
                                TextButton(
                                    onClick = {
                                        onDismiss()
                                        edit(definition)
                                    },
                                    enabled = !routineBusy,
                                ) { Text("Edit routine") }
                            }
                            onToggleRoutine?.let { toggle ->
                                TextButton(
                                    onClick = {
                                        onDismiss()
                                        toggle(definition)
                                    },
                                    enabled = !routineBusy,
                                ) { Text(if (definition.isActive) "Pause routine" else "Resume routine") }
                            }
                            onDeleteRoutine?.let { delete ->
                                TextButton(
                                    onClick = {
                                        onDismiss()
                                        delete(definition)
                                    },
                                    enabled = !routineBusy,
                                ) { Text("Delete routine", color = MaterialTheme.colorScheme.error) }
                            }
                        }
                    }
                }
            }
        },
        confirmButton = {
            if (allowResolution) {
                if (occurrence.status == OccurrenceStatus.PENDING) {
                    TextButton(
                        onClick = { onDismiss(); onComplete(occurrence) },
                        enabled = !busy,
                    ) { Text("Complete") }
                } else {
                    TextButton(
                        onClick = { onDismiss(); onRevert(occurrence) },
                        enabled = !busy,
                    ) { Text("Undo") }
                }
            } else {
                TextButton(onClick = onDismiss) { Text("Close") }
            }
        },
        dismissButton = {
            if (allowResolution && occurrence.status == OccurrenceStatus.PENDING) {
                TextButton(
                    onClick = { onDismiss(); onSkip(occurrence) },
                    enabled = !busy,
                ) { Text("Skip") }
            }
        },
    )
}

fun recurrenceLabel(type: RecurrenceType): String =
    when (type) {
        RecurrenceType.NONE -> "Once"
        RecurrenceType.DAILY -> "Daily"
        RecurrenceType.WEEKLY -> "Weekly"
        RecurrenceType.MONTHLY -> "Monthly"
        RecurrenceType.YEARLY -> "Yearly"
    }
