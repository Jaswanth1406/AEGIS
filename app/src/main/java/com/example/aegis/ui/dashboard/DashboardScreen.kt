package com.example.aegis.ui.dashboard

import android.annotation.SuppressLint
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.DashboardStats
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.delay

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun DashboardScreen(onNavigateToThreat: ((Int) -> Unit)? = null) {
    val cyber = LocalCyberColors.current
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var stats by remember { mutableStateOf<DashboardStats?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    var cardsVisible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        try {
            val resp = ApiClient.getInstance().getDashboardStats()
            if (resp.isSuccessful) stats = resp.body()
        } catch (_: Exception) { }
        isLoading = false
        delay(200)
        cardsVisible = true
    }

    // Load ALL global attacks and inject into globe — batch mode
    LaunchedEffect(webViewRef) {
        if (webViewRef == null) return@LaunchedEffect
        delay(2000) // Wait for globe to initialize

        while (true) {
            val jsBatch = StringBuilder()

            try {
                val resp = ApiClient.getInstance().getGlobalAttacks()
                if (resp.isSuccessful) {
                    resp.body()?.forEach { attack ->
                        if (attack.sourceLat != null && attack.sourceLng != null &&
                            attack.targetLat != null && attack.targetLng != null
                        ) {
                            val srcIp = attack.sourceIp?.let { "'${it.replace("'", "\\'")}'" } ?: "null"
                            val tgtSys = attack.targetSystem?.let { "'${it.replace("'", "\\'")}'" } ?: "null"
                            val sev = attack.severity?.let { "'$it'" } ?: "null"
                            val tid = attack.id ?: 0
                            jsBatch.append("window.injectAttack(${attack.sourceLat},${attack.sourceLng},${attack.targetLat},${attack.targetLng},$srcIp,$tgtSys,$sev,$tid);")
                        }
                    }
                }
            } catch (_: Exception) { }

            // Also fetch threats list for more data
            try {
                val tResp = ApiClient.getInstance().getThreats(page = 1, limit = 200)
                if (tResp.isSuccessful) {
                    tResp.body()?.items?.forEach { t ->
                        val srcHash = (t.sourceIp.hashCode() and 0x7fffffff)
                        val tgtHash = (t.targetSystem.hashCode() and 0x7fffffff)
                        val srcLat = ((srcHash % 1600) - 800) / 10.0
                        val srcLng = ((srcHash / 1600 % 3600) - 1800) / 10.0
                        val tgtLat = ((tgtHash % 1600) - 800) / 10.0
                        val tgtLng = ((tgtHash / 1600 % 3600) - 1800) / 10.0
                        val srcIp = "'${t.sourceIp.replace("'", "\\'")}'"
                        val tgtSys = "'${t.targetSystem.replace("'", "\\'")}'"
                        val sev = "'${t.severity}'"
                        jsBatch.append("window.injectAttack($srcLat,$srcLng,$tgtLat,$tgtLng,$srcIp,$tgtSys,$sev,${t.id});")
                    }
                }
            } catch (_: Exception) { }

            // Fallback samples if no data
            if (jsBatch.isEmpty()) {
                jsBatch.append("window.injectAttack(28.61,77.21,40.71,-74.01,'192.168.1.50','Web-Server-US','HIGH',1);")
                jsBatch.append("window.injectAttack(55.76,37.62,19.08,72.88,'10.0.0.22','Mumbai-DB','CRITICAL',2);")
                jsBatch.append("window.injectAttack(39.90,116.41,51.51,-0.13,'172.16.0.5','London-GW','MEDIUM',3);")
                jsBatch.append("window.injectAttack(-23.55,-46.63,12.97,77.59,'203.0.113.8','Bangalore-API','HIGH',4);")
                jsBatch.append("window.injectAttack(-33.87,151.21,35.69,139.69,'198.51.100.3','Tokyo-FW','LOW',5);")
            }

            // Single batch injection — all at once
            webViewRef?.evaluateJavascript(jsBatch.toString(), null)

            delay(15000) // Poll every 15s for new data
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Column(modifier = Modifier.padding(top = 48.dp, start = 20.dp, end = 20.dp)) {
            Text("Command Center", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Text("Global Threat Overview", fontSize = 14.sp, color = cyber.neonCyan)
        }

        Spacer(modifier = Modifier.height(16.dp))

        // 3D Globe
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(380.dp)
                .padding(horizontal = 12.dp)
                .clip(RoundedCornerShape(20.dp))
                .border(1.dp, cyber.borderColor, RoundedCornerShape(20.dp))
        ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    WebView(ctx).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        settings.cacheMode = WebSettings.LOAD_DEFAULT
                        settings.allowFileAccess = true
                        settings.allowContentAccess = true
                        settings.allowFileAccessFromFileURLs = true
                        settings.allowUniversalAccessFromFileURLs = true
                        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        webViewClient = WebViewClient()
                        webChromeClient = android.webkit.WebChromeClient()
                        setBackgroundColor(android.graphics.Color.TRANSPARENT)

                        addJavascriptInterface(object {
                            @JavascriptInterface
                            fun onThreatLongPress(threatId: Int) {
                                Handler(Looper.getMainLooper()).post {
                                    onNavigateToThreat?.invoke(threatId)
                                }
                            }
                        }, "AndroidBridge")

                        loadUrl("file:///android_asset/globe.html")
                        webViewRef = this
                    }
                }
            )
        }

        // ─── Severity Legend ───
        Spacer(modifier = Modifier.height(12.dp))
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            LegendDot("Critical", Color(0xFFFF0040))
            LegendDot("High", Color(0xFFFF3366))
            LegendDot("Medium", Color(0xFFFFDD00))
            LegendDot("Low", Color(0xFF00FF88))
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Stats Grid
        if (isLoading) {
            Box(modifier = Modifier.fillMaxWidth().height(100.dp), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = cyber.neonCyan)
            }
        } else {
            Column(modifier = Modifier.padding(horizontal = 20.dp)) {
                val delays = listOf(0, 100, 200, 300)
                val cardData = listOf(
                    Triple("Critical Threats", "${stats?.criticalThreats ?: 0}", Triple(Icons.Default.Error, Color(0xFFFF0040), 0)),
                    Triple("Active Alerts", "${stats?.activeAlerts ?: 0}", Triple(Icons.Default.Notifications, cyber.warningYellow, 1)),
                    Triple("Contained", "${stats?.threatsContained ?: 0}", Triple(Icons.Default.CheckCircle, cyber.neonGreen, 2)),
                    Triple("Avg Response", String.format("%.1fs", stats?.avgResponseTime ?: 0.0), Triple(Icons.Default.Speed, cyber.neonCyan, 3))
                )

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AnimatedStatCard(cardData[0], cardsVisible, delays[0], Modifier.weight(1f))
                    AnimatedStatCard(cardData[1], cardsVisible, delays[1], Modifier.weight(1f))
                }
                Spacer(modifier = Modifier.height(12.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    AnimatedStatCard(cardData[2], cardsVisible, delays[2], Modifier.weight(1f))
                    AnimatedStatCard(cardData[3], cardsVisible, delays[3], Modifier.weight(1f))
                }
            }
        }

        Spacer(modifier = Modifier.height(100.dp))
    }
}

