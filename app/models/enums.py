from enum import Enum


class RoleEnum(str, Enum):
    admin = "admin"
    analyst = "analyst"
    viewer = "viewer"


class SeverityEnum(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ThreatStatusEnum(str, Enum):
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    BLOCKED = "BLOCKED"
    RESOLVED = "RESOLVED"
    MITIGATED = "MITIGATED"
    IGNORED = "IGNORED"
