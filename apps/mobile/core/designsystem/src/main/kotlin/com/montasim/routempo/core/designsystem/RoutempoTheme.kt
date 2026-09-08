package com.montasim.routempo.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Routempo's product theme choice, suitable for persistence in DataStore. */
enum class RoutempoThemeMode {
    System,
    Light,
    Dark,
}

@Immutable
data class RoutempoSemanticColors(
    val canvas: Color,
    val elevated: Color,
    val soft: Color,
    val line: Color,
    val muted: Color,
    val brand50: Color,
    val brand100: Color,
    val brand500: Color,
    val brand600: Color,
    val brand700: Color,
    val brand900: Color,
    val completed: Color,
    val skipped: Color,
    val missed: Color,
)

private val LightSemanticColors =
    RoutempoSemanticColors(
        canvas = Color(0xFFEDF2EE),
        elevated = Color(0xFFFFFFFF),
        soft = Color(0xFFEDF3EE),
        line = Color(0xFFD9E3DB),
        muted = Color(0xFF68766C),
        brand50 = Color(0xFFEDF9F0),
        brand100 = Color(0xFFD9F1DF),
        brand500 = Color(0xFF28A562),
        brand600 = Color(0xFF178449),
        brand700 = Color(0xFF126B3A),
        brand900 = Color(0xFF123D27),
        completed = Color(0xFF23965A),
        skipped = Color(0xFFBB731B),
        missed = Color(0xFFCC454A),
    )

private val DarkSemanticColors =
    RoutempoSemanticColors(
        canvas = Color(0xFF0D120E),
        elevated = Color(0xFF19211B),
        soft = Color(0xFF202A22),
        line = Color(0xFF2E3A31),
        muted = Color(0xFFA5B2A8),
        brand50 = Color(0xFF203329),
        brand100 = Color(0xFF294535),
        brand500 = Color(0xFF4DB879),
        brand600 = Color(0xFF63C58B),
        brand700 = Color(0xFF88D7A6),
        brand900 = Color(0xFFDFF3E5),
        completed = Color(0xFF52C381),
        skipped = Color(0xFFE5A34B),
        missed = Color(0xFFEF696E),
    )

private val LightColors =
    lightColorScheme(
        primary = LightSemanticColors.brand600,
        onPrimary = Color.White,
        primaryContainer = LightSemanticColors.brand100,
        onPrimaryContainer = LightSemanticColors.brand900,
        secondary = LightSemanticColors.brand700,
        onSecondary = Color.White,
        secondaryContainer = LightSemanticColors.brand50,
        onSecondaryContainer = LightSemanticColors.brand900,
        background = LightSemanticColors.canvas,
        onBackground = Color(0xFF17231A),
        surface = Color(0xFFFBFDFB),
        onSurface = Color(0xFF17231A),
        surfaceVariant = LightSemanticColors.soft,
        onSurfaceVariant = LightSemanticColors.muted,
        outline = LightSemanticColors.line,
        error = LightSemanticColors.missed,
        onError = Color.White,
    )

private val DarkColors =
    darkColorScheme(
        primary = DarkSemanticColors.brand600,
        onPrimary = Color(0xFF123D27),
        primaryContainer = DarkSemanticColors.brand100,
        onPrimaryContainer = DarkSemanticColors.brand900,
        secondary = DarkSemanticColors.brand700,
        onSecondary = Color(0xFF123D27),
        secondaryContainer = DarkSemanticColors.brand50,
        onSecondaryContainer = DarkSemanticColors.brand900,
        background = DarkSemanticColors.canvas,
        onBackground = Color(0xFFEDF4EF),
        surface = Color(0xFF131A15),
        onSurface = Color(0xFFEDF4EF),
        surfaceVariant = DarkSemanticColors.soft,
        onSurfaceVariant = DarkSemanticColors.muted,
        outline = DarkSemanticColors.line,
        error = DarkSemanticColors.missed,
        onError = Color(0xFF3A0509),
    )

private val RoutempoTypography =
    Typography(
        headlineMedium =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                lineHeight = 28.sp,
                letterSpacing = (-0.3).sp,
            ),
        titleLarge =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 20.sp,
                lineHeight = 26.sp,
            ),
        titleMedium =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                lineHeight = 22.sp,
            ),
        titleSmall =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                lineHeight = 20.sp,
            ),
        bodyLarge =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Normal,
                fontSize = 16.sp,
                lineHeight = 24.sp,
            ),
        bodyMedium =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Normal,
                fontSize = 14.sp,
                lineHeight = 21.sp,
            ),
        bodySmall =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Normal,
                fontSize = 12.sp,
                lineHeight = 18.sp,
            ),
        labelLarge =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                lineHeight = 20.sp,
            ),
        labelMedium =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                lineHeight = 16.sp,
            ),
        labelSmall =
            TextStyle(
                fontFamily = FontFamily.Default,
                fontWeight = FontWeight.Bold,
                fontSize = 11.sp,
                lineHeight = 14.sp,
            ),
    )

private val RoutempoShapes =
    Shapes(
        small = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
        medium = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
        large = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
    )

private val LocalRoutempoColors = staticCompositionLocalOf { LightSemanticColors }

val MaterialTheme.routempoColors: RoutempoSemanticColors
    @Composable
    @ReadOnlyComposable
    get() = LocalRoutempoColors.current

/** Spacing and minimum dimensions shared by feature modules. */
object RoutempoDimens {
    val spacing4 = 4.dp
    val spacing8 = 8.dp
    val spacing12 = 12.dp
    val spacing16 = 16.dp
    val spacing20 = 20.dp
    val spacing24 = 24.dp
    val screenGutter = 16.dp
    val minimumTouchTarget = 48.dp
    val compactRowHeight = 64.dp
    val richRowHeight = 72.dp
    val primaryActionHeight = 52.dp
    val cardRadius = 16.dp
    val controlRadius = 12.dp
    val sheetTopRadius = 28.dp
}

@Composable
fun RoutempoTheme(
    mode: RoutempoThemeMode = RoutempoThemeMode.System,
    darkTheme: Boolean =
        when (mode) {
            RoutempoThemeMode.System -> isSystemInDarkTheme()
            RoutempoThemeMode.Light -> false
            RoutempoThemeMode.Dark -> true
        },
    content: @Composable () -> Unit,
) {
    val semanticColors = if (darkTheme) DarkSemanticColors else LightSemanticColors
    CompositionLocalProvider(LocalRoutempoColors provides semanticColors) {
        MaterialTheme(
            colorScheme = if (darkTheme) DarkColors else LightColors,
            typography = RoutempoTypography,
            shapes = RoutempoShapes,
            content = content,
        )
    }
}
