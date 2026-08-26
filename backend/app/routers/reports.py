import io
import os
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Transaction, Report
from app.schemas import ReportGenerateRequest
from app.services.pdf_report_service import generate_backend_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports System"])

@router.post("/generate")
def generate_report(req: ReportGenerateRequest, db: Session = Depends(get_db)):
    """
    Generates structured PDF/CSV analytics reports from PostgreSQL telemetry.
    """
    txns = db.query(Transaction).all()
    
    total_txns = len(txns)
    failed_txns = [t for t in txns if t.status in ["FAILED", "Failed", "PENDING"]]
    recovered_txns = [t for t in txns if t.status in ["RECOVERED", "Recovered"]]

    lost_amount = sum(float(t.amount) for t in failed_txns)
    recovered_amount = sum(float(t.amount) for t in recovered_txns)
    pot_rec = sum(float(t.amount) * ((t.recovery_probability or 70.0) / 100.0) for t in failed_txns)

    rep_id = f"REP-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
    ext = "pdf" if (req.format or "").lower() == "pdf" else "csv"
    file_name = f"{req.report_type.lower().replace(' ', '_')}_{rep_id}.{ext}"

    # Log report record to database
    report_log = Report(
        report_type=req.report_type,
        file_name=file_name,
        storage_path=f"/reports/{file_name}",
        filters={"date_range": req.date_range, "format": req.format},
        generated_at=datetime.utcnow()
    )
    db.add(report_log)
    db.commit()

    return {
        "report_id": rep_id,
        "report_name": req.report_type,
        "date_range": req.date_range,
        "format": req.format,
        "generated_at": datetime.utcnow().isoformat(),
        "summary": {
            "total_transactions": total_txns,
            "failed_count": len(failed_txns),
            "recovered_count": len(recovered_txns),
            "total_revenue_lost": round(lost_amount, 2),
            "potential_recovery": round(pot_rec, 2),
            "total_revenue_recovered": round(recovered_amount, 2),
            "recovery_rate": round((pot_rec / lost_amount * 100.0) if lost_amount > 0 else 72.0, 1)
        },
        "download_url": f"/api/reports/download/{file_name}"
    }

@router.get("/download/{filename}")
def download_report_file(filename: str, db: Session = Depends(get_db)):
    """
    Renders and streams backend ReportLab PDF or CSV report files on-the-fly.
    """
    txns = db.query(Transaction).all()
    failed_txns = [t for t in txns if t.status in ["FAILED", "Failed", "PENDING"]]
    lost_amount = sum(float(t.amount) for t in failed_txns)
    pot_rec = sum(float(t.amount) * ((t.recovery_probability or 70.0) / 100.0) for t in failed_txns)

    summary_stats = {
        "revenue_at_risk": lost_amount,
        "potential_recovery": pot_rec,
        "failed_count": len(failed_txns),
        "recovery_rate": round((pot_rec / lost_amount * 100.0) if lost_amount > 0 else 72.0, 1)
    }

    if filename.endswith(".pdf"):
        rep_title = filename.split("_")[0].capitalize() + " Report"
        pdf_bytes = generate_backend_pdf_report(rep_title, filename, "Last 30 Days", txns, summary_stats)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        # CSV Stream
        csv_lines = ["Transaction ID,Customer,Amount,Payment Method,Bank,Failure Reason,Status,Recovery Score\n"]
        for t in txns:
            c_name = t.customer.name if t.customer else "Customer"
            csv_lines.append(f"{t.transaction_id},{c_name},{t.amount},{t.payment_method},{t.bank_name},{t.failure_reason},{t.status},{t.recovery_probability}%\n")
        
        csv_text = "".join(csv_lines)
        return StreamingResponse(
            io.BytesIO(csv_text.encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
