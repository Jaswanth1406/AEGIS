from fastapi import FastAPI

from app.api.routes import auth, dashboard, playbooks, settings, threats
from app.db.session import init_db


app = FastAPI(title="AEGIS Backend", version="0.1.0")


@app.on_event("startup")
def startup_event() -> None:
    init_db()


app.include_router(auth.router)
app.include_router(threats.router)
app.include_router(dashboard.router)
app.include_router(playbooks.router)
app.include_router(settings.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
