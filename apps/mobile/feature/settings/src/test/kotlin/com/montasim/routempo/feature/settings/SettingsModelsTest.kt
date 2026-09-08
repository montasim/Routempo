package com.montasim.routempo.feature.settings

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.time.Instant

class SettingsModelsTest {
    @Test
    fun categoryValidation_normalizesWhitespaceAndColor() {
        val result =
            validateCategoryDraft(
                draft = CategoryDraft("  Deep   work ", "178449"),
                existingNames = emptyList(),
            )

        assertTrue(result.isValid)
        assertEquals("Deep work", result.normalizedName)
        assertEquals("#178449", result.normalizedColorHex)
    }

    @Test
    fun categoryValidation_rejectsDuplicateIgnoringCase() {
        val result =
            validateCategoryDraft(
                draft = CategoryDraft("wellbeing", "#178449"),
                existingNames = listOf("Wellbeing"),
            )

        assertFalse(result.isValid)
        assertEquals("A category with this name already exists.", result.nameError)
    }

    @Test
    fun categoryValidation_rejectsUnicodeCompatibilityDuplicate() {
        val result =
            validateCategoryDraft(
                draft = CategoryDraft("Ｗｅｌｌｂｅｉｎｇ", "#178449"),
                existingNames = listOf("Wellbeing"),
            )

        assertFalse(result.isValid)
        assertEquals("A category with this name already exists.", result.nameError)
    }

    @Test
    fun categoryValidation_allowsCurrentNameDuringEdit() {
        val result =
            validateCategoryDraft(
                draft = CategoryDraft("WELLBEING", "#178449"),
                existingNames = listOf("Wellbeing"),
                currentName = "Wellbeing",
            )

        assertTrue(result.isValid)
        assertNull(result.nameError)
    }

    @Test
    fun categoryValidation_rejectsInvalidColorAndLongName() {
        val result =
            validateCategoryDraft(
                draft = CategoryDraft("x".repeat(CATEGORY_NAME_MAX_LENGTH + 1), "green"),
                existingNames = emptyList(),
            )

        assertFalse(result.isValid)
        assertEquals("Use 60 characters or fewer.", result.nameError)
        assertEquals("Use a six-digit color such as #178449.", result.colorError)
    }

    @Test
    fun reminderLabels_coverScheduledHourAndMinuteOffsets() {
        assertEquals("At scheduled time", reminderOffsetLabel(0))
        assertEquals("15 minutes before", reminderOffsetLabel(15))
        assertEquals("1 hour before", reminderOffsetLabel(60))
    }

    @Test
    fun providerStatus_doesNotConfuseNetworkErrorWithUnconfigured() {
        val unconfigured =
            ProviderSettingsUi(SettingsProvider.Google, ProviderConnectionStatus.Unconfigured)
        val networkError =
            ProviderSettingsUi(
                SettingsProvider.Google,
                ProviderConnectionStatus.Error,
                detail = "Network unavailable",
            )

        assertEquals("Unavailable", providerStatusLabel(unconfigured))
        assertEquals("Network unavailable", providerStatusLabel(networkError))
    }

    @Test
    fun timezoneOption_keepsIanaIdAndUsesCurrentOffset() {
        val winter = timezoneOption("America/New_York", Instant.parse("2026-01-15T12:00:00Z"))
        val summer = timezoneOption("America/New_York", Instant.parse("2026-07-15T12:00:00Z"))

        assertEquals("America/New_York", winter?.id)
        assertEquals("New York · UTC-05:00", winter?.displayLabel)
        assertEquals("New York · UTC-04:00", summer?.displayLabel)
    }

    @Test
    fun timezoneOption_isReadableAndSearchesLabelOffsetAndIanaId() {
        val option = timezoneOption("America/Indiana/Indianapolis", Instant.parse("2026-07-15T12:00:00Z"))!!

        assertEquals("Indianapolis, Indiana", option.locationLabel)
        assertTrue(option.matches("Indianapolis"))
        assertTrue(option.matches("Indiana/Indianapolis"))
        assertTrue(option.matches("UTC-04"))
        assertFalse(option.matches("Dhaka"))
    }

    @Test
    fun timezoneOptions_deduplicatesAndSkipsInvalidIds() {
        val options =
            timezoneOptions(
                listOf("Asia/Dhaka", "Not/A_Zone", "Asia/Dhaka"),
                Instant.parse("2026-07-15T12:00:00Z"),
            )

        assertEquals(listOf("Asia/Dhaka"), options.map { it.id })
        assertEquals("Dhaka · UTC+06:00", options.single().displayLabel)
    }

    @Test
    fun accountInitials_usesNameThenEmailFallback() {
        assertEquals("MR", accountInitials("Montasim Rahman", "ignored@example.com"))
        assertEquals("RO", accountInitials("Routempo"))
        assertEquals("JD", accountInitials("", "jane.doe@example.com"))
        assertEquals("?", accountInitials("", ""))
    }
}
