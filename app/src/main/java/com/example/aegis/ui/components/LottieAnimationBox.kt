package com.example.aegis.ui.components

import androidx.annotation.RawRes
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.airbnb.lottie.compose.*

/**
 * Reusable Lottie animation composable used throughout the AEGIS app.
 *
 * @param animationResId R.raw.lottie_* resource reference
 * @param size Display size of the animation
 * @param iterations How many times to loop (default: forever)
 * @param modifier Optional modifier
 */
@Composable
fun LottieAnimationBox(
    @RawRes animationResId: Int,
    size: Dp = 120.dp,
    iterations: Int = LottieConstants.IterateForever,
    modifier: Modifier = Modifier
) {
    val composition by rememberLottieComposition(LottieCompositionSpec.RawRes(animationResId))
    val progress by animateLottieCompositionAsState(
        composition = composition,
        iterations = iterations,
        isPlaying = true,
        restartOnPlay = true
    )

    LottieAnimation(
        composition = composition,
        progress = { progress },
        modifier = modifier.size(size)
    )
}