@Composable
fun LegendDot(label: String, color: Color) {
    val cyber = LocalCyberColors.current
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier
                .size(10.dp)
                .clip(CircleShape)
                .background(color)
        )
        Spacer(modifier = Modifier.width(4.dp))
        Text(label, fontSize = 11.sp, color = cyber.textSecondary, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun AnimatedStatCard(
    data: Triple<String, String, Triple<ImageVector, Color, Int>>,
    visible: Boolean,
    delayMs: Int,
    modifier: Modifier
) {
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(durationMillis = 500, delayMillis = delayMs, easing = FastOutSlowInEasing),
        label = "card fade"
    )
    val offsetY by animateFloatAsState(
        targetValue = if (visible) 0f else 30f,
        animationSpec = tween(durationMillis = 500, delayMillis = delayMs, easing = FastOutSlowInEasing),
        label = "card slide"
    )

    Box(modifier = modifier.alpha(alpha).offset(y = offsetY.dp)) {
        StatCard(data.first, data.second, data.third.first, data.third.second, Modifier.fillMaxWidth())
    }
}

@Composable
fun StatCard(label: String, value: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    val cyber = LocalCyberColors.current
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(cyber.cardBackground)
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(value, fontSize = 24.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Text(label, fontSize = 12.sp, color = cyber.textSecondary)
        }
    }
}
