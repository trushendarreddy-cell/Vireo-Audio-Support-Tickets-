"""Live smoke test demonstrating the full provider chain:
Gemini -> Groq -> Nemotron -> Local Deterministic Fallback
Tests the real analytical question: 'Why are repeat contacts high?'
Verifies grounding in the 6 authoritative repeat-contact numbers.
"""

import os
import sys
import json
import asyncio
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Ensure utf-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from backend.ai.router import AIRouter
from backend.ai.providers import (
    GeminiProvider,
    GroqProvider,
    NemotronProvider,
    LocalFallbackProvider
)
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

REQUIRED_GROUNDING_TOKENS = [
    ("3,201", "30-day repeat contacts"),
    ("26.96", "30-day repeat rate"),
    ("858,520", "30-day repeat cost"),
    ("1,910", "14-day repeat contacts"),
    ("16.08", "14-day repeat rate"),
    ("520,560", "14-day repeat cost")
]

async def test_live_chain():
    print("=" * 70)
    print("VIREO AI SUPPORT ANALYST: LIVE MULTI-PROVIDER CHAIN SMOKE TEST")
    print("=" * 70)

    context = build_grounded_context(
        query="Why are repeat contacts high?",
        metrics=MOCK_METRICS,
        themes=MOCK_THEMES,
        repeats=MOCK_REPEATS,
        sla=MOCK_SLA,
        csat=MOCK_CSAT,
        agents={},
        sample_tickets=MOCK_TICKETS
    )

    router = AIRouter()
    env = router.providers

    # 1. Test Gemini Direct
    print("\n[1/4] Testing Primary Provider: Google Gemini...")
    gemini = env["gemini"]
    gemini_ok = False
    if gemini.is_configured:
        try:
            res = await gemini.generate_answer("Why are repeat contacts high?", context)
            print(f"      Status: SUCCESS (Model: {gemini.model})")
            print(f"      Executive Summary: {res['answer'][:120]}...")
            gemini_ok = True
        except Exception as e:
            print(f"      Status: UNAVAILABLE / SPIKE ({type(e).__name__}: {str(e)[:90]})")
    else:
        print("      Status: SKIPPED (Unconfigured)")

    # 2. Test Groq Direct
    print("\n[2/4] Testing Fallback 1: Groq...")
    groq = env["groq"]
    groq_ok = False
    if groq.is_configured:
        try:
            res = await groq.generate_answer("Why are repeat contacts high?", context)
            print(f"      Status: SUCCESS (Model: {groq.model})")
            print(f"      Executive Summary: {res['answer'][:120]}...")
            groq_ok = True
        except Exception as e:
            print(f"      Status: UNAVAILABLE ({type(e).__name__}: {str(e)[:90]})")
    else:
        print("      Status: SKIPPED (Unconfigured)")

    # 3. Test NVIDIA Nemotron Direct
    print("\n[3/4] Testing Fallback 2: NVIDIA Nemotron...")
    nemotron = env["nemotron"]
    nemotron_ok = False
    if nemotron.is_configured:
        try:
            res = await nemotron.generate_answer("Why are repeat contacts high?", context)
            print(f"      Status: SUCCESS (Model: {nemotron.model})")
            print(f"      Executive Summary: {res['answer'][:120]}...")
            nemotron_ok = True
        except Exception as e:
            print(f"      Status: UNAVAILABLE ({type(e).__name__}: {str(e)[:90]})")
    else:
        print("      Status: SKIPPED (Unconfigured)")

    # 4. Test Local Deterministic Fallback Direct
    print("\n[4/4] Testing Final Fallback: Local Deterministic Engine (₹0 guarantee)...")
    local = env["local"]
    res_local = await local.generate_answer("Why are repeat contacts high?", context)
    print(f"      Status: SUCCESS (Model: {local.model})")
    print(f"      Executive Summary: {res_local['answer'][:120]}...")

    # 5. Full End-to-End Router Test with Grounding Validation
    print("\n" + "-" * 70)
    print("EXECUTING FULL ROUTER QUERY WITH GROUNDING RECONCILIATION")
    print("-" * 70)
    final_res = await router.generate_response(
        query="Why are repeat contacts high?",
        metrics=MOCK_METRICS,
        themes=MOCK_THEMES,
        repeats=MOCK_REPEATS,
        sla=MOCK_SLA,
        csat=MOCK_CSAT,
        sample_tickets=MOCK_TICKETS
    )

    print(f"Active Provider:    {final_res.provider.upper()} ({final_res.model})")
    print(f"Fallback Used:      {final_res.fallback_used} (Chain: {' -> '.join(final_res.fallback_chain)})")
    print(f"Latency:            {final_res.latency_ms} ms")
    print(f"Executive Answer:   {final_res.answer}\n")
    print("Evidence:")
    for ev in final_res.evidence:
        print(f"  * {ev}")

    combined_text = final_res.answer + " " + final_res.analysis + " " + " ".join(final_res.evidence) + " " + " ".join(final_res.data_used)
    
    print("\nReconciling Grounded Values in Output:")
    all_matched = True
    for token, label in REQUIRED_GROUNDING_TOKENS:
        clean_token = token.replace(",", "")
        has_token = (token in combined_text) or (clean_token in combined_text)
        status_str = "VERIFIED" if has_token else "MISSING"
        if not has_token:
            all_matched = False
        print(f"  [{status_str}] {label} ({token})")

    print("\n" + "=" * 70)
    if all_matched:
        print("RESULT: ALL 6 GROUNDING METRICS INDEPENDENTLY RECONCILED IN AI OUTPUT.")
    else:
        print("RESULT: SOME TOKENS MISSING FROM CONVERSATIONAL SUMMARY.")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_live_chain())
