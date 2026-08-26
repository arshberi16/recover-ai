import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def generate_backend_pdf_report(report_name: str, report_id: str, date_range: str, txns: list, summary_stats: dict) -> bytes:
    """
    Generates a professional executive PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    story = []
    styles = getSampleStyleSheet()

    # Custom Color Palette
    primary_color = colors.HexColor("#1e293b")
    accent_color = colors.HexColor("#2563eb")
    text_color = colors.HexColor("#334155")
    bg_light = colors.HexColor("#f8fafc")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=primary_color,
        fontName='Helvetica-Bold',
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.HexColor("#64748b"),
        fontName='Helvetica'
    )

    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=12,
        leading=16,
        textColor=primary_color,
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=12,
        textColor=text_color,
        fontName='Helvetica'
    )

    # Document Header
    story.append(Paragraph("RECOVERAI REVENUE INTELLIGENCE", ParagraphStyle('HeaderTag', fontSize=8, fontName='Helvetica-Bold', textColor=accent_color, spaceAfter=4)))
    story.append(Paragraph(report_name, title_style))
    story.append(Paragraph(f"Report ID: {report_id} &nbsp;|&nbsp; Date Range: {date_range} &nbsp;|&nbsp; Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=14))

    # Executive Summary Card Table
    story.append(Paragraph("Executive Telemetry Summary", h2_style))
    
    rev_risk = summary_stats.get("revenue_at_risk", 0.0)
    pot_rec = summary_stats.get("potential_recovery", 0.0)
    failed_cnt = summary_stats.get("failed_count", 0)
    rec_rate = summary_stats.get("recovery_rate", 72.0)

    summary_data = [
        [
            Paragraph(f"<b>Revenue at Risk</b><br/><font size=12 color='#dc2626'><b>₹{rev_risk:,.2f}</b></font>", body_style),
            Paragraph(f"<b>Potential Recovery</b><br/><font size=12 color='#16a34a'><b>₹{pot_rec:,.2f}</b></font>", body_style),
            Paragraph(f"<b>Failed Transactions</b><br/><font size=12 color='#2563eb'><b>{failed_cnt}</b></font>", body_style),
            Paragraph(f"<b>Opportunity Rate</b><br/><font size=12 color='#8b5cf6'><b>{rec_rate}%</b></font>", body_style)
        ]
    ]

    summary_table = Table(summary_data, colWidths=[130, 130, 130, 130])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg_light),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#e2e8f0")),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER')
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 14))

    # Transaction Table
    story.append(Paragraph("Transaction Telemetry Detail", h2_style))

    table_data = [
        [
            Paragraph("<b>Txn ID</b>", body_style),
            Paragraph("<b>Customer</b>", body_style),
            Paragraph("<b>Amount</b>", body_style),
            Paragraph("<b>Rail</b>", body_style),
            Paragraph("<b>Bank</b>", body_style),
            Paragraph("<b>Failure Cause</b>", body_style),
            Paragraph("<b>Score</b>", body_style)
        ]
    ]

    for t in txns[:25]:
        c_name = t.customer.name if t.customer else "Merchant Customer"
        table_data.append([
            Paragraph(f"<code>{t.transaction_id}</code>", body_style),
            Paragraph(c_name[:18], body_style),
            Paragraph(f"₹{t.amount:,.0f}", body_style),
            Paragraph(str(t.payment_method), body_style),
            Paragraph(str(t.bank_name), body_style),
            Paragraph(str(t.failure_reason or "N/A")[:16], body_style),
            Paragraph(f"{t.recovery_probability or 75:.0f}%", body_style)
        ])

    txn_table = Table(table_data, colWidths=[65, 95, 55, 65, 55, 115, 45])
    txn_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, bg_light]),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('FONTSIZE', (0, 0), (-1, -1), 8)
    ]))
    story.append(txn_table)
    story.append(Spacer(1, 14))

    # Footer
    story.append(Paragraph("RecoverAI Platform Sandbox Telemetry Report — Confidential & Protected", ParagraphStyle('DocFoot', fontSize=7, fontName='Helvetica-Oblique', textColor=colors.HexColor("#94a3b8"), alignment=1)))

    doc.build(story)
    pdf_data = buffer.getvalue()
    buffer.close()
    return pdf_data
