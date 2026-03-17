package com.example.aegis.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.aegis.MainActivity
import com.example.aegis.R
import com.example.aegis.data.api.ApiClient
import kotlinx.coroutines.*

class ThreatPollingService : Service() {

    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val seenThreatIds = mutableSetOf<Int>()
    private var isFirstPoll = true

    companion object {
        const val CHANNEL_ID = "aegis_threat_channel"
        const val CHANNEL_NAME = "Threat Alerts"
        const val FOREGROUND_ID = 1001
        const val POLL_INTERVAL_MS = 15_000L
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        AlertManager.init(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val foregroundNotification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("AEGIS Active")
            .setContentText("Monitoring threats in real-time...")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setSilent(true)
            .build()

        startForeground(FOREGROUND_ID, foregroundNotification)
        startPolling()
        return START_STICKY
    }

    private fun startPolling() {
        serviceScope.launch {
            while (isActive) {
                try {
                    val resp = ApiClient.getInstance().getThreats(limit = 50)
                    if (resp.isSuccessful) {
                        val items = resp.body()?.items ?: emptyList()

                        if (isFirstPoll) {
                            items.forEach { seenThreatIds.add(it.id) }
                            isFirstPoll = false
                        } else {
                            val newThreats = items.filter { it.id !in seenThreatIds }
                            newThreats.forEach { threat ->
                                seenThreatIds.add(threat.id)
                                sendThreatNotification(threat.id, threat.threatType, threat.severity, threat.sourceIp)
                                // Concise voice alert + heavy vibration (runs in background)
                                AlertManager.speakThreatSummary(
                                    threatType = threat.threatType,
                                    severity = threat.severity,
                                    targetSystem = threat.targetSystem
                                )
                                AlertManager.vibrate(this@ThreatPollingService, threat.severity)
                            }
                        }
                    }
                } catch (_: Exception) { }
                delay(POLL_INTERVAL_MS)
            }
        }
    }

    private fun sendThreatNotification(threatId: Int, type: String, severity: String, sourceIp: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("navigate_to", "threat_detail")
            putExtra("threat_id", threatId)
        }

        val pendingIntent = PendingIntent.getActivity(
            this, threatId, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val sevEmoji = when (severity.uppercase()) {
            "CRITICAL" -> "🔴"
            "HIGH" -> "🟠"
            "MEDIUM" -> "🟡"
            else -> "🟢"
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("$sevEmoji New Threat Detected — $severity")
            .setContentText("$type from $sourceIp")
            .setStyle(NotificationCompat.BigTextStyle()
                .bigText("Type: $type\nSource: $sourceIp\nSeverity: $severity\n\nTap to investigate →"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(threatId + 10000, notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Alerts for new cyber threats detected by AEGIS"
                enableVibration(true)
                enableLights(true)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        serviceScope.cancel()
        AlertManager.shutdown()
        super.onDestroy()
    }
}
