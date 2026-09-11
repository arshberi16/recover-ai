import os
import json
import re
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY environment variable not configured.")
        return None
    try:
        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=15000)
        )
        return client
    except Exception as e:
        print(f"Failed to initialize Gemini API client: {e}")
        return None


def parse_pdf_with_gemini_ai(pdf_text: str) -> Optional[List[Dict[str, Any]]]:
    """
    Uses Gemini AI to parse and extract structured transaction records from raw PDF or text documents.
    """
    client = get_gemini_client()
    if not client or not pdf_text or not pdf_text.strip():
        return None

    prompt = f"""
You are an expert financial statement and transaction log parser.
Extract all transaction records from the following text document into a JSON array of objects.

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

    for model_name in ["gemini-flash-latest", "gemini-3.6-flash"]:
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
You are RecoverAI — an intelligent Fintech AI Assistant & Financial Operations Analyst.

CORE CAPABILITIES:
1. Dynamic Conversational Intelligence:
   - Understand ANY user question naturally in real-time.
   - For greetings ("hello", "hi", "hey"), farewells ("bye", "see ya", "goodbye"), appreciation ("thanks", "great job"), or casual questions ("who are you?", "what can you do?"):
     * Respond warmly, helpfully, and conversationally in the "answer" field.
     * Set "supporting_metrics": [] and "recommended_actions": [].
     * DO NOT output static financial metrics or random revenue numbers for casual/general chat!

2. Telemetry & Analytics Grounding:
   - When the user asks about payments, failures, banks, revenue, or transactions:
     * Ground your response in the provided VERIFIED DATABASE ANALYTICS CONTEXT.
     * If user asks for "lower risk / high recovery chance" transactions, reference the "top_low_risk_transactions" list.
     * If user asks for "higher risk / largest failure" transactions, reference the "top_high_risk_transactions" list.
     * Provide key findings, supporting metrics, and actionable recommendations.

3. Output Schema (Strict JSON Object):
{
  "answer": "<Natural conversational response or tailored financial analysis>",
  "key_findings": [
    {"title": "<Dynamic Finding Title>", "description": "<Detailed explanation>"}
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
        return None

    prompt = f"""
USER PROMPT: "{question}"

VERIFIED DATABASE ANALYTICS CONTEXT:
{json.dumps(context, indent=2)}

INSTRUCTIONS:
1. Carefully read and understand the user prompt: "{question}".
2. If it is a casual conversation, greeting, or farewell, respond naturally in "answer", and set "supporting_metrics": [] and "recommended_actions": [].
3. If it asks about lower-risk transactions, use "top_low_risk_transactions".
4. If it asks about higher-risk transactions, use "top_high_risk_transactions".
5. If context.is_empty_account is True, explain politely that no transaction telemetry exists yet and invite them to upload a statement.
6. Return valid JSON matching the schema.
"""

    for model_name in ["gemini-3.6-flash", "gemini-flash-latest"]:
        try:
            config = types.GenerateContentConfig(
                system_instruction=GEMINI_SYSTEM_INSTRUCTION,
                temperature=0.3,
                max_output_tokens=1500,
                response_mime_type="application/json"
            )

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=config
            )

            text_response = response.text.strip()
            print(f"✓ Successfully generated Gemini AI response using model: {model_name}")

            cleaned_text = re.sub(r'^```json\s*', '', text_response)
            cleaned_text = re.sub(r'\s*```$', '', cleaned_text).strip()

            parsed_json = json.loads(cleaned_text)
            parsed_json["source"] = "gemini"
            return parsed_json

        except Exception as e:
            print(f"Gemini model {model_name} execution failed: {e}")
            continue

    print("Gemini API models unavailable. Falling back to analytics engine.")
    return None

