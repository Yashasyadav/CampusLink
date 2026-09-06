from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional


@dataclass
class GraphError:
    """
    Structured error object for tracking node and branch level failures in LangGraph execution.
    Never exposes internal secrets, stack traces, or private user data.
    """
    stage: str
    code: str
    message: str
    retryable: bool = False
    severity: str = "ERROR"  # "WARNING", "ERROR", "CRITICAL"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return {
            "stage": self.stage,
            "code": self.code,
            "message": self.message,
            "retryable": self.retryable,
            "severity": self.severity,
            "timestamp": self.timestamp,
        }
