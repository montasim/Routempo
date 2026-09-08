package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Immutable
data class RoutempoChartPoint(
    val label: String,
    val valuePercent: Int,
)

/**
 * Seven-point percentage chart used by Review. The visual bars are one accessible node with an
 * ordered text alternative instead of seven noisy focus stops.
 */
@Composable
fun RoutempoBarChart(
    points: List<RoutempoChartPoint>,
    modifier: Modifier = Modifier,
    chartLabel: String = "Completion by day",
) {
    val normalized = points.map { it.copy(valuePercent = it.valuePercent.coerceIn(0, 100)) }
    Column(
        modifier =
            modifier
                .fillMaxWidth()
                .clearAndSetSemantics {
                    contentDescription = buildChartSummary(chartLabel, normalized)
                },
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().height(112.dp),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
            verticalAlignment = Alignment.Bottom,
        ) {
            normalized.forEach { point ->
                Box(
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                    contentAlignment = Alignment.BottomCenter,
                ) {
                    Box(
                        modifier =
                            Modifier
                                .fillMaxWidth()
                                .fillMaxHeight((point.valuePercent.coerceAtLeast(8)) / 100f)
                                .clip(RoundedCornerShape(topStart = 6.dp, topEnd = 6.dp))
                                .background(MaterialTheme.routempoColors.brand100),
                    )
                }
            }
        }
        Row(
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing8),
            horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
        ) {
            normalized.forEach { point ->
                Text(
                    text = point.label,
                    modifier = Modifier.weight(1f),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

internal fun buildChartSummary(label: String, points: List<RoutempoChartPoint>): String {
    val values = points.joinToString(separator = ", ") { "${it.label} ${it.valuePercent.coerceIn(0, 100)} percent" }
    return if (values.isEmpty()) "$label. No data" else "$label. $values"
}
