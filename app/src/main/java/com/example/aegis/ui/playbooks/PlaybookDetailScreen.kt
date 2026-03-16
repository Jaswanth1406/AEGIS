package com.example.aegis.ui.playbooks

import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import com.example.aegis.data.models.Playbook
import com.example.aegis.data.models.PlaybookExecuteRequest
import com.example.aegis.data.models.PlaybookStep
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

data class ActionInfo(
    val key: String,
    val label: String,
    val category: String,
    val icon: ImageVector,
    val color: Color,
    val paramLabels: Map<String, String>
)

val ACTION_REGISTRY = listOf(
    ActionInfo("block_ip", "Block IP", "Network", Icons.Default.Block, Color(0xFFFF3366), mapOf("ip" to "IP Address")),
    ActionInfo("isolate_subnet", "Isolate Subnet", "Network", Icons.Default.SettingsEthernet, Color(0xFFFF6D00), mapOf("subnet" to "Subnet CIDR")),
    ActionInfo("quarantine_device", "Quarantine Device", "Endpoint", Icons.Default.PhonelinkLock, Color(0xFFE040FB), mapOf("system_name" to "System Name")),
    ActionInfo("trigger_antivirus_scan", "Antivirus Scan", "Endpoint", Icons.Default.Security, Color(0xFF00C853), mapOf("system_name" to "System Name")),
    ActionInfo("force_user_logout", "Force Logout", "IAM", Icons.Default.ExitToApp, Color(0xFFFFAB00), mapOf("identifier" to "User / IP")),
    ActionInfo("lock_active_directory_account", "Lock AD Account", "IAM", Icons.Default.Lock, Color(0xFFFF5252), mapOf("username" to "Username")),
    ActionInfo("update_threat_status", "Update Status", "Platform", Icons.Default.Sync, Color(0xFF00B0FF), mapOf("status" to "New Status")),
    ActionInfo("escalate_to_tier2", "Escalate to Tier 2", "Platform", Icons.Default.ArrowUpward, Color(0xFFD500F9), mapOf("threat_id" to "Threat ID"))
)

fun getActionInfo(key: String): ActionInfo? = ACTION_REGISTRY.find { it.key == key }

