import os
import json
import re
from typing import Dict, Any, Optional, List
from google import genai
from google.genai import types

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable not configured.")
        return None
    try:
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        print(f"Failed to initialize Gemini API client: {e}")
        return None


def parse_pdf_with_gemini_ai(pdf_text: str) -> Optional[List[Dict[str, Any]]]:
    """
    Uses Gemini AI to parse and extract structured transaction records from raw PDF or text documents.
    Intelligently maps columns even if header names differ (e.g. 'Ref No' -> transaction_id, 'Sum/Value/Amt' -> amount, 'Remarks' -> failure_reason).
    Minimum required fields: transaction_id and amount. Missing columns are returned as null.
    """
    client = get_gemini_client()
    if not client or not pdf_text or not pdf_text.strip():
        return None

    prompt = f"""
You are an expert financial statement and transaction log parser.
Extract all transaction records from the following text document into a JSON array of objects.

CRITICAL EXTRACTION RULES:
1. MINIMUM REQUIRED FIELDS: A valid row MUST contain at minimum:
   - "transaction_id": Any unique transaction reference code, order ID, payment ref, or ID string.
   - "amount": The numeric monetary value, price, total, or sum (convert to float).
2. FLEXIBLE COLUMN HEADER RECOGNITION: The document headers may vary widely. Intelligently map alternative column names:
   - transaction_id: (Txn Ref, Ref No, Reference, Order ID, Payment ID, Transaction #, Txn ID, ID, Invoice #)
   - amount: (Amount, Value, Sum, Total, Price, Debit, INR, Amt, Paid)
   - customer_name: (Customer, Name, Payer, Client, User, Account Holder)
   - customer_email: (Email, Customer Email, Payer Email, Contact Email)
   - payment_method: (Method, Mode, Rail, Payment Type, Instrument, Gateway) -> Normalize to "UPI", "Credit Card", "Debit Card", "Net Banking", "Wallet", or null
   - bank_name: (Bank, Issuer, Financial Institution, Gateway Bank) -> Normalize to "HDFC", "ICICI", "SBI", "Axis", "Kotak", or null
   - failure_reason: (Reason, Failure Description, Remarks, Error Code, Decline Cause, Status Message)
   - transaction_timestamp: (Date, Time, Timestamp, Txn Date) -> ISO YYYY-MM-DDTHH:MM:SS format if available, else null

3. NULL FOR MISSING COLUMNS: If a column (e.g. customer_name, customer_email, payment_method, bank_name, failure_reason) is NOT present in the document, explicitly set its value to null. DO NOT drop valid rows if only transaction_id and amount are present!

REQUIRED OUTPUT FORMAT (JSON Array ONLY):
[
  {{
    "transaction_id": "TXN-XXXXX",
    "amount": 4999.0,
    "customer_name": "Full Name or null",
    "customer_email": "email@domain.com or null",
    "payment_method": "UPI | Credit Card | Debit Card | Net Banking | Wallet | null",
    "bank_name": "HDFC | ICICI | SBI | Axis | Kotak | null",
    "failure_reason": "Bank Timeout | Insufficient Funds | Bank Decline | Network Error | Card Expired | null",
    "transaction_timestamp": "YYYY-MM-DDTHH:MM:SS or null"
  }}
]

TEXT DOCUMENT CONTENT:
{pdf_text[:12000]}
"""

    for model_name in ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]:
        try:
            config = types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=4000,
                response_mime_type="application/json"
            )
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )
            data = json.loads(response.text.strip())
            if isinstance(data, list) and len(data) > 0:
                print(f"✓ Gemini AI successfully extracted {len(data)} transaction rows using model {model_name}!")
                return data
        except Exception as e:
            print(f"Gemini model {model_name} extraction attempt failed: {e}")
            continue

    return None

GEMINI_SYSTEM_INSTRUCTION = """
You are RecoverAI — an intelligent Fintech AI Assistant & Financial Analyst.

GUIDELINES FOR RESPONDING TO THE USER:
1. Conversational & Normal Chat: If the user greets you ("hi", "hello", "how are you"), asks casual questions ("who are you?", "what can you do?", "how are you doing?"), or asks general questions about payments:
   - Provide a warm, friendly, natural, and engaging answer in the "answer" field.
   - Feel free to converse naturally like an intelligent assistant.
   - For casual greetings or general chat, key_findings, supporting_metrics, and recommended_actions can be empty arrays ([]) or contain helpful usage tips.

2. Analytical & Telemetry Queries: If the user asks about payment failures, revenue loss, bank performance, or specific transaction IDs:
   - Base all numeric statistics, amounts, bank names, and percentages STRICTLY on the provided VERIFIED DATABASE ANALYTICS CONTEXT.
   - Provide executive structured key_findings, supporting_metrics, and recommended_actions.

3. Always return valid JSON matching this schema:
{
  "answer": "<Friendly conversational response or clear financial summary>",
  "key_findings": [
    {"title": "<Finding Title>", "description": "<Factual detail or tip>"}
  ],
  "supporting_metrics": [
    {"label": "<Metric Label>", "value": "<Metric Value>"}
  ],
  "recommended_actions": [
    {"action": "<Recommended Action>", "impact": "<Business Impact>", "priority": "HIGH", "target_page": "recovery"}
  ]
}
"""

def generate_gemini_insights(question: str, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    client = get_gemini_client()
    if not client:
        print("Gemini API client unavailable. Returning None for fallback.")
        return None

    prompt = f"""
USER PROMPT: "{question}"

VERIFIED DATABASE ANALYTICS CONTEXT:
{json.dumps(context, indent=2)}

INSTRUCTIONS:
Respond intelligently to the user prompt. If it is a normal greeting or chat, provide a friendly conversational answer. If it is an analytics query, ground your figures in the context JSON.
Return JSON ONLY matching the required format.
"""

    try:
        config = types.GenerateContentConfig(
            system_instruction=GEMINI_SYSTEM_INSTRUCTION,
            temperature=0.4,
            max_output_tokens=1500,
            response_mime_type="application/json"
        )

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=config
        )

        text_response = response.text.strip()
        print("Successfully generated response with model: gemini-3.6-flash")

        cleaned_text = re.sub(r'^```json\s*', '', text_response)
        cleaned_text = re.sub(r'\s*```$', '', cleaned_text).strip()

        parsed_json = json.loads(cleaned_text)
        parsed_json["source"] = "gemini"
        return parsed_json

    except Exception as e:
        print(f"Gemini API model gemini-3.6-flash failed: {e}")

    print("Gemini API failed. Falling back to rule engine.")
    return None
