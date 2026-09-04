from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class PredictRequest(BaseModel):
    transaction_amount: float = Field(..., example=50000.0)
    payment_method: str = Field(..., example="UPI")
    failure_reason: str = Field(..., example="Bank Decline")
    transaction_hour: int = Field(..., ge=0, le=23, example=19)
    customer_success_rate: float = Field(..., ge=0, le=100, example=92.5)
    previous_failures: int = Field(..., ge=0, example=1)
    bank: Optional[str] = Field("HDFC", example="HDFC")

class PredictResponse(BaseModel):
    recovery_probability: float
    priority_score: float
    priority_level: str
    recommended_action: str
    explanation: str

class CustomerSchema(BaseModel):
    id: UUID
    customer_code: str
    name: str
    email: str
    phone: Optional[str] = None
    customer_segment: str
    success_rate: float
    total_transactions: int
    successful_transactions: int
    failed_transactions: int
    total_transaction_value: float

    class Config:
        from_attributes = True

class TransactionSchema(BaseModel):
    id: UUID
    transaction_id: str
    customer_id: UUID
    amount: float
    currency: str
    payment_method: str
    bank_name: str
    transaction_timestamp: datetime
    transaction_hour: int
    failure_reason: str
    failure_code: Optional[str] = None
    status: str
    recovery_probability: Optional[float] = None
    priority_score: Optional[float] = None
    priority_level: Optional[str] = None
    recommended_action: Optional[str] = None
    retry_count: int = 0
    recovered_at: Optional[datetime] = None
    customer: Optional[CustomerSchema] = None

    class Config:
        from_attributes = True

class KPISummary(BaseModel):
    revenue_at_risk: float
    revenue_at_risk_change: float
    potential_recovery: float
    potential_recovery_change: float
    failed_transactions_count: int
    failed_transactions_change: float
    recovery_opportunity_rate: float
    recovery_opportunity_change: float

class RevenueLossTrendPoint(BaseModel):
    date: str
    revenue_lost: float
    potential_recovered: float
    failed_count: int

class FailureReasonPoint(BaseModel):
    reason: str
    count: int
    amount: float
    percentage: float

class PaymentMethodPerformancePoint(BaseModel):
    method: str
    total_transactions: int
    failed_transactions: int
    failure_rate: float
    success_rate: float
    volume: float

class BankPerformancePoint(BaseModel):
    bank: str
    total_transactions: int
    failed_transactions: int
    failure_rate: float
    volume_lost: float

class HourlyPatternPoint(BaseModel):
    hour: str
    count: int
    upi_count: int
    volume: float

class ActionRequest(BaseModel):
    transaction_id: str
    action_type: str
    notes: Optional[str] = None
    user_id: Optional[str] = None

class ActionResponse(BaseModel):
    success: bool
    message: str
    transaction_id: str
    new_status: str

class InsightQueryRequest(BaseModel):
    question: str
    date_range: Optional[str] = "30d"
    user_id: Optional[str] = None
    user_email: Optional[str] = None

class KeyFindingItem(BaseModel):
    title: str
    description: str

class MetricItem(BaseModel):
    label: str
    value: str

class ActionItem(BaseModel):
    action: str
    impact: str
    priority: str = "HIGH"
    target_page: str = "recovery"

class InsightQueryResponse(BaseModel):
    intent: str
    answer: str
    key_findings: List[KeyFindingItem]
    supporting_metrics: List[MetricItem]
    recommended_actions: List[ActionItem]
    source: str

class ReportGenerateRequest(BaseModel):
    report_type: str
    date_range: str
    format: str
    user_id: Optional[str] = None
