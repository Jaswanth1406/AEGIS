# AI Threat Analysis & SHAP Integration 

This document details the newly added AI Analysis capability for the AEGIS control plane. The backend now natively supports ingesting model explainability metrics (SHAP values) and leveraging a Large Language Model (Gemini 1.5 Flash via AIPipe) to automatically synthesize a human-readable executive summary of the threat.

## 1. Feature Overview

Security analysts require rapid, interpretable context when a threat is detected. The ML inference engine acts as a "black box" generating anomaly scores. To increase trust and reduce investigation time, the AEGIS platform now:

1. **Ingests SHAP (SHapley Additive exPlanations) values** sent directly from the ML engine.
2. **Generates an AI Summary** by feeding the threat context and the SHAP feature importances to a Gemini AI model.
3. **Delivers Real-Time Updates** to the frontend dashboard via Server-Sent Events (SSE).

## 2. Configuration & Setup

The AI features require an API token from `aipipe.org`. These are loaded via environment variables or an `.env` file in the project root.

```env
# Required for AI generation feature
AEGIS_AI_API_KEY="your_aipipe_token"

# Optional: Override the target model (defaults to gemini-1.5-flash)
AEGIS_AI_MODEL="gemini-1.5-flash"
```

*Note: If `AEGIS_AI_API_KEY` is not set, the platform falls back gracefully, ingesting the threat and SHAP values without executing the AI background task.*

## 3. Threat Ingestion Payload 

The `POST /api/internal/threats` endpoint has been updated. The ML detection service **must** include the `shap_values` array when sending a threat event.

**Example Ingestion Request:**
```json
{
  "threat_type": "Data Exfiltration",
  "severity": "HIGH",
  "source_ip": "192.168.1.45",
  "target_system": "db-server-1",
  "confidence_score": 0.94,
  "anomaly_score": 0.88,
  "explanation": {"port_usage": "non-standard"},
  "shap_values": [
    {"feature": "bytes_out", "value": 0.45},
    {"feature": "dst_port_uncommon", "value": 0.22},
    {"feature": "failed_logins", "value": -0.05}
  ],
  "threat_fingerprint": [0.1, 0.2, 0.3, 0.4]
}
```

The `shap_values` array contains exactly what features pushed the anomaly score up (positive values) or down (negative values).

## 4. Asynchronous Architecture

Because querying an LLM takes multiple seconds and ML pipelines require low-latency ingestion, the AI generation operates asynchronously.

### The Pipeline Flow:
1. **Receipt:** The backend receives the `POST` request and immediately persists the threat and `shap_values` to the SQLite database. 
2. **Immediate Return:** The backend responds with a `201 Created`, freeing the ML engine. The `ai_analysis` field is initially `null`.
3. **Background Processing:** A FastAPI `BackgroundTask` is fired off (see `app/services/ai_service.py`), packaging the threat details and sending them to `aipipe.org`.
4. **SSE Broadcast:** Once the Gemini API responds (typically 2-4 seconds later), the background task updates the database and publishes a `threat.ai_analysis_completed` event to the `GET /api/threats/stream` WebSocket/SSE stream.

## 5. Fetching the Output 

Frontend dashboards or analysts fetching a specific threat via `GET /api/threats/{id}` will now see the populated AI fields.

**Example Threat Response:**
```json
{
  "id": 1,
  "threat_type": "Data Exfiltration",
  "severity": "HIGH",
  "source_ip": "192.168.1.45",
  "target_system": "db-server-1",
  "timestamp": "2026-03-16T11:29:18Z",
  "status": "INVESTIGATING",
  "confidence_score": 0.94,
  "anomaly_score": 0.88,
  "shap_values": [
    {"feature": "bytes_out", "value": 0.45},
    {"feature": "dst_port_uncommon", "value": 0.22}
  ],
  "ai_analysis": "The model flagged this event primarily due to a massive spike in outbound byte transfers (SHAP: +0.45) corresponding with an uncommon destination port (SHAP: +0.22), heavily indicating non-standard data exfiltration behavior.",
  "fingerprint": [0.1, 0.2, 0.3, 0.4]
}
```
