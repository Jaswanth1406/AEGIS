# AEGIS Playbook System Architecture 

The AEGIS Playbook system is a powerful, event-driven Security Orchestration, Automation, and Response (SOAR) engine. It is designed to allow security analysts and administrators to codify their incident response (IR) procedures into reusable, automated templates.

This document provides a high-level overview of how the Playbook system works, its components, and its lifecycle.

---

## 1. Core Concepts

### What is a Playbook?
A Playbook in AEGIS is a **global, reusable template** that defines a sequence of automated or manual actions to take when a specific security threat is detected. 

Instead of treating playbooks as static text fields or simple checklists, AEGIS playbooks are composed of programmatic **Actions**. 

### What is an Action?
An Action is a predefined functional block of code executed by the AEGIS backend. Actions can simulate interactions with infrastructure, such as updating firewall rules, quarantining devices, isolating subnets, or revoking active Active Directory sessions.

### Dynamic Variable Injection
Playbooks are designed to be generic. For example, instead of hardcoding an IP address to block, a playbook uses variables like `{source_ip}`. When the playbook is executed against a specific Threat, the AEGIS Action Engine dynamically extracts the real IP address from the Threat object and injects it into the action.

---

## 2. System Architecture

The Playbook system consists of three main tiers:

### A. The Database Tier
- **Playbooks Table:** Stores the playbook metadata (Name, Description) and the raw JSON array representing the steps/actions to execute.
- **Threats Table:** Stores the ingest data from the ML engine (IPs, anomaly scores, SHAP values, affected systems).
- **Execution Logs Table:** An immutable ledger that tracks every time a playbook is run against a threat. It records who ran it, how long it took, the overall success status, and a detailed breakdown of every single step that was executed.

### B. The API Tier
The FastAPI layer exposes REST endpoints that allow the frontend to:
1. **CRUD Playbooks:** Create, Read, Update, and Delete global playbook templates (`POST /api/playbooks`).
2. **Execute Playbooks:** Send a command to run a specific `playbook_id` against a specific `threat_id` (`POST /api/playbooks/{playbook_id}/execute`).
3. **Audit Execution:** Retrieve execution logs to prove compliance to auditors (`GET /api/playbooks/logs`).

### C. The Action Engine Tier (`playbook_service.py` & `action_handlers.py`)
This is the "brain" of the playbook system. When an execution request is received, the Action Engine:
1. Validates the playbook and the threat.
2. Loops through the JSON array of steps sequentially.
3. Injects the Threat's dynamic variables into the step's parameters.
4. Routes the step to the corresponding asynchronous Python function in the `ACTION_REGISTRY`.
5. Captures the output or failure of each step and logs it.

---

## 3. The Playbook Lifecycle

Here is exactly how a Playbook flows through the system from creation to execution:

### Step 1: Creation & Configuration (Frontend -> Backend)
A security administrator navigates to the "Playbooks" tab in the frontend and clicks "Create New". 
They define a playbook named **"High Severity Data Exfiltration Response"**.
Using a visual drag-and-drop builder, they add three modules:
1. Block the attacker's IP.
2. Quarantine the compromised internal server.
3. Mark the threat as 'MITIGATED' in the database.

The frontend sends this to the backend as a structured JSON array:
```json
[
  {"action": "block_ip", "params": {"ip": "{source_ip}"}},
  {"action": "quarantine_device", "params": {"system_name": "{target_system}"}},
  {"action": "update_threat_status", "params": {"status": "MITIGATED"}}
]
```

### Step 2: Analyst Triage (Frontend)
Later, the ML inference engine detects a real attack. A threat alert appears on the analyst's dashboard.
The analyst reviews the AI-generated summary and the SHAP values. They confirm it is a true positive.
The analyst selects the threat, opens the "Response" menu, and clicks **"Execute Playbook: High Severity Data Exfiltration Response"**.

### Step 3: Execution (Action Engine)
The UI sends `POST /api/playbooks/1/execute` with the payload `{"threat_id": 45}`.
The Action Engine wakes up and parses Playbook #1 and Threat #45.
- It sees Action 1 (`block_ip`). It looks at Threat #45, extracts the `source_ip` (`10.0.0.99`), and calls the Python handler. The IP is appended to the firewall blocklist.
- It sees Action 2 (`quarantine_device`). It extracts the `target_system` (`db-cluster-01`) and calls the handler. The system is added to the EDR quarantine list.
- It sees Action 3 (`update_threat_status`). It modifies the database state, and broadcasts a WebSocket/SSE event.

### Step 4: Resolution & Audit
The analyst's UI instantly updates the threat status badge to `MITIGATED` via the WebSocket event without reloading the page. 
A permanent log is written to the `PlaybookExecutionLogs` table, proving to auditors that at precisely *2:14 PM*, Analyst John Doe executed Playbook #1 against Threat #45, successfully isolating the network in 0.04 seconds.

---

## 4. Current Mock Integrations

Because the AEGIS backend cannot talk to real enterprise firewalls in this isolated environment, it simulates these real-world SOAR integrations by writing to specific state files in the `/storage` directory. 

* **Network Integrations:** `storage/firewall_blocklist.txt`, `storage/isolated_subnets.txt`
* **Endpoint Integrations:** `storage/quarantine_list.txt`, `storage/av_scan_queue.txt`
* **IAM Integrations:** `storage/revoked_sessions.txt`, `storage/locked_ad_accounts.txt`
* **Ticketing:** `storage/tier2_escalations.txt`
