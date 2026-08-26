import os
import json
import re
from typing import Dict, Any, Optional
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
