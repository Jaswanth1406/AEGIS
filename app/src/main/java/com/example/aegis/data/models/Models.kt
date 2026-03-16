package com.example.aegis.data.models

import com.google.gson.annotations.SerializedName

// ─── Dashboard ───
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

// ─── Threats ───
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

// ─── Playbooks ───
data class Playbook(
    val id: Int,
    val name: String,
    val description: String?,
    val steps: List<String>?
)

data class PlaybookExecuteRequest(@SerializedName("threat_id") val threatId: Int)

data class PlaybookLog(
    val id: Int,
    @SerializedName("playbook_id") val playbookId: Int,
    @SerializedName("threat_id") val threatId: Int,
    val status: String?,
    @SerializedName("executed_at") val executedAt: String?,
    @SerializedName("playbook_name") val playbookName: String?
)

// ─── Settings ───
data class SettingsData(
    @SerializedName("alert_thresholds") val alertThresholds: AlertThresholds?,
    @SerializedName("notification_preferences") val notificationPreferences: NotificationPreferences?,
    @SerializedName("playbook_automation_enabled") val playbookAutomationEnabled: Boolean?
)

data class AlertThresholds(val critical: Double?, val high: Double?, val medium: Double?)
data class NotificationPreferences(val email: Boolean?, val slack: Boolean?)
