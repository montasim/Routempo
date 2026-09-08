package com.montasim.routempo.feature.settings

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import com.montasim.routempo.core.designsystem.RoutempoThemeMode
import java.io.IOException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

interface ThemePreferenceRepository {
    val themeMode: Flow<RoutempoThemeMode>

    suspend fun setThemeMode(mode: RoutempoThemeMode)
}

class DataStoreThemePreferenceRepository(
    private val dataStore: DataStore<Preferences>,
) : ThemePreferenceRepository {
    override val themeMode: Flow<RoutempoThemeMode> =
        dataStore.data
            .catch { error ->
                if (error is IOException) emit(emptyPreferences()) else throw error
            }.map { preferences -> decodeThemeMode(preferences[ThemeModeKey]) }

    override suspend fun setThemeMode(mode: RoutempoThemeMode) {
        dataStore.edit { preferences -> preferences[ThemeModeKey] = encodeThemeMode(mode) }
    }

    private companion object {
        val ThemeModeKey = stringPreferencesKey("theme_mode")
    }
}

internal fun encodeThemeMode(mode: RoutempoThemeMode): String = mode.name.lowercase()

internal fun decodeThemeMode(value: String?): RoutempoThemeMode =
    when (value?.lowercase()) {
        "light" -> RoutempoThemeMode.Light
        "dark" -> RoutempoThemeMode.Dark
        else -> RoutempoThemeMode.System
    }
