package com.example.aegis.ui.playbooks

import android.widget.Toast
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.aegis.data.api.ApiClient
import com.example.aegis.data.models.*
import com.example.aegis.ui.theme.*
import kotlinx.coroutines.launch

val ACTION_CATEGORIES = ACTION_REGISTRY.groupBy { it.category }

val INJECTABLE_VARS = listOf(
    "{source_ip}" to "Threat Source IP",
    "{target_system}" to "Threat Target System",
    "{threat_type}" to "Threat Type",
    "{id}" to "Threat ID"
)

@Composable
fun PlaybookBuilderScreen(
    editPlaybookId: Int? = null,
    onBack: () -> Unit,
    onSaved: () -> Unit
) {
    val cyber = LocalCyberColors.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var steps by remember { mutableStateOf<List<MutableStepState>>(emptyList()) }
    var isLoading by remember { mutableStateOf(editPlaybookId != null) }
    var isSaving by remember { mutableStateOf(false) }
    var showActionPicker by remember { mutableStateOf(false) }

    LaunchedEffect(editPlaybookId) {
        if (editPlaybookId != null) {
            try {
                val resp = ApiClient.getInstance().getPlaybook(editPlaybookId)
                if (resp.isSuccessful) {
                    val pb = resp.body()!!
                    name = pb.name
                    description = pb.description ?: ""
                    steps = pb.steps?.map { s ->
                        MutableStepState(
                            action = s.action,
                            params = s.params?.toMutableMap() ?: mutableMapOf()
                        )
                    } ?: emptyList()
                }
            } catch (_: Exception) { }
            isLoading = false
        }
    }

    if (showActionPicker) {
        AlertDialog(
            onDismissRequest = { showActionPicker = false },
            containerColor = cyber.cardBackground,
            title = { Text("Add Action", color = cyber.textPrimary, fontWeight = FontWeight.Bold) },
            text = {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    ACTION_CATEGORIES.forEach { (category, actions) ->
                        item {
                            Text(
                                category.uppercase(),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = cyber.textSecondary,
                                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp)
                            )
                        }
                        items(actions.size) { idx ->
                            val action = actions[idx]
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(action.color.copy(alpha = 0.08f))
                                    .border(1.dp, action.color.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                                    .clickable {
                                        val defaultParams = mutableMapOf<String, String>()
                                        action.paramLabels.keys.forEach { k -> defaultParams[k] = "" }
                                        steps = steps + MutableStepState(action.key, defaultParams)
                                        showActionPicker = false
                                    }
                                    .padding(12.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(action.icon, null, tint = action.color, modifier = Modifier.size(20.dp))
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column {
                                        Text(action.label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = cyber.textPrimary)
                                        Text(
                                            action.paramLabels.values.joinToString(", "),
                                            fontSize = 11.sp, color = cyber.textSecondary
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showActionPicker = false }) {
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
            Text(
                if (editPlaybookId != null) "Edit Playbook" else "New Playbook",
                fontSize = 22.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary
            )
        }

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = cyber.neonCyan)
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                item {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Playbook Name") },
                        placeholder = { Text("e.g. High Severity Response") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp),
                        colors = fieldColors(cyber)
                    )
                }

                item {
                    OutlinedTextField(
                        value = description,
                        onValueChange = { description = it },
                        label = { Text("Description") },
                        placeholder = { Text("Describe what this playbook does...") },
                        modifier = Modifier.fillMaxWidth(),
                        minLines = 2,
                        maxLines = 4,
                        shape = RoundedCornerShape(12.dp),
                        colors = fieldColors(cyber)
                    )
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Action Steps", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary)
                        Text("${steps.size} step${if (steps.size != 1) "s" else ""}", fontSize = 12.sp, color = cyber.textSecondary)
                    }
                }

                itemsIndexed(steps) { index, step ->
                    BuilderStepCard(
                        index = index,
                        step = step,
                        cyber = cyber,
                        onParamChange = { key, value ->
                            steps = steps.toMutableList().also {
                                it[index] = it[index].copy(params = it[index].params.toMutableMap().apply { put(key, value) })
                            }
                        },
                        onRemove = {
                            steps = steps.toMutableList().also { it.removeAt(index) }
                        },
                        onMoveUp = {
                            if (index > 0) {
                                steps = steps.toMutableList().also {
                                    val temp = it[index]
                                    it[index] = it[index - 1]
                                    it[index - 1] = temp
                                }
                            }
                        },
                        onMoveDown = {
                            if (index < steps.size - 1) {
                                steps = steps.toMutableList().also {
                                    val temp = it[index]
                                    it[index] = it[index + 1]
                                    it[index + 1] = temp
                                }
                            }
                        }
                    )
                }

                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .border(2.dp, cyber.neonCyan.copy(alpha = 0.3f), RoundedCornerShape(14.dp))
                            .clickable { showActionPicker = true }
                            .padding(16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Add, null, tint = cyber.neonCyan)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Add Action Step", color = cyber.neonCyan, fontWeight = FontWeight.SemiBold)
                        }
                    }
                }

                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(cyber.neonCyan.copy(alpha = 0.05f))
                            .border(1.dp, cyber.neonCyan.copy(alpha = 0.15f), RoundedCornerShape(14.dp))
                            .padding(14.dp)
                    ) {
                        Column {
                            Text("💡 Dynamic Variables", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = cyber.neonCyan)
                            Spacer(modifier = Modifier.height(6.dp))
                            Text("Use these in parameter fields to inject threat data at execution time:", fontSize = 11.sp, color = cyber.textSecondary)
                            Spacer(modifier = Modifier.height(8.dp))
                            INJECTABLE_VARS.forEach { (varName, desc) ->
                                Row(modifier = Modifier.padding(vertical = 2.dp)) {
                                    Text(varName, fontSize = 12.sp, fontWeight = FontWeight.Bold, color = cyber.warningYellow)
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("→ $desc", fontSize = 12.sp, color = cyber.textSecondary)
                                }
                            }
                        }
                    }
                }

                item { Spacer(modifier = Modifier.height(80.dp)) }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .padding(20.dp)
            ) {
                Button(
                    onClick = {
                        if (name.isBlank()) {
                            Toast.makeText(context, "Name is required", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        if (steps.isEmpty()) {
                            Toast.makeText(context, "Add at least one action step", Toast.LENGTH_SHORT).show()
                            return@Button
                        }
                        isSaving = true
                        scope.launch {
                            try {
                                val apiSteps = steps.map { PlaybookStep(it.action, it.params.ifEmpty { null }) }
                                val resp = if (editPlaybookId != null) {
                                    ApiClient.getInstance().updatePlaybook(editPlaybookId, PlaybookUpdateRequest(name, description, apiSteps))
                                } else {
                                    ApiClient.getInstance().createPlaybook(PlaybookCreateRequest(name, description, apiSteps))
                                }
                                if (resp.isSuccessful) {
                                    Toast.makeText(context, "✅ Playbook saved!", Toast.LENGTH_SHORT).show()
                                    onSaved()
                                } else {
                                    Toast.makeText(context, "Failed: ${resp.code()}", Toast.LENGTH_SHORT).show()
                                }
                            } catch (e: Exception) {
                                Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                            }
                            isSaving = false
                        }
                    },
                    enabled = !isSaving,
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = cyber.neonBlue, contentColor = Color.White)
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Default.Save, null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (editPlaybookId != null) "Update Playbook" else "Create Playbook", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

data class MutableStepState(
    val action: String,
    val params: MutableMap<String, String>
)

@Composable
fun BuilderStepCard(
    index: Int,
    step: MutableStepState,
    cyber: CyberColors,
    onParamChange: (String, String) -> Unit,
    onRemove: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit
) {
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
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(7.dp))
                        .background(color.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("${index + 1}", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = color)
                }
                Spacer(modifier = Modifier.width(10.dp))
                Icon(info?.icon ?: Icons.Default.Settings, null, tint = color, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text(info?.label ?: step.action, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = cyber.textPrimary, modifier = Modifier.weight(1f))

                IconButton(onClick = onMoveUp, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.KeyboardArrowUp, null, tint = cyber.textSecondary, modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onMoveDown, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.KeyboardArrowDown, null, tint = cyber.textSecondary, modifier = Modifier.size(18.dp))
                }
                IconButton(onClick = onRemove, modifier = Modifier.size(28.dp)) {
                    Icon(Icons.Default.Close, null, tint = Color(0xFFFF3366), modifier = Modifier.size(16.dp))
                }
            }

            info?.paramLabels?.forEach { (key, label) ->
                Spacer(modifier = Modifier.height(10.dp))
                OutlinedTextField(
                    value = step.params[key] ?: "",
                    onValueChange = { onParamChange(key, it) },
                    label = { Text(label) },
                    placeholder = { Text("e.g. {source_ip}") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp),
                    colors = fieldColors(cyber)
                )
            }
        }
    }
}

@Composable
fun fieldColors(cyber: CyberColors) = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = cyber.neonCyan,
    unfocusedBorderColor = cyber.borderColor,
    cursorColor = cyber.neonCyan,
    focusedTextColor = cyber.textPrimary,
    unfocusedTextColor = cyber.textPrimary,
    focusedLabelColor = cyber.neonCyan,
    unfocusedLabelColor = cyber.textSecondary
)
