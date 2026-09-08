package com.montasim.routempo.feature.settings

import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.montasim.routempo.core.designsystem.RoutempoThemeMode
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class ThemePreferenceRepositoryTest {
    @get:Rule val temporaryFolder = TemporaryFolder()

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    @After
    fun tearDown() {
        scope.cancel()
    }

    @Test
    fun repository_defaultsToSystemAndPersistsChanges() =
        runBlocking {
            val file = File(temporaryFolder.root, "theme.preferences_pb")
            val dataStore =
                PreferenceDataStoreFactory.create(scope = scope, produceFile = { file })
            val repository = DataStoreThemePreferenceRepository(dataStore)

            assertEquals(RoutempoThemeMode.System, repository.themeMode.first())
            repository.setThemeMode(RoutempoThemeMode.Dark)
            assertEquals(RoutempoThemeMode.Dark, repository.themeMode.first())
        }

    @Test
    fun decodingUnknownOrMissingValueFallsBackToSystem() {
        assertEquals(RoutempoThemeMode.System, decodeThemeMode(null))
        assertEquals(RoutempoThemeMode.System, decodeThemeMode("future-mode"))
        assertEquals(RoutempoThemeMode.Light, decodeThemeMode("LIGHT"))
    }
}
