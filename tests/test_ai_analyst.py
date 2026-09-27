"""Automated test suite for Vireo AI Support Analyst:
- Grounding in authoritative metrics (11,875 tickets, 3,201 30d, 1,910 14d, etc.)
- Multi-provider execution (Gemini, Groq, Nemotron, Local)
- Failover cascade (Gemini -> Groq -> Nemotron -> Local)
- Schema validation
- Security: zero credential leaks
"""

import unittest
import asyncio
import os
import json
from unittest.mock import patch, AsyncMock

from backend.ai.schemas import AIAnalystResponse, ChatMessage
from backend.ai.router import AIRouter
from backend.ai.providers.local_fallback import LocalFallbackProvider
from backend.ai.context import build_grounded_context

MOCK_METRICS = {
    "raw_ticket_count": 12528,
    "unique_tickets_count": 11875,
    "duplicate_pairs_removed": 653,
    "operating_volume_per_week": 650
}
MOCK_REPEATS = {
    "window_14d": {
        "repeat_contacts": 1910,
        "repeat_rate_pct": 16.08,
        "repeat_cost_inr": 520560.0
    },
    "window_30d": {
        "repeat_contacts": 3201,
        "repeat_rate_pct": 26.96,
        "repeat_cost_inr": 858520.0,
        "quarterly_cost_inr": 858520.0
    }
}
MOCK_THEMES = {
    "cancellation_glitch": {
        "ticket_count": 324,
        "share_of_other_pct": 19.2
    }
}
MOCK_SLA = {
    "total_breaches": 1051,
    "breach_rate_pct": 8.85,
    "total_liability_inr": 367850.0
}
MOCK_CSAT = {
    "responses": 5269,
    "response_rate_pct": 44.4,
    "average_csat": 3.32
}
MOCK_TICKETS = [
    {"ticket_id": "TK-240014", "channel": "voice", "category": "Delivery", "customer_message": "Where is my package? Delay 5 days."},
    {"ticket_id": "TK-239102", "channel": "chat", "category": "Other", "customer_message": "Cancel button greyed out cannot cancel in app."}
]

