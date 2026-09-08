package com.montasim.routempo

import java.time.Duration
import java.time.ZoneId
import java.time.ZonedDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class RoutempoNotificationsTest {
    private val zone = ZoneId.of("Asia/Dhaka")

    @Test
    fun reminderWindowStartsAtScheduledTimeAndClosesAfterTwentyMinutes() {
        val scheduled = ZonedDateTime.of(2026, 9, 2, 10, 0, 0, 0, zone)
        assertFalse(isReminderDue(scheduled.minusSeconds(1), scheduled))
        assertTrue(isReminderDue(scheduled, scheduled))
        assertTrue(isReminderDue(scheduled.plusMinutes(19), scheduled))
        assertFalse(isReminderDue(scheduled.plusMinutes(20), scheduled))
    }

    @Test
    fun weeklySummaryTargetsNextMondayAtNine() {
        val sunday = ZonedDateTime.of(2026, 9, 6, 7, 30, 0, 0, zone)
        assertEquals(Duration.ofHours(25).plusMinutes(30), nextWeeklySummaryDelay(sunday))

        val mondayAfterEight = ZonedDateTime.of(2026, 9, 7, 9, 0, 0, 0, zone)
        assertEquals(Duration.ofDays(7), nextWeeklySummaryDelay(mondayAfterEight))
    }
}
