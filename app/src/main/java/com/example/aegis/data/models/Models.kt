package com.example.aegis.data.models

import com.google.gson.annotations.SerializedName

data class DashboardStats(
    @SerializedName("critical_threats") val criticalThreats: Int,
    @SerializedName("active_alerts") val activeAlerts: Int,
    @SerializedName("threats_contained") val threatsContained: Int,
    @SerializedName("avg_response_time") val avgResponseTime: Double
)

data class AttackGlobal(
    val id: Int?,
    @SerializedName("source_lat") val sourceLat: Double?,
    @SerializedName("source_lng") val sourceLng: Double?,
    @SerializedName("target_lat") val targetLat: Double?,
    @SerializedName("target_lng") val targetLng: Double?,
    @SerializedName("source_ip") val sourceIp: String?,
    @SerializedName("target_system") val targetSystem: String?,
    val severity: String?
)

data class ThreatItem(
    val id: Int,
    @SerializedName("threat_type") val threatType: String,
    val severity: String,
    @SerializedName("source_ip") val sourceIp: String,
    @SerializedName("target_system") val targetSystem: String,
    @SerializedName("confidence_score") val confidenceScore: Double?,
    @SerializedName("anomaly_score") val anomalyScore: Double?,
    val status: String?,
    @SerializedName("created_at") val createdAt: String?,
    val explanation: Map<String, Any>?
)

data class ThreatListResponse(
    val items: List<ThreatItem>,
    val page: Int,
    val limit: Int,
    val total: Int,
    @SerializedName("has_next") val hasNext: Boolean
)

data class StatusUpdateRequest(val status: String)

data class PlaybookStep(
    val action: String,
    val params: Map<String, String>? = null
)

data class Playbook(
    val id: Int,
    val name: String,
    val description: String?,
    val steps: List<PlaybookStep>?,
    @SerializedName("created_at") val createdAt: String? = null
)

data class PlaybookCreateRequest(
    val name: String,
    val description: String,
    val steps: List<PlaybookStep>
)

data class PlaybookUpdateRequest(
    val name: String? = null,
    val description: String? = null,
    val steps: List<PlaybookStep>? = null
)

data class PlaybookExecuteRequest(@SerializedName("threat_id") val threatId: Int)

data class StepResult(
    val action: String?,
    val status: String?,
    val output: String?,
    @SerializedName("duration_ms") val durationMs: Long? = null
)

data class PlaybookLog(
    val id: Int,
    @SerializedName("playbook_id") val playbookId: Int,
    @SerializedName("threat_id") val threatId: Int,
    val status: String?,
    @SerializedName("executed_at") val executedAt: String?,
    @SerializedName("playbook_name") val playbookName: String?,
    @SerializedName("duration_ms") val durationMs: Long? = null,
    @SerializedName("step_results") val stepResults: List<StepResult>? = null
)

data class SettingsData(
    @SerializedName("alert_thresholds") val alertThresholds: AlertThresholds?,
    @SerializedName("notification_preferences") val notificationPreferences: NotificationPreferences?,
    @SerializedName("playbook_automation_enabled") val playbookAutomationEnabled: Boolean?
)

data class AlertThresholds(val critical: Double?, val high: Double?, val medium: Double?)
data class NotificationPreferences(val email: Boolean?, val slack: Boolean?)
