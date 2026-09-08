package com.montasim.routempo.core.data

import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class InMemoryProductSnapshotCache : ProductSnapshotCache {
    private val lock = Mutex()
    private val snapshots = mutableMapOf<String, ProductSnapshot>()

    override suspend fun read(accountId: String): ProductSnapshot? = lock.withLock {
        requireAccountId(accountId)
        snapshots[accountId]?.detached()
    }

    override suspend fun write(accountId: String, snapshot: ProductSnapshot) = lock.withLock {
        requireAccountId(accountId)
        require(snapshot.currentUser.user.id == accountId) { "Snapshot user does not match its cache account" }
        snapshots[accountId] = snapshot.detached()
    }

    override suspend fun clear(accountId: String) = lock.withLock {
        requireAccountId(accountId)
        snapshots.remove(accountId)
        Unit
    }

    override suspend fun clearAll() = lock.withLock {
        snapshots.clear()
    }

    private fun requireAccountId(accountId: String) {
        require(accountId.isNotBlank()) { "Account ID is required" }
    }
}
