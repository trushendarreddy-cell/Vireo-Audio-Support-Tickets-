"""NVIDIA Nemotron API provider for Vireo Support Intelligence."""

import logging
import httpx
from typing import Dict, Any, List, Optional
from backend.ai.providers.base import BaseLLMProvider
from backend.ai.schemas import ChatMessage
from backend.ai.prompts import SYSTEM_PROMPT

logger = logging.getLogger("vireo.ai.nemotron")

class NemotronProvider(BaseLLMProvider):
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, timeout: int = 15):
        configured_model = model or "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning"
        super().__init__(name="nemotron", model=configured_model, api_key=api_key)
        self.timeout = timeout
        self.base_url = "https://integrate.api.nvidia.com/v1/chat/completions"

    async def generate_answer(
        self,
        query: str,
        context: str,
        history: Optional[List[ChatMessage]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("NVIDIA Nemotron API key is not configured.")

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"=== VERIFIED ANALYTICAL CONTEXT ===\n{context}\n\n"
                    f"=== USER QUERY ===\n{query}\n\n"
                    f"Respond with valid JSON according to system instructions:"
                )
            }
        ]

        candidate_models = [self.model]
        for fallback_m in [
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
            "nvidia/nemotron-nano-3-30b-a3b",
            "mistralai/mistral-nemotron",
            "nvidia/llama-3.1-nemotron-70b-instruct"
        ]:
            if fallback_m not in candidate_models:
                candidate_models.append(fallback_m)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        last_error = None
        for candidate in candidate_models:
            payload = {
                "model": candidate,
                "messages": messages,
                "temperature": 0.2,
                "max_tokens": 1024
            }
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(self.base_url, headers=headers, json=payload)

                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["choices"][0]["message"]["content"]
                    parsed = self.clean_json_response(raw_text)
                    self.model = candidate
                    return parsed
                else:
                    last_error = f"Nemotron ({candidate}) HTTP {res.status_code}: {res.text[:150]}"
                    logger.warning(last_error)
            except Exception as e:
                last_error = f"Nemotron ({candidate}) exception: {str(e)}"
                logger.warning(last_error)

        raise RuntimeError(f"Nemotron generation failed: {last_error}")
