import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from app.database import get_db
from app.models import Transaction, Customer, PaymentAttempt, RecoveryPrediction, RecoveryAction
from app.schemas import TransactionSchema

router = APIRouter(prefix="/api/transactions", tags=["Transactions Registry"])

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except ValueError:
        return False

@router.post("/clear")
def clear_user_transactions(user_email: Optional[str] = Query(None), db: Session = Depends(get_db)):
    """
    Clears only the logged-in user's transaction records from the database so they can re-import cleanly.
    """
    if not user_email or not user_email.strip():
        raise HTTPException(status_code=400, detail="user_email is required to clear account data")

    txn_query = db.query(Transaction).join(Customer)
    txn_query = apply_account_filter(txn_query, user_email)
    target_txns = txn_query.all()
    target_ids = [t.id for t in target_txns]

    if not target_ids:
        return {"success": True, "message": "No transactions found to clear for this account."}

    db.query(PaymentAttempt).filter(PaymentAttempt.transaction_id.in_(target_ids)).delete(synchronize_session=False)
    db.query(RecoveryPrediction).filter(RecoveryPrediction.transaction_id.in_(target_ids)).delete(synchronize_session=False)
    db.query(RecoveryAction).filter(RecoveryAction.transaction_id.in_(target_ids)).delete(synchronize_session=False)

    deleted_count = db.query(Transaction).filter(Transaction.id.in_(target_ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "message": f"Cleared {deleted_count} transaction records for account {user_email}."}

def apply_account_filter(query, user_email: Optional[str]):
    if not user_email or not user_email.strip():
        return query.filter(Customer.phone == "__NONE__")
    
    email_clean = user_email.strip().lower()
    return query.filter(
        or_(
            Customer.email.ilike(email_clean),
            Customer.phone.ilike(email_clean)
        )
    )

@router.get("", response_model=dict)
def get_transactions(
    search: Optional[str] = Query(None),
    payment_method: Optional[str] = Query("All"),
    failure_reason: Optional[str] = Query("All"),
    status: Optional[str] = Query("All"),
    priority_level: Optional[str] = Query("All"),
    bank_name: Optional[str] = Query("All"),
    user_email: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("transaction_timestamp"),
    sort_order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).join(Customer)
    query = apply_account_filter(query, user_email)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Transaction.transaction_id.ilike(term),
                Customer.name.ilike(term),
                Customer.email.ilike(term)
            )
        )

    if payment_method and payment_method != "All":
        query = query.filter(Transaction.payment_method == payment_method)

    if failure_reason and failure_reason != "All":
        query = query.filter(Transaction.failure_reason == failure_reason)

    if status and status != "All":
        query = query.filter(Transaction.status == status)

    if priority_level and priority_level not in ["All", "All Priorities"]:
        clean_priority = priority_level.replace(" Priority", "").strip()
        query = query.filter(Transaction.priority_level == clean_priority)

    if bank_name and bank_name != "All":
        query = query.filter(Transaction.bank_name == bank_name)

    # Date Range Filter
    if start_date and start_date.strip():
        try:
            s_dt = datetime.fromisoformat(start_date.strip().replace("Z", "+00:00"))
            query = query.filter(Transaction.transaction_timestamp >= s_dt)
        except Exception:
            pass

    if end_date and end_date.strip():
        try:
            e_str = end_date.strip()
            if "T" not in e_str:
                e_str = f"{e_str}T23:59:59"
            e_dt = datetime.fromisoformat(e_str.replace("Z", "+00:00"))
            query = query.filter(Transaction.transaction_timestamp <= e_dt)
        except Exception:
            pass

    # Sorting
    sort_col = getattr(Transaction, sort_by, Transaction.transaction_timestamp)
    if sort_order == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    serialized_items = []
    for item in items:
        d = TransactionSchema.from_orm(item).dict()
        d["bank"] = item.bank_name
        serialized_items.append(d)

    return {
        "items": serialized_items,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit
    }

@router.get("/queue", response_model=List[TransactionSchema])
def get_recovery_queue(
    priority: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction).join(Customer).filter(Transaction.status.in_(["FAILED", "PENDING"]))
    query = apply_account_filter(query, user_email)

    if priority and priority not in ["All", "All Priorities"]:
        clean_priority = priority.replace(" Priority", "").strip()
        query = query.filter(Transaction.priority_level == clean_priority)

    query = query.order_by(desc(Transaction.priority_score)).limit(limit)
    items = query.all()

    results = []
    for item in items:
        d = TransactionSchema.from_orm(item).dict()
        d["bank"] = item.bank_name
        results.append(d)

    return results

@router.get("/queue/count")
def get_recovery_queue_count(user_email: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Transaction).join(Customer).filter(Transaction.status.in_(["FAILED", "PENDING"]))
    query = apply_account_filter(query, user_email)
    return {"count": query.count()}

@router.get("/{id}", response_model=TransactionSchema)
def get_transaction_by_id(id: str, db: Session = Depends(get_db)):
    if is_valid_uuid(id):
        txn = db.query(Transaction).filter(Transaction.id == uuid.UUID(id)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.transaction_id == id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    d = TransactionSchema.from_orm(txn).dict()
    d["bank"] = txn.bank_name
    return d

@router.delete("/{id}")
def delete_transaction_by_id(id: str, db: Session = Depends(get_db)):
    if is_valid_uuid(id):
        txn = db.query(Transaction).filter(Transaction.id == uuid.UUID(id)).first()
    else:
        txn = db.query(Transaction).filter(Transaction.transaction_id == id).first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    txn_id_str = txn.transaction_id
    txn_uuid = txn.id

    # Safely delete dependent records
    db.query(PaymentAttempt).filter(PaymentAttempt.transaction_id == txn_uuid).delete(synchronize_session=False)
    db.query(RecoveryPrediction).filter(RecoveryPrediction.transaction_id == txn_uuid).delete(synchronize_session=False)
    db.query(RecoveryAction).filter(RecoveryAction.transaction_id == txn_uuid).delete(synchronize_session=False)

    db.delete(txn)
    db.commit()

    return {"success": True, "message": f"Transaction {txn_id_str} deleted successfully.", "deleted_id": txn_id_str}
