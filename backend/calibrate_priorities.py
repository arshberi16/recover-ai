import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Transaction, RecoveryPrediction

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres.ouxmyklzwcebwlmurfce:ArshBeri%401909@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
)

print("Connecting to DB...", flush=True)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

print("Calibrating transaction priority levels in Supabase PostgreSQL...", flush=True)

txns = db.query(Transaction).all()
high_cnt = 0
med_cnt = 0
low_cnt = 0

for t in txns:
    score = float(t.priority_score or 75.0)
    if score >= 88.0:
        new_priority = "High"
        high_cnt += 1
    elif score >= 72.0:
        new_priority = "Medium"
        med_cnt += 1
    else:
        new_priority = "Low"
        low_cnt += 1
    
    t.priority_level = new_priority
    
    # Also update recovery_predictions table
    pred = db.query(RecoveryPrediction).filter(RecoveryPrediction.transaction_id == t.id).first()
    if pred:
        pred.priority_level = new_priority

db.commit()
print(f"Calibration Complete! Updated {len(txns)} transactions:", flush=True)
print(f"  • High Priority: {high_cnt}", flush=True)
print(f"  • Medium Priority: {med_cnt}", flush=True)
print(f"  • Low Priority: {low_cnt}", flush=True)
