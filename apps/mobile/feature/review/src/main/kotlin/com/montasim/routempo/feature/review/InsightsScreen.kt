package com.montasim.routempo.feature.review

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.BarChart
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.montasim.routempo.core.designsystem.RoutempoEmptyState
import com.montasim.routempo.core.designsystem.RoutempoErrorState
import com.montasim.routempo.core.designsystem.RoutempoLoadingState
import com.montasim.routempo.core.designsystem.RoutempoOfflineBanner
import com.montasim.routempo.core.designsystem.routempoColors
import com.montasim.routempo.core.model.AnalyticsDay
import com.montasim.routempo.core.model.OutcomeSummary

@Composable
fun InsightsScreen(
    state: InsightsUiState,
    onSelectRange: (InsightsRange) -> Unit,
    onRetry: () -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier = Modifier,
) {
    when (state.surfaceState()) {
        ReviewSurfaceState.LOADING -> RoutempoLoadingState("Loading insights", modifier.fillMaxSize())
        ReviewSurfaceState.FAILURE -> RoutempoErrorState(
            title = "Insights are unavailable",
            message = state.errorMessage ?: "Unable to load insights.",
            modifier = modifier.fillMaxSize(),
            retryLabel = "Retry",
            onRetry = onRetry,
        )
        ReviewSurfaceState.EMPTY -> InsightsEmptyContent(state, onSelectRange, onRefresh, modifier)
        ReviewSurfaceState.CONTENT -> InsightsContent(state, onSelectRange, onRefresh, modifier)
    }
}

@Composable
private fun InsightsEmptyContent(
    state: InsightsUiState,
    onSelectRange: (InsightsRange) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier,
) {
    val isOfflineWithoutCache = state.isStale && state.analytics == null
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { InsightsHeader(state.range, onSelectRange) }
        if (state.isStale) {
            item {
                RoutempoOfflineBanner(
                    title = if (isOfflineWithoutCache) "No saved insights" else "Showing saved insights",
                    message = if (isOfflineWithoutCache) "Reconnect to load your outcomes." else "Reconnect to update these outcomes.",
                    retryLabel = "Refresh",
                    onRetry = onRefresh,
                )
            }
        }
        state.errorMessage?.let { message ->
            item {
                RoutempoErrorState(
                    title = "Could not refresh insights",
                    message = message,
                    retryLabel = "Try again",
                    onRetry = onRefresh,
                )
            }
        }
        item {
            when {
                isOfflineWithoutCache -> RoutempoEmptyState(
                    title = "Insights are not available offline yet",
                    message = "Refresh while connected to save your latest review.",
                    icon = Icons.Outlined.BarChart,
                )
                state.emptyReason == InsightsEmptyReason.NO_ACCOUNT_ACTIVITY -> RoutempoEmptyState(
                    title = "Your patterns will appear here",
                    message = "Add a routine and record what happens to build a useful review.",
                    icon = Icons.Outlined.BarChart,
                )
                else -> RoutempoEmptyState(
                    title = "No outcomes in the last ${state.range.days} days",
                    message = "Choose a wider range or keep recording routines to build a current picture.",
                    icon = Icons.Outlined.BarChart,
                    actionLabel = if (state.range == InsightsRange.NINETY) null else "Show 90 days",
                    onAction = if (state.range == InsightsRange.NINETY) null else ({ onSelectRange(InsightsRange.NINETY) }),
                )
            }
        }
    }
}

