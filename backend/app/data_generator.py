import uuid
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import Customer, Transaction, RecoveryPrediction, BusinessInsight

FIRST_NAMES = ["Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Aditya", "Kavya", "Kabir", "Meera", "Arjun", "Diya", "Rahul", "Ishita", "Siddharth", "Pooja", "Varun", "Riya", "Karan", "Tanvi"]
LAST_NAMES = ["Sharma", "Patel", "Verma", "Gupta", "Singh", "Reddy", "Nair", "Joshi", "Chopra", "Mehta", "Iyer", "Rao", "Deshmukh", "Kapoor", "Bhatia"]
COMPANY_DOMAINS = ["techcorp.in", "nexusdigital.co.in", "cloudscale.io", "fintechone.in", "payflow.co", "quickretail.com", "enterprise.in"]

PAYMENT_METHODS = ["UPI", "Credit Card", "Debit Card", "NetBanking", "Wallet"]
BANKS = ["HDFC", "ICICI", "SBI", "Axis", "Kotak"]
FAILURE_REASONS = [
    "Bank Timeout",
    "Insufficient Funds",
    "Bank Decline",
    "Network Error",
    "Payment Gateway Error",
    "Card Expired",
    "Daily Limit Exceeded",
    "Authentication Failed"
]

CUSTOMER_SEGMENTS = ["Premium", "Regular", "New", "High Risk"]

def generate_customers(db: Session, count: int = 150) -> list:
    existing = db.query(Customer).all()
    if existing and len(existing) >= count:
        return existing

    existing_codes = set(c.customer_code for c in existing)
    customers = list(existing)

    for i in range(len(existing), count):
        code = f"CUST-{1000 + i}"
        while code in existing_codes:
            i += 1
            code = f"CUST-{1000 + i}"
        existing_codes.add(code)

        fn = random.choice(FIRST_NAMES)
        ln = random.choice(LAST_NAMES)
        domain = random.choice(COMPANY_DOMAINS)
        email = f"{fn.lower()}.{ln.lower()}{i+1}@{domain}"
        
        segment = random.choices(CUSTOMER_SEGMENTS, weights=[0.25, 0.45, 0.20, 0.10])[0]
        
        if segment == "Premium":
            success_rate = round(random.uniform(92.0, 99.0), 1)
        elif segment == "Regular":
            success_rate = round(random.uniform(80.0, 92.0), 1)
        elif segment == "New":
            success_rate = round(random.uniform(70.0, 85.0), 1)
        else:
            success_rate = round(random.uniform(40.0, 68.0), 1)

        c = Customer(
            id=uuid.uuid4(),
            customer_code=code,
            name=f"{fn} {ln}",
            email=email,
            phone="admin@recoverai.io",
            customer_segment=segment,
            success_rate=success_rate,
            total_transactions=0,
            successful_transactions=0,
            failed_transactions=0,
            total_transaction_value=0.0
        )
        db.add(c)
        customers.append(c)
    
    db.commit()
    return customers

def seed_admin_demo_data(db: Session, force: bool = False):
    existing_admin_txns = db.query(Transaction).join(Customer).filter(Customer.phone == "admin@recoverai.io").count()
    if existing_admin_txns >= 600 and not force:
        print(f"Admin demo data already populated with {existing_admin_txns} transactions.")
        return

    print("Seeding 600 realistic admin demo transaction records...")
    customers = generate_customers(db, count=150)
    for c in customers:
        c.phone = "admin@recoverai.io"
    db.commit()

    now = datetime.utcnow()
    transactions_dicts = []
    predictions_dicts = []

    for i in range(600):
        cust = random.choice(customers)
        days_ago = random.randint(0, 30)
        hour = random.randint(0, 23)
        minute = random.randint(0, 59)
        second = random.randint(0, 59)
        timestamp = now - timedelta(days=days_ago, hours=now.hour - hour, minutes=now.minute - minute, seconds=now.second - second)

        if 19 <= hour <= 22:
            method = random.choices(PAYMENT_METHODS, weights=[0.60, 0.18, 0.10, 0.08, 0.04])[0]
        else:
            method = random.choices(PAYMENT_METHODS, weights=[0.40, 0.28, 0.15, 0.12, 0.05])[0]

        bank = random.choices(BANKS, weights=[0.30, 0.25, 0.25, 0.12, 0.08])[0]

        if 19 <= hour <= 22 and method == "UPI":
            reason = random.choices(FAILURE_REASONS, weights=[0.38, 0.15, 0.22, 0.15, 0.05, 0.01, 0.02, 0.02])[0]
        else:
            reason = random.choices(FAILURE_REASONS, weights=[0.18, 0.28, 0.24, 0.10, 0.08, 0.04, 0.04, 0.04])[0]

        amount = round(random.choice([
            random.uniform(500, 5000),
            random.uniform(5000, 25000),
            random.uniform(25000, 85000),
            random.uniform(85000, 250000)
        ]), 2)

        failure_code_map = {
            "Bank Timeout": "TIM-91",
            "Insufficient Funds": "INS-51",
            "Bank Decline": "DEC-05",
            "Network Error": "NET-96",
            "Payment Gateway Error": "GW-92",
            "Card Expired": "EXP-54",
            "Daily Limit Exceeded": "LIM-61",
            "Authentication Failed": "AUTH-65"
        }
        failure_code = failure_code_map.get(reason, "ERR-99")
        status = random.choices(["FAILED", "RECOVERED", "SUCCESS", "PENDING", "LOST"], weights=[0.55, 0.25, 0.10, 0.06, 0.04])[0]

        prob = 88.0 if reason in ["Bank Timeout", "Network Error"] else 76.0 if reason == "Bank Decline" else 35.0
        score = round(prob * 0.5 + cust.success_rate * 0.3 + min(20, amount / 5000), 1)
        priority = "High" if score >= 70 else "Medium" if score >= 45 else "Low"

        txn_uuid = uuid.uuid4()
        txn_id_str = f"TXN-{8000 + i}"

        retry_cnt = 0
        recovered_dt = None
        if status == "RECOVERED":
            retry_cnt = random.randint(1, 3)
            recovered_dt = timestamp + timedelta(hours=random.randint(1, 8))

        transactions_dicts.append({
            "id": txn_uuid,
            "transaction_id": txn_id_str,
            "customer_id": cust.id,
            "amount": amount,
            "currency": "INR",
            "payment_method": method,
            "bank_name": bank,
            "transaction_timestamp": timestamp,
            "transaction_hour": hour,
            "failure_reason": reason,
            "failure_code": failure_code,
            "status": status,
            "recovery_probability": prob,
            "priority_score": score,
            "priority_level": priority,
            "retry_attempts": retry_cnt,
            "recovered_at": recovered_dt
        })

        predictions_dicts.append({
            "id": uuid.uuid4(),
            "transaction_id": txn_uuid,
            "model_version": "GradientBoostingClassifier-v2.0",
            "recovery_probability": prob,
            "priority_score": score,
            "priority_level": priority,
            "recommended_action": "Automated Retry Strategy A",
            "predicted_at": timestamp
        })

    db.bulk_insert_mappings(Transaction, transactions_dicts)
    db.bulk_insert_mappings(RecoveryPrediction, predictions_dicts)
    db.commit()
    print("Successfully seeded 600 transactions for admin demo account!")

def seed_database_if_empty(db: Session):
    seed_admin_demo_data(db)
