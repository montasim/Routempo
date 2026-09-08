package com.montasim.routempo

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OAuthCallbackTest {
    @Test
    fun acceptsOnlyTheRegisteredCallbackSurface() {
        assertTrue(isTrustedRoutempoCallback("routempo://auth/callback?code=one-time"))
        assertTrue(isTrustedRoutempoCallback("ROUTEMPO://AUTH/callback?integration=google"))
        assertFalse(isTrustedRoutempoCallback("https://auth/callback?code=one-time"))
        assertFalse(isTrustedRoutempoCallback("routempo://evil/callback?code=one-time"))
        assertFalse(isTrustedRoutempoCallback("routempo://auth/other?code=one-time"))
        assertFalse(isTrustedRoutempoCallback("routempo://auth/callback#unexpected"))
        assertFalse(isTrustedRoutempoCallback("not a uri"))
    }
}
