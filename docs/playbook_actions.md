# AEGIS Playbook Action Engine Guide

The AEGIS Playbook system has been upgraded to an Event-Driven Action Engine. Playbooks are no longer simple text lists; they are composed of predefined functional actions that the backend can execute natively against the infrastructure.

## Data Structure

When communicating with the `POST /api/playbooks` or `PUT /api/playbooks/{id}` endpoints, the `steps` array must be an array of JSON objects instead of strings.

### Schema:
```json
{
  "action": "action_name_here",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

## Variable Injection
The Action Engine supports dynamic variable resolution. When a playbook is executed against a given `Threat`, the frontend can configure playbook parameters to pull data dynamically from the target threat. 

**Supported Injectables:**
- `{id}` (The Threat ID)
- `{source_ip}`
- `{target_system}`
- `{threat_type}`
- *(Any other property natively available on the Threat object)*

Example:
```json
{"action": "block_ip", "params": {"ip": "{source_ip}"}}
```
When this action runs against Threat #5 (which has `source_ip=192.168.1.50`), the engine will automatically resolve the IP and block `192.168.1.50`.

---

## Supported Action Registry

The Frontend team should use the following predefined `action` keys to build the Playbook builder UI.

### 1. Network & Infrastructure
* `block_ip`
  * **Description:** Simulates an external firewall block by adding the IP to the local blocklist.
  * **Required Params:** `ip` (string)
* `isolate_subnet`
  * **Description:** Simulates an ACL update to contain an infected subnet.
  * **Required Params:** `subnet` (string)

### 2. Endpoint & Asset Management
* `quarantine_device`
  * **Description:** Simulates an EDR network quarantine operation.
  * **Required Params:** `system_name` (string)
* `trigger_antivirus_scan`
  * **Description:** Queues a targeted antivirus operation for the given system.
  * **Required Params:** `system_name` (string)

### 3. Identity and Access Management (IAM)
* `force_user_logout`
  * **Description:** Simulates SSO session revocation for an identifier (e.g., username or IP).
  * **Required Params:** `identifier` (string)
* `lock_active_directory_account`
  * **Description:** Simulates an Active Directory lock across the domain.
  * **Required Params:** `username` (string)

### 4. Internal Platform
* `update_threat_status`
  * **Description:** Updates the active threat state in the database and broadcasts a Server-Sent Event (SSE) to update the UI instantly without a refresh.
  * **Required Params:** `status` (string, e.g., "MITIGATED", "CONTAINED", "IGNORED")
* `escalate_to_tier2`
  * **Description:** Simulates escalating the incident to a Tier 2 security analyst ticketing system.
  * **Required Params:** `threat_id` (string)

---

## Adding New Actions (For Backend Developers)

If you need to add a new functional action to the engine, follow these two steps:

1. **Create the Handler Function:**
   Open `app/services/action_handlers.py` and create a new async function. It must accept `(db: Session, threat: Threat, params: dict)` and return a string describing the outcome.

   ```python
   async def handle_new_action(db: Session, threat: Threat, params: dict) -> str:
       # Your custom logic here
       my_param = params.get("my_param")
       return f"Successfully executed with {my_param}"
   ```

2. **Register the Action:**
   At the bottom of `app/services/action_handlers.py`, add your action mapping to the `ACTION_REGISTRY` dictionary.

   ```python
   ACTION_REGISTRY = {
       # ... existing actions ...
       "my_new_action": handle_new_action
   }
   ```
3. **Document It:** Add the new action to the Supported Action Registry section above so the frontend team knows it is available!

---

## Executing Playbooks Against Threats

Playbooks are **global reusable templates**, meaning they are not bound to a specific threat until you actually execute them. 

Once your frontend has obtained a `Threat.id` (perhaps from the analyst viewing the threat details page) and the `Playbook.id` (from the analyst selecting a playbook to run), you trigger the Action Engine via the API.

To execute Playbook ID `5` against Threat ID `12`, the frontend makes this `POST` request:

```bash
POST /api/playbooks/5/execute
Content-Type: application/json

{
  "threat_id": 12
}
```

The backend Action Engine will instantly fetch the `steps` array defined in Playbook `5` and execute them line-by-line while injecting the properties from Threat `12`!

---

## AI-Powered Playbook Suggestions

When a new threat is ingested via `POST /api/internal/threats`, the system automatically generates a **suggested playbook** using Gemini AI. The AI analyzes the threat type, severity, SHAP values, and context to compose an optimal response playbook from the 8 available actions.

### How It Works
1. Threat is ingested → background task runs.
2. AI generates both a text analysis AND a `suggested_playbook` JSON array.
3. The `suggested_playbook` field on the threat becomes non-null.
4. Frontend renders a "🤖 Suggested Playbook" card on the threat detail page.

### Frontend Workflow

**Approve (as-is):**
```bash
POST /api/threats/{threat_id}/approve-playbook
{"name": "AI Response Plan", "description": "Auto-generated"}
```
Uses the AI suggestion directly and saves it as a real Playbook.

**Approve (edited):**
```bash
POST /api/threats/{threat_id}/approve-playbook
{
  "name": "Custom Response Plan",
  "description": "Edited from AI suggestion",
  "steps": [
    {"action": "block_ip", "params": {"ip": "{source_ip}"}},
    {"action": "update_threat_status", "params": {"status": "MITIGATED"}}
  ]
}
```
Overrides the AI steps with the admin's edits.

**Dismiss:**
```bash
DELETE /api/threats/{threat_id}/dismiss-playbook
```
Clears the suggestion from the threat.
