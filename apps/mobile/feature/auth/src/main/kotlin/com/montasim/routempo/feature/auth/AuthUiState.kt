package com.montasim.routempo.feature.auth

enum class AuthProvider(val displayName: String) {
    Google("Google"),
    Microsoft("Microsoft"),
}

data class AuthProviderUi(
    val provider: AuthProvider,
    val available: Boolean = true,
    val unavailableReason: String? = null,
)

sealed interface AuthUiState {
    data object RestoringSession : AuthUiState

    data class SignedOut(
        val providers: List<AuthProviderUi> = defaultAuthProviders(),
    ) : AuthUiState

    data class SigningIn(
        val provider: AuthProvider,
        val providers: List<AuthProviderUi> = defaultAuthProviders(),
    ) : AuthUiState

    data class Error(
        val message: String,
        val supportCode: String? = null,
        val retryable: Boolean = true,
    ) : AuthUiState
}

fun defaultAuthProviders(): List<AuthProviderUi> =
    listOf(
        AuthProviderUi(AuthProvider.Google),
        AuthProviderUi(AuthProvider.Microsoft),
    )
