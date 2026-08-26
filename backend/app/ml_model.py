import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

MODEL_FILE = "recoverai_model.joblib"

class RecoveryPredictionModel:
    def __init__(self):
        self.model = None
        self.metrics = {}
        self.feature_importances = {}
        self.is_trained = False
        
        # Load existing model if persisted, else train fresh
        if os.path.exists(MODEL_FILE):
            try:
                data = joblib.load(MODEL_FILE)
                self.model = data["model"]
                self.metrics = data.get("metrics", {})
                self.feature_importances = data.get("feature_importances", {})
                self.is_trained = True
                print("Loaded persisted ML model from joblib file!")
            except Exception as e:
                print(f"Failed to load persisted model: {e}. Re-training model...")
                self.train_and_evaluate()
        else:
            self.train_and_evaluate()

    def _generate_synthetic_training_data(self, n_samples=2500):
        np.random.seed(42)

        amounts = np.random.exponential(scale=15000, size=n_samples) + 500
        methods = np.random.choice(['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'], size=n_samples, p=[0.45, 0.25, 0.15, 0.10, 0.05])
        reasons = np.random.choice(['Insufficient Funds', 'Bank Decline', 'Network Error', 'Timeout', 'Authentication Failure', 'User Abandonment'], size=n_samples, p=[0.25, 0.30, 0.15, 0.15, 0.10, 0.05])
        hours = np.random.randint(0, 24, size=n_samples)
        success_rates = np.random.uniform(30.0, 99.0, size=n_samples)
        prev_failures = np.random.poisson(lam=1.2, size=n_samples)

        targets = []
        for i in range(n_samples):
            prob = 50.0
            
            if reasons[i] in ['Network Error', 'Timeout']:
                prob += 28.0
            elif reasons[i] == 'Bank Decline':
                prob += 18.0
            elif reasons[i] == 'Authentication Failure':
                prob += 12.0
            elif reasons[i] == 'Insufficient Funds':
                prob -= 22.0
            elif reasons[i] == 'User Abandonment':
                prob -= 32.0
            
            prob += (success_rates[i] - 50.0) * 0.45
            prob -= prev_failures[i] * 6.5

            if 19 <= hours[i] <= 22 and methods[i] == 'UPI':
                prob += 12.0
            
            prob = max(5.0, min(95.0, prob))
            outcome = 1 if (prob + np.random.normal(0, 8.0)) > 50.0 else 0
            targets.append(outcome)

        method_map = {'UPI': 1, 'Credit Card': 2, 'Debit Card': 3, 'Net Banking': 4, 'Wallet': 5}
        reason_map = {
            'Insufficient Funds': 1, 'Bank Decline': 2, 'Network Error': 3, 
            'Timeout': 4, 'Authentication Failure': 5, 'User Abandonment': 6
        }

        df = pd.DataFrame({
            'amount': amounts,
            'hour': hours,
            'success_rate': success_rates,
            'prev_failures': prev_failures,
            'method_code': [method_map[m] for m in methods],
            'reason_code': [reason_map[r] for r in reasons],
            'target': targets
        })

        return df

    def train_and_evaluate(self):
        """
        Executes ML train/test split, fits GradientBoostingClassifier, 
        evaluates metrics, computes feature importances, and persists using joblib.
        """
        df = self._generate_synthetic_training_data(n_samples=2500)
        
        feature_cols = ['amount', 'hour', 'success_rate', 'prev_failures', 'method_code', 'reason_code']
        X = df[feature_cols]
        y = df['target']

        # 80/20 Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42, stratify=y)

        # Train Gradient Boosting Model
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            learning_rate=0.08,
            max_depth=4,
            random_state=42
        )
        self.model.fit(X_train, y_train)

        # Predict on Test Set
        y_pred = self.model.predict(X_test)
        y_prob = self.model.predict_proba(X_test)[:, 1]

        # Calculate Evaluation Metrics
        self.metrics = {
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred)), 4),
            "recall": round(float(recall_score(y_test, y_pred)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
            "train_samples": len(X_train),
            "test_samples": len(X_test)
        }

        # Calculate Feature Importances
        feature_names_readable = {
            'amount': 'Transaction Amount (INR)',
            'hour': 'Time of Day (Hour)',
            'success_rate': 'Customer Success Rate (%)',
            'prev_failures': 'Previous Failed Attempts',
            'method_code': 'Payment Method Rail',
            'reason_code': 'Issuer Failure Reason'
        }

        importances = self.model.feature_importances_
        self.feature_importances = {}
        for col, val in zip(feature_cols, importances):
            self.feature_importances[feature_names_readable[col]] = round(float(val) * 100.0, 2)

        # Sort feature importances descending
        self.feature_importances = dict(sorted(self.feature_importances.items(), key=lambda item: item[1], reverse=True))

        self.is_trained = True

        # Persist trained model to disk via joblib
        try:
            joblib.dump({
                "model": self.model,
                "metrics": self.metrics,
                "feature_importances": self.feature_importances
            }, MODEL_FILE)
            print(f"Persisted trained model to {MODEL_FILE} successfully!")
        except Exception as e:
            print(f"Could not persist model: {e}")

        return self.metrics

    def predict(self, amount: float, method: str, reason: str, hour: int, success_rate: float, prev_failures: int):
        method_map = {'UPI': 1, 'Credit Card': 2, 'Debit Card': 3, 'Net Banking': 4, 'Wallet': 5}
        reason_map = {
            'Insufficient Funds': 1, 'Bank Decline': 2, 'Network Error': 3, 
            'Timeout': 4, 'Authentication Failure': 5, 'User Abandonment': 6
        }

        method_code = method_map.get(method, 1)
        reason_code = reason_map.get(reason, 2)

        features = pd.DataFrame([{
            'amount': amount,
            'hour': hour,
            'success_rate': success_rate,
            'prev_failures': prev_failures,
            'method_code': method_code,
            'reason_code': reason_code
        }])

        model_prob = float(self.model.predict_proba(features)[0][1]) * 100.0
        prob = model_prob * 0.45 + 55.0 * 0.55

        if reason in ['Network Error', 'Timeout', 'Bank Timeout']:
            prob = max(prob, 85.0)
        elif reason == 'Bank Decline' and success_rate > 80:
            prob = max(prob, 78.0)
        elif reason == 'Insufficient Funds':
            prob = min(prob, 45.0)
        elif reason == 'User Abandonment':
            prob = min(prob, 30.0)

        if amount > 50000 and success_rate > 85:
            prob += 5.0

        prob = round(float(max(5.0, min(98.0, prob))), 1)

        amount_factor = min(100.0, (amount / 100000.0) * 100.0)
        priority_score = round(float((prob * 0.45) + (amount_factor * 0.35) + (success_rate * 0.20)), 1)
        priority_score = max(10.0, min(99.0, priority_score))

        # Calibrated 3-tier priority levels
        if priority_score >= 88.0:
            priority_level = "High"
        elif priority_score >= 72.0:
            priority_level = "Medium"
        else:
            priority_level = "Low"

        if reason in ['Timeout', 'Network Error', 'Bank Timeout']:
            recommended_action = "Initiate Automated Off-Peak Retry"
            explanation = f"Transient {reason.lower()} detected. Customer has a strong payment history ({success_rate:.0f}% success rate). Automated off-peak retry probability estimated at {prob:.0f}%."
        elif reason == 'Bank Decline' and prob >= 75.0:
            recommended_action = "Initiate Instant Payment Retry"
            explanation = f"Temporary bank decline. Customer historical success rate is {success_rate:.0f}%. High recovery likelihood ({prob:.0f}%) within 2-4 hours."
        elif amount >= 25000 and priority_level == "High":
            recommended_action = "Send Smart Email Recovery Notification Link"
            explanation = f"High-value order (₹{amount:,.0f}) with {prob:.0f}% recovery probability. Sending instant quick-pay link maximizes recovery speed."
        elif reason == 'Insufficient Funds':
            recommended_action = "Schedule Auto-Retry (24-48h)"
            explanation = f"Declined for insufficient funds. Recommending auto-retry following salary/account credit cycle."
        else:
            recommended_action = "Contact Customer via Support Operations"
            explanation = f"Requires customer follow-up. Estimated recovery probability is {prob:.0f}%."

        return {
            "recovery_probability": float(prob),
            "priority_score": float(priority_score),
            "priority_level": str(priority_level),
            "recommended_action": str(recommended_action),
            "explanation": str(explanation)
        }

# Global ML Singleton Instance
ml_engine = RecoveryPredictionModel()
