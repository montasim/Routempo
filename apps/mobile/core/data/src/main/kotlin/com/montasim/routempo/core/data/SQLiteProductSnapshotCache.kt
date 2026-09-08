package com.montasim.routempo.core.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import java.io.Closeable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SQLiteProductSnapshotCache(
    context: Context,
    private val codec: ProductSnapshotCodec = ProductSnapshotCodec(),
    databaseName: String = DATABASE_NAME,
) : SQLiteOpenHelper(context.applicationContext, databaseName, null, DATABASE_VERSION),
    ProductSnapshotCache,
    Closeable {

    override fun onCreate(database: SQLiteDatabase) {
        database.execSQL(
            """
            CREATE TABLE $TABLE_SNAPSHOTS (
                $COLUMN_ACCOUNT_ID TEXT PRIMARY KEY NOT NULL,
                $COLUMN_PAYLOAD TEXT NOT NULL,
                $COLUMN_CACHED_AT INTEGER NOT NULL
            )
            """.trimIndent(),
        )
    }

    override fun onUpgrade(database: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        recreate(database)
    }

    override fun onDowngrade(database: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        recreate(database)
    }

    override suspend fun read(accountId: String): ProductSnapshot? = withContext(Dispatchers.IO) {
        requireAccountId(accountId)
        readableDatabase.query(
            TABLE_SNAPSHOTS,
            arrayOf(COLUMN_PAYLOAD, COLUMN_CACHED_AT),
            "$COLUMN_ACCOUNT_ID = ?",
            arrayOf(accountId),
            null,
            null,
            null,
            "1",
        ).use { cursor ->
            if (!cursor.moveToFirst()) return@withContext null
            val payload = cursor.getString(cursor.getColumnIndexOrThrow(COLUMN_PAYLOAD))
            val cachedAt = cursor.getLong(cursor.getColumnIndexOrThrow(COLUMN_CACHED_AT))
            val snapshot = codec.decode(accountId, payload)
            if (snapshot == null || snapshot.cachedAtEpochMillis != cachedAt) {
                deleteAccount(accountId)
                null
            } else {
                snapshot
            }
        }
    }

    override suspend fun write(accountId: String, snapshot: ProductSnapshot) = withContext(Dispatchers.IO) {
        requireAccountId(accountId)
        val payload = codec.encode(accountId, snapshot)
        val values = ContentValues().apply {
            put(COLUMN_ACCOUNT_ID, accountId)
            put(COLUMN_PAYLOAD, payload)
            put(COLUMN_CACHED_AT, snapshot.cachedAtEpochMillis)
        }
        check(writableDatabase.insertWithOnConflict(TABLE_SNAPSHOTS, null, values, SQLiteDatabase.CONFLICT_REPLACE) != -1L) {
            "Unable to persist product snapshot"
        }
    }

    override suspend fun clear(accountId: String) = withContext(Dispatchers.IO) {
        requireAccountId(accountId)
        deleteAccount(accountId)
        Unit
    }

    override suspend fun clearAll() = withContext(Dispatchers.IO) {
        writableDatabase.delete(TABLE_SNAPSHOTS, null, null)
        Unit
    }

    private fun recreate(database: SQLiteDatabase) {
        database.execSQL("DROP TABLE IF EXISTS $TABLE_SNAPSHOTS")
        onCreate(database)
    }

    private fun deleteAccount(accountId: String) {
        writableDatabase.delete(TABLE_SNAPSHOTS, "$COLUMN_ACCOUNT_ID = ?", arrayOf(accountId))
    }

    private fun requireAccountId(accountId: String) {
        require(accountId.isNotBlank()) { "Account ID is required" }
    }

    private companion object {
        const val DATABASE_NAME = "routempo_product_cache.db"
        const val DATABASE_VERSION = 1
        const val TABLE_SNAPSHOTS = "product_snapshots"
        const val COLUMN_ACCOUNT_ID = "account_id"
        const val COLUMN_PAYLOAD = "payload"
        const val COLUMN_CACHED_AT = "cached_at"
    }
}
