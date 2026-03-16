# Backend Service (Threat Management & Platform API)

This backend service acts as the **control plane of the AEGIS platform**.  
It does **not perform ML inference**. Instead, it:

- receives threat events from the ML service
- stores threat data
- exposes APIs for the frontend dashboard
- streams real-time alerts
- manages users and authentication
- executes response playbooks
- provides dashboard analytics

The ML service runs independently and sends detected threats to this backend.

---

# 1. Core Responsibilities

The backend service is responsible for:

```
User authentication and authorization
Threat event ingestion from ML service
Threat storage and retrieval
Real-time alert streaming
Playbook execution and response tracking
Dashboard statistics generation
Attack map data aggregation
Audit logging
Settings management
```

---

# 2. Architecture Overview

```
                ┌────────────────────┐
                │   ML Detection     │
                │     Service        │
                └─────────┬──────────┘
                          │
                          │ POST threat event
                          ▼
               ┌───────────────────────┐
               │   Backend API Server  │
               │                       │
               │ Threat Management     │
               │ Playbook Engine       │
               │ Auth Service          │
               │ Streaming Service     │
               └─────────┬─────────────┘
                         │
                         ▼
               ┌───────────────────────┐
               │      Database         │
               │ (Threats / Users)     │
               └─────────┬─────────────┘
                         │
                         ▼
               ┌───────────────────────┐
               │   Frontend Dashboard  │
               └───────────────────────┘
```

---

# 3. Technology Stack

Recommended stack:

```
FastAPI
PostgreSQL
Redis (optional for streaming)
WebSockets / Server Sent Events
JWT authentication
```

---

# 4. Threat Ingestion API (From ML Service)

The ML service sends detected threats to this backend.

Endpoint:

```
POST /api/internal/threats
```

Example request body:

```
{
  "threat_type": "Port Scan",
  "severity": "HIGH",
  "source_ip": "192.168.1.14",
  "target_system": "web-server-1",
  "confidence_score": 0.91,
  "anomaly_score": 0.87,
  "explanation": {
    "connection_rate": 0.82,
    "unique_ports": 0.77
  },
  "threat_fingerprint": [0.72,0.41,0.83,0.65]
}
```

Backend responsibilities:

```
validate event
store threat record
assign threat ID
broadcast alert to connected clients
```

---

# 5. Threat Data Model

Threat

```
id
threat_type
severity
source_ip
target_system
timestamp
status
confidence_score
anomaly_score
explanation_json
threat_fingerprint
```

Severity values:

```
CRITICAL
HIGH
MEDIUM
LOW
```

Status values:

```
INVESTIGATING
CONTAINED
BLOCKED
RESOLVED
```

---

# 6. Threat Retrieval APIs (Frontend)

### Get All Threats

```
GET /api/threats
```

Supports:

```
pagination
severity filtering
search
```

Example:

```
GET /api/threats?severity=CRITICAL&page=1&limit=20
```

---

### Get Threat Details

```
GET /api/threats/{id}
```

Returns full threat information including:

```
explanation
fingerprint
status
timestamps
```

---

### Update Threat Status

```
PATCH /api/threats/{id}/status
```

Example request:

```
{
  "status": "CONTAINED"
}
```

---

# 7. Real-Time Threat Streaming

The dashboard must receive alerts instantly.

Implementation options:

```
WebSockets
Server Sent Events (SSE)
```

Example endpoint:

```
GET /api/threats/stream
```

Responsibilities:

```
broadcast new threats
push status updates
maintain client connections
```

---

# 8. Dashboard Metrics API

Provides statistics displayed on the dashboard.

Endpoint:

```
GET /api/dashboard/stats
```

Example response:

```
{
  "critical_threats": 3,
  "active_alerts": 12,
  "threats_contained": 847,
  "avg_response_time": 0.8
}
```

Metrics computed from stored threats.

---

# 9. Attack Map Data API

Provides geographic attack data.

Endpoint:

```
GET /api/attacks/global
```

Response example:

```
[
  {
    "origin_country": "Russia",
    "origin_coordinates": [55.7558,37.6173],
    "target_coordinates": [37.7749,-122.4194],
    "severity": "HIGH"
  }
]
```

---

# 10. Playbook Automation Engine

Playbooks define automated responses to threats.

### Playbook Model

```
id
name
description
steps
created_at
```

Example steps:

```
Observe
Isolate
Remediate
Validate
```

---

### Playbook APIs

Get all playbooks:

```
GET /api/playbooks
```

Get playbook details:

```
GET /api/playbooks/{id}
```

Execute playbook:

```
POST /api/playbooks/{id}/execute
```

Execution response:

```
{
  "playbook_id": 2,
  "execution_status": "completed",
  "steps_completed": 4
}
```

---

# 11. Playbook Execution Logs

Store history of automated responses.

Model:

```
id
playbook_id
threat_id
executed_by
execution_time
status
log_entries
```

Endpoint:

```
GET /api/playbooks/logs
```

---

# 12. Authentication System

Endpoints:

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/google
GET  /api/auth/session
```

Responsibilities:

```
create users
verify credentials
issue JWT tokens
protect API routes
```

---

# 13. User Model

```
id
name
email
password_hash
role
created_at
last_login
```

Roles:

```
admin
analyst
viewer
```

---

# 14. Settings API

Endpoint:

```
GET /api/settings
PUT /api/settings
```

Possible settings:

```
alert_thresholds
notification_preferences
playbook_automation_enabled
```

---

# 15. Audit Logging

Track sensitive operations.

Examples:

```
login attempts
threat status changes
playbook execution
settings updates
```

Audit log model:

```
id
user_id
action
timestamp
metadata
```

---

# 16. Minimum Backend Needed for Prototype

For a working demo the backend must implement:

```
authentication system
threat ingestion endpoint
threat retrieval APIs
real-time threat streaming
dashboard statistics endpoint
playbook execution simulation
attack map data endpoint
```

This allows the frontend dashboard to operate fully while the ML service sends threat events to the platform.
```
