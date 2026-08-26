import uuid
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MerchantSettings, Profile
from typing import Optional

router = APIRouter(prefix="/api/settings", tags=["Persistent Merchant Settings"])

class SettingsPayload(BaseModel):
    auto_retry_enabled: bool = Field(default=True)
    minimum_recovery_probability: float = Field(default=60.0)
    maximum_retry_attempts: int = Field(default=3)
    retry_delay_minutes: int = Field(default=120)
    email_recovery_enabled: bool = Field(default=True)

class ProfilePayload(BaseModel):
    email: str
    full_name: str
    company_name: Optional[str] = "RecoverAI Merchant"
    role: Optional[str] = "Payment Operations"

@router.post("/profile")
def create_or_update_profile(
    payload: ProfilePayload,
    db: Session = Depends(get_db)
):
    """
    Persists registered merchant user profiles directly to the public.profiles database table.
    """
    clean_email = payload.email.strip().lower()
    prof = db.query(Profile).filter(Profile.email.ilike(clean_email)).first()
    if not prof:
        prof = Profile(
            id=uuid.uuid4(),
            email=clean_email,
            full_name=payload.full_name,
            company_name=payload.company_name,
            role=payload.role
        )
        db.add(prof)
    else:
        prof.full_name = payload.full_name
        if payload.company_name:
            prof.company_name = payload.company_name
        if payload.role:
            prof.role = payload.role
        prof.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(prof)
    return {"success": True, "profile_id": str(prof.id), "email": prof.email}

@router.get("")
def get_merchant_settings(
    auth: AuthenticatedMerchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Retrieves persistent settings for the authenticated merchant account.
    """
    s = db.query(MerchantSettings).first()
    if not s:
        s = MerchantSettings(
            id=uuid.uuid4(),
            auto_retry_enabled=True,
            minimum_recovery_probability=60.0,
            maximum_retry_attempts=3,
            retry_delay_minutes=120,
            email_recovery_enabled=True
        )
        db.add(s)
        db.commit()
        db.refresh(s)

    return {
        "auto_retry_enabled": s.auto_retry_enabled,
        "minimum_recovery_probability": s.minimum_recovery_probability,
        "maximum_retry_attempts": s.maximum_retry_attempts,
        "retry_delay_minutes": s.retry_delay_minutes,
        "email_recovery_enabled": s.email_recovery_enabled,
        "is_demo": auth.is_demo
    }

@router.post("")
def update_merchant_settings(
    payload: SettingsPayload,
    auth: AuthenticatedMerchant = Depends(get_current_merchant),
    db: Session = Depends(get_db)
):
    """
    Updates and persists merchant settings permanently to Supabase PostgreSQL.
    """
    s = db.query(MerchantSettings).first()
    if not s:
        s = MerchantSettings(id=uuid.uuid4())
        db.add(s)

    s.auto_retry_enabled = payload.auto_retry_enabled
    s.minimum_recovery_probability = payload.minimum_recovery_probability
    s.maximum_retry_attempts = payload.maximum_retry_attempts
    s.retry_delay_minutes = payload.retry_delay_minutes
    s.email_recovery_enabled = payload.email_recovery_enabled
    s.updated_at = datetime.utcnow()

    db.commit()

    return {
        "success": True,
        "message": "Merchant configuration settings saved permanently to Supabase database!",
        "settings": payload.dict()
    }
