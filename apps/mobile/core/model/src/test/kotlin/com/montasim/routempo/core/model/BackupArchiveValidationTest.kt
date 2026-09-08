package com.montasim.routempo.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class BackupArchiveValidationTest {
    @Test
    fun `valid archive is restorable and surfaces provider sync reset`() {
        val result = archive().validateForRestore()

        assertTrue(result.canRestore)
        assertTrue(result.issues.isEmpty())
        assertEquals(setOf(BackupRestoreImplication.PROVIDER_SYNC_LINKS_RESET), result.implications)
    }

    @Test
    fun `format version and timestamps are validated`() {
        val result = archive().copy(
            format = "another-app",
            version = 2,
            exportedAt = "yesterday",
        ).validateForRestore()

        assertFalse(result.canRestore)
        assertIssue(result, BackupValidationCode.UNSUPPORTED_FORMAT, "format")
        assertIssue(result, BackupValidationCode.UNSUPPORTED_VERSION, "version")
        assertIssue(result, BackupValidationCode.INVALID_VALUE, "exportedAt")
    }

    @Test
    fun `duplicate IDs categories and broken occurrence references are rejected`() {
        val base = archive()
        val result = base.copy(
            data = base.data.copy(
                routines = listOf(base.data.routines.single(), base.data.routines.single()),
                categories = listOf(" Health ", "health"),
                logs = listOf(base.data.logs.single(), base.data.logs.single()),
                occurrences = listOf(base.data.occurrences.single().copy(routineId = "missing")),
            ),
        ).validateForRestore()

        assertIssue(result, BackupValidationCode.DUPLICATE_ID, "data.routines[1].id")
        assertIssue(result, BackupValidationCode.DUPLICATE_ID, "data.logs[1].id")
        assertIssue(result, BackupValidationCode.DUPLICATE_CATEGORY, "data.categories[1]")
        assertIssue(result, BackupValidationCode.MISSING_REFERENCE, "data.occurrences[0].routineId")
    }

    @Test
    fun `field limits dates times zones statuses and recurrence are validated`() {
        val base = archive()
        val badRoutine = base.data.routines.single().copy(
            time = "25:00",
            title = "x".repeat(121),
            startDate = "2026-02-30",
            repeat = "yearly",
            repeatOnDate = 31,
            repeatOnMonth = 4,
            endDate = "not-a-date",
            status = "missed",
        )
        val badLog = base.data.logs.single().copy(
            recordedAt = "2026-09-08T10:15:00",
            timezone = "Mars/Olympus",
            status = "pending",
        )
        val result = base.copy(
            data = base.data.copy(
                settings = base.data.settings.copy(name = "", reminder = "12", timezone = "Invalid/Zone"),
                routines = listOf(badRoutine),
                logs = listOf(badLog),
                occurrences = listOf(base.data.occurrences.single().copy(status = "pending")),
            ),
        ).validateForRestore()

        listOf(
            "data.settings.name",
            "data.settings.reminder",
            "data.settings.timezone",
            "data.routines[0].time",
            "data.routines[0].title",
            "data.routines[0].startDate",
            "data.routines[0].endDate",
            "data.routines[0].status",
            "data.routines[0].repeatOnDate",
            "data.logs[0].recordedAt",
            "data.logs[0].timezone",
            "data.logs[0].status",
            "data.occurrences[0].status",
        ).forEach { path -> assertTrue("Missing issue for $path", result.issues.any { it.path == path }) }
    }

    @Test
    fun `collection caps and recurrence requirements are enforced`() {
        val base = archive()
        val result = base.copy(
            data = base.data.copy(
                categories = List(501) { "category-$it" },
                routines = listOf(
                    base.data.routines.single().copy(
                        repeat = "weekly",
                        repeatOnDay = null,
                        repeatOnDays = emptyList(),
                    ),
                ),
            ),
        ).validateForRestore()

        assertIssue(result, BackupValidationCode.TOO_MANY_ITEMS, "data.categories")
        assertIssue(result, BackupValidationCode.INVALID_RECURRENCE, "data.routines[0].repeatOnDays")
    }

    private fun assertIssue(result: BackupPreflightResult, code: BackupValidationCode, path: String) {
        assertTrue("Missing $code at $path", result.issues.any { it.code == code && it.path == path })
    }

    private fun archive() = BackupArchive(
        format = ROUTEMPO_BACKUP_FORMAT,
        version = ROUTEMPO_BACKUP_VERSION,
        exportedAt = "2026-09-08T06:15:00Z",
        data = BackupData(
            routines = listOf(
                BackupRoutine(
                    id = "routine-1",
                    time = "7:30 AM",
                    title = "Morning walk",
                    note = "",
                    category = "Health",
                    startDate = "2026-09-01",
                    repeat = "daily",
                    status = "pending",
                    enabled = true,
                ),
            ),
            categories = listOf("Health"),
            settings = BackupSettings(
                name = "Test user",
                timezone = "Asia/Dhaka",
                reminder = "10",
                notifications = true,
                weeklySummary = true,
            ),
            logs = listOf(
                BackupLog(
                    id = "log-1",
                    date = "2026-09-07",
                    eventTime = "7:42 AM",
                    title = "Morning walk",
                    category = "Health",
                    scheduled = "7:30 AM",
                    actual = "Just now",
                    variance = "+12 min",
                    status = "completed",
                    recordedAt = "2026-09-07T01:42:00Z",
                    actor = "Test user",
                    source = "Routempo",
                    timezone = "Asia/Dhaka",
                    snapshot = "",
                ),
            ),
            occurrences = listOf(
                BackupOccurrence(
                    routineId = "routine-1",
                    date = "2026-09-07",
                    status = "completed",
                    resolvedAt = "2026-09-07T01:42:00Z",
                    updatedAt = "2026-09-07T01:42:00Z",
                ),
            ),
        ),
    )
}
