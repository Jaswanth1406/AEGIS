# AEGIS Backend API Guide

This backend is intentionally open.

- No authentication
- No authorization/role checks
- No API key checks

Base URL (local):

```bash
http://127.0.0.1:8000
```

Run server:

```bash
python -m uvicorn app.main:app --reload
```

## Common Header

For JSON body requests:

```bash
-H "Content-Type: application/json"
```

## 1. Health

### GET /health

Returns service status.

```bash
curl -X GET "http://127.0.0.1:8000/health"
```

## 2. Threat APIs

### POST /api/internal/threats

Ingest a threat event.

```bash
curl -X POST "http://127.0.0.1:8000/api/internal/threats" \
  -H "Content-Type: application/json" \
  -d '{
    "threat_type": "Data Exfiltration",
    "severity": "HIGH",
    "source_ip": "192.168.1.45",
    "target_system": "db-server-1",
    "confidence_score": 0.94,
    "anomaly_score": 0.88,
    "explanation": {"port_usage": "non-standard"},
    "shap_values": [
      {"feature": "bytes_out", "value": 0.45},
      {"feature": "dst_port_uncommon", "value": 0.22}
    ],
    "threat_fingerprint": [0.1, 0.2, 0.3, 0.4]
  }'
```

### GET /api/threats

List threats with pagination and optional filters.

Query params:
- `page` default `1`
- `limit` default `20` max `200`
- `severity` optional
- `search` optional

```bash
curl -X GET "http://127.0.0.1:8000/api/threats?page=1&limit=20"
```

### GET /api/threats/{threat_id}

Fetch one threat by id.

```bash
curl -X GET "http://127.0.0.1:8000/api/threats/1"
```

### PATCH /api/threats/{threat_id}/status

Update threat status.

```bash
curl -X PATCH "http://127.0.0.1:8000/api/threats/1/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "CONTAINED"}'
```

### GET /api/threats/stream

Server-sent events stream for threat updates.

Note: Do not pass `token` query param; this API is open.

```bash
curl -N -X GET "http://127.0.0.1:8000/api/threats/stream"
```

## 3. Dashboard APIs

### GET /api/dashboard/stats

Returns dashboard summary metrics.

```bash
curl -X GET "http://127.0.0.1:8000/api/dashboard/stats"
```

### GET /api/attacks/global

Returns attack-map entries.

```bash
curl -X GET "http://127.0.0.1:8000/api/attacks/global"
```

## 4. Playbook APIs

### GET /api/playbooks

List playbooks.

```bash
curl -X GET "http://127.0.0.1:8000/api/playbooks"
```

### POST /api/playbooks

Create a playbook.

```bash
curl -X POST "http://127.0.0.1:8000/api/playbooks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contain Host",
    "description": "Contain compromised endpoint",
    "steps": ["Isolate host", "Block IOC", "Notify SOC"]
  }'
```

### GET /api/playbooks/{playbook_id}

Get one playbook.

```bash
curl -X GET "http://127.0.0.1:8000/api/playbooks/1"
```

### PUT /api/playbooks/{playbook_id}

Update a playbook.

```bash
curl -X PUT "http://127.0.0.1:8000/api/playbooks/1" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "steps": ["Isolate host", "Collect forensic snapshot"]
  }'
```

### GET /api/playbooks/logs

List playbook execution logs.

```bash
curl -X GET "http://127.0.0.1:8000/api/playbooks/logs"
```

### POST /api/playbooks/{playbook_id}/execute

Execute a playbook against a threat.

```bash
curl -X POST "http://127.0.0.1:8000/api/playbooks/1/execute" \
  -H "Content-Type: application/json" \
  -d '{"threat_id": 1}'
```

## 5. Settings APIs

### GET /api/settings

Get settings.

```bash
curl -X GET "http://127.0.0.1:8000/api/settings"
```

### PUT /api/settings

Update settings.

```bash
curl -X PUT "http://127.0.0.1:8000/api/settings" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_thresholds": {"critical": 0.9, "high": 0.75, "medium": 0.5},
    "notification_preferences": {"email": true, "slack": false},
    "playbook_automation_enabled": false
  }'
```
