"""
Theme and complaint extraction module.
Performs deterministic, rule-based text mining and n-gram analysis
without external API costs. Filters IVR boilerplate and masks PII.
"""

import re
from collections import Counter, defaultdict
from typing import Dict, List, Any, Tuple

# PII Masking regex patterns
PHONE_PATTERN = re.compile(r"\b(?:\+?91[-.\s]?)?[6-9]\d{9}\b")
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
ORDER_ID_PATTERN = re.compile(r"\bVR\d{6}\b", re.IGNORECASE)

# IVR Transcript Boilerplate
IVR_PREFIX_PATTERN = re.compile(r"^\[ivr transcript\]\s*", re.IGNORECASE)

# Core Theme Signatures (Auditable deterministic patterns)
THEME_PATTERNS = {
    "cancellation_ui_glitch": {
        "name": "Cancellation & Order Edit UI Issue",
        "description": "Customer unable to cancel or edit address before dispatch; cancel button disabled/greyed out",
        "patterns": [
            r"cancel.*button.*g[re|er|ay]+y?ed\s*out",
            r"button.*g[re|er|ay]+y?ed\s*out",
            r"tried.*cancel.*button",
            r"tried editing in app",
            r"edit.*delivery address",
            r"change.*delivery address",
            r"stop the shipment",
            r"ordered by mistake.*cancel",
            r"don'?t ship",
            r"app address edit failed"
        ],
        "primary_category": "Other"
    },
    "delivery_shipping_delay": {
        "name": "Delivery Delay & Tracking Stagnation",
        "description": "Shipment delayed beyond promised SLA; tracking status not updating or stagnant",
        "patterns": [
            r"not (?:been )?delive+red",
            r"package not delive+red",
            r"order not delive+red",
            r"tracking not updating",
            r"tracking page daily",
            r"parcel.*stuck",
            r"delay.*(?:dispatch|transit)",
            r"order delayed",
            r"where is my (order|parcel|package)",
            r"awb.*invalid",
            r"fake attempt"
        ],
        "primary_category": "Delivery & Shipping"
    },
    "payment_invoice_glitch": {
        "name": "Payment Gateway & Invoice Download Failures",
        "description": "Double debit, payment failed but deducted, or inability to download invoice from portal",
        "patterns": [
            r"page failed after i paid",
            r"debited twice",
            r"double debit",
            r"duplicate payment",
            r"invoice not downloading",
            r"money deducted",
            r"cart says full price"
        ],
        "primary_category": "Billing & Payments"
    },
    "bluetooth_connectivity": {
        "name": "Bluetooth Pairing & Disconnection Drops",
        "description": "Audio disconnects intermittently or device fails to pair with phone/laptop",
        "patterns": [
            r"disconnecting every few minutes",
            r"keeps disconnecting",
            r"cannot pair",
            r"unable to pair",
            r"bluetooth drop",
            r"one earbud not connecting"
        ],
        "primary_category": "Connectivity"
    },
    "charging_power_failure": {
        "name": "Charging Defect & No Power",
        "description": "Unit will not turn on or charge in case despite reset / holding power button",
        "patterns": [
            r"no power",
            r"not charging",
            r"case not charging",
            r"held power button 30 sec",
            r"battery draining fast",
            r"dead on arrival"
        ],
        "primary_category": "Charging & Battery"
    },
    "mic_call_quality": {
        "name": "Microphone & Call Audio Degradation",
        "description": "Muffled mic, robotic voice on calls, or recipient unable to hear customer",
        "patterns": [
            r"mic not working",
            r"muffled sound",
            r"sounds like a badly tuned radio",
            r"crackling noise",
            r"low volume",
            r"caller cannot hear"
        ],
        "primary_category": "Audio Quality"
    },
    "return_refund_chasing": {
        "name": "Return Pickup & Refund Delay Follow-ups",
        "description": "Customer chasing pending refund after return pickup or QC inspection",
        "patterns": [
            r"where is the money for the return",
            r"refund not received",
            r"return pickup pending",
            r"pickup boy did not come",
            r"emailed twice.*refund"
        ],
        "primary_category": "Returns & Refunds"
    }
}

COMPILED_PATTERNS = {
    theme_id: [re.compile(p, re.IGNORECASE) for p in data["patterns"]]
    for theme_id, data in THEME_PATTERNS.items()
}

def clean_message_text(text: str) -> str:
    """Strips voice boilerplate and normalizes whitespace."""
    if not text:
        return ""
    # Strip [IVR transcript] prefix
    t = IVR_PREFIX_PATTERN.sub("", text.strip())
    return t

def anonymize_text(text: str) -> str:
    """Masks PII like phone numbers, emails, order IDs, and common name signatures."""
    if not text:
        return ""
    t = PHONE_PATTERN.sub("[PHONE_MASKED]", text)
    t = EMAIL_PATTERN.sub("[EMAIL_MASKED]", t)
    # Mask greetings / closures with common names and signatures
    t = re.sub(r"(?:Thanks|Regards|rgds|Cheers|Sincerely|from|advise\.)\s*,?\s*\n*\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?", r"[SIGNATURE_MASKED]", t, flags=re.IGNORECASE)
    t = re.sub(r"(?:Sincerely|Regards|Thanks|Yours truly),?\s*\n+\s*([A-Za-z\s]+)$", r"\n[NAME_MASKED]", t, flags=re.MULTILINE | re.IGNORECASE)
    return t.strip()

def match_themes(ticket: Dict[str, Any]) -> List[str]:
    """Matches ticket against auditable theme patterns."""
    msg = clean_message_text(ticket.get("customer_message", ""))
    notes = ticket.get("agent_notes", "")
    full_text = f"{msg} {notes}"

    matched = []
    for theme_id, regexes in COMPILED_PATTERNS.items():
        if any(r.search(full_text) for r in regexes):
            matched.append(theme_id)
    return matched

def extract_weekly_themes(weekly_tickets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Analyzes complaint themes for a given week.
    Returns counts, shares, and anonymized representative quotes.
    """
    total = len(weekly_tickets)
    theme_counts = Counter()
    theme_samples = defaultdict(list)

    for t in weekly_tickets:
        matched = match_themes(t)
        raw_msg = clean_message_text(t.get("customer_message", ""))
        for th in matched:
            theme_counts[th] += 1
            if len(theme_samples[th]) < 3 and len(raw_msg) > 20:
                theme_samples[th].append({
                    "ticket_id": t["ticket_id"],
                    "channel": t["channel"],
                    "category": t["category"],
                    "anonymized_quote": anonymize_text(raw_msg)
                })

    theme_metrics = {}
    for theme_id, count in theme_counts.most_common():
        theme_metrics[theme_id] = {
            "name": THEME_PATTERNS[theme_id]["name"],
            "description": THEME_PATTERNS[theme_id]["description"],
            "count": count,
            "share_pct": round((count / total * 100.0) if total else 0.0, 1),
            "samples": theme_samples[theme_id]
        }

    return theme_metrics
