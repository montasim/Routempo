package com.montasim.routempo.core.data

import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.OccurrenceStatus
import com.montasim.routempo.core.model.RecurrenceRules
import com.montasim.routempo.core.model.RecurrenceType
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence
import com.montasim.routempo.core.model.User
import com.montasim.routempo.core.model.UserSettings
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class ProductSnapshotCacheTest {
    private val codec = ProductSnapshotCodec()

    @Test
    fun `codec round trips product data and ignores unknown fields`() {
        val snapshot = snapshot(accountId = "account-a", cachedAtEpochMillis = 1_000L)
        val payload = codec.encode("account-a", snapshot).replaceFirst(
            "\"schemaVersion\":1",
            "\"schemaVersion\":1,\"futureMetadata\":{\"format\":2}",
        )

        assertEquals(snapshot, codec.decode("account-a", payload))
    }

    @Test
    fun `codec treats malformed incompatible and unknown enum payloads as cache misses`() {
        val payload = codec.encode("account-a", snapshot("account-a"))

        assertNull(codec.decode("account-a", "{"))
        assertNull(codec.decode("account-a", payload.replaceFirst("\"schemaVersion\":1", "\"schemaVersion\":0")))
        assertNull(codec.decode("account-a", payload.replaceFirst("\"daily\"", "\"fortnightly\"")))
    }

    @Test
    fun `codec rejects cross account reads and writes`() {
        val accountASnapshot = snapshot("account-a")
        val payload = codec.encode("account-a", accountASnapshot)

        assertNull(codec.decode("account-b", payload))
        assertThrows(IllegalArgumentException::class.java) {
            codec.encode("account-b", accountASnapshot)
        }
    }

    @Test
    fun `memory cache isolates accounts and clears only the selected account`() = runBlocking {
        val cache = InMemoryProductSnapshotCache()
        val accountA = snapshot("account-a", 100L)
        val accountB = snapshot("account-b", 200L)

        cache.write("account-a", accountA)
        cache.write("account-b", accountB)

        assertEquals(accountA, cache.read("account-a"))
        assertEquals(accountB, cache.read("account-b"))

        cache.clear("account-a")
        assertNull(cache.read("account-a"))
        assertEquals(accountB, cache.read("account-b"))

        cache.clearAll()
        assertNull(cache.read("account-b"))
    }

    @Test
    fun `freshness is inclusive and future clock skew never creates negative age`() = runBlocking {
        val snapshot = snapshot("account-a", cachedAtEpochMillis = 1_000L)
        val cache = InMemoryProductSnapshotCache().also { it.write("account-a", snapshot) }

        assertEquals(0L, snapshot.ageMillis(nowEpochMillis = 900L))
        assertTrue(snapshot.isFresh(maxAgeMillis = 500L, nowEpochMillis = 1_500L))
        assertFalse(snapshot.isFresh(maxAgeMillis = 500L, nowEpochMillis = 1_501L))
        assertEquals(snapshot, cache.readFresh("account-a", maxAgeMillis = 500L, nowEpochMillis = 1_500L))
        assertNull(cache.readFresh("account-a", maxAgeMillis = 500L, nowEpochMillis = 1_501L))
    }

    private fun snapshot(
        accountId: String,
        cachedAtEpochMillis: Long = 10_000L,
    ) = ProductSnapshot(
        currentUser = CurrentUser(
            user = User(
                id = accountId,
                name = "User $accountId",
                email = "$accountId@example.com",
                image = null,
            ),
            settings = UserSettings(
                name = "User $accountId",
                timezone = "Asia/Dhaka",
                defaultReminderMinutes = 15,
                routineRemindersEnabled = true,
                weeklySummaryEnabled = false,
            ),
        ),
        routines = listOf(
            Routine(
                id = "routine-$accountId",
                title = "Morning reading",
                note = "Read one chapter",
                categoryId = "learning",
                categoryName = "Learning",
                startDate = "2026-08-10",
                scheduledTime = "09:30",
                recurrenceType = RecurrenceType.DAILY,
                recurrenceRules = RecurrenceRules(),
                endDate = null,
                isActive = true,
                createdAt = "2026-08-10T01:00:00Z",
                updatedAt = "2026-08-10T01:00:00Z",
            ),
        ),
        categories = listOf(
            Category(
                id = "learning",
                name = "Learning",
                routineCount = 1,
                createdAt = "2026-08-10T01:00:00Z",
            ),
        ),
        occurrences = listOf(
            RoutineOccurrence(
                id = "occurrence-$accountId",
                routineId = "routine-$accountId",
                title = "Morning reading",
                category = "Learning",
                date = "2026-09-02",
                scheduledTime = "09:30",
                timezone = "Asia/Dhaka",
                status = OccurrenceStatus.PENDING,
                resolvedAt = null,
                updatedAt = "2026-09-02T00:00:00Z",
            ),
        ),
        cachedAtEpochMillis = cachedAtEpochMillis,
    )
}
