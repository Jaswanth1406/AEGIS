package com.example.aegis.ui.threats

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.ThreatItem
import com.example.aegis.ui.components.LottieAnimationBox
import com.example.aegis.ui.theme.*
import com.example.aegis.R
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ThreatsListScreen(onThreatClick: (Int) -> Unit) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var threats by remember { mutableStateOf<List<ThreatItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var searchQuery by remember { mutableStateOf("") }
    var selectedSeverity by remember { mutableStateOf<String?>(null) }
    val severities = listOf("ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW")

    fun loadThreats() {
        scope.launch {
            isLoading = true
            try {
                val resp = ApiClient.getInstance().getThreats(
                    severity = if (selectedSeverity == "ALL") null else selectedSeverity,
                    search = searchQuery.ifBlank { null }
                )
                if (resp.isSuccessful) threats = resp.body()?.items ?: emptyList()
                else Toast.makeText(context, "Error: ${resp.code()}", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
            } finally { isLoading = false }
        }
    }

    LaunchedEffect(Unit) { loadThreats() }
    LaunchedEffect(selectedSeverity) { loadThreats() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(top = 48.dp)
    ) {
        // Header
        Text(
            "Threat Intelligence",
            fontSize = 26.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary,
            modifier = Modifier.padding(horizontal = 20.dp)
        )
        Text(
            "Real-time threat monitoring",
            fontSize = 14.sp, color = cyber.neonCyan,
            modifier = Modifier.padding(horizontal = 20.dp, vertical = 4.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it; loadThreats() },
            placeholder = { Text("Search threats...", color = cyber.textSecondary) },
            leadingIcon = { Icon(Icons.Default.Search, null, tint = cyber.neonCyan) },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = cyber.neonCyan,
                unfocusedBorderColor = cyber.borderColor,
                cursorColor = cyber.neonCyan,
                focusedTextColor = cyber.textPrimary,
                unfocusedTextColor = cyber.textPrimary
            )
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Severity Filter Chips — horizontally scrollable
        androidx.compose.foundation.lazy.LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            contentPadding = PaddingValues(end = 8.dp)
        ) {
            items(severities.size) { index ->
                val sev = severities[index]
                val selected = (selectedSeverity ?: "ALL") == sev
                val chipColor = severityColor(sev)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .background(if (selected) chipColor.copy(alpha = 0.2f) else Color.Transparent)
                        .border(1.dp, if (selected) chipColor else cyber.borderColor, RoundedCornerShape(20.dp))
                        .clickable { selectedSeverity = sev }
                        .padding(horizontal = 14.dp, vertical = 8.dp)
                ) {
                    Text(
                        sev,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (selected) chipColor else cyber.textSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    LottieAnimationBox(
                        animationResId = R.raw.lottie_radar_scanning,
                        size = 120.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Scanning for threats...", color = cyber.neonCyan, fontSize = 14.sp)
                }
            }
        } else if (threats.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    LottieAnimationBox(
                        animationResId = R.raw.lottie_shield_safe,
                        size = 140.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("No threats detected", color = cyber.textSecondary, fontSize = 16.sp)
                    Text("System secured", color = cyber.neonGreen, fontSize = 14.sp)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 100.dp)
            ) {
                itemsIndexed(threats) { index, threat ->
                    // Staggered fade-in per item
                    val animAlpha by animateFloatAsState(
                        targetValue = 1f,
                        animationSpec = tween(400, delayMillis = index * 50),
                        label = "item fade"
                    )
                    Box(modifier = Modifier.alpha(animAlpha)) {
                        ThreatCard(threat = threat, onClick = { onThreatClick(threat.id) })
                    }
                }
            }
        }
    }
}

@Composable
fun ThreatCard(threat: ThreatItem, onClick: () -> Unit) {
    val cyber = LocalCyberColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(cyber.cardBackground)
            .border(1.dp, severityColor(threat.severity).copy(alpha = 0.3f), RoundedCornerShape(16.dp))
            .clickable { onClick() }
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(threat.threatType, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = cyber.textPrimary)
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(severityColor(threat.severity).copy(alpha = 0.15f))
                        .border(1.dp, severityColor(threat.severity).copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(threat.severity, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = severityColor(threat.severity))
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row {
                Icon(Icons.Default.GpsFixed, null, tint = cyber.textSecondary, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Source: ${threat.sourceIp}", fontSize = 13.sp, color = cyber.textSecondary)
            }
            Spacer(modifier = Modifier.height(4.dp))
            Row {
                Icon(Icons.Default.Dns, null, tint = cyber.textSecondary, modifier = Modifier.size(14.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Target: ${threat.targetSystem}", fontSize = 13.sp, color = cyber.textSecondary)
            }
            if (threat.status != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text("Status: ${threat.status}", fontSize = 12.sp, color = cyber.neonCyan, fontWeight = FontWeight.SemiBold)
            }
        }
    }
}

fun severityColor(severity: String): Color = when (severity.uppercase()) {
    "CRITICAL" -> Color(0xFFFF0040)
    "HIGH" -> Color(0xFFFF3366)
    "MEDIUM" -> Color(0xFFFFDD00)
    "LOW" -> Color(0xFF00FF88)
    else -> Color(0xFF3570E8)
}
