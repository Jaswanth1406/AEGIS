import time

from sqlalchemy.orm import Session

from app.models.playbook import Playbook
from app.models.playbook_log import PlaybookExecutionLog
from app.models.threat import Threat


def parse_steps(steps_raw: str) -> list[str]:
    return [s.strip() for s in steps_raw.split(",") if s.strip()]


def execute_playbook(db: Session, playbook: Playbook, threat: Threat, executed_by: str) -> PlaybookExecutionLog:
    start = time.perf_counter()
    steps = parse_steps(playbook.steps)
    step_logs = []
    for step in steps:
        step_logs.append({"step": step, "status": "completed"})

    elapsed = time.perf_counter() - start
    log = PlaybookExecutionLog(
        playbook_id=playbook.id,
        threat_id=threat.id,
        executed_by=executed_by,
        execution_time=elapsed,
        status="completed",
        log_entries=step_logs,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
