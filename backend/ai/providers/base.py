"""Abstract base class for Vireo AI model providers."""

import re
import json
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from backend.ai.schemas import ChatMessage

logger = logging.getLogger("vireo.ai.provider")

class BaseLLMProvider(ABC):
    def __init__(self, name: str, model: str, api_key: Optional[str] = None):
        self.name = name
        self.model = model
        self.api_key = api_key or ""
        self.is_configured = bool(self.api_key and not self.api_key.startswith("your_"))

    @abstractmethod
    async def generate_answer(
        self,
        query: str,
        context: str,
        history: Optional[List[ChatMessage]] = None
    ) -> Dict[str, Any]:
        """Call the provider API and return a parsed response dict with answer, analysis, evidence, data_used, relevant_tickets."""
        pass

    def clean_json_response(self, text: str) -> Dict[str, Any]:
        """Safely extracts and parses JSON from raw LLM output."""
        cleaned = text.strip()
        
        # Remove markdown fences if present
        if "```" in cleaned:
            # Strip outer ```json ... ``` or ``` ... ```
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()

        # Find outer-most JSON object bounds
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end+1]

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as err:
            logger.warning(f"Initial JSON parse failed: {err}. Attempting raw text fallback...")
            # If literal newlines inside string values caused decode error:
            try:
                # Replace unescaped control characters
                import re
                repaired = re.sub(r'[\x00-\x1f\x7f-\x9f]', ' ', cleaned)
                data = json.loads(repaired)
            except Exception:
                raise ValueError(f"Unable to parse valid JSON from model response: {cleaned[:150]}")

        if not isinstance(data, dict):
            raise ValueError("Parsed JSON is not a dictionary")

        # Validate mandatory keys
        return {
            "answer": str(data.get("answer", "")).strip(),
            "analysis": str(data.get("analysis", "")).strip(),
            "evidence": [str(e) for e in data.get("evidence", []) if str(e).strip()],
            "data_used": [str(d) for d in data.get("data_used", []) if str(d).strip()],
            "relevant_tickets": [str(t) for t in data.get("relevant_tickets", []) if "TK-" in str(t)]
        }
