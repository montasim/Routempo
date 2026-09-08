package com.montasim.routempo

import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material.icons.outlined.Insights
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.listSaver
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.montasim.routempo.core.data.ProductSnapshot
import com.montasim.routempo.core.network.ApiException
import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.AnalyticsQuery
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.BackupArchive
import com.montasim.routempo.core.model.BackupRestoreImplication
import com.montasim.routempo.core.model.validateForRestore
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.IdempotencyKey
import com.montasim.routempo.core.model.IntegrationProvider
import com.montasim.routempo.core.model.IntegrationAction
import com.montasim.routempo.core.model.IntegrationResource
import com.montasim.routempo.core.model.ProviderState
import com.montasim.routempo.core.model.LogPatch
import com.montasim.routempo.core.model.LogQuery
import com.montasim.routempo.core.model.OccurrenceQuery
import com.montasim.routempo.core.model.OccurrenceResolution
import com.montasim.routempo.core.model.PageQuery
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.RoutinePatch
import com.montasim.routempo.core.model.RoutineQuery
import com.montasim.routempo.core.model.RoutineWrite
import com.montasim.routempo.core.model.SettingsPatch
import com.montasim.routempo.feature.auth.AuthProvider
import com.montasim.routempo.feature.auth.AuthUiState
import com.montasim.routempo.feature.auth.RoutempoAuthScreen
import com.montasim.routempo.feature.plan.PlanScreen
import com.montasim.routempo.feature.plan.PlanUiState
import com.montasim.routempo.feature.review.InsightsUiState
import com.montasim.routempo.feature.review.InsightsEmptyReason
import com.montasim.routempo.feature.review.LogEditorUiState
import com.montasim.routempo.feature.review.LogFilterOption
import com.montasim.routempo.feature.review.LogFilters
import com.montasim.routempo.feature.review.LogsUiState
import com.montasim.routempo.feature.review.LogOutcomeCounts
import com.montasim.routempo.feature.review.InsightsRange
import com.montasim.routempo.feature.review.ReviewEvent
import com.montasim.routempo.feature.review.ReviewScreen
import com.montasim.routempo.feature.review.ReviewTab
import com.montasim.routempo.feature.review.ReviewUiState
import com.montasim.routempo.feature.review.toDraft
import com.montasim.routempo.feature.review.toLogWriteOrNull
import com.montasim.routempo.feature.review.validateLogDraft
import com.montasim.routempo.feature.review.toQueryOrNull
import com.montasim.routempo.feature.routines.DeleteRoutineConfirmation
import com.montasim.routempo.feature.routines.OccurrenceDetailDialog
import com.montasim.routempo.feature.routines.RoutineEditorSheet
import com.montasim.routempo.feature.routines.RoutineDetailDialog
import com.montasim.routempo.feature.routines.RoutineFormField
import com.montasim.routempo.feature.routines.routineFormFieldForServerPath
import com.montasim.routempo.feature.settings.AppInfoUi
import com.montasim.routempo.feature.settings.CategoryDraft
import com.montasim.routempo.feature.settings.CategoryEditorSheet
import com.montasim.routempo.feature.settings.CategoryManagementSheet
import com.montasim.routempo.feature.settings.CategorySettingsUi
import com.montasim.routempo.feature.settings.DeleteCategoryConfirmationSheet
import com.montasim.routempo.feature.settings.DisconnectProviderConfirmationSheet
import com.montasim.routempo.feature.settings.IntegrationActionUi
import com.montasim.routempo.feature.settings.IntegrationOperation
import com.montasim.routempo.feature.settings.IntegrationResourceUi
import com.montasim.routempo.feature.settings.NotificationPermissionStatus
import com.montasim.routempo.feature.settings.ProfileSettingsDraft
import com.montasim.routempo.feature.settings.ProfileSettingsSheet
import com.montasim.routempo.feature.settings.ProviderConnectionStatus
import com.montasim.routempo.feature.settings.ProviderIntegrationSheet
import com.montasim.routempo.feature.settings.ProviderSettingsUi
import com.montasim.routempo.feature.settings.ReminderConfigurationSheet
import com.montasim.routempo.feature.settings.ReminderSettingsUi
import com.montasim.routempo.feature.settings.RestoreBackupConfirmationSheet
import com.montasim.routempo.feature.settings.RoutempoSettingsCallbacks
import com.montasim.routempo.feature.settings.RoutempoSettingsScreen
import com.montasim.routempo.feature.settings.RoutempoSettingsUiState
import com.montasim.routempo.feature.settings.SettingsAccountUi
import com.montasim.routempo.feature.settings.SettingsProvider
import com.montasim.routempo.feature.settings.SignOutConfirmationSheet
import com.montasim.routempo.feature.today.TodayScreen
import com.montasim.routempo.feature.today.TodayUiState
import com.montasim.routempo.feature.today.TodayEmptyKind
import com.montasim.routempo.feature.today.TodayOccurrenceDetails
import com.montasim.routempo.feature.today.buildTodayWeek
import java.io.IOException
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.DayOfWeek
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private enum class MainDestination(val label: String) {
    TODAY("Today"),
    PLAN("Plan"),
    REVIEW("Review"),
    SETTINGS("Settings"),
}

private val PlanStateSaver =
    listSaver<PlanUiState, String>(
        save = { listOf(it.selectedTab.name, it.selectedDate.toString(), it.today.toString()) },
        restore = { values ->
            PlanUiState(
                selectedTab = com.montasim.routempo.feature.plan.PlanTab.valueOf(values[0]),
                selectedDate = LocalDate.parse(values[1]),
                today = LocalDate.parse(values[2]),
                isLoading = true,
            )
        },
    )

private val ReviewStateSaver =
    listSaver<ReviewUiState, String>(
        save = {
            listOf(
                it.selectedTab.name,
                it.insights.range.name,
                it.logs.filters.startDate,
                it.logs.filters.endDate,
                it.logs.filters.routineId.orEmpty(),
                it.logs.filters.category.orEmpty(),
                it.logs.filters.status?.name.orEmpty(),
                it.logs.filtersExpanded.toString(),
            )
        },
        restore = { values ->
            ReviewUiState(
                selectedTab = ReviewTab.valueOf(values[0]),
                insights = InsightsUiState(range = InsightsRange.valueOf(values[1])),
                logs =
                    LogsUiState(
                        filters =
                            LogFilters(
                                startDate = values[2],
                                endDate = values[3],
                                routineId = values[4].ifBlank { null },
                                category = values[5].ifBlank { null },
                                status =
                                    values[6].ifBlank { null }
                                        ?.let { com.montasim.routempo.core.model.LogStatus.valueOf(it) },
                            ),
                        filtersExpanded = values[7].toBoolean(),
                    ),
            )
        },
    )

