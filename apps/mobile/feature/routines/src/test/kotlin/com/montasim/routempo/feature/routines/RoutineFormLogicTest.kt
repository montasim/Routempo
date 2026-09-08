package com.montasim.routempo.feature.routines

import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.RecurrenceRules
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import java.time.LocalDate
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class RoutineFormLogicTest {
    @Test
    fun newRoutine_rejectsDateBeforeSuppliedSavedZoneToday() {
        val validation =
            validateRoutineDraft(
                validDraft(startDate = "2026-03-09"),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )

        assertEquals(
            "New routines cannot start before 2026-03-10.",
            validation[RoutineFormField.START_DATE],
        )
    }

    @Test
    fun edit_allowsUnchangedLegacyPastStartButNotAnotherPastDate() {
        val existing = routine(startDate = "2025-01-01")

        assertNull(
            validateRoutineDraft(
                validDraft(startDate = "2025-01-01"),
                savedZoneToday = LocalDate.of(2026, 3, 10),
                existingRoutine = existing,
            )[RoutineFormField.START_DATE],
        )
        assertTrue(
            validateRoutineDraft(
                validDraft(startDate = "2025-01-02"),
                savedZoneToday = LocalDate.of(2026, 3, 10),
                existingRoutine = existing,
            )[RoutineFormField.START_DATE] != null,
        )
    }

    @Test
    fun yearlyValidation_allowsLeapDayAndRejectsDatesThatNeverExist() {
        val leapDay =
            validateRoutineDraft(
                validDraft(
                    recurrenceType = RecurrenceType.YEARLY,
                    dayOfMonth = "29",
                    month = "2",
                ),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )
        val februaryThirty =
            validateRoutineDraft(
                validDraft(
                    recurrenceType = RecurrenceType.YEARLY,
                    dayOfMonth = "30",
                    month = "2",
                ),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )
        val aprilThirtyOne =
            validateRoutineDraft(
                validDraft(
                    recurrenceType = RecurrenceType.YEARLY,
                    dayOfMonth = "31",
                    month = "4",
                ),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )

        assertNull(leapDay[RoutineFormField.DAY_OF_MONTH])
        assertEquals("That month never has day 30.", februaryThirty[RoutineFormField.DAY_OF_MONTH])
        assertEquals("That month never has day 31.", aprilThirtyOne[RoutineFormField.DAY_OF_MONTH])
    }

    @Test
    fun monthlyValidation_keepsDaysAbsentFromShorterMonths() {
        val validation =
            validateRoutineDraft(
                validDraft(recurrenceType = RecurrenceType.MONTHLY, dayOfMonth = "31"),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )

        assertNull(validation[RoutineFormField.DAY_OF_MONTH])
    }

    @Test
    fun recurrenceSeed_followsStartDateWhileStillDerived() {
        val previous = LocalDate.of(2026, 2, 28)
        val next = LocalDate.of(2026, 3, 2)

        assertEquals(
            setOf(1),
            reconcileRecurrenceSeed(
                previous,
                next,
                RecurrenceType.WEEKLY,
                defaultRecurrenceSeed(previous),
            ).weeklyDays,
        )
        assertEquals(
            2,
            reconcileRecurrenceSeed(
                previous,
                next,
                RecurrenceType.MONTHLY,
                defaultRecurrenceSeed(previous),
            ).dayOfMonth,
        )
        val yearly =
            reconcileRecurrenceSeed(
                previous,
                next,
                RecurrenceType.YEARLY,
                defaultRecurrenceSeed(previous),
            )
        assertEquals(2, yearly.dayOfMonth)
        assertEquals(3, yearly.month)
    }

    @Test
    fun recurrenceSeed_preservesExplicitCustomRule() {
        val custom = RecurrenceSeed(weeklyDays = setOf(1, 3), dayOfMonth = 15, month = 7)

        assertEquals(
            custom,
            reconcileRecurrenceSeed(
                LocalDate.of(2026, 2, 28),
                LocalDate.of(2026, 3, 2),
                RecurrenceType.YEARLY,
                custom,
            ),
        )
    }

    @Test
    fun categoryValidation_normalizesNfkcWhitespaceAndUnicodeCaseFold() {
        val existing = category("1", "Strasse")
        val result = validateCategoryName("  Ｓｔｒａßｅ\u00a0  ", listOf(existing))

        assertEquals("Straße", result.normalizedName)
        assertEquals(existing, result.duplicate)
        assertFalse(result.isValid)
    }

    @Test
    fun categorySearch_usesSameCanonicalizationAsDuplicates() {
        assertTrue(categoryMatchesSearch("Morning Focus", "  ＦＯＣＵＳ "))
        assertFalse(categoryMatchesSearch("Morning Focus", "evening"))
    }

    @Test
    fun onceWrite_stripsEndDateAndRecurrenceOnlyFields() {
        val write =
            validDraft(
                recurrenceType = RecurrenceType.NONE,
                dayOfMonth = "31",
                month = "12",
                endDate = "2027-01-01",
            ).toRoutineWrite()

        assertNull(write.endDate)
        assertEquals(RecurrenceRules(), write.recurrenceRules)
    }

    @Test
    fun serverPaths_mapToStructuredFormFields() {
        assertEquals(
            RoutineFormField.DAY_OF_MONTH,
            routineFormFieldForServerPath("recurrenceRules.dayOfMonth"),
        )
        assertEquals(
            RoutineFormField.START_DATE,
            routineFormFieldForServerPath("body.start_date"),
        )
        assertNull(routineFormFieldForServerPath("unknown"))
    }

    @Test
    fun apiTime_requiresZeroPaddedHoursAndMinutes() {
        val validation =
            validateRoutineDraft(
                validDraft(scheduledTime = "8:00"),
                savedZoneToday = LocalDate.of(2026, 3, 10),
            )

        assertTrue(validation[RoutineFormField.SCHEDULED_TIME] != null)
    }

    private fun validDraft(
        startDate: String = "2026-03-10",
        scheduledTime: String = "08:00",
        recurrenceType: RecurrenceType = RecurrenceType.DAILY,
        dayOfMonth: String = "10",
        month: String = "3",
        endDate: String = "",
    ) =
        RoutineFormDraft(
            title = "Read",
            startDate = startDate,
            scheduledTime = scheduledTime,
            categoryId = "category-1",
            note = "",
            recurrenceType = recurrenceType,
            weeklyDays = setOf(2),
            dayOfMonth = dayOfMonth,
            month = month,
            endDate = endDate,
        )

    private fun category(id: String, name: String) =
        Category(id = id, name = name, routineCount = 0, createdAt = "2026-01-01T00:00:00Z")

    private fun routine(startDate: String) =
        Routine(
            id = "routine-1",
            title = "Read",
            note = "",
            categoryId = "category-1",
            categoryName = "Focus",
            startDate = startDate,
            scheduledTime = "08:00",
            recurrenceType = RecurrenceType.DAILY,
            recurrenceRules = RecurrenceRules(),
            endDate = null,
            isActive = true,
            createdAt = "2025-01-01T00:00:00Z",
            updatedAt = "2025-01-01T00:00:00Z",
        )
}
