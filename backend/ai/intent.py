"""Lightweight intent router executing BEFORE external LLM calls.
Handles conversational greetings and capability questions locally (<2ms, ₹0 cost).
"""

import re
from typing import Optional, Dict, Any

GREETING_PATTERNS = [
    r"^(hi|hello|hey|greetings|good\s+morning|good\s+afternoon|good\s+evening|yo|sup|howdy)\b",
    r"^hi\s+there\b",
    r"^hello\s+there\b"
]

CAPABILITY_PATTERNS = [
    r"^(what\s+can\s+(you|u)\s+do)",
    r"^(how\s+can\s+(you|u)\s+help)",
    r"^(what\s+can\s+i\s+(ask|query))",
    r"^(how\s+to\s+use)",
    r"^(help|capabilities|menu)\b",
    r"how\s+can\s+(you|u)\s+help\s+regarding",
    r"^(what\s+do\s+you\s+know)",
    r"^(who\s+are\s+you)"
]

def check_local_intent(query: str) -> Optional[Dict[str, Any]]:
    """Checks if query is a simple greeting or capability question.
    Returns structured response dict if matched, otherwise None.
    """
    q_clean = query.strip().lower()
    # Strip common punctuation
    q_alpha = re.sub(r"[?!.,;:]+$", "", q_clean).strip()

    # 1. Greetings
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, q_alpha):
            # Only treat as pure greeting if it's very short (not e.g. "hello why are repeat contacts high")
            if len(q_alpha.split()) <= 4:
                return {
                    "answer": (
                        "Hi. I can analyze Vireo Audio's support data across repeat contacts, "
                        "SLA performance, CSAT, customer friction, and operational cost."
                    ),
                    "analysis": (
                        "I am Vireo Audio's Support Intelligence System. You can ask me specific questions "
                        "about customer complaint drivers, delivery delays, SLA liabilities, survey ratings, "
                        "agent performance, or repeat-contact cost modeling."
                    ),
                    "evidence": [
                        "Try asking: 'Why are repeat contacts high?'",
                        "Try asking: 'What is driving customer friction?'",
                        "Try asking: 'Explain the cancellation UI issue'",
                        "Try asking: 'How much are repeat contacts costing us?'"
                    ],
                    "data_used": [
                        "Vireo Audio Support Desk Dataset (11,875 unique cleaned tickets)"
                    ],
                    "relevant_tickets": []
                }

    # 2. Capability Questions
    for pattern in CAPABILITY_PATTERNS:
        if re.search(pattern, q_alpha):
            return {
                "answer": (
                    "I can analyze Vireo Audio's support operations, customer friction points, and operational costs "
                    "across 11,875 verified tickets."
                ),
                "analysis": (
                    "I can help analyze:\n"
                    "• Repeat contacts — 14-day (16.08%) and 30-day (26.96%) patterns and handling costs\n"
                    "• SLA performance — breach rates (8.85%) and store credit compensation liability (₹367,850)\n"
                    "• Customer friction — audited complaint themes, delivery delays, and checkout cancellation UI flaws\n"
                    "• CSAT scores — valid ratings (3.32 average) and legacy survey filtering\n"
                    "• Agent scorecards — fair Tier 1 and Tier 2 resolution speed metrics\n"
                    "• Business impact — quarterly cost modeling and the ₹122,500 repeat-contact reduction opportunity"
                ),
                "evidence": [
                    "Ask: 'Why are repeat contacts high?'",
                    "Ask: 'What is the cancellation issue?'",
                    "Ask: 'How much are repeat contacts costing Vireo?'",
                    "Ask: 'Break down SLA breach liability'"
                ],
                "data_used": [
                    "Support Policy v3.2 (§1–12)",
                    "Cleaned Tickets Dataset (11,875 rows)"
                ],
                "relevant_tickets": []
            }

    return None
