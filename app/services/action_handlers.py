import json
import logging
import os
import re
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.threat import Threat
from app.streaming.sse import threat_event_bus

STORAGE_DIR = Path("storage")
STORAGE_DIR.mkdir(exist_ok=True)

logger = logging.getLogger(__name__)

def _inject_variables(text: str, threat: Threat) -> str:
    """Replaces {variable_name} in the text with the actual value from the Threat object."""
    def replacer(match):
        var_name = match.group(1)
        # Handle stringification of properties safe-ly
        value = getattr(threat, var_name, None)
        return str(value) if value is not None else match.group(0)
        
    return re.sub(r'\{([a-zA-Z0-9_]+)\}', replacer, text)


def _resolve_params(params: dict, threat: Threat) -> dict:
    """Iterates through dictionary parameters and injects threat variables into string values."""
    resolved = {}
    for key, val in params.items():
        if isinstance(val, str):
            resolved[key] = _inject_variables(val, threat)
        else:
            resolved[key] = val
    return resolved


# --- Action Implementations ---

async def handle_block_ip(db: Session, threat: Threat, params: dict) -> str:
    ip = params.get("ip")
    if not ip:
        raise ValueError("Missing 'ip' parameter")
    
    file_path = STORAGE_DIR / "firewall_blocklist.txt"
    with open(file_path, "a") as f:
        f.write(f"{ip}\n")
        
    # LIVE DEMO INTEGRATION: Try to actually block it on the Target System
    import httpx
    target_control_url = "http://127.0.0.1:8001/_control/action"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                target_control_url, 
                json={"action": "block_ip", "ip": ip},
                timeout=2.0
            )
            if resp.status_code == 200:
                logger.info(f"Successfully enforced block_ip for {ip} on Target System.")
                return f"Appended {ip} to blocklist AND successfully enforced on Target System."
    except Exception as e:
        logger.warning(f"Could not reach Target System to enforce block ({e}). Proceeded with local logging only.")
        
    return f"Appended {ip} to firewall_blocklist.txt (Target System offline)"


async def handle_isolate_subnet(db: Session, threat: Threat, params: dict) -> str:
    subnet = params.get("subnet")
    if not subnet:
        raise ValueError("Missing 'subnet' parameter")
        
    file_path = STORAGE_DIR / "isolated_subnets.txt"
    with open(file_path, "a") as f:
        f.write(f"{subnet}\n")
    return f"Appended {subnet} to isolated_subnets.txt"


async def handle_quarantine_device(db: Session, threat: Threat, params: dict) -> str:
    system = params.get("system_name")
    if not system:
        raise ValueError("Missing 'system_name' parameter")
        
    file_path = STORAGE_DIR / "quarantine_list.txt"
    with open(file_path, "a") as f:
        f.write(f"{system}\n")
    return f"Quarantined system {system}"


async def handle_trigger_antivirus_scan(db: Session, threat: Threat, params: dict) -> str:
    system = params.get("system_name")
    if not system:
        raise ValueError("Missing 'system_name' parameter")
        
    file_path = STORAGE_DIR / "av_scan_queue.txt"
    with open(file_path, "a") as f:
        f.write(f"{system}\n")
    return f"Queued AV scan for {system}"


async def handle_force_user_logout(db: Session, threat: Threat, params: dict) -> str:
    identifier = params.get("identifier")
    if not identifier:
        raise ValueError("Missing 'identifier' parameter")
        
    file_path = STORAGE_DIR / "revoked_sessions.txt"
    with open(file_path, "a") as f:
        f.write(f"{identifier}\n")
    return f"Revoked session for {identifier}"


async def handle_lock_active_directory_account(db: Session, threat: Threat, params: dict) -> str:
    username = params.get("username")
    if not username:
        raise ValueError("Missing 'username' parameter")
        
    file_path = STORAGE_DIR / "locked_ad_accounts.txt"
    with open(file_path, "a") as f:
        f.write(f"{username}\n")
    return f"Locked AD account {username}"


async def handle_escalate_to_tier2(db: Session, threat: Threat, params: dict) -> str:
    threat_id = params.get("threat_id")
    if not threat_id:
        raise ValueError("Missing 'threat_id' parameter")
        
    file_path = STORAGE_DIR / "tier2_escalations.txt"
    with open(file_path, "a") as f:
        f.write(f"Threat {threat_id} (Severity: {threat.severity})\n")
    return f"Escalated Threat {threat_id} to Tier 2"


async def handle_update_threat_status(db: Session, threat: Threat, params: dict) -> str:
    status = params.get("status")
    if not status:
        raise ValueError("Missing 'status' parameter")
        
    threat.status = status
    db.commit()
    db.refresh(threat)
    
    # Needs to be extracted to avoid circular imports. We can just broadcast a raw dict 
    # instead of using to_threat_response for simplicity inside the action runner.
    
    # Broadcast status updated specifically:
    await threat_event_bus.publish({
        "event": "threat.status_updated", 
        "payload": {"id": threat.id, "status": status}
    })
    
    return f"Updated threat {threat.id} status to {status}"


async def handle_deploy_honeytoken(db: Session, threat: Threat, params: dict) -> str:
    """Creates a new honeytoken entry in the DB and writes a decoy file to storage/honeytokens/."""
    from app.models.honeytoken import Honeytoken
    import uuid

    name = params.get("name", f"auto_honeytoken_{threat.id}")
    token_type = params.get("token_type", "credential")
    token_value = params.get("token_value", f"decoy_{uuid.uuid4().hex[:12]}")
    deployed_location = params.get("deployed_location", f"auto/threat_{threat.id}")

    # Create DB entry
    token = Honeytoken(
        name=name,
        token_type=token_type,
        token_value=token_value,
        deployed_location=deployed_location,
    )
    db.add(token)
    db.commit()
    db.refresh(token)

    # Write decoy file
    honey_dir = STORAGE_DIR / "honeytokens"
    honey_dir.mkdir(exist_ok=True)
    decoy_file = honey_dir / f"{token.id}_{name}.txt"
    with open(decoy_file, "w") as f:
        f.write(f"type={token_type}\nvalue={token_value}\nlocation={deployed_location}\n")

    return f"Deployed honeytoken '{name}' (ID: {token.id}) to {deployed_location}"


# --- Action Registry ---

ACTION_REGISTRY = {
    "block_ip": handle_block_ip,
    "isolate_subnet": handle_isolate_subnet,
    "quarantine_device": handle_quarantine_device,
    "trigger_antivirus_scan": handle_trigger_antivirus_scan,
    "force_user_logout": handle_force_user_logout,
    "lock_active_directory_account": handle_lock_active_directory_account,
    "escalate_to_tier2": handle_escalate_to_tier2,
    "update_threat_status": handle_update_threat_status,
    "deploy_honeytoken": handle_deploy_honeytoken,
}

async def execute_action(action_name: str, params: dict, threat: Threat, db: Session) -> dict:
    handler = ACTION_REGISTRY.get(action_name)
    if not handler:
        return {"status": "failed", "message": f"Unknown action: {action_name}"}
        
    try:
        resolved_params = _resolve_params(params, threat)
        message = await handler(db, threat, resolved_params)
        return {"status": "completed", "message": str(message)}
    except Exception as e:
        logger.exception(f"Error executing playbook action '{action_name}'")
        return {"status": "failed", "message": str(e)}
