from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_threat_and_playbook_flow() -> None:
    with TestClient(app) as client:
        ingest = client.post(
            "/api/internal/threats",
            json={
                "threat_type": "Port Scan",
                "severity": "HIGH",
                "source_ip": "192.168.1.20",
                "target_system": "web-server-1",
                "confidence_score": 0.88,
                "anomaly_score": 0.81,
                "explanation": {"rate": 0.8},
                "threat_fingerprint": [0.1, 0.2, 0.3, 0.4],
            },
        )
        assert ingest.status_code == 201
        threat_id = ingest.json()["id"]

        get_threats = client.get("/api/threats")
        assert get_threats.status_code == 200
        assert get_threats.json()["total"] >= 1

        patch = client.patch(
            f"/api/threats/{threat_id}/status",
            json={"status": "CONTAINED"},
        )
        assert patch.status_code == 200
        assert patch.json()["status"] == "CONTAINED"

        approve = client.post(
            f"/api/threats/{threat_id}/approve-playbook",
            json={
                "name": "Smoke Playbook",
                "description": "Demo containment flow",
                "steps": [
                    {"action": "block_ip", "params": {"ip": "{source_ip}"}},
                    {"action": "update_threat_status", "params": {"status": "MITIGATED"}},
                ],
                "execute_now": True,
                "executed_by": "smoke-test",
            },
        )
        assert approve.status_code == 201
        assert approve.json()["executed"] is True
        assert approve.json()["execution_status"] in ("completed", "completed_with_errors")

        updated = client.get(f"/api/threats/{threat_id}")
        assert updated.status_code == 200
        assert updated.json()["status"] == "MITIGATED"