@Composable
fun PlaybookDetailScreen(
    playbookId: Int,
    onBack: () -> Unit,
    onEdit: (Int) -> Unit
) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var playbook by remember { mutableStateOf<Playbook?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var executing by remember { mutableStateOf(false) }
    var threatIdText by remember { mutableStateOf("") }
    var showExecuteDialog by remember { mutableStateOf(false) }
    var contentVisible by remember { mutableStateOf(false) }

    LaunchedEffect(playbookId) {
        try {
            val resp = ApiClient.getInstance().getPlaybook(playbookId)
            if (resp.isSuccessful) playbook = resp.body()
        } catch (_: Exception) { }
        isLoading = false
        delay(100)
        contentVisible = true
    }

    if (showExecuteDialog) {
        AlertDialog(
            onDismissRequest = { showExecuteDialog = false },
            containerColor = cyber.cardBackground,
            title = { Text("Execute Playbook", color = cyber.textPrimary) },
            text = {
                Column {
                    Text("Enter the Threat ID to execute this playbook against:", color = cyber.textSecondary, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedTextField(
                        value = threatIdText,
                        onValueChange = { threatIdText = it.filter { c -> c.isDigit() } },
                        label = { Text("Threat ID") },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = cyber.neonCyan,
                            unfocusedBorderColor = cyber.borderColor,
                            cursorColor = cyber.neonCyan,
                            focusedTextColor = cyber.textPrimary,
                            unfocusedTextColor = cyber.textPrimary,
                            focusedLabelColor = cyber.neonCyan
                        )
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val tid = threatIdText.toIntOrNull() ?: return@Button
                        executing = true
                        scope.launch {
                            try {
                                val resp = ApiClient.getInstance().executePlaybook(playbookId, PlaybookExecuteRequest(tid))
                                if (resp.isSuccessful) {
                                    Toast.makeText(context, "✅ Playbook executed successfully!", Toast.LENGTH_LONG).show()
                                } else {
                                    Toast.makeText(context, "Failed: ${resp.code()}", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                            executing = false
                            showExecuteDialog = false
                        }
                    },
                    enabled = threatIdText.isNotBlank() && !executing,
                    colors = ButtonDefaults.buttonColors(containerColor = cyber.neonBlue)
                ) {
                    if (executing) CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text("Execute")
                }
            },
            dismissButton = {
                TextButton(onClick = { showExecuteDialog = false }) {
                    Text("Cancel", color = cyber.textSecondary)
                }
            }
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(top = 48.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.Default.ArrowBack, null, tint = cyber.textPrimary)
            }
            Text("Playbook Details", fontSize = 22.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary, modifier = Modifier.weight(1f))
            IconButton(onClick = { onEdit(playbookId) }) {
                Icon(Icons.Default.Edit, null, tint = cyber.neonCyan)
            }
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = cyber.neonCyan)
            }
        } else if (playbook == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Playbook not found", color = cyber.textSecondary)
            }
        } else {
            val pb = playbook!!
            Column(
                modifier = Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                FadeSlideSection(contentVisible, 0) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(20.dp))
                            .background(cyber.cardBackground)
                            .border(1.dp, cyber.neonBlue.copy(alpha = 0.2f), RoundedCornerShape(20.dp))
                            .padding(20.dp)
                    ) {
                        Column {
                            Text(pb.name, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                            if (!pb.description.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(pb.description, fontSize = 14.sp, color = cyber.textSecondary)
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Layers, null, tint = cyber.neonCyan, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("${pb.steps?.size ?: 0} actions", fontSize = 13.sp, color = cyber.neonCyan, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }

                FadeSlideSection(contentVisible, 100) {
                    Text("Action Pipeline", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                }

                pb.steps?.forEachIndexed { index, step ->
                    FadeSlideSection(contentVisible, 150 + index * 80) {
                        StepCard(index + 1, step, cyber)
                    }
                }

                Spacer(modifier = Modifier.height(80.dp))
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(20.dp)
            ) {
                Button(
                    onClick = { showExecuteDialog = true },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = cyber.neonBlue, contentColor = Color.White)
                ) {
                    Icon(Icons.Default.PlayArrow, null, modifier = Modifier.size(20.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Execute Against Threat", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }
    }
}

@Composable
fun StepCard(number: Int, step: PlaybookStep, cyber: CyberColors) {
    val info = getActionInfo(step.action)
    val color = info?.color ?: cyber.neonCyan

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(cyber.cardBackground)
            .border(1.dp, color.copy(alpha = 0.2f), RoundedCornerShape(16.dp))
            .padding(16.dp)
    ) {
        Row(verticalAlignment = Alignment.Top) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Text("$number", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
            }
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(info?.icon ?: Icons.Default.Settings, null, tint = color, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(info?.label ?: step.action, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = cyber.textPrimary)
                }
                Text(info?.category ?: "", fontSize = 11.sp, color = cyber.textSecondary)

                step.params?.forEach { (key, value) ->
                    Spacer(modifier = Modifier.height(6.dp))
                    Row {
                        Text("${info?.paramLabels?.get(key) ?: key}: ", fontSize = 12.sp, color = cyber.textSecondary)
                        val isVar = value.startsWith("{") && value.endsWith("}")
                        Text(
                            value,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isVar) cyber.warningYellow else cyber.neonCyan
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun FadeSlideSection(visible: Boolean, delayMs: Int, content: @Composable () -> Unit) {
    val alpha by animateFloatAsState(
        targetValue = if (visible) 1f else 0f,
        animationSpec = tween(500, delayMillis = delayMs, easing = FastOutSlowInEasing), label = "fade"
    )
    val offsetY by animateFloatAsState(
        targetValue = if (visible) 0f else 24f,
        animationSpec = tween(500, delayMillis = delayMs, easing = FastOutSlowInEasing), label = "slide"
    )
    Box(modifier = Modifier.alpha(alpha).offset(y = offsetY.dp)) { content() }
}
