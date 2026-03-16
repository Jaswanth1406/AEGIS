package com.example.aegis.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// ═══════════════════════════════════════════
//  Custom color tokens not in MaterialTheme
// ═══════════════════════════════════════════
data class CyberColors(
    val neonCyan: Color,
    val neonGreen: Color,
    val neonBlue: Color,
    val dangerRed: Color,
    val warningYellow: Color,
    val cardBackground: Color,
    val borderColor: Color,
    val textPrimary: Color,
    val textSecondary: Color,
    val textMuted: Color,
    val isDark: Boolean
)

val LocalCyberColors = staticCompositionLocalOf {
    CyberColors(
        neonCyan = NeonCyan, neonGreen = NeonGreen, neonBlue = NeonBlue,
        dangerRed = DangerRed, warningYellow = WarningYellow,
        cardBackground = DarkCard, borderColor = DarkBorder,
        textPrimary = TextPrimary, textSecondary = TextSecondary,
        textMuted = TextMuted, isDark = true
    )
}

// ─── Dark Scheme ───
private val CyberDarkColorScheme = darkColorScheme(
    primary = NeonCyan,
    onPrimary = DarkBackground,
    primaryContainer = DarkCard,
    onPrimaryContainer = NeonCyan,
    secondary = NeonGreen,
    onSecondary = DarkBackground,
    secondaryContainer = DarkCard,
    onSecondaryContainer = NeonGreen,
    tertiary = NeonBlue,
    onTertiary = Color.White,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = TextSecondary,
    outline = DarkBorder,
    error = DangerRed,
    onError = Color.White,
)

// ─── Light Scheme ───
private val CyberLightColorScheme = lightColorScheme(
    primary = LightNeonCyan,
    onPrimary = Color.White,
    primaryContainer = LightCard,
    onPrimaryContainer = LightNeonCyan,
    secondary = LightNeonGreen,
    onSecondary = Color.White,
    secondaryContainer = LightCard,
    onSecondaryContainer = LightNeonGreen,
    tertiary = LightNeonBlue,
    onTertiary = Color.White,
    background = LightBackground,
    onBackground = LightTextPrimary,
    surface = LightSurface,
    onSurface = LightTextPrimary,
    surfaceVariant = LightCard,
    onSurfaceVariant = LightTextSecondary,
    outline = LightBorder,
    error = LightDangerRed,
    onError = Color.White,
)

// ─── Dark custom tokens ───
private val DarkCyberColors = CyberColors(
    neonCyan = NeonCyan,
    neonGreen = NeonGreen,
    neonBlue = NeonBlue,
    dangerRed = DangerRed,
    warningYellow = WarningYellow,
    cardBackground = DarkCard,
    borderColor = DarkBorder,
    textPrimary = TextPrimary,
    textSecondary = TextSecondary,
    textMuted = TextMuted,
    isDark = true
)

// ─── Light custom tokens ───
private val LightCyberColors = CyberColors(
    neonCyan = LightNeonCyan,
    neonGreen = LightNeonGreen,
    neonBlue = LightNeonBlue,
    dangerRed = LightDangerRed,
    warningYellow = Color(0xFFE6B800),
    cardBackground = LightCard,
    borderColor = LightBorder,
    textPrimary = LightTextPrimary,
    textSecondary = LightTextSecondary,
    textMuted = LightTextMuted,
    isDark = false
)

// ═══════════════════════════════════════════
//  Theme Composable
// ═══════════════════════════════════════════
@Composable
fun AEGISTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) CyberDarkColorScheme else CyberLightColorScheme
    val cyberColors = if (darkTheme) DarkCyberColors else LightCyberColors

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            val bgColor = colorScheme.background.toArgb()
            window.statusBarColor = bgColor
            window.navigationBarColor = bgColor
            val insetsController = WindowCompat.getInsetsController(window, view)
            insetsController.isAppearanceLightStatusBars = !darkTheme
            insetsController.isAppearanceLightNavigationBars = !darkTheme
        }
    }

    CompositionLocalProvider(LocalCyberColors provides cyberColors) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = Typography,
            content = content
        )
    }
}