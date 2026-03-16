import json
import time

from sqlalchemy.orm import Session

from app.models.playbook import Playbook
from app.models.playbook_log import PlaybookExecutionLog
from app.models.threat import Threat
from app.services.action_handlers import execute_action


async def execute_playbook(db: Session, playbook: Playbook, threat: Threat, executed_by: str) -> PlaybookExecutionLog:
    start = time.perf_counter()
    steps = playbook.steps
    if isinstance(steps, str):
        try:
            steps = json.loads(steps)
        except json.JSONDecodeError:
            steps = []
            
    step_logs = []
    
    overall_status = "completed"
    
    for step in steps:
        action = step.get("action", "unknown")
        params = step.get("params", {})
        
        # Execute the specific handler
        result = await execute_action(action, params, threat, db)
        step_logs.append({
            "step": action,
            "status": result["status"],
            "message": result["message"]
        })
        
        # If any step fails, we could halt or continue. We continue but mark the run as partial.
        if result["status"] == "failed":
            overall_status = "completed_with_errors"

    # AUTO-MITIGATE: If all steps ran cleanly, AND the playbook didn't explicitly update the status,
    # we automatically append a final implicit step to mark the threat as MITIGATED.
    if overall_status == "completed":
        has_status_update = any(s.get("action") == "update_threat_status" for s in steps)
        if not has_status_update:
            auto_result = await execute_action(
                "update_threat_status", 
                {"status": "MITIGATED"}, 
                threat, 
                db
            )
            step_logs.append({
                "step": "update_threat_status (auto-applied)",
                "status": auto_result["status"],
                "message": auto_result["message"]
            })

    elapsed = time.perf_counter() - start
    log = PlaybookExecutionLog(
        playbook_id=playbook.id,
        threat_id=threat.id,
        executed_by=executed_by,
        execution_time=elapsed,
        status=overall_status,
        log_entries=step_logs,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
