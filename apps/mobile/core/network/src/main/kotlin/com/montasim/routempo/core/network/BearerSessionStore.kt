package com.montasim.routempo.core.network

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import com.montasim.routempo.core.model.BearerSession
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

interface BearerSessionStore {
    suspend fun read(): BearerSession?
    suspend fun write(session: BearerSession)
    suspend fun clear()
}

class InMemoryBearerSessionStore(initial: BearerSession? = null) : BearerSessionStore {
    private val lock = Mutex()
    private var value = initial

    override suspend fun read(): BearerSession? = lock.withLock { value }
    override suspend fun write(session: BearerSession) = lock.withLock { value = session }
    override suspend fun clear() = lock.withLock { value = null }
}

/**
 * Stores the bearer token, expiry, and bound account ID. AES/GCM key material is non-exportable
 * and lives in Android Keystore; SharedPreferences contains IV + ciphertext only.
 */
class AndroidKeystoreBearerSessionStore(
    context: Context,
    private val json: Json = Json { ignoreUnknownKeys = true },
    private val keyAlias: String = "routempo_bearer_session_v1",
    preferencesName: String = "routempo_secure_session",
) : BearerSessionStore {
    private val preferences = context.applicationContext.getSharedPreferences(preferencesName, Context.MODE_PRIVATE)
    private val lock = Mutex()

    override suspend fun read(): BearerSession? = lock.withLock {
        val encoded = preferences.getString(SESSION_BLOB, null) ?: return@withLock null
        runCatching {
            val bytes = Base64.decode(encoded, Base64.NO_WRAP)
            require(bytes.size > IV_BYTES)
            val iv = bytes.copyOfRange(0, IV_BYTES)
            val ciphertext = bytes.copyOfRange(IV_BYTES, bytes.size)
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(TAG_BITS, iv))
            val record = json.decodeFromString<StoredSession>(cipher.doFinal(ciphertext).decodeToString())
            BearerSession(record.token, record.expiresAt, record.accountId)
        }.getOrElse {
            preferences.edit().remove(SESSION_BLOB).commit()
            runCatching {
                KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }.deleteEntry(keyAlias)
            }
            null
        }
    }

    override suspend fun write(session: BearerSession) = lock.withLock {
        val plaintext =
            json.encodeToString(StoredSession(session.token, session.expiresAt, session.accountId)).encodeToByteArray()
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey())
        val encrypted = cipher.doFinal(plaintext)
        val blob = cipher.iv + encrypted
        check(preferences.edit().putString(SESSION_BLOB, Base64.encodeToString(blob, Base64.NO_WRAP)).commit()) {
            "Unable to persist bearer session"
        }
    }

    override suspend fun clear(): Unit = lock.withLock {
        preferences.edit().remove(SESSION_BLOB).commit()
    }

    private fun secretKey(): SecretKey {
        val keyStore = KeyStore.getInstance(ANDROID_KEY_STORE).apply { load(null) }
        (keyStore.getKey(keyAlias, null) as? SecretKey)?.let { return it }
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEY_STORE)
        generator.init(
            KeyGenParameterSpec.Builder(
                keyAlias,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build(),
        )
        return generator.generateKey()
    }

    @Serializable
    private data class StoredSession(
        val token: String,
        val expiresAt: String,
        val accountId: String? = null,
    )

    private companion object {
        const val SESSION_BLOB = "bearer_session"
        const val ANDROID_KEY_STORE = "AndroidKeyStore"
        const val TRANSFORMATION = "AES/GCM/NoPadding"
        const val IV_BYTES = 12
        const val TAG_BITS = 128
    }
}
