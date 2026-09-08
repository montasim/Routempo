package com.montasim.routempo.core.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

class TransportValueTest {
    @Test
    fun `idempotency key can be retained for one logical mutation`() {
        val key = IdempotencyKey.create()
        assertEquals(key, key)
        assertEquals(36, key.value.length)
    }

    @Test
    fun `idempotency key rejects spaces and pagination rejects opaque cursor`() {
        assertThrows(IllegalArgumentException::class.java) { IdempotencyKey("contains spaces") }
        assertThrows(IllegalArgumentException::class.java) { PageQuery(cursor = "opaque-token") }
    }
}
