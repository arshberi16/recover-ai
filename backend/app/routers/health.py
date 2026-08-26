from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, engine
from app.models import Transaction, Customer

router = APIRouter(prefix="/api/health", tags=["Health & System Diagnostics"])

@router.get("/database")
def database_health_check(db: Session = Depends(get_db)):
    """
    Returns live database connection status and table stats for Supabase PostgreSQL.
    """
    try:
        # Test direct query execution
        db.execute(text("SELECT 1"))
        
        txn_count = db.query(Transaction).count()
        cust_count = db.query(Customer).count()

        return {
            "status": "online",
            "connected": True,
            "database_type": "Supabase PostgreSQL",
            "host": str(engine.url.host),
            "port": engine.url.port or 5432,
            "database_name": engine.url.database,
            "record_stats": {
                "total_transactions": txn_count,
                "total_customers": cust_count
            }
        }
    except Exception as e:
        return {
            "status": "degraded",
            "connected": False,
            "error": str(e)
        }
