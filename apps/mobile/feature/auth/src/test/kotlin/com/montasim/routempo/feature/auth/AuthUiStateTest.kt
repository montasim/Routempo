package com.montasim.routempo.feature.auth

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AuthUiStateTest {
    @Test
    fun defaultProviders_includeGoogleAndMicrosoftInOrder() {
        assertEquals(
            listOf(AuthProvider.Google, AuthProvider.Microsoft),
            defaultAuthProviders().map { it.provider },
        )
    }

    @Test
    fun providerAvailability_carriesVisibleReason() {
        val provider =
            AuthProviderUi(
                provider = AuthProvider.Microsoft,
                available = false,
                unavailableReason = "Microsoft sign-in is not configured.",
            )

        assertFalse(provider.available)
        assertEquals("Microsoft sign-in is not configured.", provider.unavailableReason)
    }

    @Test
    fun authError_distinguishesRetryableFailures() {
        val retryable = AuthUiState.Error(message = "Network unavailable", retryable = true)
        val terminal = AuthUiState.Error(message = "Account unavailable", retryable = false)

        assertTrue(retryable.retryable)
        assertFalse(terminal.retryable)
    }
}
