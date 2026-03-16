from fastapi.testclient import TestClient

from app.main import app

def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


def test_auth_and_threat_flow() -> None:
    email = "analyst-smoke@example.com"
    with TestClient(app) as client:
        register = client.post(
            "/api/auth/register",
            json={"name": "Smoke Analyst", "email": email, "password": "demo-pass", "role": "analyst"},
        )
        assert register.status_code in (201, 409)

        login = client.post("/api/auth/login", json={"email": email, "password": "demo-pass"})
        assert login.status_code == 200
        token = login.json()["access_token"]

        ingest = client.post(
            "/api/internal/threats",
            headers={"X-Internal-API-Key": "internal-dev-key"},
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

        get_threats = client.get("/api/threats", headers={"Authorization": f"Bearer {token}"})
        assert get_threats.status_code == 200
        assert get_threats.json()["total"] >= 1

        patch = client.patch(
            f"/api/threats/{threat_id}/status",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "CONTAINED"},
        )
        assert patch.status_code == 200
        assert patch.json()["status"] == "CONTAINED"
