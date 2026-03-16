# AEGIS Adaptive Honeytokens Guide

The AEGIS Honeytoken system allows administrators to deploy lightweight decoy assets (fake credentials, API keys, database records) inside their infrastructure. Any interaction with these assets is a **high-confidence indicator of compromise** that automatically triggers a CRITICAL-severity threat alert.

---

## 1. What is a Honeytoken?

A honeytoken is a deliberately planted fake asset that legitimate users should **never** interact with. Unlike honeypots (full decoy systems), honeytokens are lightweight traps embedded inside real systems.

Examples:
| Type | Example Value | Where to Plant |
|------|---------------|----------------|
| `credential` | `admin_backup:XyZ123!dummy` | `config/secrets.yml` |
| `api_key` | `API_KEY_TEST_INTERNAL_4f8a` | `.env.production` |
| `database_record` | `customer_id: 000000` | `users` table |
| `file` | `classified_report.pdf` | Shared network drive |
| `url` | `https://internal.corp/secret-admin` | Internal wiki |

**If someone accesses one → they are almost certainly an attacker.**

---

## 2. API Endpoints

### Create a Honeytoken
```bash
POST /api/honeytokens
Content-Type: application/json

{
  "name": "Backup Admin Creds",
  "token_type": "credential",
  "token_value": "admin_backup:XyZ123!dummy",
  "deployed_location": "config/secrets.yml"
}
```

### List All Honeytokens
```bash
GET /api/honeytokens
```

### Get One Honeytoken
```bash
GET /api/honeytokens/{id}
```

### Deactivate a Honeytoken
```bash
DELETE /api/honeytokens/{id}
```
Sets the status to `deactivated`. Does not delete the record.

### Trigger / Validate a Honeytoken
```bash
POST /api/honeytokens/validate
Content-Type: application/json

{
  "token_value": "admin_backup:XyZ123!dummy",
  "source_ip": "203.0.113.50",
  "context": {"method": "SSH login", "geo": "unknown"}
}
```
This is the **critical endpoint**. When called:
1. The honeytoken is marked as `triggered` with a timestamp.
2. A **CRITICAL** threat is auto-generated with `confidence_score: 1.0`.
3. An SSE event is broadcast so the dashboard updates instantly.
4. The AI background task generates an analysis AND a suggested playbook.

---

## 3. Honeytoken Lifecycle

```
Admin creates honeytoken via POST /api/honeytokens
                    ↓
          Status: "active"
                    ↓
    Deployed in real infrastructure
                    ↓
   Attacker discovers and uses the decoy
                    ↓
   External system calls POST /api/honeytokens/validate
                    ↓
          Status: "triggered"
                    ↓
   CRITICAL threat auto-generated in AEGIS
                    ↓
   AI suggests a response playbook
                    ↓
   Admin approves & executes playbook
```

---

## 4. Response Schema

### Honeytoken Object
```json
{
  "id": 1,
  "name": "Backup Admin Creds",
  "token_type": "credential",
  "token_value": "admin_backup:XyZ123!dummy",
  "deployed_location": "config/secrets.yml",
  "status": "active",
  "triggered_at": null,
  "created_at": "2026-03-16T16:20:57.793544"
}
```

### After Trigger
```json
{
  "status": "triggered",
  "triggered_at": "2026-03-16T16:20:57.908886"
}
```

### Auto-Generated Threat
```json
{
  "threat_type": "Honeytoken Triggered: Backup Admin Creds",
  "severity": "CRITICAL",
  "source_ip": "203.0.113.50",
  "target_system": "config/secrets.yml",
  "confidence_score": 1.0,
  "anomaly_score": 1.0,
  "explanation": {
    "honeytoken_id": 1,
    "honeytoken_type": "credential",
    "deployed_location": "config/secrets.yml",
    "context": {"method": "SSH login", "geo": "unknown"}
  }
}
```

---

## 5. Playbook Integration

Honeytokens are fully integrated with the Playbook Action Engine.

### Using `deploy_honeytoken` in Playbooks
You can include `deploy_honeytoken` as a step in any playbook to automatically plant new decoys during incident response:

```json
{
  "action": "deploy_honeytoken",
  "params": {
    "name": "post_incident_trap",
    "token_type": "credential",
    "token_value": "service_recovery:Tmp!9x2k",
    "deployed_location": "recovery/config.yml"
  }
}
```

If `token_value` is omitted, a random unique value is generated automatically.

---

## 6. Frontend Integration Guide

### Dashboard View
- Fetch honeytokens via `GET /api/honeytokens`.
- Display a table with Name, Type, Location, Status, and Created/Triggered timestamps.
- Color-code by status: 🟢 active, 🔴 triggered, ⚫ deactivated.

### Threat Detail View
- When a threat has `threat_type` starting with `"Honeytoken Triggered:"`, display a special badge indicating it was a honeytoken-sourced alert.
- These threats have `confidence_score: 1.0`, making them the highest-priority alerts.

### Creating Honeytokens
- Provide a form with fields: Name, Type (dropdown), Value, Deployed Location.
- On submit, `POST /api/honeytokens`.