@Composable
private fun InsightsContent(
    state: InsightsUiState,
    onSelectRange: (InsightsRange) -> Unit,
    onRefresh: () -> Unit,
    modifier: Modifier,
) {
    val analytics = requireNotNull(state.analytics)
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp, 12.dp, 16.dp, 104.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { InsightsHeader(state.range, onSelectRange) }
        if (state.isStale) {
            item {
                RoutempoOfflineBanner(
                    title = "Showing saved insights",
                    message = "Reconnect to update these outcomes.",
                    retryLabel = "Refresh",
                    onRetry = onRefresh,
                )
            }
        }
        state.errorMessage?.let { message ->
            item {
                RoutempoErrorState(
                    title = "Could not refresh insights",
                    message = message,
                    retryLabel = "Try again",
                    onRetry = onRefresh,
                )
            }
        }
        item { OutcomeMetrics(analytics.outcomes) }
        item {
            Card {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text("Daily outcomes", Modifier.semantics { heading() }, style = MaterialTheme.typography.titleMedium)
                    Text(
                        "${analytics.startDate} to ${analytics.endDate}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall,
                    )
                    Spacer(Modifier.height(16.dp))
                    AccessibleOutcomeChart(analytics.series)
                    Spacer(Modifier.height(12.dp))
                    OutcomeLegend()
                }
            }
        }
        item { Text("By category", Modifier.semantics { heading() }, style = MaterialTheme.typography.titleMedium) }
        items(sortedCategoryAnalytics(analytics.categories), key = { it.category }) { category ->
            Card {
                Column(
                    Modifier.fillMaxWidth().padding(16.dp).semantics {
                        contentDescription =
                            "${category.category}: ${category.outcomes.completionPercentage}% completed, " +
                                "${category.outcomes.completed} completed, ${category.outcomes.skipped} skipped, " +
                                "${category.outcomes.missed} missed, ${category.outcomes.unrecorded} unrecorded, " +
                                "${category.routineCount} routines"
                    },
                ) {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(category.category, fontWeight = FontWeight.SemiBold)
                            Text(
                                "${category.routineCount} routines · ${category.outcomes.total} outcomes",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Text("${category.outcomes.completionPercentage}%", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                    }
                    Spacer(Modifier.height(10.dp))
                    LinearProgressIndicator(
                        progress = { category.outcomes.completionPercentage / 100f },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "${category.outcomes.completed} completed · ${category.outcomes.skipped} skipped · " +
                            "${category.outcomes.missed} missed · ${category.outcomes.unrecorded} unrecorded",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
        }
    }
}

@Composable
private fun InsightsHeader(range: InsightsRange, onSelectRange: (InsightsRange) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Column {
            Text("Insights", Modifier.semantics { heading() }, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("See what is working over time.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            InsightsRange.entries.forEach { option ->
                FilterChip(
                    selected = range == option,
                    onClick = { onSelectRange(option) },
                    label = { Text(option.label) },
                )
            }
        }
    }
}

@Composable
private fun OutcomeMetrics(summary: OutcomeSummary) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricCard("Completion", "${summary.completionPercentage}%", MaterialTheme.colorScheme.primary, Modifier.weight(1f))
            MetricCard("Scheduled", summary.total.toString(), MaterialTheme.colorScheme.secondary, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricCard("Completed", summary.completed.toString(), MaterialTheme.routempoColors.completed, Modifier.weight(1f))
            MetricCard("Unrecorded", summary.unrecorded.toString(), MaterialTheme.colorScheme.outline, Modifier.weight(1f))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            MetricCard("Skipped", summary.skipped.toString(), MaterialTheme.routempoColors.skipped, Modifier.weight(1f))
            MetricCard("Missed", summary.missed.toString(), MaterialTheme.routempoColors.missed, Modifier.weight(1f))
        }
    }
}

@Composable
private fun MetricCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    Card(modifier = modifier.semantics { contentDescription = "$label $value" }) {
        Column(Modifier.fillMaxWidth().padding(16.dp)) {
            Text(value, style = MaterialTheme.typography.headlineMedium, color = color, fontWeight = FontWeight.Bold)
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun AccessibleOutcomeChart(days: List<AnalyticsDay>) {
    val maxTotal = days.maxOfOrNull { it.outcomes.total }?.coerceAtLeast(1) ?: 1
    LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        items(days, key = { it.date }) { day ->
            val summary = day.outcomes
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.semantics {
                    contentDescription =
                        "${day.date}: ${summary.completed} completed, ${summary.skipped} skipped, " +
                            "${summary.missed} missed, ${summary.unrecorded} unrecorded, " +
                            "${summary.completionPercentage}% completion"
                },
            ) {
                Box(Modifier.width(28.dp).height(120.dp), contentAlignment = Alignment.BottomCenter) {
                    if (summary.total > 0) {
                        Column(
                            Modifier.fillMaxWidth().fillMaxHeight(summary.total.toFloat() / maxTotal),
                            verticalArrangement = Arrangement.Bottom,
                        ) {
                            OutcomeSegment(summary.unrecorded, summary.total, MaterialTheme.colorScheme.outlineVariant)
                            OutcomeSegment(summary.missed, summary.total, MaterialTheme.routempoColors.missed)
                            OutcomeSegment(summary.skipped, summary.total, MaterialTheme.routempoColors.skipped)
                            OutcomeSegment(summary.completed, summary.total, MaterialTheme.routempoColors.completed)
                        }
                    } else {
                        Box(Modifier.fillMaxWidth().height(2.dp).background(MaterialTheme.colorScheme.outline))
                    }
                }
                Text(day.date.takeLast(5), style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}

@Composable
private fun ColumnScope.OutcomeSegment(value: Int, total: Int, color: Color) {
    if (value > 0) Box(Modifier.fillMaxWidth().weight(value.toFloat() / total).background(color))
}

@Composable
private fun OutcomeLegend() {
    HorizontalDivider()
    Row(Modifier.fillMaxWidth().padding(top = 10.dp), horizontalArrangement = Arrangement.SpaceEvenly) {
        LegendItem("Completed", MaterialTheme.routempoColors.completed)
        LegendItem("Skipped", MaterialTheme.routempoColors.skipped)
        LegendItem("Missed", MaterialTheme.routempoColors.missed)
        LegendItem("Unrecorded", MaterialTheme.colorScheme.outlineVariant)
    }
}

@Composable
private fun LegendItem(label: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.width(10.dp).height(10.dp).background(color))
        Text(label, style = MaterialTheme.typography.labelSmall)
    }
}
