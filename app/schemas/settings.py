from pydantic import BaseModel


class SettingsPayload(BaseModel):
    alert_thresholds: dict
    notification_preferences: dict
    playbook_automation_enabled: bool
