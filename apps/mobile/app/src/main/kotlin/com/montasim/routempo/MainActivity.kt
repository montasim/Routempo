package com.montasim.routempo

import android.Manifest
import android.content.pm.PackageManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.core.app.NotificationManagerCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.montasim.routempo.core.designsystem.RoutempoTheme
import com.montasim.routempo.feature.settings.NotificationPermissionStatus
import java.net.URI

class MainActivity : ComponentActivity() {
    private var authCallback by mutableStateOf<Uri?>(null)
    private var notificationDestination by mutableStateOf<String?>(null)
    private var notificationPermission by mutableStateOf(NotificationPermissionStatus.NotRequested)
    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) {
            getSharedPreferences(NOTIFICATION_PERMISSION_PREFS, MODE_PRIVATE)
                .edit().putBoolean(NOTIFICATION_PERMISSION_REQUESTED, true).apply()
            notificationPermission = notificationPermissionStatus()
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        consumeLaunchIntent(intent)
        notificationPermission = notificationPermissionStatus()
        enableEdgeToEdge()
        setContent {
            val themeMode by (application as RoutempoApplication)
                .themePreferences.themeMode.collectAsStateWithLifecycle(
                    initialValue = com.montasim.routempo.core.designsystem.RoutempoThemeMode.System,
                )
            RoutempoTheme(mode = themeMode) {
                RoutempoApp(
                    authCallback = authCallback,
                    onAuthCallbackConsumed = ::clearAuthCallback,
                    notificationDestination = notificationDestination,
                    onNotificationDestinationConsumed = { notificationDestination = null },
                    notificationPermission = notificationPermission,
                    onRequestNotificationPermission = ::requestNotificationPermission,
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        consumeLaunchIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        notificationPermission = notificationPermissionStatus()
    }

    private fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (notificationPermission == NotificationPermissionStatus.Blocked) {
                startActivity(
                    Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                        .putExtra(Settings.EXTRA_APP_PACKAGE, packageName),
                )
            } else {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        } else {
            startActivity(
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                    .putExtra(Settings.EXTRA_APP_PACKAGE, packageName),
            )
        }
    }

    private fun notificationPermissionStatus(): NotificationPermissionStatus {
        val runtimeGranted =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
        if (runtimeGranted) {
            val manager = NotificationManagerCompat.from(this)
            val channelEnabled =
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    getSystemService(android.app.NotificationManager::class.java)
                        .getNotificationChannel(RoutempoNotificationScheduler.CHANNEL_ID)
                        ?.importance != android.app.NotificationManager.IMPORTANCE_NONE
                } else {
                    true
                }
            return if (manager.areNotificationsEnabled() && channelEnabled) {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                    NotificationPermissionStatus.NotRequired
                } else {
                    NotificationPermissionStatus.Granted
                }
            } else {
                NotificationPermissionStatus.Blocked
            }
        }
        val requested =
            getSharedPreferences(NOTIFICATION_PERMISSION_PREFS, MODE_PRIVATE)
                .getBoolean(NOTIFICATION_PERMISSION_REQUESTED, false)
        return when {
            !requested -> NotificationPermissionStatus.NotRequested
            shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS) -> NotificationPermissionStatus.Denied
            else -> NotificationPermissionStatus.Blocked
        }
    }

    private fun consumeLaunchIntent(launchIntent: Intent?) {
        val candidate = launchIntent?.data
        authCallback = candidate?.takeIf { isTrustedRoutempoCallback(it.toString()) }
        notificationDestination = launchIntent?.getStringExtra(NOTIFICATION_DESTINATION)
        if (candidate != null || notificationDestination != null) {
            setIntent(Intent(this, MainActivity::class.java))
        }
    }

    private fun clearAuthCallback() {
        authCallback = null
        if (intent?.data != null) setIntent(Intent(this, MainActivity::class.java))
    }
}

private const val NOTIFICATION_PERMISSION_PREFS = "routempo-notification-permission"
private const val NOTIFICATION_PERMISSION_REQUESTED = "requested"

internal fun isTrustedRoutempoCallback(raw: String): Boolean =
    runCatching {
        val uri = URI(raw)
        uri.scheme.equals("routempo", ignoreCase = true) &&
            uri.host.equals("auth", ignoreCase = true) &&
            uri.path == "/callback" &&
            uri.fragment == null
    }.getOrDefault(false)
