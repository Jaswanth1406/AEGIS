import httpx
import json

from app.core.config import settings


def _mock_threat_analysis(threat_data: dict, shap_values: list[dict]) -> str:
    threat_type = threat_data.get("threat_type", "Unknown Threat")
    source_ip = threat_data.get("source_ip", "unknown")
    target_system = threat_data.get("target_system", "unknown-system")
    severity = threat_data.get("severity", "UNKNOWN")
    top_features = [item.get("feature") for item in shap_values if isinstance(item, dict) and item.get("feature")]
    feature_hint = f" Top contributors: {', '.join(top_features[:3])}." if top_features else ""
    return (
        f"{severity} {threat_type} activity was detected from {source_ip} against {target_system}."
        f" AEGIS recommends immediate containment and post-incident validation.{feature_hint}"
    )


def _mock_playbook_suggestion(threat_data: dict) -> list[dict]:
    return [
        {"action": "block_ip", "params": {"ip": "{source_ip}"}},
        {"action": "quarantine_device", "params": {"system_name": "{target_system}"}},
        {"action": "update_threat_status", "params": {"status": "MITIGATED"}},
    ]

async def generate_threat_analysis(threat_data: dict, shap_values: list[dict]) -> str | None:
    if not settings.ai_api_key:
        return _mock_threat_analysis(threat_data, shap_values)

    # Construct the prompt
    prompt = f"""
    Analyze the following threat event and its SHAP feature importance values. 
    Provide a concise, 1-2 sentence executive summary of what happened and why the model flagged it, 
    based primarily on the features with the highest SHAP values.

    Threat Details:
    - Type: {threat_data.get('threat_type')}
    - Severity: {threat_data.get('severity')}
    - Source IP: {threat_data.get('source_ip')}
    - Target System: {threat_data.get('target_system')}

    SHAP Values (Feature Importance):
    {shap_values}
    """

    url = f"https://aipipe.org/geminiv1beta/models/{settings.ai_model}:generateContent"
    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            # Extract the generated text from Gemini's response structure
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "").strip()
            
            return None
    except Exception as e:
        print(f"Error generating AI analysis: {e}")
        return _mock_threat_analysis(threat_data, shap_values)


AVAILABLE_ACTIONS = [
    {"name": "block_ip", "description": "Block an IP address via firewall", "params": ["ip"]},
    {"name": "isolate_subnet", "description": "Isolate a network subnet to contain lateral movement", "params": ["subnet"]},
    {"name": "quarantine_device", "description": "Quarantine an endpoint via EDR", "params": ["system_name"]},
    {"name": "trigger_antivirus_scan", "description": "Queue a deep antivirus scan on a system", "params": ["system_name"]},
    {"name": "force_user_logout", "description": "Revoke active sessions for a user/IP", "params": ["identifier"]},
    {"name": "lock_active_directory_account", "description": "Lock an Active Directory account", "params": ["username"]},
    {"name": "escalate_to_tier2", "description": "Escalate the incident to a Tier 2 analyst", "params": ["threat_id"]},
    {"name": "update_threat_status", "description": "Update the threat status in the database", "params": ["status"]},
]

VALID_ACTION_NAMES = {a["name"] for a in AVAILABLE_ACTIONS}


async def generate_playbook_suggestion(threat_data: dict, shap_values: list[dict]) -> list[dict] | None:
    if not settings.ai_api_key:
        return _mock_playbook_suggestion(threat_data)

    prompt = f"""You are a cybersecurity incident response AI. Based on the threat below, generate a playbook — an ordered list of response actions.

You MUST respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Available actions (you may ONLY use these):
{json.dumps(AVAILABLE_ACTIONS, indent=2)}

You can use these dynamic variables inside string parameter values:
- {{source_ip}} — the attacker's IP
- {{target_system}} — the compromised system name
- {{id}} — the threat ID

Threat Details:
- Type: {threat_data.get('threat_type')}
- Severity: {threat_data.get('severity')}
- Source IP: {threat_data.get('source_ip')}
- Target System: {threat_data.get('target_system')}
- Confidence Score: {threat_data.get('confidence_score')}
- Anomaly Score: {threat_data.get('anomaly_score')}

SHAP Values (Feature Importance):
{json.dumps(shap_values, indent=2) if shap_values else "None provided"}

Respond with a JSON array like:
[
  {{"action": "block_ip", "params": {{"ip": "{{source_ip}}"}}}},
  {{"action": "update_threat_status", "params": {{"status": "MITIGATED"}}}}
]
"""

    url = f"https://aipipe.org/geminiv1beta/models/{settings.ai_model}:generateContent"
    headers = {
        "Authorization": f"Bearer {settings.ai_api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload, timeout=15.0)
            response.raise_for_status()
            data = response.json()

            candidates = data.get("candidates", [])
            if not candidates:
                return None

            raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()

            # Strip markdown code fences if the model wraps them
            if raw_text.startswith("```"):
                raw_text = raw_text.split("\n", 1)[-1]  # remove first line
                raw_text = raw_text.rsplit("```", 1)[0]  # remove trailing fence
                raw_text = raw_text.strip()

            steps = json.loads(raw_text)

            # Validate: only keep steps with known action names
            validated = []
            for step in steps:
                if isinstance(step, dict) and step.get("action") in VALID_ACTION_NAMES:
                    validated.append(step)

            return validated if validated else None

    except Exception as e:
        print(f"Error generating playbook suggestion: {e}")
        return _mock_playbook_suggestion(threat_data)
