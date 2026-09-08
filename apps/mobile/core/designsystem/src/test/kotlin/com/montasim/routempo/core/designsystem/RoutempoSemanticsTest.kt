package com.montasim.routempo.core.designsystem

import org.junit.Assert.assertEquals
import org.junit.Test

class RoutempoSemanticsTest {
    @Test
    fun chartSummary_preservesOrderAndClampsPercentages() {
        val summary =
            buildChartSummary(
                label = "Completion by day",
                points =
                    listOf(
                        RoutempoChartPoint("Mon", -2),
                        RoutempoChartPoint("Tue", 72),
                        RoutempoChartPoint("Wed", 120),
                    ),
            )

        assertEquals(
            "Completion by day. Mon 0 percent, Tue 72 percent, Wed 100 percent",
            summary,
        )
    }

    @Test
    fun chartSummary_exposesNoData() {
        assertEquals("Completion by day. No data", buildChartSummary("Completion by day", emptyList()))
    }

    @Test
    fun occurrenceActions_areStateSpecific() {
        assertEquals(
            "Complete Morning walk",
            statusActionDescription(RoutempoOccurrenceStatus.Pending, "Morning walk"),
        )
        assertEquals(
            "Mark Morning walk as not done",
            statusActionDescription(RoutempoOccurrenceStatus.Completed, "Morning walk"),
        )
        assertEquals(
            "Mark Morning walk as not done",
            statusActionDescription(RoutempoOccurrenceStatus.Skipped, "Morning walk"),
        )
    }
}
