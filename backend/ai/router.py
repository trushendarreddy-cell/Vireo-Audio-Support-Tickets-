"""AI Model Router orchestrating provider selection, fallback execution, and validation."""

import os
import time
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

from backend.ai.schemas import AIAnalystResponse, ChatMessage, ProviderHealth, AIStatusResponse
from backend.ai.context import build_grounded_context
from backend.ai.intent import check_local_intent
from backend.ai.providers import (
    BaseLLMProvider,
    GeminiProvider,
    GroqProvider,
    NemotronProvider,
    LocalFallbackProvider
)

logger = logging.getLogger("vireo.ai.router")

def _load_env_file():
    """Lightweight .env loader that populates os.environ without external dependencies."""
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip("'\"")
                    if k not in os.environ:
                        os.environ[k] = v

_load_env_file()

class AIRouter:
    def __init__(self):
        self._init_providers()

    def _init_providers(self):
        timeout = int(os.environ.get("AI_TIMEOUT_SECONDS", "15"))
        
        # Load API keys from environment
        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        groq_key = os.environ.get("GROQ_API_KEY") or os.environ.get("XAI_API_KEY", "")
        xai_key = os.environ.get("XAI_API_KEY", "")
        nvidia_key = os.environ.get("NVIDIA_API_KEY", "")

        # Configurable model names
        gemini_model = os.environ.get("GEMINI_MODEL", "gemma-4-26b-a4b-it")
        groq_model = os.environ.get("GROQ_MODEL", "qwen/qwen3.8-27b")
        nemotron_model = os.environ.get("NEMOTRON_MODEL", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning")

        self.providers: Dict[str, BaseLLMProvider] = {
            "gemini": GeminiProvider(api_key=gemini_key, model=gemini_model, timeout=timeout),
            "groq": GroqProvider(api_key=groq_key, model=groq_model, timeout=timeout),
            "xai": GroqProvider(api_key=xai_key, model="grok-beta", timeout=timeout),
            "nemotron": NemotronProvider(api_key=nvidia_key, model=nemotron_model, timeout=timeout),
            "local": LocalFallbackProvider()
        }

        # Provider priority order
        self.primary_name = os.environ.get("AI_PRIMARY_PROVIDER", "gemini").lower()
        fallback_str = os.environ.get("AI_FALLBACK_PROVIDERS", "groq,nemotron,local").lower()
        self.fallback_names = [p.strip() for p in fallback_str.split(",") if p.strip()]

    def get_execution_order(self) -> List[str]:
        """Returns ordered list of provider names to attempt."""
        order = []
        if self.primary_name in self.providers:
            order.append(self.primary_name)
        for fb in self.fallback_names:
            if fb in self.providers and fb not in order:
                order.append(fb)
        if "local" not in order:
            order.append("local")
        return order

    async def generate_response(
        self,
        query: str,
        history: Optional[List[ChatMessage]] = None,
        # Authoritative operational metrics
        metrics: Optional[Dict[str, Any]] = None,
        themes: Optional[Dict[str, Any]] = None,
        repeats: Optional[Dict[str, Any]] = None,
        sla: Optional[Dict[str, Any]] = None,
        csat: Optional[Dict[str, Any]] = None,
        agents: Optional[Dict[str, Any]] = None,
        sample_tickets: Optional[List[Dict[str, Any]]] = None
    ) -> AIAnalystResponse:
        # 1. Fast local intent routing for greetings and capability questions (<2ms, ₹0 cost)
        t_start = time.time()
        fast_intent = check_local_intent(query)
        if fast_intent:
            latency = max(1, int((time.time() - t_start) * 1000))
            return AIAnalystResponse(
                answer=fast_intent["answer"],
                analysis=fast_intent["analysis"],
                evidence=fast_intent["evidence"],
                data_used=fast_intent["data_used"],
                relevant_tickets=fast_intent.get("relevant_tickets", []),
                provider="local",
                model="vireo-intent-router",
                fallback_used=False,
                fallback_chain=["local:intent_router"],
                latency_ms=latency
            )

        # 2. Build targeted authoritative context proportional to the query
        context = build_grounded_context(
            query=query,
            metrics=metrics or {},
            themes=themes or {},
            repeats=repeats or {},
            sla=sla or {},
            csat=csat or {},
            agents=agents or {},
            sample_tickets=sample_tickets or []
        )

        execution_order = self.get_execution_order()
        attempted_chain = []
        start_time = time.time()

        for idx, p_name in enumerate(execution_order):
            provider = self.providers.get(p_name)
            if not provider or (not provider.is_configured and p_name != "local"):
                logger.info(f"Skipping unconfigured provider: {p_name}")
                attempted_chain.append(f"{p_name}:not_configured")
                continue

            attempted_chain.append(p_name)
            t0 = time.time()
            try:
                logger.info(f"Attempting AI generation with provider: {p_name} ({provider.model})")
                raw_result = await provider.generate_answer(query=query, context=context, history=history)
                latency = int((time.time() - t0) * 1000)

                # Validate structure
                is_fallback = (idx > 0)
                return AIAnalystResponse(
                    answer=raw_result.get("answer", ""),
                    analysis=raw_result.get("analysis", ""),
                    evidence=raw_result.get("evidence", []),
                    data_used=raw_result.get("data_used", []),
                    relevant_tickets=raw_result.get("relevant_tickets", []),
                    provider=provider.name,
                    model=provider.model,
                    fallback_used=is_fallback,
                    fallback_chain=attempted_chain,
                    latency_ms=latency
                )

            except Exception as e:
                # Safe logging without exposing secrets
                logger.warning(f"Provider '{p_name}' failed: {type(e).__name__} - {str(e)[:120]}")
                attempted_chain[-1] = f"{p_name}:failed"
                continue

        # If somehow all configured cloud providers fail, invoke deterministic local fallback
        local_provider = self.providers["local"]
        t0 = time.time()
        local_result = await local_provider.generate_answer(query=query, context=context, history=history)
        latency = int((time.time() - t0) * 1000)

        return AIAnalystResponse(
            answer=local_result["answer"],
            analysis=local_result["analysis"],
            evidence=local_result["evidence"],
            data_used=local_result["data_used"],
            relevant_tickets=local_result["relevant_tickets"],
            provider="local",
            model=local_provider.model,
            fallback_used=True,
            fallback_chain=attempted_chain + ["local:executed"],
            latency_ms=latency
        )

    def get_status(self) -> AIStatusResponse:
        statuses = {}
        for name, p in self.providers.items():
            if not p.is_configured:
                status = "missing_key"
            else:
                status = "ready"
            statuses[name] = ProviderHealth(
                name=name,
                configured=p.is_configured,
                model=p.model,
                status=status
            )

        return AIStatusResponse(
            status="active",
            primary_provider=self.primary_name,
            fallback_providers=self.fallback_names,
            providers=statuses
        )

# Global singleton router
router = AIRouter()
