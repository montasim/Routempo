package com.montasim.routempo.feature.review

import com.montasim.routempo.core.model.Analytics
import com.montasim.routempo.core.model.BehaviorLog
import com.montasim.routempo.core.model.CategoryAnalytics
import com.montasim.routempo.core.model.LogStatus
import com.montasim.routempo.core.model.OutcomeSummary
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.math.roundToInt

class ReviewLogicTest {
    private val completed = log("completed", "routine-a", "2026-08-10", "Learning", LogStatus.COMPLETED)
    private val skipped = log("skipped", "routine-b", "2026-08-11", "Personal", LogStatus.SKIPPED)
    private val missed = log("missed", "routine-a", "2026-08-12", "Learning", LogStatus.MISSED)

    @Test
    fun `filters combine inclusive dates routine category and every status`() {
        val values = listOf(completed, skipped, missed)

        assertEquals(listOf(completed), filterLogs(values, LogFilters(status = LogStatus.COMPLETED)))
        assertEquals(listOf(skipped), filterLogs(values, LogFilters(status = LogStatus.SKIPPED)))
        assertEquals(listOf(missed), filterLogs(values, LogFilters(status = LogStatus.MISSED)))
        assertEquals(
            listOf(completed, missed),
            filterLogs(
                values,
                LogFilters(
                    startDate = "2026-08-10",
                    endDate = "2026-08-12",
                    routineId = "routine-a",
                    category = "learning",
                ),
            ),
        )
    }

    @Test
    fun `outcome summary uses rounded completion percent and zero-safe empty state`() {
        val summary = summarizeLogs(listOf(completed, completed.copy(id = "completed-2"), skipped))

        assertEquals(2, summary.completed)
        assertEquals(1, summary.skipped)
        assertEquals(0, summary.missed)
        assertEquals(3, summary.total)
        assertEquals(67, summary.completionPercentage)
        assertEquals(0, summarizeLogs(emptyList()).completionPercentage)
        assertEquals(
            LogOutcomeCounts(all = 3, completed = 2, skipped = 1, missed = 0),
            countLogOutcomes(listOf(completed, completed.copy(id = "completed-2"), skipped)),
        )
    }

    @Test
    fun `log filters validate ISO dates and reject reversed ranges before querying`() {
        val malformed = LogFilters(startDate = "2026-8-1", endDate = "tomorrow")
        val reversed = LogFilters(startDate = "2026-08-12", endDate = "2026-08-10")

        assertEquals(
            setOf(LogFilterField.START_DATE, LogFilterField.END_DATE),
            validateLogFilters(malformed).errors.keys,
        )
        assertEquals(
            "End date must be on or after start date",
            validateLogFilters(reversed)[LogFilterField.END_DATE],
        )
        assertNull(malformed.toQueryOrNull())
        assertNull(reversed.toQueryOrNull())
        assertEquals(
            "2026-08-10",
            LogFilters(startDate = "2026-08-10", endDate = "2026-08-12").toQueryOrNull()?.startDate,
        )
    }

    @Test
    fun `surface state keeps initial loading failure empty content and stale distinct`() {
        assertEquals(ReviewSurfaceState.LOADING, InsightsUiState().surfaceState())
        assertEquals(
            ReviewSurfaceState.FAILURE,
            InsightsUiState(hasLoaded = true, errorMessage = "offline").surfaceState(),
        )
        assertEquals(
            ReviewSurfaceState.EMPTY,
            InsightsUiState(hasLoaded = true, analytics = analytics(total = 0)).surfaceState(),
        )
        assertEquals(
            ReviewSurfaceState.CONTENT,
            InsightsUiState(hasLoaded = true, analytics = analytics(total = 2)).surfaceState(),
        )
        assertEquals(
            ReviewSurfaceState.EMPTY,
            InsightsUiState(isStale = true, errorMessage = "offline").surfaceState(),
        )

        assertEquals(ReviewSurfaceState.LOADING, LogsUiState().surfaceState())
        assertEquals(
            ReviewSurfaceState.FAILURE,
            LogsUiState(hasLoaded = true, errorMessage = "offline").surfaceState(),
        )
        assertEquals(ReviewSurfaceState.EMPTY, LogsUiState(hasLoaded = true).surfaceState())
        assertEquals(ReviewSurfaceState.EMPTY, LogsUiState(hasLoaded = true, isLoading = true).surfaceState())
        assertEquals(ReviewSurfaceState.CONTENT, LogsUiState(logs = listOf(completed)).surfaceState())
        assertEquals(
            ReviewSurfaceState.EMPTY,
            LogsUiState(isStale = true, errorMessage = "offline").surfaceState(),
        )
    }

