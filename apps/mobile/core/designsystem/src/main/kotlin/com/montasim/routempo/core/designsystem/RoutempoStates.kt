package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.CloudOff
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.Inbox
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

/** Full-width loading feedback that announces state changes without stealing accessibility focus. */
@Composable
fun RoutempoLoadingState(
    message: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier =
            modifier
                .fillMaxWidth()
                .semantics { liveRegion = LiveRegionMode.Polite }
                .padding(RoutempoDimens.spacing24),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing16),
    ) {
        CircularProgressIndicator(modifier = Modifier.size(32.dp), strokeWidth = 3.dp)
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
    }
}

/** Empty collection feedback with an optional recovery/creation action. */
@Composable
fun RoutempoEmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Rounded.Inbox,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    RoutempoMessageState(
        title = title,
        message = message,
        icon = icon,
        modifier = modifier,
        actionLabel = actionLabel,
        onAction = onAction,
        actionIsPrimary = true,
    )
}

/** Retryable failure feedback. A load failure must use this instead of an empty state. */
@Composable
fun RoutempoErrorState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    retryLabel: String? = null,
    onRetry: (() -> Unit)? = null,
) {
    RoutempoMessageState(
        title = title,
        message = message,
        icon = Icons.Rounded.ErrorOutline,
        modifier = modifier,
        actionLabel = retryLabel,
        onAction = onRetry,
        actionIsPrimary = false,
    )
}

/** Visible stale/offline disclosure. Cached data may remain below this banner. */
@Composable
fun RoutempoOfflineBanner(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    retryLabel: String? = null,
    onRetry: (() -> Unit)? = null,
) {
    Card(
        modifier = modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite },
        colors =
            CardDefaults.cardColors(
                containerColor = MaterialTheme.routempoColors.soft,
                contentColor = MaterialTheme.colorScheme.onSurface,
            ),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(RoutempoDimens.spacing16),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = Icons.Rounded.CloudOff,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(text = title, style = MaterialTheme.typography.titleSmall)
                Text(
                    text = message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (retryLabel != null && onRetry != null) {
                OutlinedButton(onClick = onRetry) { Text(retryLabel) }
            }
        }
    }
}

@Composable
private fun RoutempoMessageState(
    title: String,
    message: String,
    icon: ImageVector,
    modifier: Modifier,
    actionLabel: String?,
    onAction: (() -> Unit)?,
    actionIsPrimary: Boolean,
) {
    Column(
        modifier =
            modifier
                .fillMaxWidth()
                .padding(horizontal = RoutempoDimens.spacing24, vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Card(
            colors =
                CardDefaults.cardColors(
                    containerColor = MaterialTheme.routempoColors.brand50,
                    contentColor = MaterialTheme.colorScheme.primary,
                ),
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                modifier = Modifier.padding(RoutempoDimens.spacing12).size(24.dp),
            )
        }
        Spacer(Modifier.height(RoutempoDimens.spacing16))
        Text(
            text = title,
            modifier = Modifier.semantics { heading() },
            style = MaterialTheme.typography.titleMedium,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.height(RoutempoDimens.spacing4))
        Text(
            text = message,
            modifier = Modifier.widthIn(max = 360.dp),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (actionLabel != null && onAction != null) {
            Spacer(Modifier.height(RoutempoDimens.spacing16))
            if (actionIsPrimary) {
                Button(onClick = onAction) { Text(actionLabel) }
            } else {
                OutlinedButton(onClick = onAction) { Text(actionLabel) }
            }
        }
    }
}
