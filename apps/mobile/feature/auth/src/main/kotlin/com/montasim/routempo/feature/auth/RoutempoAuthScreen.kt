package com.montasim.routempo.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CalendarMonth
import androidx.compose.material.icons.rounded.CheckCircleOutline
import androidx.compose.material.icons.rounded.Insights
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoDimens
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.designsystem.RoutempoMark
import com.montasim.routempo.core.designsystem.RoutempoTheme
import com.montasim.routempo.core.designsystem.RoutempoWordmark
import com.montasim.routempo.core.designsystem.routempoColors

/**
 * Native authentication surface. Navigation, Credential Manager, Custom Tabs, and external legal
 * destinations remain caller-owned through callbacks; this composable never embeds a WebView.
 */
@Composable
fun RoutempoAuthScreen(
    state: AuthUiState,
    onSignIn: (AuthProvider) -> Unit,
    onRetry: () -> Unit,
    onReturnToSignIn: () -> Unit,
    onTerms: () -> Unit,
    onPrivacy: () -> Unit,
    onSupport: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier =
            modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .statusBarsPadding()
                .navigationBarsPadding(),
        contentAlignment = Alignment.Center,
    ) {
        when (state) {
            AuthUiState.RestoringSession ->
                RoutempoLoadingState(
                    message = stringResource(R.string.auth_restoring_session),
                    modifier = Modifier.widthIn(max = 520.dp).testTag("auth-restoring"),
                )

            is AuthUiState.SignedOut ->
                SignInContent(
                    providers = state.providers,
                    signingIn = null,
                    onSignIn = onSignIn,
                    onTerms = onTerms,
                    onPrivacy = onPrivacy,
                    onSupport = onSupport,
                )

            is AuthUiState.SigningIn ->
                SignInContent(
                    providers = state.providers,
                    signingIn = state.provider,
                    onSignIn = onSignIn,
                    onTerms = onTerms,
                    onPrivacy = onPrivacy,
                    onSupport = onSupport,
                )

            is AuthUiState.Error ->
                AuthErrorContent(
                    state = state,
                    onRetry = onRetry,
                    onReturnToSignIn = onReturnToSignIn,
                    onSupport = onSupport,
                )
        }
    }
}

@Composable
private fun SignInContent(
    providers: List<AuthProviderUi>,
    signingIn: AuthProvider?,
    onSignIn: (AuthProvider) -> Unit,
    onTerms: () -> Unit,
    onPrivacy: () -> Unit,
    onSupport: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = RoutempoDimens.screenGutter, vertical = RoutempoDimens.spacing24),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().widthIn(max = 520.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            RoutempoWordmark()
            Spacer(Modifier.height(RoutempoDimens.spacing24))
            Text(
                text = stringResource(R.string.auth_heading),
                modifier = Modifier.semantics { heading() },
                style = MaterialTheme.typography.titleLarge,
                textAlign = TextAlign.Center,
            )
            Text(
                text = stringResource(R.string.auth_intro),
                modifier = Modifier.padding(top = RoutempoDimens.spacing8),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )

            Surface(
                modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing24),
                color = MaterialTheme.routempoColors.elevated,
                contentColor = MaterialTheme.colorScheme.onSurface,
                shape = MaterialTheme.shapes.medium,
                tonalElevation = 1.dp,
            ) {
                Column(modifier = Modifier.padding(RoutempoDimens.spacing16)) {
                    AuthBenefitRow(
                        icon = Icons.Rounded.CalendarMonth,
                        title = stringResource(R.string.auth_benefit_plan_title),
                        message = stringResource(R.string.auth_benefit_plan_message),
                    )
                    HorizontalDivider(modifier = Modifier.padding(vertical = RoutempoDimens.spacing12))
                    AuthBenefitRow(
                        icon = Icons.Rounded.CheckCircleOutline,
                        title = stringResource(R.string.auth_benefit_record_title),
                        message = stringResource(R.string.auth_benefit_record_message),
                    )
                    HorizontalDivider(modifier = Modifier.padding(vertical = RoutempoDimens.spacing12))
                    AuthBenefitRow(
                        icon = Icons.Rounded.Insights,
                        title = stringResource(R.string.auth_benefit_learn_title),
                        message = stringResource(R.string.auth_benefit_learn_message),
                    )
                }
            }

            Text(
                text = stringResource(R.string.auth_choose_account),
                modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing24),
                style = MaterialTheme.typography.titleSmall,
            )
            providers
                .sortedBy { it.provider.ordinal }
                .forEach { provider ->
                    ProviderButton(
                        provider = provider,
                        signingIn = signingIn,
                        onClick = { onSignIn(provider.provider) },
                        modifier = Modifier.padding(top = RoutempoDimens.spacing8),
                    )
                }

            Text(
                text = stringResource(R.string.auth_integration_disclosure),
                modifier = Modifier.padding(top = RoutempoDimens.spacing16),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )

            Row(
                modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing16),
                horizontalArrangement = Arrangement.Center,
            ) {
                TextButton(onClick = onTerms, modifier = Modifier.weight(1f)) {
                    Text(stringResource(R.string.auth_terms))
                }
                TextButton(onClick = onPrivacy, modifier = Modifier.weight(1f)) {
                    Text(stringResource(R.string.auth_privacy))
                }
            }
            TextButton(onClick = onSupport, modifier = Modifier.fillMaxWidth()) {
                Text(stringResource(R.string.auth_support))
            }
        }
    }
}

