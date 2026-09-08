package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.SheetState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/** Scroll-safe, accessibility-labelled sheet shared by detail and form destinations. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoutempoModalSheet(
    title: String,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
    closeLabel: String = "Close",
    content: @Composable ColumnScope.() -> Unit,
) {
    ModalBottomSheet(
        onDismissRequest = onDismissRequest,
        modifier = modifier,
        sheetState = sheetState,
        shape =
            RoundedCornerShape(
                topStart = RoutempoDimens.sheetTopRadius,
                topEnd = RoutempoDimens.sheetTopRadius,
            ),
        containerColor = MaterialTheme.routempoColors.elevated,
        dragHandle = null,
    ) {
        Column(
            modifier =
                Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .navigationBarsPadding()
                    .padding(
                        start = RoutempoDimens.spacing16,
                        end = RoutempoDimens.spacing16,
                        bottom = RoutempoDimens.spacing20,
                    ),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing12),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = title,
                    modifier = Modifier.weight(1f).semantics { heading() },
                    style = MaterialTheme.typography.titleLarge,
                )
                IconButton(onClick = onDismissRequest) {
                    Icon(Icons.Rounded.Close, contentDescription = closeLabel)
                }
            }
            content()
        }
    }
}

/** Confirmation sheet with an explicit consequence and destructive primary action. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RoutempoConfirmationSheet(
    title: String,
    message: String,
    confirmLabel: String,
    cancelLabel: String,
    onConfirm: () -> Unit,
    onDismissRequest: () -> Unit,
    modifier: Modifier = Modifier,
    busy: Boolean = false,
    sheetState: SheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true),
) {
    RoutempoModalSheet(
        title = title,
        onDismissRequest = { if (!busy) onDismissRequest() },
        modifier = modifier,
        sheetState = sheetState,
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(top = RoutempoDimens.spacing8),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Column(
            modifier = Modifier.fillMaxWidth().padding(top = RoutempoDimens.spacing24),
            verticalArrangement = Arrangement.spacedBy(RoutempoDimens.spacing8),
        ) {
            Button(
                onClick = onConfirm,
                modifier = Modifier.fillMaxWidth().heightIn(min = RoutempoDimens.primaryActionHeight),
                enabled = !busy,
                colors =
                    ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.error,
                        contentColor = MaterialTheme.colorScheme.onError,
                    ),
            ) {
                Text(confirmLabel)
            }
            TextButton(
                onClick = onDismissRequest,
                modifier = Modifier.fillMaxWidth().heightIn(min = RoutempoDimens.primaryActionHeight),
                enabled = !busy,
            ) {
                Text(cancelLabel)
            }
        }
    }
}
