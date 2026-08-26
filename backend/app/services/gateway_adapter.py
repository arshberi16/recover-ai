import random
from abc import ABC, abstractmethod
from typing import Dict, Any

class PaymentGatewayAdapter(ABC):
    @abstractmethod
    def simulate_recovery_retry(self, transaction: Any, attempt_number: int) -> Dict[str, Any]:
        pass

class SandboxGatewayAdapter(PaymentGatewayAdapter):
    def simulate_recovery_retry(self, transaction: Any, attempt_number: int) -> Dict[str, Any]:
        """
        Executes a realistic sandbox payment simulation based on transaction characteristics.
        Does NOT alter production merchant bank accounts.
        """
        attempt_id = f"ATT-{random.randint(100000, 999999)}"
        reason = (transaction.failure_reason or "").strip()
        prob = float(transaction.recovery_probability or 70.0)

        # Deterministic / Realistic Rule Engine
        if reason in ["Network Error", "Bank Timeout", "Timeout"]:
            # High recovery probability for temporary network failures
            outcome = "SUCCESS" if random.random() < 0.90 else "PENDING"
            code = "00" if outcome == "SUCCESS" else "TIM-91"
            msg = "Payment recovery simulation succeeded! Network timeout resolved." if outcome == "SUCCESS" else "Gateway timeout. Retry queued in pending state."

        elif reason == "Bank Decline":
            outcome = "SUCCESS" if random.random() < (prob / 100.0) else "FAILED"
            code = "00" if outcome == "SUCCESS" else "DEC-02"
            msg = "Issuer bank approved recovery transaction." if outcome == "SUCCESS" else "Issuer bank declined automated retry request."

        elif reason == "Insufficient Funds":
            outcome = "SUCCESS" if random.random() < 0.45 else "FAILED"
            code = "00" if outcome == "SUCCESS" else "INS-04"
            msg = "Account balance sufficient. Payment recovered!" if outcome == "SUCCESS" else "Insufficient account balance on retry attempt."

        elif reason == "Card Expired":
            outcome = "FAILED"
            code = "EXP-09"
            msg = "Card expired. Automated retry rejected. Quick-Pay link email required."

        else:
            outcome = "SUCCESS" if random.random() < 0.75 else "FAILED"
            code = "00" if outcome == "SUCCESS" else "GEN-99"
            msg = "Payment simulation completed successfully." if outcome == "SUCCESS" else "Gateway simulation returned failure status."

        return {
            "attempt_id": attempt_id,
            "status": outcome,
            "response_code": code,
            "response_message": msg,
            "gateway_name": "RECOVERAI_SANDBOX",
            "is_simulated": True
        }

# Active singleton gateway instance
sandbox_gateway = SandboxGatewayAdapter()