    @Test
    fun `categories sort deterministically by total then normalized name`() {
        val categories = listOf(
            category("zebra", total = 2),
            category("Learning", total = 4),
            category("alpha", total = 2),
            category("Alpha", total = 2),
        )

        assertEquals(
            listOf("Learning", "Alpha", "alpha", "zebra"),
            sortedCategoryAnalytics(categories).map(CategoryAnalytics::category),
        )
        assertEquals(
            listOf("Alpha", "learning", "Zebra"),
            sortedCategoryLabels(listOf(" Zebra ", "learning", "Alpha", "alpha", "")),
        )
    }

    @Test
    fun `valid draft converts to trimmed API input with optional actual time`() {
        val draft = LogDraft(
            date = "2026-08-12",
            eventTime = "09:45",
            title = "  Read  ",
            category = " Learning ",
            scheduledTime = "09:30",
            actualTime = "",
            status = LogStatus.COMPLETED,
            note = "  Chapter one  ",
        )

        val validation = validateLogDraft(draft)
        val write = draft.toLogWriteOrNull()

        assertTrue(validation.isValid)
        assertNotNull(write)
        assertEquals("Read", write?.title)
        assertEquals("Learning", write?.category)
        assertEquals("Chapter one", write?.note)
        assertNull(write?.actualTime)
        assertTrue(draft.toLogPatchOrNull()?.clearActualTime == true)
    }

    @Test
    fun `invalid draft reports every actionable field`() {
        val draft = LogDraft(
            date = "12 August",
            eventTime = "9:45",
            title = " ",
            category = " ",
            scheduledTime = "25:00",
            actualTime = "later",
            note = "x".repeat(241),
        )

        val validation = validateLogDraft(draft)

        assertFalse(validation.isValid)
        assertEquals(LogField.entries.toSet(), validation.errors.keys)
        assertNull(draft.toLogWriteOrNull())
    }

    @Test
    fun `insight ranges expose exactly the supported server values`() {
        assertEquals(listOf(7, 30, 90), InsightsRange.entries.map { it.days })
        assertEquals(90, InsightsRange.NINETY.toQuery().range)
        assertEquals("2", LogFilters(status = LogStatus.MISSED).toQuery(cursor = "2").page.cursor)
    }

    private fun log(
        id: String,
        routineId: String?,
        date: String,
        category: String,
        status: LogStatus,
    ) = BehaviorLog(
        id = id,
        routineId = routineId,
        date = date,
        eventTime = "09:45",
        title = "Read",
        category = category,
        scheduledTime = "09:30",
        actualTime = if (status == LogStatus.COMPLETED) "09:45" else null,
        variance = "15 minutes late",
        status = status,
        recordedAt = "2026-08-12T03:45:00.000Z",
        actor = "Test user",
        source = "Routempo Android",
        timezone = "Asia/Dhaka",
        note = "",
    )

    private fun analytics(total: Int) = Analytics(
        startDate = "2026-08-06",
        endDate = "2026-08-12",
        completionPercentage = if (total == 0) 0 else 50,
        outcomes = summary(total),
        series = emptyList(),
        categories = emptyList(),
        generatedAt = "2026-08-12T03:45:00.000Z",
    )

    private fun category(name: String, total: Int) = CategoryAnalytics(
        category = name,
        routineCount = 1,
        outcomes = summary(total),
    )

    private fun summary(total: Int) = OutcomeSummary(
        completed = if (total == 0) 0 else 1,
        skipped = (total - 1).coerceAtLeast(0),
        missed = 0,
        total = total,
        completionPercentage = if (total == 0) 0 else (100.0 / total).roundToInt(),
    )
}