@Composable
fun RoutempoApp(
    authCallback: Uri?,
    onAuthCallbackConsumed: () -> Unit,
    notificationDestination: String?,
    onNotificationDestinationConsumed: () -> Unit,
    notificationPermission: NotificationPermissionStatus,
    onRequestNotificationPermission: () -> Unit,
) {
    val context = LocalContext.current
    val application = context.applicationContext as RoutempoApplication
    val api = application.api
    val snapshotCache = application.snapshotCache
    val organizationPreferences = remember { context.getSharedPreferences("routempo_organization", android.content.Context.MODE_PRIVATE) }
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }

    var authState: AuthUiState by remember { mutableStateOf(AuthUiState.RestoringSession) }
    var signedIn by remember { mutableStateOf(false) }
    var destination by rememberSaveable { mutableStateOf(MainDestination.TODAY) }
    var todayState by remember { mutableStateOf(TodayUiState(isLoading = true)) }
    var planState by rememberSaveable(stateSaver = PlanStateSaver) { mutableStateOf(PlanUiState(isLoading = true)) }
    var categories by remember { mutableStateOf<List<Category>>(emptyList()) }
    var currentUser by remember { mutableStateOf<CurrentUser?>(null) }
    var pendingAuthProvider by rememberSaveable { mutableStateOf<AuthProvider?>(null) }
    var reviewState by rememberSaveable(stateSaver = ReviewStateSaver) { mutableStateOf(ReviewUiState()) }
    var insightsLoaded by remember { mutableStateOf(false) }
    var logsLoaded by remember { mutableStateOf(false) }
    var editingRoutine by remember { mutableStateOf<Routine?>(null) }
    var routineStartDate by remember { mutableStateOf(LocalDate.now()) }
    var showRoutineEditor by remember { mutableStateOf(false) }
    var deletingRoutine by remember { mutableStateOf<Routine?>(null) }
    var selectedRoutine by remember { mutableStateOf<Routine?>(null) }
    var selectedOccurrence by remember { mutableStateOf<RoutineOccurrence?>(null) }
    var isSavingRoutine by remember { mutableStateOf(false) }
    var routineError by remember { mutableStateOf<String?>(null) }
    var routineFieldErrors by remember { mutableStateOf<Map<RoutineFormField, String>>(emptyMap()) }
    var busyRoutineIds by remember { mutableStateOf<Set<String>>(emptySet()) }
    val themeMode by application.themePreferences.themeMode.collectAsStateWithLifecycle(
        initialValue = com.montasim.routempo.core.designsystem.RoutempoThemeMode.System,
    )
    var settingsState by remember {
        mutableStateOf(
            RoutempoSettingsUiState(
                isLoading = true,
                appInfo = AppInfoUi(BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE.toString()),
            ),
        )
    }
    var settingsLoaded by remember { mutableStateOf(false) }
    var showProfileSettings by rememberSaveable { mutableStateOf(false) }
    var showReminderSettings by rememberSaveable { mutableStateOf(false) }
    var showCategorySettings by rememberSaveable { mutableStateOf(false) }
    var editingCategory by remember { mutableStateOf<CategorySettingsUi?>(null) }
    var showCategoryEditor by remember { mutableStateOf(false) }
    var deletingCategory by remember { mutableStateOf<CategorySettingsUi?>(null) }
    var selectedProvider by remember { mutableStateOf<SettingsProvider?>(null) }
    var disconnectingProvider by remember { mutableStateOf<SettingsProvider?>(null) }
    var showSignOutConfirmation by rememberSaveable { mutableStateOf(false) }
    var pendingRestore by remember { mutableStateOf<Pair<String?, BackupArchive>?>(null) }
    var pendingBackupContent by remember { mutableStateOf<String?>(null) }
    var pendingCsvContent by remember { mutableStateOf<String?>(null) }
    val mutationKeys = remember { mutableMapOf<String, IdempotencyKey>() }

    suspend fun <T> idempotentMutation(
        logicalOperation: String,
        block: suspend (IdempotencyKey) -> T,
    ): T {
        val key = mutationKeys.getOrPut(logicalOperation, IdempotencyKey::create)
        return block(key).also { mutationKeys.remove(logicalOperation) }
    }

    fun resetAccountScopedState() {
        destination = MainDestination.TODAY
        todayState = TodayUiState(isLoading = true)
        planState = PlanUiState(isLoading = true)
        categories = emptyList()
        reviewState = ReviewUiState()
        insightsLoaded = false
        logsLoaded = false
        editingRoutine = null
        routineStartDate = LocalDate.now()
        showRoutineEditor = false
        deletingRoutine = null
        selectedRoutine = null
        selectedOccurrence = null
        isSavingRoutine = false
        routineError = null
        routineFieldErrors = emptyMap()
        busyRoutineIds = emptySet()
        settingsState =
            RoutempoSettingsUiState(
                isLoading = true,
                appInfo = AppInfoUi(BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE.toString()),
            )
        settingsLoaded = false
        showProfileSettings = false
        showReminderSettings = false
        showCategorySettings = false
        editingCategory = null
        showCategoryEditor = false
        deletingCategory = null
        selectedProvider = null
        disconnectingProvider = null
        pendingRestore = null
        pendingBackupContent = null
        pendingCsvContent = null
        mutationKeys.clear()
    }

    val backupCreateLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
            val content = pendingBackupContent
            pendingBackupContent = null
            if (uri != null && content != null) {
                scope.launch {
                    runCatching {
                        withContext(Dispatchers.IO) {
                            context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(content) }
                                ?: error("Unable to open the selected file")
                        }
                    }.onSuccess { snackbar.showSnackbar("Backup saved.") }
                        .onFailure { snackbar.showSnackbar(it.message ?: "Unable to save backup.") }
                }
            }
        }
    val csvCreateLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("text/csv")) { uri ->
            val content = pendingCsvContent
            pendingCsvContent = null
            if (uri != null && content != null) {
                scope.launch {
                    runCatching {
                        withContext(Dispatchers.IO) {
                            context.contentResolver.openOutputStream(uri)?.bufferedWriter()?.use { it.write(content) }
                                ?: error("Unable to open the selected file")
                        }
                    }.onSuccess { snackbar.showSnackbar("CSV saved.") }
                        .onFailure { snackbar.showSnackbar(it.message ?: "Unable to save CSV.") }
                }
            }
        }
    val backupOpenLauncher =
        rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
            if (uri != null) {
                scope.launch {
                    runCatching {
                        val content =
                            withContext(Dispatchers.IO) {
                                context.contentResolver.openInputStream(uri)?.bufferedReader()?.use {
                                    val content = StringBuilder()
                                    val buffer = CharArray(8_192)
                                    while (true) {
                                        val read = it.read(buffer)
                                        if (read < 0) break
                                        content.append(buffer, 0, read)
                                        require(content.length <= MAX_BACKUP_CHARS) { "Backup files must be 10 MB or smaller" }
                                    }
                                    content.toString()
                                } ?: error("Unable to read the selected file")
                            }
                        api.decodeBackup(content).also { archive ->
                            val preflight = archive.validateForRestore()
                            require(preflight.canRestore) {
                                preflight.issues.take(3).joinToString("; ") { "${it.path}: ${it.message}" }
                            }
                        }
                    }.onSuccess { pendingRestore = uri.lastPathSegment to it }
                        .onFailure { snackbar.showSnackbar(it.message ?: "This is not a valid Routempo backup.") }
                }
            }
        }

    fun applyProductSnapshot(snapshot: ProductSnapshot, stale: Boolean) {
        currentUser = snapshot.currentUser
        categories = snapshot.categories
        val zone =
            snapshot.currentUser.settings.timezone
                .takeIf(String::isNotBlank)
                ?.let { runCatching { ZoneId.of(it) }.getOrNull() }
                ?: ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val weekEnd = weekStart.plusDays(6)
        val weekOccurrences =
            snapshot.occurrences.filter { occurrence ->
                val date = runCatching { LocalDate.parse(occurrence.date) }.getOrNull()
                date != null && !date.isBefore(weekStart) && !date.isAfter(weekEnd)
            }
        val todayOccurrences =
            snapshot.occurrences
                .filter { it.date == today.toString() }
                .sortedWith(compareBy({ it.scheduledTime }, { it.title }))
        val routinesById = snapshot.routines.associateBy(Routine::id)
        todayState =
            TodayUiState(
                greeting = greeting(zone),
                dateLabel = today.format(DateTimeFormatter.ofPattern("EEEE, MMMM d")),
                occurrences = todayOccurrences,
                weekCompleted = weekOccurrences.count { it.status == com.montasim.routempo.core.model.OccurrenceStatus.COMPLETED },
                weekTotal = weekOccurrences.size,
                isStale = stale,
                emptyKind =
                    when {
                        snapshot.routines.isEmpty() -> TodayEmptyKind.NO_ROUTINES
                        todayOccurrences.isEmpty() -> TodayEmptyKind.NO_OCCURRENCES
                        else -> null
                    },
                occurrenceDetails =
                    todayOccurrences.associate { occurrence ->
                        occurrence.id to TodayOccurrenceDetails(note = routinesById[occurrence.routineId]?.note?.takeIf(String::isNotBlank))
                    },
                weekDays = buildTodayWeek(snapshot.occurrences, today),
            )
        planState =
            planState.copy(
                occurrences = snapshot.occurrences,
                routines = snapshot.routines,
                selectedDate = if (planState.isLoading && planState.occurrences.isEmpty()) today else planState.selectedDate,
                today = today,
                isLoading = false,
                isStale = stale,
                errorMessage = null,
            )
        reviewState =
            reviewState.copy(
                logs =
                    reviewState.logs.copy(
                        categoryOptions = snapshot.categories.map(Category::name).distinct().sorted(),
                        routineOptions = snapshot.routines.map { LogFilterOption(it.id, it.title) },
                    ),
            )
    }

    suspend fun bootstrapAccount(): CurrentUser {
        var account = api.currentUser()
        if (account.settings.timezone.isBlank()) {
            val settings =
                idempotentMutation("bootstrap-timezone:${account.user.id}:${ZoneId.systemDefault().id}") { key ->
                    api.updateSettings(SettingsPatch(timezone = ZoneId.systemDefault().id), key)
                }
            account = account.copy(settings = settings)
        }
        if (currentUser?.user?.id?.let { it != account.user.id } == true) {
            resetAccountScopedState()
        }
        currentUser = account
        application.sessionStore.read()?.let { persisted ->
            if (persisted.accountId != account.user.id) {
                application.sessionStore.write(persisted.copy(accountId = account.user.id))
            }
        }
        RoutempoNotificationScheduler.reconcile(
            context = context,
            routineEnabled = account.settings.routineRemindersEnabled,
            weeklyEnabled = account.settings.weeklySummaryEnabled,
            timezone = account.settings.timezone,
        )
        return account
    }

    fun loadProduct() {
        scope.launch {
            todayState = todayState.copy(isLoading = true, errorMessage = null)
            planState = planState.copy(isLoading = true, errorMessage = null)
            val account = currentUser
            val cached = account?.let { snapshotCache.read(it.user.id) }
            if (cached != null && todayState.occurrences.isEmpty()) applyProductSnapshot(cached, stale = true)
            runCatching {
                val zone = account?.settings?.timezone
                    ?.takeIf(String::isNotBlank)
                    ?.let { runCatching { ZoneId.of(it) }.getOrNull() }
                    ?: ZoneId.systemDefault()
                val today = LocalDate.now(zone)
                val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                val weekEnd = weekStart.plusDays(6)
                val rangeStart = minOf(today.minusDays(3), weekStart)
                val rangeEnd = maxOf(today.plusDays(3), weekEnd)
                val occurrenceDeferred =
                    async {
                        api.occurrences(
                            OccurrenceQuery(
                                startDate = rangeStart.toString(),
                                endDate = rangeEnd.toString(),
                                page = PageQuery(limit = 200),
                            ),
                        )
                    }
                val routineDeferred = async { api.routines(RoutineQuery(includeInactive = true, page = PageQuery(limit = 200))) }
                val categoryDeferred = async { api.categories(PageQuery(limit = 200)) }
                val occurrences = occurrenceDeferred.await().items
                val routines = routineDeferred.await().items
                val loadedCategories = categoryDeferred.await().items
                val loadedAccount = requireNotNull(account)
                val snapshot =
                    ProductSnapshot(
                        currentUser = loadedAccount,
                        routines = routines,
                        categories = loadedCategories,
                        occurrences = occurrences,
                        cachedAtEpochMillis = System.currentTimeMillis(),
                    )
                applyProductSnapshot(snapshot, stale = false)
                snapshotCache.write(loadedAccount.user.id, snapshot)
            }.onFailure { error ->
                val message = error.message ?: "Check your connection and try again."
                if (cached != null) {
                    applyProductSnapshot(cached, stale = true)
                    snackbar.showSnackbar("Offline — showing your last saved Routempo data.")
                } else {
                    todayState =
                        todayState.copy(
                            isLoading = false,
                            errorMessage = message,
                            emptyKind = if (error is IOException) TodayEmptyKind.OFFLINE_NO_CACHE else TodayEmptyKind.FAILURE,
                        )
                    planState = planState.copy(isLoading = false, errorMessage = message)
                }
            }
        }
    }

    fun loadPlanDate(target: LocalDate) {
        val rangeStart = target.minusDays(3)
        val rangeEnd = target.plusDays(3)
        planState = planState.copy(selectedDate = target, isLoading = true, errorMessage = null)
        scope.launch {
            runCatching {
                api.occurrences(
                    OccurrenceQuery(
                        startDate = rangeStart.toString(),
                        endDate = rangeEnd.toString(),
                        page = PageQuery(limit = 200),
                    ),
                ).items
            }.onSuccess { loaded ->
                val merged =
                    (planState.occurrences.filter { occurrence ->
                        val date = runCatching { LocalDate.parse(occurrence.date) }.getOrNull()
                        date == null || date.isBefore(rangeStart) || date.isAfter(rangeEnd)
                    } + loaded).distinctBy { it.id }
                val selectedStillTargetsThisRequest = planState.selectedDate == target
                planState =
                    planState.copy(
                        occurrences = merged,
                        isLoading = if (selectedStillTargetsThisRequest) false else planState.isLoading,
                        isStale = false,
                        errorMessage = if (selectedStillTargetsThisRequest) null else planState.errorMessage,
                    )
                currentUser?.let { account ->
                    snapshotCache.write(
                        account.user.id,
                        ProductSnapshot(
                            currentUser = account,
                            routines = planState.routines,
                            categories = categories,
                            occurrences = merged,
                            cachedAtEpochMillis = System.currentTimeMillis(),
                        ),
                    )
                }
            }.onFailure { error ->
                if (planState.selectedDate == target) {
                    planState =
                        planState.copy(
                            isLoading = false,
                            errorMessage = error.message ?: "Unable to load this week.",
                        )
                }
            }
        }
    }

    fun restoreSession() {
        scope.launch {
            authState = AuthUiState.RestoringSession
            val session = application.sessionStore.read()
            if (session == null) {
                signedIn = false
                authState = AuthUiState.SignedOut()
                return@launch
            }
            runCatching { bootstrapAccount() }
                .onSuccess {
                    signedIn = true
                    loadProduct()
                }
                .onFailure { error ->
                    val persistedSession = application.sessionStore.read()
                    val cached = persistedSession?.accountId?.let { snapshotCache.read(it) }
                    if (cached != null) {
                        signedIn = true
                        applyProductSnapshot(cached, stale = true)
                    } else {
                        signedIn = false
                        authState =
                            if (persistedSession == null) AuthUiState.SignedOut()
                            else AuthUiState.Error(error.message ?: "Your session could not be restored.")
                    }
                }
        }
    }

    fun startSocialSignIn(provider: AuthProvider) {
        pendingAuthProvider = provider
        authState = AuthUiState.SigningIn(provider)
        val apiProvider =
            if (provider == AuthProvider.Google) IntegrationProvider.GOOGLE else IntegrationProvider.MICROSOFT
        val url = api.socialSignInUrl(apiProvider, AUTH_REDIRECT_URI)
        runCatching { CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url)) }
            .onFailure { authState = AuthUiState.Error(it.message ?: "Unable to open sign in.") }
    }

    fun mutateOccurrence(id: String, logicalAction: String, action: suspend (IdempotencyKey) -> Unit) {
        if (id in todayState.busyOccurrenceIds) return
        scope.launch {
            todayState = todayState.copy(busyOccurrenceIds = todayState.busyOccurrenceIds + id)
            runCatching {
                idempotentMutation("occurrence:$logicalAction:$id") { key -> action(key) }
            }
                .onSuccess { loadProduct() }
                .onFailure { snackbar.showSnackbar(it.message ?: "Unable to update this routine.") }
            todayState = todayState.copy(busyOccurrenceIds = todayState.busyOccurrenceIds - id)
        }
    }

    fun savedZoneToday(): LocalDate {
        val zone =
            currentUser?.settings?.timezone
                ?.takeIf(String::isNotBlank)
                ?.let { runCatching { ZoneId.of(it) }.getOrNull() }
                ?: ZoneId.systemDefault()
        return LocalDate.now(zone)
    }

    fun mutateRoutine(id: String, logicalAction: String, action: suspend (IdempotencyKey) -> Unit) {
        if (id in busyRoutineIds) return
        scope.launch {
            busyRoutineIds = busyRoutineIds + id
            runCatching {
                idempotentMutation("routine:$logicalAction:$id") { key -> action(key) }
            }
                .onSuccess { loadProduct() }
                .onFailure { snackbar.showSnackbar(it.message ?: "Unable to update this routine.") }
            busyRoutineIds = busyRoutineIds - id
        }
    }

    fun loadInsights() {
        val range = reviewState.insights.range
        scope.launch {
            reviewState = reviewState.copy(insights = reviewState.insights.copy(isLoading = true, errorMessage = null))
            runCatching {
                val analyticsDeferred = async { api.analytics(AnalyticsQuery(range = range.days)) }
                val historyDeferred = async { api.logs(LogQuery(page = PageQuery(limit = 1))).total }
                analyticsDeferred.await() to runCatching { historyDeferred.await() }.getOrDefault(0)
            }
                .onSuccess { (analytics, historyTotal) ->
                    insightsLoaded = true
                    reviewState =
                        reviewState.copy(
                            insights =
                                InsightsUiState(
                                    range = range,
                                    analytics = analytics,
                                    hasLoaded = true,
                                    emptyReason =
                                        if (planState.routines.isEmpty() && historyTotal == 0) {
                                            InsightsEmptyReason.NO_ACCOUNT_ACTIVITY
                                        } else {
                                            InsightsEmptyReason.NO_OUTCOMES_IN_RANGE
                                        },
                                    isLoading = false,
                                ),
                        )
                }.onFailure { error ->
                    insightsLoaded = true
                    reviewState =
                        reviewState.copy(
                            insights =
                                reviewState.insights.copy(
                                    isLoading = false,
                                    isStale = reviewState.insights.analytics != null,
                                    errorMessage = error.message ?: "Unable to load insights.",
                                ),
                        )
                }
        }
    }

    fun loadLogs(reset: Boolean = true) {
        val current = reviewState.logs
        val filters = current.filters
        val cursor = if (reset) null else current.nextCursor
        if (!reset && cursor == null) return
        val query = filters.toQueryOrNull(cursor = cursor, limit = 50)
        if (query == null) {
            reviewState =
                reviewState.copy(
                    logs = current.copy(errorMessage = "Check the date range before applying these filters."),
                )
            return
        }
        scope.launch {
            reviewState =
                reviewState.copy(
                    logs =
                        current.copy(
                            isLoading = reset && current.logs.isEmpty(),
                            isRefreshing = reset && current.logs.isNotEmpty(),
                            isLoadingNextPage = !reset,
                            errorMessage = null,
                            paginationErrorMessage = null,
                        ),
                )
            runCatching {
                val page = api.logs(query)
                val counts =
                    if (reset) {
                        val base = filters.copy(status = null)
                        val totals =
                            listOf(null, com.montasim.routempo.core.model.LogStatus.COMPLETED, com.montasim.routempo.core.model.LogStatus.SKIPPED, com.montasim.routempo.core.model.LogStatus.MISSED)
                                .map { status ->
                                    async {
                                        api.logs(
                                            requireNotNull(base.copy(status = status).toQueryOrNull(limit = 1)),
                                        ).total
                                    }
                                }.awaitAll()
                        LogOutcomeCounts(totals[0], totals[1], totals[2], totals[3])
                    } else {
                        current.outcomeCounts
                    }
                page to counts
            }.onSuccess { (page, counts) ->
                logsLoaded = true
                reviewState =
                    reviewState.copy(
                        logs =
                            reviewState.logs.copy(
                                logs = if (reset) page.items else (current.logs + page.items).distinctBy(BehaviorLog::id),
                                hasLoaded = true,
                                outcomeCounts = counts,
                                nextCursor = page.nextCursor,
                                isLoading = false,
                                isRefreshing = false,
                                isLoadingNextPage = false,
                                isStale = false,
                            ),
                    )
            }.onFailure { error ->
                logsLoaded = true
                reviewState =
                    reviewState.copy(
                        logs =
                            reviewState.logs.copy(
                                isLoading = false,
                                isRefreshing = false,
                                isLoadingNextPage = false,
                                isStale = reviewState.logs.logs.isNotEmpty(),
                                errorMessage = if (reset) error.message ?: "Unable to load logs." else null,
                                paginationErrorMessage = if (reset) null else error.message ?: "Unable to load more logs.",
                            ),
                    )
            }
        }
    }

    fun handleReviewEvent(event: ReviewEvent) {
        when (event) {
            is ReviewEvent.SelectTab -> {
                reviewState = reviewState.copy(selectedTab = event.tab)
                if (event.tab == ReviewTab.INSIGHTS && !insightsLoaded) loadInsights()
                if (event.tab == ReviewTab.LOGS && !logsLoaded) loadLogs()
            }
            is ReviewEvent.SelectInsightsRange -> {
                reviewState = reviewState.copy(insights = reviewState.insights.copy(range = event.range))
                loadInsights()
            }
            ReviewEvent.RetryInsights,
            ReviewEvent.RefreshInsights,
            -> loadInsights()
            ReviewEvent.ToggleLogFilters ->
                reviewState = reviewState.copy(logs = reviewState.logs.copy(filtersExpanded = !reviewState.logs.filtersExpanded))
            is ReviewEvent.ChangeLogFilters ->
                reviewState = reviewState.copy(logs = reviewState.logs.copy(filters = event.filters))
            ReviewEvent.ApplyLogFilters -> {
                reviewState = reviewState.copy(logs = reviewState.logs.copy(filtersExpanded = false))
                loadLogs()
            }
            ReviewEvent.ClearLogFilters -> {
                reviewState = reviewState.copy(logs = reviewState.logs.copy(filters = com.montasim.routempo.feature.review.LogFilters()))
                loadLogs()
            }
            ReviewEvent.RefreshLogs,
            ReviewEvent.RetryLogs,
            -> loadLogs()
            ReviewEvent.LoadMoreLogs,
            ReviewEvent.RetryLogPage,
            -> loadLogs(reset = false)
            is ReviewEvent.OpenLog -> reviewState = reviewState.copy(logs = reviewState.logs.copy(selectedLog = event.log))
            ReviewEvent.CloseLogDetails -> reviewState = reviewState.copy(logs = reviewState.logs.copy(selectedLog = null))
            ReviewEvent.AddLog -> {
                val zone =
                    currentUser?.settings?.timezone
                        ?.let { runCatching { ZoneId.of(it) }.getOrNull() }
                        ?: ZoneId.systemDefault()
                val now = LocalTime.now(zone).format(DateTimeFormatter.ofPattern("HH:mm"))
                val draft =
                    com.montasim.routempo.feature.review.LogDraft(
                        date = LocalDate.now(zone).toString(),
                        eventTime = now,
                        scheduledTime = now,
                        category = categories.firstOrNull()?.name.orEmpty(),
                    )
                reviewState = reviewState.copy(logs = reviewState.logs.copy(editor = LogEditorUiState(draft = draft)))
            }
            is ReviewEvent.EditLog ->
                reviewState =
                    reviewState.copy(
                        logs = reviewState.logs.copy(selectedLog = null, editor = LogEditorUiState(logId = event.log.id, draft = event.log.toDraft())),
                    )
            ReviewEvent.DismissLogEditor -> reviewState = reviewState.copy(logs = reviewState.logs.copy(editor = null))
            is ReviewEvent.ChangeLogDraft -> {
                val editor = reviewState.logs.editor ?: return
                reviewState =
                    reviewState.copy(
                        logs = reviewState.logs.copy(editor = editor.copy(draft = event.draft, showValidation = false, errorMessage = null)),
                    )
            }
            ReviewEvent.SaveLog -> {
                val editor = reviewState.logs.editor ?: return
                val validation = validateLogDraft(editor.draft)
                if (!validation.isValid) {
                    reviewState = reviewState.copy(logs = reviewState.logs.copy(editor = editor.copy(validation = validation, showValidation = true)))
                    return
                }
                scope.launch {
                    reviewState = reviewState.copy(logs = reviewState.logs.copy(editor = editor.copy(isSaving = true)))
                    runCatching {
                        val write = requireNotNull(editor.draft.toLogWriteOrNull())
                        val logId = editor.logId
                        if (logId == null) {
                            idempotentMutation("log:create:${write.hashCode()}") { key -> api.createLog(write, key) }
                        }
                        else {
                            val patch =
                                LogPatch(
                                    routineId = write.routineId,
                                    clearRoutineId = write.routineId == null,
                                    date = write.date,
                                    eventTime = write.eventTime,
                                    title = write.title,
                                    category = write.category,
                                    scheduledTime = write.scheduledTime,
                                    actualTime = write.actualTime,
                                    clearActualTime = write.actualTime == null,
                                    status = write.status,
                                    note = write.note,
                                )
                            idempotentMutation("log:update:$logId:${patch.hashCode()}") { key ->
                                api.updateLog(logId, patch, key)
                            }
                        }
                    }.onSuccess {
                        reviewState = reviewState.copy(logs = reviewState.logs.copy(editor = null))
                        loadLogs()
                        loadInsights()
                    }.onFailure { error ->
                        reviewState =
                            reviewState.copy(
                                logs =
                                    reviewState.logs.copy(
                                        editor = editor.copy(isSaving = false, errorMessage = error.message ?: "Unable to save log."),
                                    ),
                            )
                    }
                }
            }
            is ReviewEvent.RequestDeleteLog ->
                reviewState = reviewState.copy(logs = reviewState.logs.copy(selectedLog = null, deleteCandidate = event.log))
            ReviewEvent.CancelDeleteLog -> reviewState = reviewState.copy(logs = reviewState.logs.copy(deleteCandidate = null))
            ReviewEvent.ConfirmDeleteLog -> {
                val candidate = reviewState.logs.deleteCandidate ?: return
                scope.launch {
                    reviewState = reviewState.copy(logs = reviewState.logs.copy(isDeleting = true))
                    runCatching {
                        idempotentMutation("log:delete:${candidate.id}") { key -> api.deleteLog(candidate.id, key) }
                    }
                        .onSuccess {
                            reviewState = reviewState.copy(logs = reviewState.logs.copy(deleteCandidate = null, isDeleting = false))
                            loadLogs()
                            loadInsights()
                        }.onFailure { error ->
                            reviewState = reviewState.copy(logs = reviewState.logs.copy(isDeleting = false))
                            snackbar.showSnackbar(error.message ?: "Unable to delete log.")
                        }
                }
            }
        }
    }

    fun providerStatus(state: ProviderState): ProviderConnectionStatus =
        when {
            !state.configured -> ProviderConnectionStatus.Unconfigured
            state.connected && state.ready -> ProviderConnectionStatus.Connected
            state.connected -> ProviderConnectionStatus.SignInOnly
            else -> ProviderConnectionStatus.Disconnected
        }

    fun categorySettings(items: List<Category>, accountId: String): List<CategorySettingsUi> {
        val order = organizationPreferences.getString("$accountId:category_order", "").orEmpty().split(',').filter(String::isNotBlank)
        val orderIndex = order.withIndex().associate { it.value to it.index }
        return items
            .map {
                CategorySettingsUi(
                    id = it.id,
                    name = it.name,
                    routineCount = it.routineCount,
                    colorHex = organizationPreferences.getString("$accountId:category_color:${it.id}", null) ?: "#178449",
                )
            }.sortedWith(compareBy({ orderIndex[it.id] ?: Int.MAX_VALUE }, CategorySettingsUi::name))
    }

    fun loadSettings() {
        scope.launch {
            settingsState = settingsState.copy(isLoading = settingsState.account == null, errorMessage = null)
            val accountDeferred = async { runCatching { api.currentUser() } }
            val categoriesDeferred = async { runCatching { api.categories(PageQuery(limit = 200)).items } }
            val integrationsDeferred = async { runCatching { api.integrationStatuses() } }
            val accountResult = accountDeferred.await()
            val categoriesResult = categoriesDeferred.await()
            val integrationsResult = integrationsDeferred.await()
            val account = accountResult.getOrNull() ?: currentUser
            val loadedCategories = categoriesResult.getOrNull() ?: categories
            if (account != null) {
                currentUser = account
                categories = loadedCategories
                settingsLoaded = true
                settingsState =
                    RoutempoSettingsUiState(
                        account = SettingsAccountUi(account.settings.name, account.user.email, account.settings.timezone),
                        reminders =
                            ReminderSettingsUi(
                                routineRemindersEnabled = account.settings.routineRemindersEnabled,
                                reminderTime = "At scheduled time",
                                reminderOffsetMinutes = account.settings.defaultReminderMinutes,
                                weeklySummaryEnabled = account.settings.weeklySummaryEnabled,
                            ),
                        themeMode = themeMode,
                        categories = categorySettings(loadedCategories, account.user.id),
                        providers =
                            integrationsResult.getOrNull()?.let { integrations ->
                                listOf(
                                    ProviderSettingsUi(SettingsProvider.Google, providerStatus(integrations.google)),
                                    ProviderSettingsUi(SettingsProvider.Microsoft, providerStatus(integrations.microsoft)),
                                )
                            } ?: SettingsProvider.entries.map { provider ->
                                ProviderSettingsUi(
                                    provider,
                                    ProviderConnectionStatus.Error,
                                    integrationsResult.exceptionOrNull()?.message ?: "Provider status is unavailable.",
                                )
                            },
                        notificationPermission = notificationPermission,
                        appInfo = AppInfoUi(BuildConfig.VERSION_NAME, BuildConfig.VERSION_CODE.toString()),
                        isOffline = listOf(accountResult, categoriesResult, integrationsResult).any { it.isFailure },
                    )
                RoutempoNotificationScheduler.reconcile(
                    context,
                    account.settings.routineRemindersEnabled,
                    account.settings.weeklySummaryEnabled,
                    account.settings.timezone,
                )
            } else {
                settingsLoaded = true
                settingsState =
                    settingsState.copy(
                        isLoading = false,
                        errorMessage = accountResult.exceptionOrNull()?.message ?: "Unable to load settings.",
                    )
            }
        }
    }

    fun updateSettings(patch: SettingsPatch, after: (() -> Unit)? = null) {
        scope.launch {
            settingsState = settingsState.copy(isMutating = true, errorMessage = null)
            runCatching {
                idempotentMutation("settings:update:${patch.hashCode()}") { key -> api.updateSettings(patch, key) }
            }
                .onSuccess { updated ->
                    currentUser = currentUser?.copy(settings = updated)
                    settingsState =
                        settingsState.copy(
                            account = currentUser?.let { SettingsAccountUi(updated.name, it.user.email, updated.timezone) },
                            reminders =
                                ReminderSettingsUi(
                                    updated.routineRemindersEnabled,
                                    "At scheduled time",
                                    updated.defaultReminderMinutes,
                                    updated.weeklySummaryEnabled,
                                ),
                            isMutating = false,
                            isOffline = false,
                        )
                    RoutempoNotificationScheduler.reconcile(
                        context,
                        updated.routineRemindersEnabled,
                        updated.weeklySummaryEnabled,
                        updated.timezone,
                    )
                    after?.invoke()
                }.onFailure { error ->
                    settingsState = settingsState.copy(isMutating = false, errorMessage = error.message ?: "Unable to save settings.")
                }
        }
    }

    fun connectProvider(provider: SettingsProvider) {
        val apiProvider = if (provider == SettingsProvider.Google) IntegrationProvider.GOOGLE else IntegrationProvider.MICROSOFT
        settingsState =
            settingsState.copy(
                providers = settingsState.providers.map {
                    if (it.provider == provider) it.copy(status = ProviderConnectionStatus.Connecting) else it
                },
            )
        scope.launch {
            runCatching {
                idempotentMutation("integration:connect:${apiProvider.name}") { key ->
                    api.createIntegrationConnect(apiProvider, AUTH_REDIRECT_URI, key)
                }
            }
                .onSuccess { connection -> openTrustedUrl(context, connection.browserUrl) }
                .onFailure { error ->
                    snackbar.showSnackbar(error.message ?: "Unable to connect ${provider.displayName}.")
                    loadSettings()
                }
        }
    }

    fun syncProvider(provider: SettingsProvider, resource: IntegrationResourceUi, action: IntegrationActionUi) {
        val operation = IntegrationOperation(resource, action)
        settingsState =
            settingsState.copy(
                providers = settingsState.providers.map { if (it.provider == provider) it.copy(activeOperation = operation) else it },
            )
        scope.launch {
            val apiProvider = if (provider == SettingsProvider.Google) IntegrationProvider.GOOGLE else IntegrationProvider.MICROSOFT
            val apiResource = if (resource == IntegrationResourceUi.Calendar) IntegrationResource.CALENDAR else IntegrationResource.TASKS
            val apiAction = if (action == IntegrationActionUi.Import) IntegrationAction.IMPORT else IntegrationAction.EXPORT
            runCatching {
                idempotentMutation("integration:sync:${apiAction.name}:${apiProvider.name}:${apiResource.name}") { key ->
                    api.syncIntegration(apiAction, apiProvider, apiResource, key)
                }
            }
                .onSuccess { result ->
                    settingsState =
                        settingsState.copy(
                            providers = settingsState.providers.map { if (it.provider == provider) it.copy(activeOperation = null) else it },
                        )
                    snackbar.showSnackbar(
                        buildString {
                            append("${action.displayName} finished: ${result.imported ?: result.exported ?: 0} changed, ${result.skipped} skipped")
                            if (result.failures.isNotEmpty()) append(", ${result.failures.size} failed")
                            append('.')
                        },
                    )
                    loadProduct()
                }.onFailure { error ->
                    settingsState =
                        settingsState.copy(
                            providers = settingsState.providers.map { if (it.provider == provider) it.copy(activeOperation = null) else it },
                        )
                    snackbar.showSnackbar(error.message ?: "Integration sync failed.")
                }
        }
    }

    LaunchedEffect(Unit) { restoreSession() }
    LaunchedEffect(authCallback) {
        val callback = authCallback ?: return@LaunchedEffect
        val code = callback.getQueryParameter("code")
        val error = callback.getQueryParameter("error")
        if (code != null) {
            authState = AuthUiState.SigningIn(pendingAuthProvider ?: AuthProvider.Microsoft)
            try {
                api.exchangeSocialCode(code, AUTH_REDIRECT_URI)
                bootstrapAccount()
                pendingAuthProvider = null
                signedIn = true
                loadProduct()
            } catch (error: CancellationException) {
                throw error
            } catch (error: Throwable) {
                authState = AuthUiState.Error(error.message ?: "Sign in could not be completed.")
            }
        } else if (signedIn && error == null) {
            loadSettings()
            snackbar.showSnackbar("Provider connection updated.")
        } else {
            authState = AuthUiState.Error(error ?: "Sign in was cancelled.")
        }
        // Clearing the callback changes this LaunchedEffect's key. Do it only after all
        // suspending callback work is complete so Compose cannot cancel the exchange midway.
        onAuthCallbackConsumed()
    }
    LaunchedEffect(notificationDestination, signedIn) {
        val requested = notificationDestination ?: return@LaunchedEffect
        if (!signedIn) return@LaunchedEffect
        onNotificationDestinationConsumed()
        destination = if (requested == "review") MainDestination.REVIEW else MainDestination.TODAY
    }
    LaunchedEffect(themeMode) {
        settingsState = settingsState.copy(themeMode = themeMode)
    }
    LaunchedEffect(notificationPermission) {
        settingsState =
            settingsState.copy(
                notificationPermission = notificationPermission,
            )
    }
    LaunchedEffect(destination, signedIn) {
        if (signedIn && destination == MainDestination.REVIEW) {
            if (!insightsLoaded) loadInsights()
            if (!logsLoaded) loadLogs()
        }
        if (signedIn && destination == MainDestination.SETTINGS && !settingsLoaded) loadSettings()
    }

    if (!signedIn) {
        RoutempoAuthScreen(
            state = authState,
            onSignIn = ::startSocialSignIn,
            onRetry = ::restoreSession,
            onReturnToSignIn = { authState = AuthUiState.SignedOut() },
            onTerms = { openTrustedUrl(context, "https://routempo.netlify.app/terms") },
            onPrivacy = { openTrustedUrl(context, "https://routempo.netlify.app/privacy") },
            onSupport = { openTrustedUrl(context, "https://www.supportkori.com/") },
        )
        return
    }

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val expandedNavigation = maxWidth >= 600.dp
        Row(Modifier.fillMaxSize()) {
            if (expandedNavigation) {
                NavigationRail {
                    RailDestinationItem(destination, MainDestination.TODAY, Icons.Outlined.CheckCircle) { destination = it }
                    RailDestinationItem(destination, MainDestination.PLAN, Icons.Outlined.CalendarMonth) { destination = it }
                    Box(Modifier.weight(1f), contentAlignment = androidx.compose.ui.Alignment.Center) {
                        FloatingActionButton(
                            onClick = {
                                editingRoutine = null
                                routineStartDate = savedZoneToday()
                                showRoutineEditor = true
                            },
                        ) { Icon(Icons.Outlined.Add, "Add routine") }
                    }
                    RailDestinationItem(destination, MainDestination.REVIEW, Icons.Outlined.Insights) { destination = it }
                    RailDestinationItem(destination, MainDestination.SETTINGS, Icons.Outlined.Settings) { destination = it }
                }
            }
            Scaffold(
                modifier = Modifier.weight(1f),
                snackbarHost = { SnackbarHost(snackbar) },
                bottomBar = {
                    if (!expandedNavigation) {
                        NavigationBar {
                            DestinationItem(destination, MainDestination.TODAY, Icons.Outlined.CheckCircle) { destination = it }
                            DestinationItem(destination, MainDestination.PLAN, Icons.Outlined.CalendarMonth) { destination = it }
                            Box(Modifier.weight(1f)) {
                                FloatingActionButton(
                                    onClick = {
                                        editingRoutine = null
                                        routineStartDate = savedZoneToday()
                                        showRoutineEditor = true
                                    },
                                ) { Icon(Icons.Outlined.Add, "Add routine") }
                            }
                            DestinationItem(destination, MainDestination.REVIEW, Icons.Outlined.Insights) { destination = it }
                            DestinationItem(destination, MainDestination.SETTINGS, Icons.Outlined.Settings) { destination = it }
                        }
                    }
                },
            ) { innerPadding ->
        when (destination) {
            MainDestination.TODAY ->
                TodayScreen(
                    state = todayState,
                    onRetry = ::loadProduct,
                    onAddRoutine = {
                        editingRoutine = null
                        routineStartDate = savedZoneToday()
                        showRoutineEditor = true
                    },
                    onOpenOccurrence = { selectedOccurrence = it },
                    onComplete = { occurrence ->
                        mutateOccurrence(occurrence.id, "complete") { key ->
                            api.completeOccurrence(occurrence.id, OccurrenceResolution(), key)
                        }
                    },
                    onSkip = { occurrence ->
                        mutateOccurrence(occurrence.id, "skip") { key ->
                            api.skipOccurrence(occurrence.id, OccurrenceResolution(), key)
                        }
                    },
                    onRevert = { occurrence ->
                        mutateOccurrence(occurrence.id, "revert") { key -> api.revertOccurrence(occurrence.id, key) }
                    },
                    modifier = Modifier.padding(innerPadding),
                )

            MainDestination.PLAN ->
                PlanScreen(
                    state = planState,
                    busyRoutineIds = busyRoutineIds,
                    onTabSelected = { planState = planState.copy(selectedTab = it) },
                    onDateSelected = ::loadPlanDate,
                    onPreviousWeek = { loadPlanDate(planState.selectedDate.minusDays(7)) },
                    onNextWeek = { loadPlanDate(planState.selectedDate.plusDays(7)) },
                    onAddRoutine = {
                        editingRoutine = null
                        routineStartDate = it
                        showRoutineEditor = true
                    },
                    onOpenOccurrence = { selectedOccurrence = it },
                    onOpenRoutine = { selectedRoutine = it },
                    onEditRoutine = {
                        editingRoutine = it
                        routineStartDate = LocalDate.parse(it.startDate)
                        showRoutineEditor = true
                    },
                    onToggleRoutine = { routine ->
                        mutateRoutine(routine.id, "toggle:${!routine.isActive}") { key ->
                            api.updateRoutine(
                                routine.id,
                                RoutinePatch(isActive = !routine.isActive),
                                key,
                            )
                        }
                    },
                    onDeleteRoutine = { deletingRoutine = it },
                    onRetry = ::loadProduct,
                    modifier = Modifier.padding(innerPadding),
                )

            MainDestination.REVIEW ->
                ReviewScreen(
                    state = reviewState,
                    onEvent = ::handleReviewEvent,
                    modifier = Modifier.padding(innerPadding),
                )

            MainDestination.SETTINGS ->
                RoutempoSettingsScreen(
                    state = settingsState,
                    callbacks =
                        RoutempoSettingsCallbacks(
                            onRetry = ::loadSettings,
                            onProfileClick = { showProfileSettings = true },
                            onRoutineRemindersChanged = { enabled ->
                                updateSettings(SettingsPatch(routineRemindersEnabled = enabled))
                            },
                            onReminderTimeClick = { showReminderSettings = true },
                            onReminderOffsetClick = { showReminderSettings = true },
                            onWeeklySummaryChanged = { enabled ->
                                updateSettings(SettingsPatch(weeklySummaryEnabled = enabled))
                            },
                            onThemeModeChanged = { mode ->
                                scope.launch { application.themePreferences.setThemeMode(mode) }
                            },
                            onCategoriesClick = { showCategorySettings = true },
                            onProviderClick = { selectedProvider = it },
                            onNotificationPermissionClick = onRequestNotificationPermission,
                            onBackupExport = {
                                scope.launch {
                                    settingsState = settingsState.copy(isMutating = true)
                                    runCatching { api.encodeBackup(api.backup()) }
                                        .onSuccess {
                                            pendingBackupContent = it
                                            settingsState = settingsState.copy(isMutating = false)
                                            backupCreateLauncher.launch("routempo-backup-${LocalDate.now()}.json")
                                        }.onFailure { error ->
                                            settingsState = settingsState.copy(isMutating = false)
                                            snackbar.showSnackbar(error.message ?: "Unable to create backup.")
                                        }
                                }
                            },
                            onBackupRestoreRequest = { backupOpenLauncher.launch(arrayOf("application/json", "text/json")) },
                            onCsvExport = {
                                scope.launch {
                                    settingsState = settingsState.copy(isMutating = true)
                                    runCatching { api.exportLogs() }
                                        .onSuccess {
                                            pendingCsvContent = it.content
                                            settingsState = settingsState.copy(isMutating = false)
                                            csvCreateLauncher.launch(it.suggestedFilename ?: "routempo-logs-${LocalDate.now()}.csv")
                                        }.onFailure { error ->
                                            settingsState = settingsState.copy(isMutating = false)
                                            snackbar.showSnackbar(error.message ?: "Unable to export logs.")
                                        }
                                }
                            },
                            onTerms = { openTrustedUrl(context, "https://routempo.netlify.app/terms") },
                            onPrivacy = { openTrustedUrl(context, "https://routempo.netlify.app/privacy") },
                            onSupport = { openTrustedUrl(context, "https://www.supportkori.com/") },
                            onSignOutRequest = { showSignOutConfirmation = true },
                        ),
                    modifier = Modifier.padding(innerPadding),
                )
            }
        }
    }
    }

    if (showRoutineEditor) {
        RoutineEditorSheet(
            categories = categories,
            initial = editingRoutine,
            suggestedStartDate = routineStartDate.toString(),
            isSaving = isSavingRoutine,
            serverError = routineError,
            savedZoneToday = savedZoneToday(),
            serverFieldErrors = routineFieldErrors,
            onDismiss = {
                showRoutineEditor = false
                routineError = null
                routineFieldErrors = emptyMap()
            },
            onCreateCategory = { name ->
                scope.launch {
                    runCatching {
                        idempotentMutation("category:create:${name.hashCode()}") { key -> api.createCategory(name, key) }
                    }
                        .onSuccess { categories = (categories + it).distinctBy(Category::id) }
                        .onFailure { error ->
                            if (error is ApiException && error.statusCode == 409) {
                                runCatching { api.categories(PageQuery(limit = 200)).items }
                                    .onSuccess { categories = it }
                            } else {
                                routineError = error.message
                            }
                        }
                }
            },
            onSave = { write ->
                scope.launch {
                    isSavingRoutine = true
                    routineError = null
                    routineFieldErrors = emptyMap()
                    runCatching {
                        val existing = editingRoutine
                        if (existing == null) {
                            idempotentMutation("routine:create:${write.hashCode()}") { key -> api.createRoutine(write, key) }
                        } else {
                            val patch = write.toPatch()
                            idempotentMutation("routine:update:${existing.id}:${patch.hashCode()}") { key ->
                                api.updateRoutine(existing.id, patch, key)
                            }
                        }
                    }.onSuccess {
                        showRoutineEditor = false
                        routineError = null
                        routineFieldErrors = emptyMap()
                        loadProduct()
                    }.onFailure { error ->
                        routineFieldErrors =
                            (error as? ApiException)?.problem?.errors.orEmpty()
                                .mapNotNull { fieldError ->
                                    routineFormFieldForServerPath(fieldError.path)?.let { it to fieldError.message }
                                }.toMap()
                        routineError =
                            if (routineFieldErrors.isEmpty()) error.message ?: "Unable to save routine." else null
                    }
                    isSavingRoutine = false
                }
            },
        )
    }

    deletingRoutine?.let { routine ->
        DeleteRoutineConfirmation(
            routine = routine,
            onDismiss = { deletingRoutine = null },
            onConfirm = {
                deletingRoutine = null
                mutateRoutine(routine.id, "delete") { key -> api.deleteRoutine(routine.id, key) }
            },
        )
    }

    selectedRoutine?.let { routine ->
        RoutineDetailDialog(
            routine = routine,
            onDismiss = { selectedRoutine = null },
            onEdit = {
                editingRoutine = it
                routineStartDate = LocalDate.parse(it.startDate)
                showRoutineEditor = true
            },
            onToggleActive = {
                mutateRoutine(it.id, "toggle:${!it.isActive}") { key ->
                    api.updateRoutine(it.id, RoutinePatch(isActive = !it.isActive), key)
                }
            },
            onDelete = { deletingRoutine = it },
            busy = routine.id in busyRoutineIds,
        )
    }

    selectedOccurrence?.let { occurrence ->
        val savedZone =
            currentUser?.settings?.timezone
                ?.let { runCatching { ZoneId.of(it) }.getOrNull() }
                ?: ZoneId.systemDefault()
        OccurrenceDetailDialog(
            occurrence = occurrence,
            allowResolution = occurrence.date == LocalDate.now(savedZone).toString(),
            busy = occurrence.id in todayState.busyOccurrenceIds,
            onDismiss = { selectedOccurrence = null },
            onComplete = {
                mutateOccurrence(it.id, "complete") { key ->
                    api.completeOccurrence(it.id, OccurrenceResolution(), key)
                }
            },
            onSkip = {
                mutateOccurrence(it.id, "skip") { key ->
                    api.skipOccurrence(it.id, OccurrenceResolution(), key)
                }
            },
            onRevert = {
                mutateOccurrence(it.id, "revert") { key -> api.revertOccurrence(it.id, key) }
            },
            routine = planState.routines.firstOrNull { it.id == occurrence.routineId },
            routineBusy = occurrence.routineId in busyRoutineIds,
            onEditRoutine = { routine ->
                editingRoutine = routine
                routineStartDate = LocalDate.parse(routine.startDate)
                showRoutineEditor = true
            },
            onToggleRoutine = { routine ->
                mutateRoutine(routine.id, "toggle:${!routine.isActive}") { key ->
                    api.updateRoutine(
                        routine.id,
                        RoutinePatch(isActive = !routine.isActive),
                        key,
                    )
                }
            },
            onDeleteRoutine = { deletingRoutine = it },
        )
    }

    if (showProfileSettings) {
        settingsState.account?.let { account ->
            ProfileSettingsSheet(
                account = account,
                supportedTimezones = ZoneId.getAvailableZoneIds().toList(),
                isSaving = settingsState.isMutating,
                onSave = { draft: ProfileSettingsDraft ->
                    updateSettings(SettingsPatch(name = draft.name, timezone = draft.timezone)) {
                        showProfileSettings = false
                        loadProduct()
                    }
                },
                onDismissRequest = { showProfileSettings = false },
            )
        }
    }

    if (showReminderSettings) {
        ReminderConfigurationSheet(
            current = settingsState.reminders,
            reminderTimeOptions = listOf("At scheduled time"),
            isSaving = settingsState.isMutating,
            onSave = { reminders ->
                updateSettings(
                    SettingsPatch(
                        defaultReminderMinutes = reminders.reminderOffsetMinutes,
                        routineRemindersEnabled = reminders.routineRemindersEnabled,
                        weeklySummaryEnabled = reminders.weeklySummaryEnabled,
                    ),
                ) { showReminderSettings = false }
            },
            onDismissRequest = { showReminderSettings = false },
        )
    }

    if (showCategorySettings) {
        CategoryManagementSheet(
            categories = settingsState.categories,
            busyCategoryIds = if (settingsState.isMutating) settingsState.categories.mapTo(mutableSetOf()) { it.id } else emptySet(),
            onAdd = {
                editingCategory = null
                showCategoryEditor = true
            },
            onEdit = {
                editingCategory = it
                showCategoryEditor = true
            },
            onDeleteRequest = { deletingCategory = it },
            onMove = { categoryId, newIndex ->
                val reordered = settingsState.categories.toMutableList()
                val oldIndex = reordered.indexOfFirst { it.id == categoryId }
                if (oldIndex >= 0 && newIndex in reordered.indices) {
                    val item = reordered.removeAt(oldIndex)
                    reordered.add(newIndex, item)
                    settingsState = settingsState.copy(categories = reordered)
                    currentUser?.user?.id?.let { accountId ->
                        organizationPreferences.edit()
                            .putString("$accountId:category_order", reordered.joinToString(",") { it.id })
                            .apply()
                    }
                }
            },
            onDismissRequest = { showCategorySettings = false },
        )
    }

    if (showCategoryEditor) {
        CategoryEditorSheet(
            category = editingCategory,
            existingCategoryNames = settingsState.categories.map(CategorySettingsUi::name),
            isSaving = settingsState.isMutating,
            serverError = settingsState.errorMessage,
            onSave = { draft: CategoryDraft ->
                scope.launch {
                    settingsState = settingsState.copy(isMutating = true, errorMessage = null)
                    val existing = editingCategory
                    runCatching {
                        if (existing == null) {
                            idempotentMutation("category:create:${draft.name.hashCode()}") { key ->
                                api.createCategory(draft.name, key)
                            }
                        } else {
                            idempotentMutation("category:rename:${existing.id}:${draft.name.hashCode()}") { key ->
                                api.renameCategory(existing.id, draft.name, key)
                            }
                        }
                    }.onSuccess { saved ->
                        currentUser?.user?.id?.let { accountId ->
                            organizationPreferences.edit()
                                .putString("$accountId:category_color:${saved.id}", draft.colorHex)
                                .apply()
                        }
                        showCategoryEditor = false
                        editingCategory = null
                        settingsState = settingsState.copy(isMutating = false)
                        loadSettings()
                        loadProduct()
                    }.onFailure { error ->
                        settingsState = settingsState.copy(isMutating = false, errorMessage = error.message ?: "Unable to save category.")
                    }
                }
            },
            onDismissRequest = {
                showCategoryEditor = false
                editingCategory = null
            },
        )
    }

    deletingCategory?.let { category ->
        DeleteCategoryConfirmationSheet(
            category = category,
            busy = settingsState.isMutating,
            onConfirm = {
                scope.launch {
                    settingsState = settingsState.copy(isMutating = true)
                    runCatching {
                        idempotentMutation("category:delete:${category.id}") { key -> api.deleteCategory(category.id, key) }
                    }
                        .onSuccess {
                            currentUser?.user?.id?.let { accountId ->
                                organizationPreferences.edit().remove("$accountId:category_color:${category.id}").apply()
                            }
                            deletingCategory = null
                            settingsState = settingsState.copy(isMutating = false)
                            loadSettings()
                            loadProduct()
                        }.onFailure { error ->
                            settingsState = settingsState.copy(isMutating = false)
                            snackbar.showSnackbar(error.message ?: "Unable to delete category.")
                        }
                }
            },
            onDismissRequest = { deletingCategory = null },
        )
    }

    selectedProvider?.let { provider ->
        settingsState.providers.firstOrNull { it.provider == provider }?.let { providerState ->
            ProviderIntegrationSheet(
                provider = providerState,
                onConnect = ::connectProvider,
                onSync = ::syncProvider,
                onDisconnectRequest = { disconnectingProvider = it },
                onDismissRequest = { selectedProvider = null },
            )
        }
    }

    disconnectingProvider?.let { provider ->
        DisconnectProviderConfirmationSheet(
            provider = provider,
            busy = settingsState.isMutating,
            onConfirm = {
                val apiProvider = if (provider == SettingsProvider.Google) IntegrationProvider.GOOGLE else IntegrationProvider.MICROSOFT
                scope.launch {
                    settingsState = settingsState.copy(isMutating = true)
                    runCatching {
                        idempotentMutation("integration:disconnect:${apiProvider.name}") { key ->
                            api.disconnectIntegration(apiProvider, key)
                        }
                    }
                        .onSuccess {
                            disconnectingProvider = null
                            selectedProvider = null
                            settingsState = settingsState.copy(isMutating = false)
                            loadSettings()
                        }.onFailure { error ->
                            settingsState = settingsState.copy(isMutating = false)
                            snackbar.showSnackbar(error.message ?: "Unable to disconnect ${provider.displayName}.")
                        }
                }
            },
            onDismissRequest = { disconnectingProvider = null },
        )
    }

    pendingRestore?.let { (filename, archive) ->
        RestoreBackupConfirmationSheet(
            filename = filename,
            warningMessage =
                if (BackupRestoreImplication.PROVIDER_SYNC_LINKS_RESET in archive.validateForRestore().implications) {
                    "Connected provider sync links will be reset and may need to be connected again."
                } else {
                    null
                },
            busy = settingsState.isMutating,
            onConfirm = {
                scope.launch {
                    settingsState = settingsState.copy(isMutating = true)
                    runCatching {
                        val preflight = archive.validateForRestore()
                        require(preflight.canRestore) {
                            preflight.issues.take(3).joinToString("; ") { "${it.path}: ${it.message}" }
                        }
                        idempotentMutation("backup:restore:${archive.hashCode()}") { key -> api.restoreBackup(archive, key) }
                    }
                        .onSuccess {
                            pendingRestore = null
                            settingsState = settingsState.copy(isMutating = false)
                            currentUser?.user?.id?.let { snapshotCache.clear(it) }
                            loadProduct()
                            loadSettings()
                            snackbar.showSnackbar("Backup restored.")
                        }.onFailure { error ->
                            settingsState = settingsState.copy(isMutating = false)
                            snackbar.showSnackbar(error.message ?: "Unable to restore backup.")
                        }
                }
            },
            onDismissRequest = { pendingRestore = null },
        )
    }

    if (showSignOutConfirmation) {
        SignOutConfirmationSheet(
            busy = settingsState.isMutating,
            onConfirm = {
                scope.launch {
                    settingsState = settingsState.copy(isMutating = true)
                    val accountId = currentUser?.user?.id
                    runCatching {
                        idempotentMutation("auth:logout:${accountId.orEmpty()}") { key -> api.logout(key) }
                    }
                    application.sessionStore.clear()
                    if (accountId != null) snapshotCache.clear(accountId)
                    RoutempoNotificationScheduler.cancelAll(context)
                    resetAccountScopedState()
                    currentUser = null
                    signedIn = false
                    showSignOutConfirmation = false
                    authState = AuthUiState.SignedOut()
                }
            },
            onDismissRequest = { showSignOutConfirmation = false },
        )
    }
}