class TestAIAnalyst(unittest.TestCase):

    def setUp(self):
        self.router = AIRouter()

    def test_context_builder_repeat_query(self):
        """Verifies repeat-contact query contains exact unrounded numbers."""
        ctx = build_grounded_context(
            query="Why are repeat contacts high?",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            agents={},
            sample_tickets=MOCK_TICKETS
        )
        self.assertIn("11,875", ctx)
        self.assertIn("3,201", ctx)
        self.assertIn("26.96%", ctx)
        self.assertIn("858,520.00", ctx)
        self.assertIn("1,910", ctx)
        self.assertIn("16.08%", ctx)
        self.assertIn("520,560.00", ctx)

    def test_context_builder_cancellation_query(self):
        """Verifies cancellation query contains 324 tickets and 19.2% share."""
        ctx = build_grounded_context(
            query="What is the cancellation glitch?",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            agents={},
            sample_tickets=MOCK_TICKETS
        )
        self.assertIn("324", ctx)
        self.assertIn("19.2%", ctx)

    def test_intent_router_greeting(self):
        """Verifies conversational greetings bypass LLMs and return instant local response."""
        res = asyncio.run(self.router.generate_response(query="hi"))
        self.assertEqual(res.provider, "local")
        self.assertEqual(res.model, "vireo-intent-router")
        self.assertIn("Hi", res.answer)
        self.assertEqual(len(res.relevant_tickets), 0)

    def test_intent_router_capability(self):
        """Verifies capability queries return concise overview without dumping raw metrics."""
        res = asyncio.run(self.router.generate_response(query="how can u help regarding"))
        self.assertEqual(res.provider, "local")
        self.assertEqual(res.model, "vireo-intent-router")
        self.assertIn("Repeat contacts", res.analysis)
        self.assertEqual(len(res.relevant_tickets), 0)

    def test_local_deterministic_provider_grounding(self):
        """Verifies local fallback provider contains verified figures."""
        local = LocalFallbackProvider()
        res = asyncio.run(local.generate_answer(
            query="Why are repeat contacts high?",
            context=""
        ))
        self.assertIn("3,201", res["analysis"] + " ".join(res["evidence"]))
        self.assertIn("858,520", res["analysis"] + " ".join(res["evidence"]))
        self.assertIn("1,910", res["analysis"] + " ".join(res["evidence"]))
        self.assertIn("520,560", res["analysis"] + " ".join(res["evidence"]))
        self.assertIn("122,500", res["analysis"] + " ".join(res["evidence"]))

    def test_failover_gemini_to_groq(self):
        """Simulates Gemini failure to ensure Groq fallback executes."""
        router = AIRouter()
        # Mock Gemini failing
        router.providers["gemini"].generate_answer = AsyncMock(side_effect=RuntimeError("Simulated Gemini 503 Outage"))
        
        # Mock Groq succeeding
        router.providers["groq"].generate_answer = AsyncMock(return_value={
            "answer": "Grounded Groq answer",
            "analysis": "Groq verified analysis with 3,201 repeat tickets",
            "evidence": ["30-day repeats: 3,201 (26.96%)", "Cost: ₹858,520"],
            "data_used": ["Support Policy v3.2 §10"],
            "relevant_tickets": ["TK-240014"]
        })

        res = asyncio.run(router.generate_response(
            query="Why are repeat contacts high?",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            sample_tickets=MOCK_TICKETS
        ))

        self.assertEqual(res.provider, "groq")
        self.assertTrue(res.fallback_used)
        self.assertIn("gemini:failed", res.fallback_chain)
        self.assertIn("groq", res.fallback_chain)
        self.assertIn("3,201", res.analysis)

    def test_failover_gemini_and_groq_to_nemotron(self):
        """Simulates Gemini and Groq failing to ensure Nemotron fallback executes."""
        router = AIRouter()
        router.providers["gemini"].generate_answer = AsyncMock(side_effect=RuntimeError("Gemini 503"))
        router.providers["groq"].generate_answer = AsyncMock(side_effect=RuntimeError("Groq 429"))
        
        router.providers["nemotron"].generate_answer = AsyncMock(return_value={
            "answer": "Grounded Nemotron answer",
            "analysis": "Nemotron analysis with 1,910 14d repeats and 3,201 30d repeats",
            "evidence": ["1,910 (16.08%) costing ₹520,560", "3,201 (26.96%) costing ₹858,520"],
            "data_used": ["Cleaned dataset"],
            "relevant_tickets": ["TK-240014"]
        })

        res = asyncio.run(router.generate_response(
            query="Compare 14-day and 30-day repeat contacts",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            sample_tickets=MOCK_TICKETS
        ))

        self.assertEqual(res.provider, "nemotron")
        self.assertTrue(res.fallback_used)
        self.assertIn("gemini:failed", res.fallback_chain)
        self.assertIn("groq:failed", res.fallback_chain)
        self.assertIn("nemotron", res.fallback_chain)

    def test_full_failover_to_local_deterministic_engine(self):
        """Simulates all external APIs failing to ensure local engine takes over without crash."""
        router = AIRouter()
        router.providers["gemini"].generate_answer = AsyncMock(side_effect=RuntimeError("Gemini down"))
        router.providers["groq"].generate_answer = AsyncMock(side_effect=RuntimeError("Groq down"))
        router.providers["nemotron"].generate_answer = AsyncMock(side_effect=RuntimeError("Nemotron down"))

        res = asyncio.run(router.generate_response(
            query="Why are repeat contacts high?",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            sample_tickets=MOCK_TICKETS
        ))

        self.assertEqual(res.provider, "local")
        self.assertTrue(res.fallback_used)
        self.assertIn("3,201", res.analysis + " ".join(res.evidence))
        self.assertIn("858,520", res.analysis + " ".join(res.evidence))

    def test_security_no_api_keys_leaked_in_response(self):
        """Ensures API response contains zero credentials or secrets."""
        router = AIRouter()
        router.providers["gemini"].generate_answer = AsyncMock(return_value={
            "answer": "Secure answer",
            "analysis": "No keys leaked in analysis",
            "evidence": ["Data point 1"],
            "data_used": ["Table A"],
            "relevant_tickets": ["TK-123456"]
        })
        res = asyncio.run(router.generate_response(
            query="What is the cancellation bug?",
            metrics=MOCK_METRICS,
            themes=MOCK_THEMES,
            repeats=MOCK_REPEATS,
            sla=MOCK_SLA,
            csat=MOCK_CSAT,
            sample_tickets=MOCK_TICKETS
        ))
        res_json_str = res.model_dump_json()
        self.assertNotIn("AIza", res_json_str)
        self.assertNotIn("gsk_", res_json_str)
        self.assertNotIn("nvapi-", res_json_str)
        self.assertNotIn("AQ.", res_json_str)

    def test_cancellation_ui_glitch_domain_query(self):
        """Tests that queries about cancellation return the verified 324 tickets / 19.2% share."""
        local = LocalFallbackProvider()
        res = asyncio.run(local.generate_answer("Explain the cancellation issue", context=""))
        self.assertIn("324", " ".join(res["evidence"]) + res["answer"])
        self.assertIn("19.2%", " ".join(res["evidence"]) + res["answer"])

    def test_sla_liability_domain_query(self):
        """Tests that queries about SLA return 1,051 breaches and ₹367,850 liability."""
        local = LocalFallbackProvider()
        res = asyncio.run(local.generate_answer("What is the SLA liability?", context=""))
        self.assertIn("1,051", " ".join(res["evidence"]) + res["answer"])
        self.assertIn("367,850", " ".join(res["evidence"]) + res["answer"])

if __name__ == "__main__":
    unittest.main()
