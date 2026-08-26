import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Numeric, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    company_name = Column(String, nullable=True)
    role = Column(String, default="analyst")
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    insights = relationship("BusinessInsight", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("AIConversation", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    actions = relationship("RecoveryAction", back_populates="user")
    settings = relationship("MerchantSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    customer_code = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    phone = Column(String, nullable=True)
    customer_segment = Column(String, default="Regular") # Premium, Regular, New, High Risk
    historical_success_rate = Column(Float, default=85.0)
    success_rate = Column(Float, default=85.0) # Compatibility alias
    previous_failures = Column(Integer, default=0)
    total_transactions = Column(Integer, default=0)
    successful_transactions = Column(Integer, default=0)
    failed_transactions = Column(Integer, default=0)
    total_transaction_value = Column(Numeric(14, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="customer", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    transaction_id = Column(String, unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String, default="INR")
    payment_method = Column(String, nullable=False) # UPI, Credit Card, Debit Card, NetBanking, Wallet
    bank_name = Column(String, nullable=False) # HDFC, ICICI, SBI, Axis, Kotak
    transaction_timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    transaction_hour = Column(Integer, nullable=False)
    failure_reason = Column(String, nullable=True) # Bank Timeout, Insufficient Funds, Bank Decline, etc.
    failure_code = Column(String, nullable=True)
    status = Column(String, default="FAILED", index=True) # SUCCESS, FAILED, PENDING, RECOVERED, LOST

    # ML prediction fields
    recovery_probability = Column(Float, nullable=True)
    priority_score = Column(Float, nullable=True)
    priority_level = Column(String, nullable=True) # High, Medium, Low
    recommended_action = Column(String, nullable=True)

    # Recovery tracking fields
    retry_count = Column(Integer, default=0)
    recovered_at = Column(DateTime, nullable=True)

    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    customer = relationship("Customer", back_populates="transactions")
    actions = relationship("RecoveryAction", back_populates="transaction", cascade="all, delete-orphan")
    predictions = relationship("RecoveryPrediction", back_populates="transaction", cascade="all, delete-orphan")
    payment_attempts = relationship("PaymentAttempt", back_populates="transaction", cascade="all, delete-orphan")


class PaymentAttempt(Base):
    __tablename__ = "payment_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attempt_id = Column(String, unique=True, nullable=False, index=True)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    attempt_number = Column(Integer, default=1)
    gateway_name = Column(String, default="RECOVERAI_SANDBOX")
    request_timestamp = Column(DateTime, default=datetime.utcnow)
    response_status = Column(String, nullable=False) # SUCCESS, FAILED, PENDING
    response_code = Column(String, nullable=True)
    response_message = Column(Text, nullable=True)
    is_simulated = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="payment_attempts")


class MerchantSettings(Base):
    __tablename__ = "merchant_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    auto_retry_enabled = Column(Boolean, default=True)
    minimum_recovery_probability = Column(Float, default=60.0)
    maximum_retry_attempts = Column(Integer, default=3)
    retry_delay_minutes = Column(Integer, default=120)
    email_recovery_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="settings")


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="SET NULL"), nullable=True)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action_type = Column(String, nullable=False) # RETRY_PAYMENT, SEND_RECOVERY_EMAIL, MARK_AS_RECOVERED, MARK_AS_LOST, BATCH_RETRY
    action_status = Column(String, default="SUCCESS") # SUCCESS, FAILED, PENDING
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    performed_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transaction = relationship("Transaction", back_populates="actions")
    user = relationship("Profile", back_populates="actions")


class RecoveryPrediction(Base):
    __tablename__ = "recovery_predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    model_version = Column(String, default="GradientBoostingClassifier-v2.0")
    recovery_probability = Column(Float, nullable=False)
    priority_score = Column(Float, nullable=False)
    priority_level = Column(String, nullable=False)
    recommended_action = Column(String, nullable=False)
    predicted_at = Column(DateTime, default=datetime.utcnow)
    actual_outcome = Column(Boolean, nullable=True) # True = Recovered, False = Lost, None = Pending
    outcome_recorded_at = Column(DateTime, nullable=True)

    # Relationships
    transaction = relationship("Transaction", back_populates="predictions")


class BusinessInsight(Base):
    __tablename__ = "business_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    insight_type = Column(String, nullable=False) # REVENUE_RISK, FAILURE_PATTERN, BANK_PERFORMANCE, CUSTOMER_BEHAVIOR, RECOVERY_OPPORTUNITY
    title = Column(String, nullable=False)
    insight_text = Column(Text, nullable=False)
    priority = Column(String, default="MEDIUM") # HIGH, MEDIUM, LOW
    metrics = Column(JSON, nullable=True)
    related_metric = Column(JSON, nullable=True) # Compatibility alias
    generated_by = Column(String, default="ML") # ML, GEMINI, RULE_ENGINE
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("Profile", back_populates="insights")


class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, default="Payment Failure Analysis")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="conversations")
    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False) # USER, ASSISTANT, SYSTEM
    content = Column(Text, nullable=False)
    message_metadata = Column(JSON, nullable=True) # avoiding reserved metadata keyword in SQLAlchemy
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True)
    merchant_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    report_type = Column(String, nullable=False) # EXECUTIVE_SUMMARY, RECOVERY_ANALYSIS, FAILURE_DIAGNOSTICS, BANK_PERFORMANCE
    file_name = Column(String, nullable=False)
    storage_path = Column(String, nullable=True)
    filters = Column(JSON, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("Profile", back_populates="reports")
