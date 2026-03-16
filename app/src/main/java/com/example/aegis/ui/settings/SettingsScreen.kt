package com.example.aegis.ui.settings

import android.widget.Toast
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.*
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    isDarkTheme: Boolean,
    onToggleTheme: () -> Unit
) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    var settings by remember { mutableStateOf<SettingsData?>(null) }
    var isLoading by remember { mutableStateOf(true) }

    // Editable state
    var criticalThreshold by remember { mutableFloatStateOf(0.9f) }
    var highThreshold by remember { mutableFloatStateOf(0.75f) }
    var mediumThreshold by remember { mutableFloatStateOf(0.5f) }
    var emailNotif by remember { mutableStateOf(true) }
    var slackNotif by remember { mutableStateOf(false) }
    var autoPlaybook by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val settingsResp = ApiClient.getInstance().getSettings()
            if (settingsResp.isSuccessful) {
                settings = settingsResp.body()
                settings?.let {
                    criticalThreshold = it.alertThresholds?.critical?.toFloat() ?: 0.9f
                    highThreshold = it.alertThresholds?.high?.toFloat() ?: 0.75f
                    mediumThreshold = it.alertThresholds?.medium?.toFloat() ?: 0.5f
                    emailNotif = it.notificationPreferences?.email ?: true
                    slackNotif = it.notificationPreferences?.slack ?: false
                    autoPlaybook = it.playbookAutomationEnabled ?: false
                }
            }
        } catch (_: Exception) { }
        isLoading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .verticalScroll(rememberScrollState())
            .padding(top = 48.dp, bottom = 100.dp)
            .padding(horizontal = 20.dp)
    ) {
        Text("Settings", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
        Text("Platform configuration", fontSize = 14.sp, color = cyber.neonCyan)

        Spacer(modifier = Modifier.height(24.dp))

        // ─── Theme Toggle ───
        SectionCard {
            Text("Appearance", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (isDarkTheme) Icons.Default.DarkMode else Icons.Default.LightMode,
                        null,
                        tint = cyber.neonCyan,
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            if (isDarkTheme) "Dark Mode" else "Light Mode",
                            fontSize = 15.sp, color = cyber.textPrimary
                        )
                        Text(
                            if (isDarkTheme) "Cyber-dark interface" else "Clean light interface",
                            fontSize = 12.sp, color = cyber.textSecondary
                        )
                    }
                }
                Switch(
                    checked = isDarkTheme,
                    onCheckedChange = { onToggleTheme() },
                    colors = SwitchDefaults.colors(
                        checkedThumbColor = cyber.neonCyan,
                        checkedTrackColor = cyber.neonCyan.copy(alpha = 0.3f),
                        uncheckedThumbColor = cyber.textSecondary,
                        uncheckedTrackColor = cyber.borderColor
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Alert Thresholds
        SectionCard {
            Text("Alert Thresholds", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Spacer(modifier = Modifier.height(16.dp))
            ThresholdSlider("Critical", criticalThreshold, Color(0xFFFF0040)) { criticalThreshold = it }
            ThresholdSlider("High", highThreshold, cyber.dangerRed) { highThreshold = it }
            ThresholdSlider("Medium", mediumThreshold, cyber.warningYellow) { mediumThreshold = it }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Notifications
        SectionCard {
            Text("Notifications", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            ToggleRow(Icons.Default.Email, "Email Alerts", emailNotif) { emailNotif = it }
            ToggleRow(Icons.Default.Chat, "Slack Alerts", slackNotif) { slackNotif = it }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Automation
        SectionCard {
            Text("Automation", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            Spacer(modifier = Modifier.height(12.dp))
            ToggleRow(Icons.Default.AutoFixHigh, "Playbook Automation", autoPlaybook) { autoPlaybook = it }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Save Button
        Button(
            onClick = {
                scope.launch {
                    try {
                        val body = SettingsData(
                            alertThresholds = AlertThresholds(criticalThreshold.toDouble(), highThreshold.toDouble(), mediumThreshold.toDouble()),
                            notificationPreferences = NotificationPreferences(emailNotif, slackNotif),
                            playbookAutomationEnabled = autoPlaybook
                        )
                        val resp = ApiClient.getInstance().updateSettings(body)
                        if (resp.isSuccessful) Toast.makeText(context, "Settings saved", Toast.LENGTH_SHORT).show()
                        else Toast.makeText(context, "Error: ${resp.code()}", Toast.LENGTH_SHORT).show()
                    } catch (_: Exception) {
                        Toast.makeText(context, "Network error", Toast.LENGTH_SHORT).show()
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = cyber.neonCyan, contentColor = MaterialTheme.colorScheme.background)
        ) {
            Text("Save Settings", fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun SectionCard(content: @Composable ColumnScope.() -> Unit) {
    val cyber = LocalCyberColors.current
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(20.dp))
            .background(cyber.cardBackground)
            .border(1.dp, cyber.borderColor, RoundedCornerShape(20.dp))
            .padding(20.dp),
        content = content
    )
}

@Composable
fun ThresholdSlider(label: String, value: Float, color: Color, onValueChange: (Float) -> Unit) {
    val cyber = LocalCyberColors.current
    Column {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 14.sp, color = cyber.textSecondary)
            Text("${(value * 100).toInt()}%", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = color)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.fillMaxWidth(),
            colors = SliderDefaults.colors(thumbColor = color, activeTrackColor = color, inactiveTrackColor = cyber.borderColor)
        )
    }
}

@Composable
fun ToggleRow(icon: ImageVector, label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    val cyber = LocalCyberColors.current
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = cyber.neonCyan, modifier = Modifier.size(20.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Text(label, fontSize = 15.sp, color = cyber.textPrimary)
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = cyber.neonCyan,
                checkedTrackColor = cyber.neonCyan.copy(alpha = 0.3f),
                uncheckedThumbColor = cyber.textSecondary,
                uncheckedTrackColor = cyber.borderColor
            )
        )
    }
}
