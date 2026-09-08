package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Native rendering of the approved 96x96 forest-green Routempo mark.
 *
 * Pass a [contentDescription] when the mark carries brand meaning. Leave it null when adjacent
 * text already identifies Routempo so TalkBack does not hear duplicate content.
 */
@Composable
fun RoutempoMark(
    modifier: Modifier = Modifier,
    size: Dp = 48.dp,
    contentDescription: String? = null,
) {
    val semanticModifier =
        if (contentDescription == null) {
            Modifier
        } else {
            Modifier.semantics { this.contentDescription = contentDescription }
        }

    Canvas(modifier = modifier.then(semanticModifier).size(size)) {
        val scale = minOf(this.size.width, this.size.height) / 96f
        val left = (this.size.width - (96f * scale)) / 2f
        val top = (this.size.height - (96f * scale)) / 2f
        fun point(x: Float, y: Float) = Offset(left + (x * scale), top + (y * scale))

        drawRoundRect(
            color = Color(0xFF14532D),
            topLeft = Offset(left, top),
            size = Size(96f * scale, 96f * scale),
            cornerRadius = CornerRadius(24f * scale),
        )

        val whiteStroke =
            Stroke(width = 5f * scale, cap = StrokeCap.Round, join = StrokeJoin.Round)
        drawLine(
            color = Color.White,
            start = point(29f, 70f),
            end = point(67f, 70f),
            strokeWidth = 5f * scale,
            cap = StrokeCap.Round,
        )

        val route =
            Path().apply {
                moveTo(point(33f, 67f).x, point(33f, 67f).y)
                lineTo(point(43f, 30f).x, point(43f, 30f).y)
                lineTo(point(53f, 30f).x, point(53f, 30f).y)
                lineTo(point(63f, 67f).x, point(63f, 67f).y)
            }
        drawPath(route, Color.White, style = whiteStroke)

        val accent = Color(0xFF86EFAC)
        drawLine(
            color = accent,
            start = point(48f, 53f),
            end = point(61f, 29f),
            strokeWidth = 5f * scale,
            cap = StrokeCap.Round,
        )
        drawCircle(accent, radius = 6f * scale, center = point(62f, 27f))
    }
}

/** Theme-aware native wordmark; unlike the source SVG it remains legible on dark surfaces. */
@Composable
fun RoutempoWordmark(
    modifier: Modifier = Modifier,
    markSize: Dp = 40.dp,
    contentDescription: String = "Routempo",
) {
    Row(
        modifier = modifier.clearAndSetSemantics { this.contentDescription = contentDescription },
        horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        RoutempoMark(size = markSize)
        Text(
            text =
                buildAnnotatedString {
                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.onSurface)) { append("Rou") }
                    withStyle(SpanStyle(color = MaterialTheme.colorScheme.primary)) { append("tempo") }
                },
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
        )
    }
}
