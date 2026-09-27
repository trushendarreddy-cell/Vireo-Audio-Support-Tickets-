"""
Configuration and constants derived strictly from support-policy.pdf and task specifications.
"""

from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"

# Authoritative SLA Targets (support-policy.pdf §3)
# Human first-response targets from ticket creation
SLA_TARGET_MINUTES = {
    "chat": 15,       # 15 minutes
    "voice": 120,     # 2 hours
    "social": 240,    # 4 hours
    "email": 480      # 8 hours
}

# SLA Breach Penalty (support-policy.pdf §3)
SLA_BREACH_PENALTY_INR = 350.0

# Fully Loaded Cost Standards FY26 (support-policy.pdf §4)
CHANNEL_COST_INR = {
    "chat": 210.0,
    "email": 260.0,
    "voice": 520.0,
    "social": 240.0
}
BLENDED_CONTACT_COST_INR = 290.0
INTERNAL_TRANSFER_COST_INR = 305.0
AGENT_HOURLY_COST_INR = 165.0
AGENT_SHIFT_HOURS = 8

# Replacement & Goodwill Standards (support-policy.pdf §5)
REPLACEMENT_SHIPPING_LOGISTICS_INR = 340.0
GOODWILL_CREDIT_CAP_INR = 500.0

# Refund Reason Codes (support-policy.pdf §5)
VALID_REFUND_REASON_CODES = {
    "GW-OTHER",
    "DOA-REPL",
    "LOST-TRANSIT",
    "DUP-PAYMENT",
    "CANCEL",
    "PRICE-ADJ",
    "RETURN-QC-OK",
    "WTY-BUYBACK"
}

# Teams & Tiers (support-policy.pdf §6)
TIER1_TEAMS = {
    "Chat Frontline",
    "Email Frontline",
    "Voice Frontline",
    "Logistics",
    "Billing",
    "Returns Desk"
}
TIER2_TEAMS = {
    "Escalations & Warranty"
}

# Shifts (support-policy.pdf §7)
SHIFTS_IST = {
    "Morning": ("06:00", "14:00"),
    "Day": ("14:00", "22:00"),
    "Night": ("22:00", "06:00")
}

# Stated Operating Scenario Volume (Task specification / submission form)
STATED_WEEKLY_VOLUME = 650
WEEKS_PER_YEAR = 52
MONTHS_PER_YEAR = 12
STATED_MONTHLY_VOLUME = (STATED_WEEKLY_VOLUME * WEEKS_PER_YEAR) / MONTHS_PER_YEAR  # ~2,816.67 tickets/mo
