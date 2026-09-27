"""Google Gemini / Gemma API provider for Vireo Support Intelligence."""

import logging
import httpx
from typing import Dict, Any, List, Optional
from backend.ai.providers.base import BaseLLMProvider
from backend.ai.schemas import ChatMessage
from backend.ai.prompts import SYSTEM_PROMPT

logger = logging.getLogger("vireo.ai.gemini")

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: int = 15):
        configured_model = model or "gemma-4-26b-a4b-it"
        super().__init__(name="gemini", model=configured_model, api_key=api_key)
        self.timeout = timeout

    async def generate_answer(
        self,
        query: str,
        context: str,
        history: Optional[List[ChatMessage]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("Gemini API key is not configured.")

        # Build prompt with system instructions, context, and query
        full_prompt = (
            f"{SYSTEM_PROMPT}\n\n"
            f"=== VERIFIED ANALYTICAL CONTEXT ===\n{context}\n\n"
            f"=== USER QUERY ===\n{query}\n\n"
            f"Respond with valid JSON according to the instructions:"
        )

        payload = {
            "contents": [
                {
                    "parts": [{"text": full_prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.8,
                "maxOutputTokens": 2048,
                "responseMimeType": "application/json"
            }
        }

        # Candidates to try if configured model is experiencing spikes
        candidate_models = ["gemini-3.8-flash", self.model, "gemini-flash-latest"]
        for fallback_m in ["gemma-4-26b-a4b-it"]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        last_error = None
        for candidate in candidate_models:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate}:generateContent?key={self.api_key}"
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(url, json=payload)
                
                if res.status_code == 200:
                    data = res.json()
                    parts = data.get("candidates", [])[0].get("content", {}).get("parts", [])
                    raw_text = parts[0].get("text", "") if parts else ""
                    parsed = self.clean_json_response(raw_text)
                    self.model = candidate
                    return parsed
                else:
                    last_error = f"Gemini ({candidate}) HTTP {res.status_code}: {res.text[:150]}"
                    logger.warning(last_error)
                    if res.status_code == 429:
                        # Key-wide quota reached; fail over to fallback provider immediately
                        break
            except Exception as e:
                last_error = f"Gemini ({candidate}) exception: {str(e)}"
                logger.warning(last_error)

        raise RuntimeError(f"Gemini generation failed: {last_error}")
