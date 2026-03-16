from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, SessionResponse
from app.schemas.common import MessageResponse
from app.services.audit_service import write_audit_log


router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> SessionResponse:
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    write_audit_log(db, user.id, "user_registered", {"email": user.email})
    return SessionResponse.model_validate(user, from_attributes=True)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    user.last_login = datetime.now(timezone.utc)
    db.commit()
    write_audit_log(db, user.id, "user_login", {})
    return AuthResponse(access_token=create_access_token(str(user.id), user.role.value))


@router.post("/logout", response_model=MessageResponse)
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> MessageResponse:
    write_audit_log(db, current_user.id, "user_logout", {})
    return MessageResponse(message="Logged out")


@router.post("/google", response_model=AuthResponse)
def google_auth(db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == "google.user@aegis.local").first()
    if user is None:
        user = User(
            name="Google User",
            email="google.user@aegis.local",
            password_hash=hash_password("oauth-placeholder"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    write_audit_log(db, user.id, "user_google_login", {})
    return AuthResponse(access_token=create_access_token(str(user.id), user.role.value))


@router.get("/session", response_model=SessionResponse)
def session(current_user: User = Depends(get_current_user)) -> SessionResponse:
    return SessionResponse.model_validate(current_user, from_attributes=True)
