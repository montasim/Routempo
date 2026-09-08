package com.montasim.routempo.core.network

import com.montasim.routempo.core.model.Analytics
import com.montasim.routempo.core.model.AnalyticsQuery
import com.montasim.routempo.core.model.ApiPage
import com.montasim.routempo.core.model.AuthResult
import com.montasim.routempo.core.model.BackupArchive
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CsvExport
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.IdempotencyKey
import com.montasim.routempo.core.model.IntegrationAction
import com.montasim.routempo.core.model.IntegrationConnect
import com.montasim.routempo.core.model.IntegrationProvider
import com.montasim.routempo.core.model.IntegrationResource
import com.montasim.routempo.core.model.IntegrationStatuses
import com.montasim.routempo.core.model.IntegrationSyncResult
import com.montasim.routempo.core.model.LogPatch
import com.montasim.routempo.core.model.LogQuery
import com.montasim.routempo.core.model.LogWrite
import com.montasim.routempo.core.model.OccurrenceGeneration
import com.montasim.routempo.core.model.OccurrenceQuery
import com.montasim.routempo.core.model.OccurrenceResolution
import com.montasim.routempo.core.model.PageQuery
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.RoutinePatch
import com.montasim.routempo.core.model.RoutineQuery
import com.montasim.routempo.core.model.RoutineWrite
import com.montasim.routempo.core.model.SettingsPatch
import com.montasim.routempo.core.model.UserSettings

interface RoutempoApi {
    fun socialSignInUrl(provider: IntegrationProvider, redirectUri: String): String
    suspend fun signInWithGoogle(idToken: String, nonce: String? = null): AuthResult
    suspend fun exchangeSocialCode(code: String, redirectUri: String): AuthResult
    suspend fun currentUser(): CurrentUser
    suspend fun logout(idempotencyKey: IdempotencyKey): Boolean

    suspend fun settings(): UserSettings
    suspend fun updateSettings(patch: SettingsPatch, idempotencyKey: IdempotencyKey): UserSettings

    suspend fun categories(page: PageQuery = PageQuery()): ApiPage<Category>
    suspend fun createCategory(name: String, idempotencyKey: IdempotencyKey): Category
    suspend fun renameCategory(id: String, name: String, idempotencyKey: IdempotencyKey): Category
    suspend fun deleteCategory(id: String, idempotencyKey: IdempotencyKey): Category

    suspend fun routines(query: RoutineQuery = RoutineQuery()): ApiPage<Routine>
    suspend fun createRoutine(routine: RoutineWrite, idempotencyKey: IdempotencyKey): Routine
    suspend fun updateRoutine(id: String, patch: RoutinePatch, idempotencyKey: IdempotencyKey): Routine
    suspend fun deleteRoutine(id: String, idempotencyKey: IdempotencyKey): Routine

    suspend fun occurrences(query: OccurrenceQuery = OccurrenceQuery()): ApiPage<RoutineOccurrence>
    suspend fun generateOccurrences(idempotencyKey: IdempotencyKey): OccurrenceGeneration
    suspend fun completeOccurrence(id: String, resolution: OccurrenceResolution, idempotencyKey: IdempotencyKey): RoutineOccurrence
    suspend fun skipOccurrence(id: String, resolution: OccurrenceResolution, idempotencyKey: IdempotencyKey): RoutineOccurrence
    suspend fun revertOccurrence(id: String, idempotencyKey: IdempotencyKey): RoutineOccurrence

    suspend fun logs(query: LogQuery = LogQuery()): ApiPage<BehaviorLog>
    suspend fun createLog(log: LogWrite, idempotencyKey: IdempotencyKey): BehaviorLog
    suspend fun updateLog(id: String, patch: LogPatch, idempotencyKey: IdempotencyKey): BehaviorLog
    suspend fun deleteLog(id: String, idempotencyKey: IdempotencyKey): BehaviorLog

    suspend fun analytics(query: AnalyticsQuery = AnalyticsQuery()): Analytics
    suspend fun backup(): BackupArchive
    fun encodeBackup(archive: BackupArchive): String
    fun decodeBackup(content: String): BackupArchive
    suspend fun restoreBackup(archive: BackupArchive, idempotencyKey: IdempotencyKey)
    suspend fun exportLogs(startDate: String? = null, endDate: String? = null): CsvExport

    suspend fun integrationStatuses(): IntegrationStatuses
    suspend fun syncIntegration(
        action: IntegrationAction,
        provider: IntegrationProvider,
        resource: IntegrationResource,
        idempotencyKey: IdempotencyKey,
    ): IntegrationSyncResult
    suspend fun createIntegrationConnect(
        provider: IntegrationProvider,
        redirectUri: String,
        idempotencyKey: IdempotencyKey,
    ): IntegrationConnect
    suspend fun disconnectIntegration(provider: IntegrationProvider, idempotencyKey: IdempotencyKey): Boolean
}