@Composable
private fun ProviderButton(
    provider: AuthProviderUi,
    signingIn: AuthProvider?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val busy = signingIn != null
    val active = signingIn == provider.provider
    val enabled = provider.available && !busy
    val label =
        if (active) {
            stringResource(R.string.auth_signing_in_with, provider.provider.displayName)
        } else {
            stringResource(R.string.auth_continue_with, provider.provider.displayName)
        }
    val content: @Composable () -> Unit = {
        if (active) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary,
            )
        } else {
            ProviderLetter(provider.provider)
        }
        Text(label, modifier = Modifier.padding(start = RoutempoDimens.spacing12))
    }

    if (provider.provider == AuthProvider.Google) {
        Button(
            onClick = onClick,
            modifier = modifier.fillMaxWidth().heightIn(min = RoutempoDimens.primaryActionHeight),
            enabled = enabled,
            content = { content() },
        )
    } else {
        OutlinedButton(
            onClick = onClick,
            modifier = modifier.fillMaxWidth().heightIn(min = RoutempoDimens.primaryActionHeight),
            enabled = enabled,
            content = { content() },
        )
    }
    if (!provider.available && provider.unavailableReason != null) {
        Text(
            text = provider.unavailableReason,
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing4),
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.error,
        )
    }
}

@Composable
private fun ProviderLetter(provider: AuthProvider) {
    Surface(
        modifier = Modifier.size(24.dp),
        shape = CircleShape,
        color = MaterialTheme.routempoColors.soft,
        contentColor = MaterialTheme.colorScheme.onSurface,
    ) {
        Box(contentAlignment = Alignment.Center) {
            Text(
                text = provider.displayName.first().toString(),
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
            )
        }
    }
}

@Composable
private fun AuthBenefitRow(
    icon: ImageVector,
    title: String,
    message: String,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Surface(
            modifier = Modifier.size(40.dp),
            shape = CircleShape,
            color = MaterialTheme.routempoColors.brand50,
            contentColor = MaterialTheme.colorScheme.primary,
        ) {
            Box(contentAlignment = Alignment.Center) {
                androidx.compose.material3.Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
            }
        }
        Column(modifier = Modifier.weight(1f)) {
            Text(text = title, style = MaterialTheme.typography.titleSmall)
            Text(
                text = message,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun AuthErrorContent(
    state: AuthUiState.Error,
    onRetry: () -> Unit,
    onReturnToSignIn: () -> Unit,
    onSupport: () -> Unit,
) {
    Column(
        modifier =
            Modifier
                .fillMaxWidth()
                .widthIn(max = 520.dp)
                .verticalScroll(rememberScrollState())
                .semantics { liveRegion = LiveRegionMode.Polite }
                .padding(RoutempoDimens.spacing24),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        RoutempoMark(size = 64.dp, contentDescription = stringResource(R.string.auth_brand_mark))
        Text(
            text = stringResource(R.string.auth_error_title),
            modifier = Modifier.padding(top = RoutempoDimens.spacing20).semantics { heading() },
            style = MaterialTheme.typography.titleLarge,
            textAlign = TextAlign.Center,
        )
        Text(
            text = state.message,
            modifier = Modifier.padding(top = RoutempoDimens.spacing8),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (state.supportCode != null) {
            Text(
                text = stringResource(R.string.auth_support_code, state.supportCode),
                modifier = Modifier.padding(top = RoutempoDimens.spacing8),
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (state.retryable) {
            Button(
                onClick = onRetry,
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(top = RoutempoDimens.spacing24)
                        .heightIn(min = RoutempoDimens.primaryActionHeight),
            ) {
                Text(stringResource(R.string.auth_try_again))
            }
        }
        OutlinedButton(
            onClick = onReturnToSignIn,
            modifier =
                Modifier
                    .fillMaxWidth()
                    .padding(top = RoutempoDimens.spacing8)
                    .heightIn(min = RoutempoDimens.primaryActionHeight),
        ) {
            Text(stringResource(R.string.auth_back_to_sign_in))
        }
        TextButton(
            onClick = onSupport,
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing8),
        ) {
            Text(stringResource(R.string.auth_support))
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun SignedOutPreview() {
    RoutempoTheme {
        RoutempoAuthScreen(
            state = AuthUiState.SignedOut(),
            onSignIn = {},
            onRetry = {},
            onReturnToSignIn = {},
            onTerms = {},
            onPrivacy = {},
            onSupport = {},
        )
    }
}
