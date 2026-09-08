package com.montasim.routempo

import org.junit.Assert.assertEquals
import org.junit.Test

class ApplicationIdTest {
    @Test
    fun confirmedNamespaceIsStable() {
        assertEquals("com.montasim.routempo", BuildConfig.APPLICATION_ID.removeSuffix(".debug"))
    }
}
