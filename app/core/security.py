import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone

from app.core.config import settings

def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode().rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode(raw + padding)


def _pbkdf2(password: str, salt: str) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return base64.b64encode(digest).decode()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    return f"{salt}${_pbkdf2(password, salt)}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        salt, expected = password_hash.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(_pbkdf2(password, salt), expected)


def create_access_token(subject: str, role: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_exp_minutes)
    payload = {"sub": subject, "role": role, "exp": int(expires.timestamp())}
    payload_segment = _b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(settings.jwt_secret.encode(), payload_segment.encode(), hashlib.sha256).hexdigest()
    return f"{payload_segment}.{signature}"


def decode_access_token(token: str) -> dict:
    try:
        payload_segment, signature = token.split(".", 1)
        expected = hmac.new(settings.jwt_secret.encode(), payload_segment.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("Bad signature")

        payload = json.loads(_b64url_decode(payload_segment).decode())
        if int(payload.get("exp", 0)) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise ValueError("Invalid token") from exc
