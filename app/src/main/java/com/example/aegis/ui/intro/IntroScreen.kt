package com.example.aegis.ui.intro

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Security
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.ui.theme.LocalCyberColors
import com.example.aegis.ui.components.LottieAnimationBox
import com.example.aegis.R

import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset

@Composable
fun IntroScreen(onGetStartedClick: () -> Unit) {
    val cyber = LocalCyberColors.current

    // Animation for the pulsing background orbs
    val infiniteTransition = rememberInfiniteTransition(label = "background pulse")
    val scalePulse by infiniteTransition.animateFloat(
        initialValue = 0.8f,
        targetValue = 1.2f,
        animationSpec = infiniteRepeatable(
            animation = tween(4000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse animation"
    )

    // Main layout
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .drawBehind {
                val gridSpacing = 40.dp.toPx()
                val gridColor = cyber.neonGreen.copy(alpha = 0.06f)
                val dotRadius = 1.5f

                var x = 0f
                while (x < size.width) {
                    var y = 0f
                    while (y < size.height) {
                        drawCircle(
                            color = gridColor,
                            radius = dotRadius,
                            center = Offset(x, y)
                        )
                        y += gridSpacing
                    }
                    x += gridSpacing
                }
            }
    ) {
        // Background Orb Green (top-left)
        Box(
            modifier = Modifier
                .offset(x = (-50).dp, y = (-100).dp)
                .size(300.dp)
                .scale(scalePulse)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(
                            cyber.neonGreen.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )
        // Background Orb Blue (bottom-right)
        Box(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .offset(x = 50.dp, y = 100.dp)
                .size(350.dp)
                .scale(scalePulse)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(
                            cyber.neonBlue.copy(alpha = 0.15f),
                            Color.Transparent
                        )
                    )
                )
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Spacer(modifier = Modifier.height(60.dp))

            // Animated logo area
            AnimatedLogoArea()

            Spacer(modifier = Modifier.height(40.dp))

            // Text Content
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "AEGIS",
                    fontSize = 56.sp,
                    fontWeight = FontWeight.Black,
                    color = cyber.textPrimary
                )
                Text(
                    text = "CyberShield",
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = cyber.neonGreen
                )
                Text(
                    text = "Your Autonomous\nCyber-Immune Platform",
                    fontSize = 18.sp,
                    color = cyber.neonBlue,
                    textAlign = TextAlign.Center,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(top = 8.dp)
                )
                Text(
                    text = "Detect, analyze, and neutralize active threats in real-time with our intelligent AI immune system.",
                    fontSize = 14.sp,
                    color = cyber.textMuted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 16.dp, start = 16.dp, end = 16.dp)
                )
            }

            Spacer(modifier = Modifier.weight(1f))

            // Glass bottom card — smooth nav on click (no flash)
            GlassBottomCard(onClick = onGetStartedClick)
        }
    }
}

@Composable
fun AnimatedLogoArea() {
    val cyber = LocalCyberColors.current
    val infiniteTransition = rememberInfiniteTransition(label = "logo jump")

    val jump by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = -20f,
        animationSpec = infiniteRepeatable(
            animation = tween(1500, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "jump y offset"
    )

    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.12f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000),
            repeatMode = RepeatMode.Reverse
        ),
        label = "shield pulse"
    )

    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.3f,
        targetValue = 0.7f,
        animationSpec = infiniteRepeatable(
            animation = tween(2000, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow alpha"
    )

    Box(
        modifier = Modifier
            .size(200.dp)
            .offset(y = jump.dp),
        contentAlignment = Alignment.Center
    ) {
        // Outer glow ring
        Box(
            modifier = Modifier
                .size(180.dp)
                .scale(scale)
                .alpha(glowAlpha)
                .clip(CircleShape)
                .background(cyber.neonGreen.copy(alpha = 0.1f))
                .border(2.dp, cyber.neonGreen.copy(alpha = 0.3f), CircleShape)
        )
        // Middle ring
        Box(
            modifier = Modifier
                .size(140.dp)
                .scale(scale)
                .clip(CircleShape)
                .background(cyber.neonGreen.copy(alpha = 0.2f))
                .border(1.dp, cyber.neonGreen.copy(alpha = 0.4f), CircleShape)
        )
        // Inner solid circle with Lottie welcome animation
        Box(
            modifier = Modifier
                .size(100.dp)
                .scale(scale)
                .clip(CircleShape)
                .background(
                    Brush.radialGradient(
                        listOf(cyber.neonGreen, cyber.neonGreen.copy(alpha = 0.7f))
                    )
                ),
            contentAlignment = Alignment.Center
        ) {
            LottieAnimationBox(
                animationResId = R.raw.lottie_welcome,
                size = 80.dp
            )
        }
    }
}

@Composable
fun GlassBottomCard(onClick: () -> Unit) {
    val cyber = LocalCyberColors.current

    // Use a semi-transparent card that adapts to theme
    val glassColor = if (cyber.isDark) Color.White.copy(alpha = 0.08f) else Color.White.copy(alpha = 0.7f)
    val glassBorder = if (cyber.isDark) Color.White.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.9f)

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(28.dp))
            .background(glassColor)
            .border(1.dp, glassBorder, RoundedCornerShape(28.dp))
            .padding(24.dp)
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            // Stats Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                StatItem("MTTD", "<1s", cyber.neonGreen)
                StatItem("MTTR", "<1ms", cyber.neonBlue)
                StatItem("False Positives", "-95%", cyber.neonGreen)
            }

            Spacer(modifier = Modifier.height(28.dp))

            // "Initialize System" button with smooth press animation
            val coroutineScope = rememberCoroutineScope()
            var isPressed by remember { mutableStateOf(false) }
            val scaleBtn by animateFloatAsState(
                targetValue = if (isPressed) 0.95f else 1f,
                animationSpec = tween(durationMillis = 200),
                label = "button press"
            )

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .scale(scaleBtn)
                    .clip(RoundedCornerShape(18.dp))
                    .background(
                        Brush.horizontalGradient(
                            listOf(cyber.neonGreen, cyber.neonCyan)
                        )
                    )
                    .clickable {
                        coroutineScope.launch {
                            isPressed = true
                            delay(200)
                            isPressed = false
                            onClick()
                        }
                    },
                contentAlignment = Alignment.Center
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "Initialize System",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF0D1117)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    val arrowOffset by rememberInfiniteTransition(label = "arrow bob").animateFloat(
                        initialValue = 0f,
                        targetValue = 6f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(800, easing = LinearEasing),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "arrow position"
                    )
                    Icon(
                        imageVector = Icons.Filled.ArrowForward,
                        contentDescription = "Start",
                        tint = Color(0xFF0D1117),
                        modifier = Modifier.offset(x = arrowOffset.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun StatItem(label: String, value: String, color: Color) {
    val cyber = LocalCyberColors.current
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = value,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = color
        )
        Text(
            text = label,
            fontSize = 11.sp,
            color = cyber.textMuted,
            fontWeight = FontWeight.Medium
        )
    }
}
