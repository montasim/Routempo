package com.montasim.routempo

import android.app.Application
import android.content.Context
import androidx.datastore.preferences.preferencesDataStore
import com.montasim.routempo.core.data.SQLiteProductSnapshotCache
import com.montasim.routempo.core.network.AndroidKeystoreBearerSessionStore
import com.montasim.routempo.core.network.RoutempoApi
import com.montasim.routempo.core.network.RoutempoNetwork
import com.montasim.routempo.feature.settings.DataStoreThemePreferenceRepository

private val Context.routempoPreferences by preferencesDataStore(name = "routempo_preferences")

class RoutempoApplication : Application() {
    val sessionStore by lazy { AndroidKeystoreBearerSessionStore(this) }
    val snapshotCache by lazy { SQLiteProductSnapshotCache(this) }
    val themePreferences by lazy { DataStoreThemePreferenceRepository(routempoPreferences) }
    val api: RoutempoApi by lazy {
        RoutempoNetwork.create(
            baseUrl = BuildConfig.API_BASE_URL,
            sessionStore = sessionStore,
        )
    }

    override fun onCreate() {
        super.onCreate()
        RoutempoNotificationScheduler.ensureChannel(this)
    }
}