@Composable
private fun RowScope.DestinationItem(
    current: MainDestination,
    item: MainDestination,
    icon: ImageVector,
    onSelect: (MainDestination) -> Unit,
) {
    NavigationBarItem(
        selected = current == item,
        onClick = { onSelect(item) },
        icon = { Icon(icon, item.label) },
        label = { Text(item.label) },
    )
}

@Composable
private fun RailDestinationItem(
    current: MainDestination,
    item: MainDestination,
    icon: ImageVector,
    onSelect: (MainDestination) -> Unit,
) {
    NavigationRailItem(
        selected = current == item,
        onClick = { onSelect(item) },
        icon = { Icon(icon, item.label) },
        label = { Text(item.label) },
    )
}

@Composable
private fun PlaceholderDestination(title: String, message: String, modifier: Modifier = Modifier) {
    com.montasim.routempo.core.designsystem.RoutempoEmptyState(
        title = title,
        message = message,
        modifier = modifier.fillMaxSize(),
    )
}

private fun openTrustedUrl(context: android.content.Context, url: String) {
    CustomTabsIntent.Builder().build().launchUrl(context, Uri.parse(url))
}

private fun greeting(zoneId: ZoneId = ZoneId.systemDefault()): String =
    when (LocalTime.now(zoneId).hour) {
        in 0..11 -> "Good morning"
        in 12..16 -> "Good afternoon"
        else -> "Good evening"
    }

private fun RoutineWrite.toPatch() =
    RoutinePatch(
        title = title,
        note = note,
        categoryId = categoryId,
        startDate = startDate,
        scheduledTime = scheduledTime,
        recurrenceType = recurrenceType,
        recurrenceRules = recurrenceRules,
        endDate = endDate,
        clearEndDate = endDate == null,
        isActive = isActive,
    )

private const val AUTH_REDIRECT_URI = "routempo://auth/callback"
private const val MAX_BACKUP_CHARS = 10 * 1024 * 1024
