package com.montasim.routempo.feature.today

import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.RoutineOccurrence
import java.time.DayOfWeek
import java.time.LocalDate
import java.util.Locale
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TodayLogicTest {
    @Test
    fun `week summary always runs Monday through Sunday`() {
        val result =
            buildTodayWeek(
                occurrences =
                    listOf(
                        occurrence("monday", "2026-09-07", OccurrenceStatus.COMPLETED),
                        occurrence("wednesday", "2026-09-09", OccurrenceStatus.PENDING),
                        occurrence("sunday", "2026-09-13", OccurrenceStatus.COMPLETED),
                        occurrence("outside", "2026-09-14", OccurrenceStatus.COMPLETED),
                    ),
                dateInWeek = LocalDate.parse("2026-09-10"),
            )

        assertEquals(7, result.size)
        assertEquals(DayOfWeek.MONDAY, result.first().date.dayOfWeek)
        assertEquals(DayOfWeek.SUNDAY, result.last().date.dayOfWeek)
        assertEquals(TodayWeekDaySummary(LocalDate.parse("2026-09-07"), 1, 1), result.first())
        assertEquals(TodayWeekDaySummary(LocalDate.parse("2026-09-09"), 0, 1), result[2])
        assertEquals(TodayWeekDaySummary(LocalDate.parse("2026-09-13"), 1, 1), result.last())
    }

    @Test
    fun `localized time respects locale and safely preserves invalid input`() {
        assertTrue(localizedTime("21:05", Locale.US).contains("9:05"))
        assertEquals("not-a-time", localizedTime("not-a-time", Locale.US))
    }

    @Test(expected = IllegalArgumentException::class)
    fun `daily summary rejects completed count above total`() {
        TodayWeekDaySummary(LocalDate.parse("2026-09-07"), completed = 2, total = 1)
    }

    private fun occurrence(
        id: String,
        date: String,
        status: OccurrenceStatus,
    ) = RoutineOccurrence(
        id = id,
        routineId = "routine-$id",
        title = id,
        category = "Personal",
        date = date,
        scheduledTime = "09:00",
        timezone = "Asia/Dhaka",
        status = status,
        resolvedAt = null,
        updatedAt = "2026-09-07T00:00:00Z",
    )
}
