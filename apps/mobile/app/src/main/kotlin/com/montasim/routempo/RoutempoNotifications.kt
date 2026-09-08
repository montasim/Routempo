package com.montasim.routempo

import android.Manifest
import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.montasim.routempo.core.model.OccurrenceQuery
import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.PageQuery
import java.time.DayOfWeek
import java.time.Duration
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.temporal.TemporalAdjusters
import java.util.concurrent.TimeUnit

object RoutempoNotificationScheduler {
    const val CHANNEL_ID = "routine_reminders"
    private const val ROUTINE_WORK = "routempo-routine-reminders"
    private const val WEEKLY_WORK = "routempo-weekly-summary"

    fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel =
            NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_DEFAULT,
            ).apply {
                description = context.getString(R.string.notification_channel_description)
            }
        context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    fun reconcile(
        context: Context,
        routineEnabled: Boolean,
        weeklyEnabled: Boolean,
        timezone: String? = null,
    ) {
        ensureChannel(context)
        val workManager = WorkManager.getInstance(context)
        if (routineEnabled) {
            val request =
                PeriodicWorkRequestBuilder<RoutineReminderWorker>(15, TimeUnit.MINUTES)
                    .setInitialDelay(1, TimeUnit.MINUTES)
                    .build()
            workManager.enqueueUniquePeriodicWork(ROUTINE_WORK, ExistingPeriodicWorkPolicy.UPDATE, request)
        } else {
            workManager.cancelUniqueWork(ROUTINE_WORK)
        }

        if (weeklyEnabled) {
            val zone = timezone?.let { runCatching { ZoneId.of(it) }.getOrNull() } ?: ZoneId.systemDefault()
            val delay = nextWeeklySummaryDelay(ZonedDateTime.now(zone)).toMillis().coerceAtLeast(0)
            val request =
                PeriodicWorkRequestBuilder<WeeklySummaryWorker>(24, TimeUnit.HOURS)
                    .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                    .build()
            workManager.enqueueUniquePeriodicWork(WEEKLY_WORK, ExistingPeriodicWorkPolicy.UPDATE, request)
        } else {
            workManager.cancelUniqueWork(WEEKLY_WORK)
        }
    }

    fun cancelAll(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(ROUTINE_WORK)
        WorkManager.getInstance(context).cancelUniqueWork(WEEKLY_WORK)
        NotificationManagerCompat.from(context).cancelAll()
        context.getSharedPreferences(DELIVERED_STORE, Context.MODE_PRIVATE).edit().clear().apply()
    }
}

class RoutineReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        val application = applicationContext as RoutempoApplication
        return runCatching {
            val settings = application.api.settings()
            if (!settings.routineRemindersEnabled || !notificationsAllowed(applicationContext)) {
                return Result.success()
            }
            val zone = runCatching { ZoneId.of(settings.timezone) }.getOrDefault(ZoneId.systemDefault())
            val now = ZonedDateTime.now(zone)
            val accountId = application.sessionStore.read()?.accountId ?: return Result.success()
            val occurrences =
                application.api.occurrences(
                    OccurrenceQuery(
                        date = now.toLocalDate().toString(),
                        status = OccurrenceStatus.PENDING,
                        page = PageQuery(limit = 200),
                    ),
                ).items
            val delivered = applicationContext.getSharedPreferences(DELIVERED_STORE, Context.MODE_PRIVATE)
            occurrences.forEach { occurrence ->
                val scheduled =
                    LocalDate.parse(occurrence.date)
                        .atTime(LocalTime.parse(occurrence.scheduledTime))
                        .atZone(zone)
                        .minusMinutes(settings.defaultReminderMinutes.toLong())
                val deliveryKey = "$accountId:routine:${occurrence.id}:${occurrence.updatedAt}"
                if (isReminderDue(now, scheduled) && !delivered.getBoolean(deliveryKey, false)) {
                    showNotification(
                        context = applicationContext,
                        id = occurrence.id.hashCode(),
                        title = occurrence.title,
                        message = applicationContext.getString(
                            R.string.notification_routine_message,
                            occurrence.scheduledTime,
                        ),
                        destination = "today",
                    )
                    delivered.edit().putBoolean(deliveryKey, true).apply()
                }
            }
            Result.success()
        }.getOrElse { Result.retry() }
    }
}

class WeeklySummaryWorker(
    appContext: Context,
    workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        val application = applicationContext as RoutempoApplication
        return runCatching {
            val settings = application.api.settings()
            if (!settings.weeklySummaryEnabled || !notificationsAllowed(applicationContext)) {
                return Result.success()
            }
            val zone = runCatching { ZoneId.of(settings.timezone) }.getOrDefault(ZoneId.systemDefault())
            val today = LocalDate.now(zone)
            if (today.dayOfWeek != DayOfWeek.MONDAY) return Result.success()
            val accountId = application.sessionStore.read()?.accountId ?: return Result.success()
            val delivered = applicationContext.getSharedPreferences(DELIVERED_STORE, Context.MODE_PRIVATE)
            val deliveryKey = "$accountId:weekly:$today"
            if (delivered.getBoolean(deliveryKey, false)) return Result.success()
            val start = today.minusWeeks(1)
            val end = today.minusDays(1)
            val occurrences =
                application.api.occurrences(
                    OccurrenceQuery(
                        startDate = start.toString(),
                        endDate = end.toString(),
                        page = PageQuery(limit = 200),
                    ),
                ).items
            val completed = occurrences.count { it.status == OccurrenceStatus.COMPLETED }
            val resolved = occurrences.count { it.status != OccurrenceStatus.PENDING }
            showNotification(
                context = applicationContext,
                id = WEEKLY_NOTIFICATION_ID,
                title = applicationContext.getString(R.string.notification_weekly_title),
                message = applicationContext.getString(R.string.notification_weekly_message, completed, resolved),
                destination = "review",
            )
            delivered.edit().putBoolean(deliveryKey, true).apply()
            Result.success()
        }.getOrElse { Result.retry() }
    }
}

internal fun isReminderDue(now: ZonedDateTime, scheduled: ZonedDateTime): Boolean =
    !now.isBefore(scheduled) && now.isBefore(scheduled.plusMinutes(20))

internal fun nextWeeklySummaryDelay(now: ZonedDateTime): Duration {
    var next = now.with(TemporalAdjusters.nextOrSame(DayOfWeek.MONDAY)).withHour(9).withMinute(0).withSecond(0).withNano(0)
    if (!next.isAfter(now)) next = next.plusWeeks(1)
    return Duration.between(now, next)
}

private fun notificationsAllowed(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

@SuppressLint("MissingPermission")
private fun showNotification(context: Context, id: Int, title: String, message: String, destination: String) {
    if (!notificationsAllowed(context)) return
    val intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra(NOTIFICATION_DESTINATION, destination)
    }
    val pendingIntent =
        PendingIntent.getActivity(
            context,
            id,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
    val notification =
        NotificationCompat.Builder(context, RoutempoNotificationScheduler.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .build()
    runCatching { NotificationManagerCompat.from(context).notify(id, notification) }
}

private const val DELIVERED_STORE = "routempo-delivered-notifications"
private const val WEEKLY_NOTIFICATION_ID = 8_102
const val NOTIFICATION_DESTINATION = "notification_destination"
