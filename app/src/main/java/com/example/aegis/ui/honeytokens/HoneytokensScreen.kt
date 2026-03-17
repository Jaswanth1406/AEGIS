package com.example.aegis.ui.honeytokens

import android.widget.Toast
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.BugReport
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.Honeytoken
import com.example.aegis.data.models.HoneytokenCreateRequest
import com.example.aegis.ui.playbooks.FadeSlideSection
import com.example.aegis.ui.theme.LocalCyberColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun HoneytokensScreen() {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    var honeytokens by remember { mutableStateOf<List<Honeytoken>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    var contentVisible by remember { mutableStateOf(false) }
    var showCreateDialog by remember { mutableStateOf(false) }

    fun loadHoneytokens() {
        scope.launch {
            try {
                val resp = ApiClient.getInstance().getHoneytokens()
                if (resp.isSuccessful) honeytokens = resp.body() ?: emptyList()
            } catch (_: Exception) { }
            isLoading = false
            delay(100)
            contentVisible = true
        }
    }

    LaunchedEffect(Unit) { loadHoneytokens() }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(cyber.cardBackground)
                    .padding(top = 48.dp, bottom = 16.dp, start = 20.dp, end = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.BugReport, contentDescription = "Honeytokens", tint = cyber.neonCyan, modifier = Modifier.size(28.dp))
                Spacer(modifier = Modifier.width(12.dp))
                Text("Adaptive Honeytokens", fontSize = 24.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = cyber.neonCyan)
                }
            } else if (honeytokens.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.CheckCircle, null, modifier = Modifier.size(64.dp), tint = cyber.textSecondary.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(16.dp))
                        Text("No active honeytokens", color = cyber.textSecondary, fontSize = 16.sp)
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(20.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    itemsIndexed(honeytokens) { index, token ->
                        FadeSlideSection(contentVisible, index * 100) {
                            val htColor = when (token.status) {
                                "active" -> cyber.neonGreen
                                "triggered" -> Color(0xFFFF0040)
                                else -> cyber.textSecondary
                            }
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(16.dp))
                                    .background(cyber.cardBackground)
                                    .border(1.dp, htColor.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                                    .padding(16.dp)
                            ) {
                                Column {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Icon(
                                                if (token.status == "triggered") Icons.Default.Error else Icons.Default.BugReport,
                                                null,
                                                tint = htColor,
                                                modifier = Modifier.size(20.dp)
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text(token.name, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                                        }
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(6.dp))
                                                .background(htColor.copy(alpha = 0.15f))
                                                .padding(horizontal = 8.dp, vertical = 4.dp)
                                        ) {
                                            Text(token.status.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold, color = htColor)
                                        }
                                    }
                                    
                                    Spacer(modifier = Modifier.height(12.dp))
                                    
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.LocationOn, null, tint = cyber.textSecondary, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(token.deployedLocation, color = cyber.textSecondary, fontSize = 13.sp)
                                    }
                                    
                                    Spacer(modifier = Modifier.height(8.dp))
                                    
                                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                        Text("Type: ${token.tokenType}", color = cyber.textSecondary, fontSize = 12.sp)
                                        if (token.status == "active") {
                                            TextButton(
                                                onClick = {
                                                    scope.launch {
                                                        try {
                                                            val rsp = ApiClient.getInstance().deactivateHoneytoken(token.id)
                                                            if (rsp.isSuccessful) {
                                                                Toast.makeText(context, "Deactivated", Toast.LENGTH_SHORT).show()
                                                                loadHoneytokens()
                                                            }
                                                        } catch (_: Exception) { }
                                                    }
                                                },
                                                contentPadding = PaddingValues(0.dp),
                                                modifier = Modifier.height(20.dp)
                                            ) {
                                                Text("DEACTIVATE", color = cyber.warningYellow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                            }
                                        }
                                    }
                                    
                                    if (token.triggeredAt != null) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Box(
                                            modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).background(Color(0xFFFF0040).copy(alpha=0.1f)).padding(8.dp)
                                        ) {
                                            Text("Triggered At: ${token.triggeredAt}", color = Color(0xFFFF0040), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                                        }
                                    }
                                }
                            }
                        }
                    }
                    item { Spacer(modifier = Modifier.height(80.dp)) }
                }
            }
        }

        // FAB
        FadeSlideSection(visible = contentVisible, delayMs = 300) {
            Box(modifier = Modifier.fillMaxSize().padding(24.dp).padding(bottom = 60.dp), contentAlignment = Alignment.BottomEnd) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = cyber.neonCyan,
                    contentColor = MaterialTheme.colorScheme.background,
                    shape = RoundedCornerShape(16.dp)
                ) {
                    Icon(Icons.Default.Add, "Deploy Honeytoken")
                }
            }
        }
    }
    
    if (showCreateDialog) {
        HoneytokenCreateDialog(
            onDismiss = { showCreateDialog = false },
            onCreated = {
                showCreateDialog = false
                isLoading = true
                contentVisible = false
                loadHoneytokens()
                Toast.makeText(context, "Decoy deployed successfully", Toast.LENGTH_SHORT).show()
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HoneytokenCreateDialog(onDismiss: () -> Unit, onCreated: () -> Unit) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    
    var name by remember { mutableStateOf("") }
    var tokenType by remember { mutableStateOf("credential") }
    var tokenValue by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }
    
    val types = listOf("credential", "api_key", "database_record", "file", "url")
    var typeExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = { if (!isSaving) onDismiss() },
        containerColor = cyber.cardBackground,
        title = { Text("Deploy Honeytoken", color = cyber.textPrimary, fontSize = 18.sp, fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                OutlinedTextField(
                    value = name, onValueChange = { name = it },
                    label = { Text("Name (e.g., Backup Admin Creds)") },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = cyber.neonCyan, focusedLabelColor = cyber.neonCyan, unfocusedTextColor = cyber.textPrimary, focusedTextColor = cyber.textPrimary)
                )
                
                // Type Dropdown
                ExposedDropdownMenuBox(
                    expanded = typeExpanded,
                    onExpandedChange = { typeExpanded = !typeExpanded }
                ) {
                    OutlinedTextField(
                        value = tokenType,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Token Type") },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = cyber.neonCyan, focusedLabelColor = cyber.neonCyan, unfocusedTextColor = cyber.textPrimary, focusedTextColor = cyber.textPrimary)
                    )
                    ExposedDropdownMenu(
                        expanded = typeExpanded,
                        onDismissRequest = { typeExpanded = false },
                        modifier = Modifier.background(cyber.cardBackground)
                    ) {
                        types.forEach { t ->
                            DropdownMenuItem(
                                text = { Text(t, color = cyber.textPrimary) },
                                onClick = { tokenType = t; typeExpanded = false }
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = tokenValue, onValueChange = { tokenValue = it },
                    label = { Text("Decoy Value (e.g., admin:pwd)") },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = cyber.neonCyan, focusedLabelColor = cyber.neonCyan, unfocusedTextColor = cyber.textPrimary, focusedTextColor = cyber.textPrimary)
                )

                OutlinedTextField(
                    value = location, onValueChange = { location = it },
                    label = { Text("Deployed Location (e.g., config.yml)") },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = cyber.neonCyan, focusedLabelColor = cyber.neonCyan, unfocusedTextColor = cyber.textPrimary, focusedTextColor = cyber.textPrimary)
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    isSaving = true
                    scope.launch {
                        try {
                            val req = HoneytokenCreateRequest(name, tokenType, tokenValue, location)
                            val res = ApiClient.getInstance().createHoneytoken(req)
                            if (res.isSuccessful) onCreated()
                        } catch (_: Exception) { }
                        isSaving = false
                    }
                },
                enabled = name.isNotBlank() && tokenValue.isNotBlank() && location.isNotBlank() && !isSaving,
                colors = ButtonDefaults.buttonColors(containerColor = cyber.neonCyan)
            ) {
                if (isSaving) CircularProgressIndicator(modifier = Modifier.size(16.dp), color = MaterialTheme.colorScheme.background, strokeWidth = 2.dp)
                else Text("Deploy", color = MaterialTheme.colorScheme.background, fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = { if (!isSaving) onDismiss() }) {
                Text("Cancel", color = cyber.textSecondary)
            }
        }
    )
}
