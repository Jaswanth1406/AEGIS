package com.example.aegis.ui.threats

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.PlaybookExecuteRequest
import com.example.aegis.data.models.StatusUpdateRequest
import com.example.aegis.data.models.ThreatItem
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun ThreatDetailScreen(threatId: Int, onBack: () -> Unit) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var threat by remember { mutableStateOf<ThreatItem?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    // Staggered content animation
    var contentVisible by remember { mutableStateOf(false) }

    LaunchedEffect(threatId) {
        try {
            val resp = ApiClient.getInstance().getThreat(threatId)
            if (resp.isSuccessful) threat = resp.body()
        } catch (_: Exception) { }
        isLoading = false
        delay(100)
        contentVisible = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(top = 48.dp)
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, null, tint = cyber.textPrimary)
            }
            Text("Threat Details", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = cyber.neonCyan)
            }
        } else if (threat == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Threat not found", color = cyber.textSecondary)
            }
        } else {
            val t = threat!!
            Column(
                modifier = Modifier
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Header Card — animated
                AnimatedSection(visible = contentVisible, delayMs = 0) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(cyber.cardBackground)
                            .border(1.dp, severityColor(t.severity).copy(alpha = 0.3f), RoundedCornerShape(20.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(t.threatType, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                                Box(
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(severityColor(t.severity).copy(alpha = 0.15f))
                                        .padding(horizontal = 12.dp, vertical = 6.dp)
                                ) {
                                    Text(t.severity, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = severityColor(t.severity))
                                }
                            }
                            if (t.status != null) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text("Status: ${t.status}", color = cyber.neonCyan, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                // Info Grid — staggered
                AnimatedSection(visible = contentVisible, delayMs = 100) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        InfoCard("Source IP", t.sourceIp, Icons.Default.GpsFixed, cyber.neonCyan, Modifier.weight(1f))
                        InfoCard("Target", t.targetSystem, Icons.Default.Dns, cyber.neonBlue, Modifier.weight(1f))
                    }
                }

                AnimatedSection(visible = contentVisible, delayMs = 200) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        InfoCard("Confidence", "${((t.confidenceScore ?: 0.0) * 100).toInt()}%", Icons.Default.Analytics, cyber.neonGreen, Modifier.weight(1f))
                        InfoCard("Anomaly", "${((t.anomalyScore ?: 0.0) * 100).toInt()}%", Icons.Default.Warning, cyber.warningYellow, Modifier.weight(1f))
                    }
                }

                // Status Update Buttons
                AnimatedSection(visible = contentVisible, delayMs = 300) {
                    Column {
                        Text("Update Status", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                        Spacer(modifier = Modifier.height(8.dp))
                        val statuses = listOf("INVESTIGATING", "CONTAINED", "BLOCKED", "RESOLVED")
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            statuses.forEach { status ->
                                val isCurrent = t.status == status
                                Button(
                                    onClick = {
                                        scope.launch {
                                            try {
                                                val resp = ApiClient.getInstance().updateThreatStatus(t.id, StatusUpdateRequest(status))
                                                if (resp.isSuccessful) {
                                                    threat = resp.body()
                                                    Toast.makeText(context, "Status updated", Toast.LENGTH_SHORT).show()
                                                }
                                            } catch (_: Exception) {
                                                Toast.makeText(context, "Failed", Toast.LENGTH_SHORT).show()
                                            }
                                        }
                                    },
                                    modifier = Modifier.weight(1f).height(40.dp),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = if (isCurrent) cyber.neonCyan else cyber.cardBackground,
                                        contentColor = if (isCurrent) MaterialTheme.colorScheme.background else cyber.textSecondary
                                    ),
                                    contentPadding = PaddingValues(2.dp)
                                ) {
                                    Text(status.take(4), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }

                // Execute Playbook — with selector
                AnimatedSection(visible = contentVisible, delayMs = 400) {
                    var playbooks by remember { mutableStateOf<List<com.example.aegis.data.models.Playbook>>(emptyList()) }
                    var selectedPb by remember { mutableStateOf<com.example.aegis.data.models.Playbook?>(null) }
                    var expanded by remember { mutableStateOf(false) }
                    var executing by remember { mutableStateOf(false) }

                    LaunchedEffect(Unit) {
                        try {
                            val resp = ApiClient.getInstance().getPlaybooks()
                            if (resp.isSuccessful) playbooks = resp.body() ?: emptyList()
                        } catch (_: Exception) { }
                    }

                    Column {
                        Text("Execute Playbook", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                        Spacer(modifier = Modifier.height(8.dp))

                        // Dropdown selector
                        Box {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(cyber.cardBackground)
                                    .border(1.dp, cyber.borderColor, RoundedCornerShape(12.dp))
                                    .clickable { expanded = true }
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        selectedPb?.name ?: if (playbooks.isEmpty()) "No playbooks available" else "Select a playbook...",
                                        color = if (selectedPb != null) cyber.textPrimary else cyber.textSecondary,
                                        fontSize = 14.sp
                                    )
                                    Icon(Icons.Default.ArrowDropDown, null, tint = cyber.textSecondary)
                                }
                            }
                            DropdownMenu(
                                expanded = expanded && playbooks.isNotEmpty(),
                                onDismissRequest = { expanded = false },
                                modifier = Modifier.background(cyber.cardBackground)
                            ) {
                                playbooks.forEach { pb ->
                                    DropdownMenuItem(
                                        text = {
                                            Column {
                                                Text(pb.name, color = cyber.textPrimary, fontWeight = FontWeight.SemiBold)
                                                Text(
                                                    "${pb.steps?.size ?: 0} actions",
                                                    fontSize = 11.sp, color = cyber.neonCyan
                                                )
                                            }
                                        },
                                        onClick = { selectedPb = pb; expanded = false }
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))

                        Button(
                            onClick = {
                                val pbId = selectedPb?.id ?: return@Button
                                executing = true
                                scope.launch {
                                    try {
                                        val resp = ApiClient.getInstance().executePlaybook(pbId, PlaybookExecuteRequest(t.id))
                                        if (resp.isSuccessful) {
                                            Toast.makeText(context, "✅ Playbook executed!", Toast.LENGTH_LONG).show()
                                        } else {
                                            Toast.makeText(context, "Failed: ${resp.code()}", Toast.LENGTH_SHORT).show()
                                        }
                                    } catch (e: Exception) {
                                        Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                                    }
                                    executing = false
                                }
                            },
                            enabled = selectedPb != null && !executing,
                            modifier = Modifier.fillMaxWidth().height(52.dp),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = cyber.neonBlue, contentColor = Color.White)
                        ) {
                            if (executing) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                            } else {
                                Icon(Icons.Default.PlayArrow, null, modifier = Modifier.size(20.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text("Execute${selectedPb?.let { ": ${it.name}" } ?: ""}", fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Composable
fun AnimatedSection(visible: Boolean, delayMs: Int, content: @Composable () -> Unit) {
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(500, delayMillis = delayMs, easing = FastOutSlowInEasing),
        label = "section fade"
    )
    val offsetY by animateFloatAsState(
        targetValue = if (visible) 0f else 24f,
        animationSpec = tween(500, delayMillis = delayMs, easing = FastOutSlowInEasing),
        label = "section slide"
    )
    Box(modifier = Modifier.alpha(alpha).offset(y = offsetY.dp)) {
        content()
    }
}

@Composable
fun InfoCard(label: String, value: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    val cyber = LocalCyberColors.current
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(16.dp))
            .background(cyber.cardBackground)
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Column {
            Icon(icon, null, tint = color, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, fontSize = 12.sp, color = cyber.textSecondary)
            Text(value, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
        }
    }
}
