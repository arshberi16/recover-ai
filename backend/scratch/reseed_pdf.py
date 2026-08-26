import os
import sys

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/../../backend'))

from app.database import SessionLocal
from app.models import Transaction, Customer, RecoveryPrediction
from app.routers.ingest import TransactionIngestPayload, ingest_payment_gateway_transaction

FULL_PDF_TEST_DATASET = [
  { "transaction_id": "TXN-68008", "customer_name": "Meera Nair", "customer_email": "meera.nair@example.com", "amount": 8999, "payment_method": "Debit Card", "bank_name": "HDFC", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-01T20:24:00" },
  { "transaction_id": "TXN-68012", "customer_name": "Kavya Iyer", "customer_email": "kavya.iyer@example.com", "amount": 1299, "payment_method": "Credit Card", "bank_name": "ICICI", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-02T19:53:00" },
  { "transaction_id": "TXN-68023", "customer_name": "Nikhil Sood", "customer_email": "nikhil.sood@example.com", "amount": 7499, "payment_method": "Debit Card", "bank_name": "SBI", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-02T20:41:00" },
  { "transaction_id": "TXN-68005", "customer_name": "Kabir Verma", "customer_email": "kabir.verma@example.com", "amount": 499, "payment_method": "Wallet", "bank_name": "Axis", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-03T11:30:00" },
  { "transaction_id": "TXN-68030", "customer_name": "Naina Roy", "customer_email": "naina.roy@example.com", "amount": 1299, "payment_method": "Wallet", "bank_name": "Kotak", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-03T20:15:00" },
  { "transaction_id": "TXN-68011", "customer_name": "Aditya Jain", "customer_email": "aditya.jain@example.com", "amount": 3499, "payment_method": "UPI", "bank_name": "HDFC", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-04T13:41:00" },
  { "transaction_id": "TXN-68027", "customer_name": "Dev Kapoor", "customer_email": "dev.kapoor@example.com", "amount": 3499, "payment_method": "Credit Card", "bank_name": "ICICI", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-05T12:00:00" },
  { "transaction_id": "TXN-68018", "customer_name": "Riya Sethi", "customer_email": "riya.sethi@example.com", "amount": 2499, "payment_method": "Debit Card", "bank_name": "SBI", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-06T13:41:00" },
  { "transaction_id": "TXN-68025", "customer_name": "Kunal Gupta", "customer_email": "kunal.gupta@example.com", "amount": 7499, "payment_method": "Wallet", "bank_name": "Axis", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-07T18:53:00" },
  { "transaction_id": "TXN-68002", "customer_name": "Ananya Gupta", "customer_email": "ananya.gupta@example.com", "amount": 1299, "payment_method": "Credit Card", "bank_name": "HDFC", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-08T11:24:00" },
  { "transaction_id": "TXN-68007", "customer_name": "Vivaan Patel", "customer_email": "vivaan.patel@example.com", "amount": 3499, "payment_method": "Credit Card", "bank_name": "ICICI", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-08T16:05:00" },
  { "transaction_id": "TXN-68024", "customer_name": "Aditi Malhotra", "customer_email": "aditi.malhotra@example.com", "amount": 4999, "payment_method": "Net Banking", "bank_name": "SBI", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-09T09:30:00" },
  { "transaction_id": "TXN-68016", "customer_name": "Pooja Khanna", "customer_email": "pooja.khanna@example.com", "amount": 1299, "payment_method": "UPI", "bank_name": "Axis", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-10T09:30:00" },
  { "transaction_id": "TXN-68010", "customer_name": "Sneha Reddy", "customer_email": "sneha.reddy@example.com", "amount": 7499, "payment_method": "Wallet", "bank_name": "Kotak", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-11T09:19:00" },
  { "transaction_id": "TXN-68009", "customer_name": "Arjun Malhotra", "customer_email": "arjun.malhotra@example.com", "amount": 2499, "payment_method": "Net Banking", "bank_name": "HDFC", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-11T12:24:00" },
  { "transaction_id": "TXN-68029", "customer_name": "Yash Agrawal", "customer_email": "yash.agrawal@example.com", "amount": 12499, "payment_method": "Net Banking", "bank_name": "ICICI", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-12T11:24:00" },
  { "transaction_id": "TXN-68013", "customer_name": "Rahul Bansal", "customer_email": "rahul.bansal@example.com", "amount": 3999, "payment_method": "Debit Card", "bank_name": "SBI", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-13T10:00:00" },
  { "transaction_id": "TXN-68017", "customer_name": "Aryan Joshi", "customer_email": "aryan.joshi@example.com", "amount": 5999, "payment_method": "Credit Card", "bank_name": "Axis", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-13T12:53:00" },
  { "transaction_id": "TXN-68021", "customer_name": "Harsh Vardhan", "customer_email": "harsh.vardhan@example.com", "amount": 2999, "payment_method": "UPI", "bank_name": "HDFC", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-15T14:36:00" },
  { "transaction_id": "TXN-68006", "customer_name": "Isha Kapoor", "customer_email": "isha.kapoor@example.com", "amount": 8999, "payment_method": "UPI", "bank_name": "ICICI", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-18T12:00:00" },
  { "transaction_id": "TXN-68020", "customer_name": "Diya Mishra", "customer_email": "diya.mishra@example.com", "amount": 1999, "payment_method": "Wallet", "bank_name": "Kotak", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-18T19:30:00" },
  { "transaction_id": "TXN-68004", "customer_name": "Priya Singh", "customer_email": "priya.singh@example.com", "amount": 499, "payment_method": "Net Banking", "bank_name": "SBI", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-19T14:15:00" },
  { "transaction_id": "TXN-68028", "customer_name": "Ira Menon", "customer_email": "ira.menon@example.com", "amount": 7499, "payment_method": "Debit Card", "bank_name": "HDFC", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-19T15:05:00" },
  { "transaction_id": "TXN-68001", "customer_name": "Aarav Sharma", "customer_email": "aarav.sharma@example.com", "amount": 3499, "payment_method": "UPI", "bank_name": "HDFC", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-21T09:15:00" },
  { "transaction_id": "TXN-68026", "customer_name": "Simran Kaur", "customer_email": "simran.kaur@example.com", "amount": 3499, "payment_method": "UPI", "bank_name": "ICICI", "failure_reason": "Network Error", "transaction_timestamp": "2026-08-21T15:24:00" },
  { "transaction_id": "TXN-68014", "customer_name": "Neha Chawla", "customer_email": "neha.chawla@example.com", "amount": 2499, "payment_method": "Net Banking", "bank_name": "SBI", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-21T17:41:00" },
  { "transaction_id": "TXN-68019", "customer_name": "Manav Arora", "customer_email": "manav.arora@example.com", "amount": 1999, "payment_method": "Net Banking", "bank_name": "Axis", "failure_reason": "Card Expired", "transaction_timestamp": "2026-08-22T12:19:00" },
  { "transaction_id": "TXN-68022", "customer_name": "Tanvi Shah", "customer_email": "tanvi.shah@example.com", "amount": 2999, "payment_method": "Credit Card", "bank_name": "Kotak", "failure_reason": "Bank Timeout", "transaction_timestamp": "2026-08-22T13:15:00" },
  { "transaction_id": "TXN-68003", "customer_name": "Rohan Mehta", "customer_email": "rohan.mehta@example.com", "amount": 999, "payment_method": "Debit Card", "bank_name": "HDFC", "failure_reason": "Bank Decline", "transaction_timestamp": "2026-08-22T20:00:00" },
  { "transaction_id": "TXN-68015", "customer_name": "Siddharth Rao", "customer_email": "siddharth.rao@example.com", "amount": 2999, "payment_method": "Wallet", "bank_name": "ICICI", "failure_reason": "Insufficient Funds", "transaction_timestamp": "2026-08-23T09:15:00" }
]

def run():
    db = SessionLocal()
    db.query(Transaction).delete(synchronize_session=False)
    db.query(Customer).filter(Customer.email.like("%@example.com")).delete(synchronize_session=False)
    db.commit()

    for item in FULL_PDF_TEST_DATASET:
        payload = TransactionIngestPayload(**item)
        ingest_payment_gateway_transaction(payload=payload, db=db)
    
    print("Reseeded all 30 PDF records cleanly!")

if __name__ == "__main__":
    run()
