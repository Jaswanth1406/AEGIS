package com.example.aegis.service

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.speech.tts.TextToSpeech
import java.util.Locale

/**
 * Singleton managing voice alerts (TTS) and heavy vibration for threat detection.
 * Designed to run from ThreatPollingService in background — speaks when
 * new threats arrive via notification, NOT on UI interaction.
 */
object AlertManager {

    private var tts: TextToSpeech? = null
    private var ttsReady = false

    /**
     * Initialize TTS engine. Safe to call multiple times.
     */
    fun init(context: Context) {
        if (tts != null) return
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale.US
                // Clear, authoritative voice settings
                tts?.setSpeechRate(0.85f)   // Slightly slower for clarity
                tts?.setPitch(0.95f)        // Natural, slightly deep for urgency
                ttsReady = true
            }
        }
    }

    /**
     * Generate and speak a concise 1-line natural summary.
     * Examples:
     *   "Critical DDoS Attack detected on Web Server"
     *   "High severity SQL Injection detected"
     *   "Medium Port Scan detected on Database"
     */
    fun speakThreatSummary(
        threatType: String,
        severity: String,
        targetSystem: String? = null
    ) {
        if (!ttsReady) return

        // Build a concise, natural 1-line summary — type + severity + optional target
        val target = if (!targetSystem.isNullOrBlank()) " on $targetSystem" else ""
        val summary = when (severity.uppercase()) {
            "CRITICAL" -> "Critical $threatType detected$target"
            "HIGH" -> "High severity $threatType detected$target"
            "MEDIUM" -> "Medium $threatType detected$target"
            else -> "$threatType detected$target"
        }

        tts?.speak(summary, TextToSpeech.QUEUE_ADD, null, "threat_${System.currentTimeMillis()}")
    }

    /**
     * Trigger heavy, long vibration based on severity.
     * CRITICAL: 5 heavy bursts at max amplitude (~3.5s)
     * HIGH:     3 heavy bursts (~2s)
     * MEDIUM:   2 medium bursts (~1s)
     * LOW:      1 short pulse
     */
    fun vibrate(context: Context, severity: String) {
        val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val mgr = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
            mgr?.defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        } ?: return

        val pattern = when (severity.uppercase()) {
            "CRITICAL" -> longArrayOf(0, 500, 150, 500, 150, 500, 150, 500, 200, 800)
            "HIGH" -> longArrayOf(0, 400, 200, 400, 200, 600)
            "MEDIUM" -> longArrayOf(0, 300, 150, 300)
            else -> longArrayOf(0, 150)
        }

        val amplitudes = when (severity.uppercase()) {
            "CRITICAL" -> intArrayOf(0, 255, 0, 255, 0, 255, 0, 255, 0, 255)
            "HIGH" -> intArrayOf(0, 230, 0, 240, 0, 255)
            "MEDIUM" -> intArrayOf(0, 180, 0, 200)
            else -> intArrayOf(0, 120)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            vibrator.vibrate(VibrationEffect.createWaveform(pattern, amplitudes, -1))
        } else {
            @Suppress("DEPRECATION")
            vibrator.vibrate(pattern, -1)
        }
    }

    /**
     * Shutdown TTS engine. Call from Service.onDestroy().
     */
    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        ttsReady = false
    }
}
