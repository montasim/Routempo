package com.montasim.routempo.core.data

import com.montasim.routempo.core.model.Category
import com.montasim.routempo.core.model.CurrentUser
import com.montasim.routempo.core.model.Routine
import com.montasim.routempo.core.model.RoutineOccurrence

/**
 * A disposable, account-scoped offline read model. It deliberately excludes bearer sessions,
 * OAuth credentials, idempotency keys, and every other authentication secret.
 */
data class ProductSnapshot(
    val currentUser: CurrentUser,
    val routines: List<Routine>,
    val categories: List<Category>,
    val occurrences: List<RoutineOccurrence>,
    val cachedAtEpochMillis: Long,
) {
    init {
        require(cachedAtEpochMillis >= 0) { "Freshness timestamp must not be negative" }
    }

    fun ageMillis(nowEpochMillis: Long): Long =
        (nowEpochMillis - cachedAtEpochMillis).coerceAtLeast(0)

    fun isFresh(maxAgeMillis: Long, nowEpochMillis: Long): Boolean {
        require(maxAgeMillis >= 0) { "Maximum age must not be negative" }
        return ageMillis(nowEpochMillis) <= maxAgeMillis
    }

    internal fun detached(): ProductSnapshot = copy(
        routines = routines.toList(),
        categories = categories.toList(),
        occurrences = occurrences.toList(),
    )
}

interface ProductSnapshotCache {
    suspend fun read(accountId: String): ProductSnapshot?
    suspend fun write(accountId: String, snapshot: ProductSnapshot)
    suspend fun clear(accountId: String)
    suspend fun clearAll()
}

suspend fun ProductSnapshotCache.readFresh(
    accountId: String,
    maxAgeMillis: Long,
    nowEpochMillis: Long = System.currentTimeMillis(),
): ProductSnapshot? = read(accountId)?.takeIf { it.isFresh(maxAgeMillis, nowEpochMillis) }
