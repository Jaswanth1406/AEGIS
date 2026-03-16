package com.example.aegis.ui.playbooks

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.Playbook
import com.example.aegis.data.models.PlaybookLog
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.delay

@Composable
fun PlaybooksScreen(
    onPlaybookClick: (Int) -> Unit,
    onCreateClick: () -> Unit
) {
    val cyber = LocalCyberColors.current
    var playbooks by remember { mutableStateOf<List<Playbook>>(emptyList()) }
    var logs by remember { mutableStateOf<List<PlaybookLog>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var showLogs by remember { mutableStateOf(false) }
    var contentVisible by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val pResp = ApiClient.getInstance().getPlaybooks()
            if (pResp.isSuccessful) playbooks = pResp.body() ?: emptyList()
        } catch (_: Exception) { }
        try {
            val lResp = ApiClient.getInstance().getPlaybookLogs()
            if (lResp.isSuccessful) logs = lResp.body() ?: emptyList()
        } catch (_: Exception) { }
        isLoading = false
        delay(150)
        contentVisible = true
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 48.dp, start = 20.dp, end = 20.dp, bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Playbooks", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                Text("Automated Response Engine", fontSize = 14.sp, color = cyber.neonCyan)
            }
            FloatingActionButton(
                onClick = onCreateClick,
                containerColor = cyber.neonBlue,
                contentColor = Color.White,
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Icon(Icons.Default.Add, "Create Playbook")
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(cyber.cardBackground)
                .padding(4.dp)
        ) {
            listOf("Playbooks" to false, "Execution Logs" to true).forEach { (label, isLogTab) ->
                val selected = showLogs == isLogTab
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (selected) cyber.neonCyan.copy(alpha = 0.15f) else Color.Transparent)
                        .clickable { showLogs = isLogTab }
                        .padding(vertical = 10.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        label,
                        fontSize = 13.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                        color = if (selected) cyber.neonCyan else cyber.textSecondary
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = cyber.neonCyan)
            }
        } else if (!showLogs) {
            if (playbooks.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.AutoFixHigh, null, tint = cyber.textSecondary, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No playbooks yet", color = cyber.textSecondary, fontSize = 16.sp)
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(
                            onClick = onCreateClick,
                            colors = ButtonDefaults.buttonColors(containerColor = cyber.neonBlue),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text("Create First Playbook")
                        }
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    itemsIndexed(playbooks) { index, pb ->
                        val alpha by animateFloatAsState(
                            targetValue = if (contentVisible) 1f else 0f,
                            animationSpec = tween(400, delayMillis = index * 60),
                            label = "pb fade"
                        )
                        PlaybookCard(pb, cyber, onClick = { onPlaybookClick(pb.id) }, modifier = Modifier.alpha(alpha))
                    }
                    item { Spacer(modifier = Modifier.height(100.dp)) }
                }
            }
        } else {
            if (logs.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.History, null, tint = cyber.textSecondary, modifier = Modifier.size(48.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text("No execution logs", color = cyber.textSecondary, fontSize = 16.sp)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 4.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    itemsIndexed(logs) { index, log ->
                        val alpha by animateFloatAsState(
                            targetValue = if (contentVisible) 1f else 0f,
                            animationSpec = tween(400, delayMillis = index * 60),
                            label = "log fade"
                        )
                        LogCard(log, cyber, modifier = Modifier.alpha(alpha))
                    }
                    item { Spacer(modifier = Modifier.height(100.dp)) }
                }
            }
        }
    }
}

@Composable
fun PlaybookCard(pb: Playbook, cyber: CyberColors, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(cyber.cardBackground)
            .border(1.dp, cyber.neonBlue.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(cyber.neonBlue.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.AutoFixHigh, null, tint = cyber.neonBlue, modifier = Modifier.size(24.dp))
            }
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(pb.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                if (!pb.description.isNullOrBlank()) {
                    Text(pb.description, fontSize = 12.sp, color = cyber.textSecondary, maxLines = 2)
                }
                Spacer(modifier = Modifier.height(6.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Layers, null, tint = cyber.neonCyan, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        "${pb.steps?.size ?: 0} action${if ((pb.steps?.size ?: 0) != 1) "s" else ""}",
                        fontSize = 11.sp, color = cyber.neonCyan
                    )
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = cyber.textSecondary)
        }
    }
}

@Composable
fun LogCard(log: PlaybookLog, cyber: CyberColors, modifier: Modifier = Modifier) {
    val statusColor = when (log.status?.uppercase()) {
        "SUCCESS", "COMPLETED" -> cyber.neonGreen
        "FAILED", "ERROR" -> Color(0xFFFF3366)
        "PARTIAL" -> cyber.warningYellow
        else -> cyber.neonCyan
    }

    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(cyber.cardBackground)
            .border(1.dp, statusColor.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(statusColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (log.status?.uppercase() == "SUCCESS" || log.status?.uppercase() == "COMPLETED")
                        Icons.Default.CheckCircle else Icons.Default.ErrorOutline,
                    null, tint = statusColor, modifier = Modifier.size(18.dp)
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    log.playbookName ?: "Playbook #${log.playbookId}",
                    fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = cyber.textPrimary
                )
                Text(
                    "Threat #${log.threatId} • ${log.executedAt?.take(16) ?: "—"}",
                    fontSize = 11.sp, color = cyber.textSecondary
                )
            }
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(statusColor.copy(alpha = 0.15f))
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    log.status?.uppercase() ?: "—",
                    fontSize = 10.sp, fontWeight = FontWeight.Bold, color = statusColor
                )
            }
        }
    }
}
