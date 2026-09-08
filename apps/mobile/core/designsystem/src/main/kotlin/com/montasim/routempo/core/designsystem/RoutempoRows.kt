package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ErrorOutline
import androidx.compose.material.icons.rounded.KeyboardArrowRight
import androidx.compose.material.icons.rounded.SkipNext
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

enum class RoutempoOccurrenceStatus(val stateLabel: String) {
    Pending("Pending"),
    Completed("Completed"),
    Skipped("Skipped"),
}

enum class RoutempoOutcome(val label: String) {
    Completed("Completed"),
    Skipped("Skipped"),
    Missed("Missed"),
}

@Immutable
data class RoutempoRowSemantics(
    val stateDescription: String? = null,
    val disabledReason: String? = null,
)

/** A 72dp-minimum rich row. Feature-specific trailing actions should remain separate nodes. */
@Composable
fun RoutempoSemanticRow(
    title: String,
    modifier: Modifier = Modifier,
    supportingText: String? = null,
    enabled: Boolean = true,
    semantics: RoutempoRowSemantics = RoutempoRowSemantics(),
    onClick: (() -> Unit)? = null,
    leadingContent: (@Composable () -> Unit)? = null,
    trailingContent: (@Composable RowScope.() -> Unit)? = null,
) {
    val semanticsModifier =
        Modifier.semantics {
            semantics.stateDescription?.let { stateDescription = it }
            if (!enabled) {
                disabled()
                semantics.disabledReason?.let { stateDescription = it }
            }
            if (onClick != null) role = Role.Button
        }
    val content: @Composable () -> Unit = {
        Row(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .heightIn(min = RoutempoDimens.richRowHeight)
                    .padding(horizontal = RoutempoDimens.spacing16, vertical = RoutempoDimens.spacing8),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            leadingContent?.invoke()
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleSmall,
                    color = if (enabled) MaterialTheme.colorScheme.onSurface else MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                )
                if (supportingText != null) {
                    Text(
                        text = supportingText,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
            if (trailingContent != null) {
                trailingContent()
            } else if (onClick != null) {
                Icon(Icons.Rounded.KeyboardArrowRight, contentDescription = null)
            }
        }
    }

    if (onClick == null) {
        Surface(modifier = modifier.then(semanticsModifier), content = content)
    } else {
        Surface(
            onClick = onClick,
            modifier = modifier.then(semanticsModifier),
            enabled = enabled,
            content = content,
        )
    }
}

/** Accessible 48dp occurrence action, with a distinct visual state inside its touch target. */
@Composable
fun RoutempoStatusButton(
    routineTitle: String,
    status: RoutempoOccurrenceStatus,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val colors = MaterialTheme.routempoColors
    val (container, content, icon) =
        when (status) {
            RoutempoOccurrenceStatus.Pending -> Triple(Color.Transparent, MaterialTheme.colorScheme.onSurfaceVariant, null)
            RoutempoOccurrenceStatus.Completed -> Triple(MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.onPrimary, Icons.Rounded.Check)
            RoutempoOccurrenceStatus.Skipped -> Triple(colors.brand100, colors.skipped, Icons.Rounded.SkipNext)
        }
    IconButton(
        onClick = onClick,
        modifier =
            modifier
                .size(RoutempoDimens.minimumTouchTarget)
                .semantics {
                    contentDescription = statusActionDescription(status, routineTitle)
                    stateDescription = status.stateLabel
                },
        enabled = enabled,
    ) {
        Box(
            modifier =
                Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .then(
                        if (status == RoutempoOccurrenceStatus.Pending) {
                            Modifier.border(2.dp, colors.line, CircleShape)
                        } else {
                            Modifier.background(container, CircleShape)
                        },
                    ),
            contentAlignment = Alignment.Center,
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = content,
                    modifier = Modifier.size(20.dp),
                )
            }
        }
    }
}

@Composable
fun RoutempoOutcomeBadge(
    outcome: RoutempoOutcome,
    modifier: Modifier = Modifier,
) {
    val colors = MaterialTheme.routempoColors
    val (container, content, icon) =
        when (outcome) {
            RoutempoOutcome.Completed -> Triple(colors.brand100, colors.completed, Icons.Rounded.Check)
            RoutempoOutcome.Skipped -> Triple(colors.brand100, colors.skipped, Icons.Rounded.SkipNext)
            RoutempoOutcome.Missed -> Triple(colors.soft, colors.missed, Icons.Rounded.ErrorOutline)
        }
    Surface(
        modifier = modifier.clearAndSetSemantics { contentDescription = outcome.label },
        color = container,
        contentColor = content,
        shape = CircleShape,
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.padding(10.dp).size(20.dp),
        )
    }
}

@Composable
fun RoutempoSectionHeader(
    title: String,
    countLabel: String,
    modifier: Modifier = Modifier,
) {
    Row(
        modifier = modifier.fillMaxWidth().padding(bottom = RoutempoDimens.spacing8),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = title,
            modifier = Modifier.semantics { heading() },
            style = MaterialTheme.typography.titleSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = countLabel,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

internal fun statusActionDescription(status: RoutempoOccurrenceStatus, routineTitle: String): String =
    when (status) {
        RoutempoOccurrenceStatus.Pending -> "Complete $routineTitle"
        RoutempoOccurrenceStatus.Completed,
        RoutempoOccurrenceStatus.Skipped,
        -> "Mark $routineTitle as not done"
    }
