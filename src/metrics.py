"""
Metrics calculation module.
Computes operational volumes, SLA breaches and liabilities, repeat-contact sensitivities
and financial costs, CSAT distributions, and refund/replacement exposure.
"""

from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Tuple, Optional

from src.config import (
    CHANNEL_COST_INR,
    BLENDED_CONTACT_COST_INR,
    SLA_BREACH_PENALTY_INR,
    REPLACEMENT_SHIPPING_LOGISTICS_INR,
    STATED_WEEKLY_VOLUME,
    WEEKS_PER_YEAR,
    MONTHS_PER_YEAR
)

def calculate_operational_metrics(tickets: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_tickets = len(tickets)
    status_counts = Counter(t["status"] for t in tickets)
    channel_counts = Counter(t["channel"] for t in tickets)
    priority_counts = Counter(t["priority"] for t in tickets)
    category_counts = Counter(t["category"] for t in tickets)
    team_counts = Counter(t["agent_team"] for t in tickets)

    attendance_count = status_counts["resolved"] + status_counts["closed"]

    # SLA calculations
    sla_breaches = [t for t in tickets if t["is_sla_breach"]]
    total_sla_breaches = len(sla_breaches)
    sla_breach_rate = (total_sla_breaches / total_tickets * 100.0) if total_tickets else 0.0
    sla_liability_inr = total_sla_breaches * SLA_BREACH_PENALTY_INR
    sla_quarterly_liability_inr = sla_liability_inr / 6.0  # 18 months = 6 quarters

    sla_by_channel = {}
    for ch in channel_counts:
        ch_tickets = [t for t in tickets if t["channel"] == ch]
        ch_breaches = [t for t in ch_tickets if t["is_sla_breach"]]
        sla_by_channel[ch] = {
            "total": len(ch_tickets),
            "breaches": len(ch_breaches),
            "breach_rate_pct": (len(ch_breaches) / len(ch_tickets) * 100.0) if ch_tickets else 0.0,
            "liability_inr": len(ch_breaches) * SLA_BREACH_PENALTY_INR
        }

    # CSAT calculations
    valid_csat_scores = [t["csat_valid"] for t in tickets if t["csat_valid"] is not None]
    csat_responses = len(valid_csat_scores)
    csat_response_rate = (csat_responses / total_tickets * 100.0) if total_tickets else 0.0
    avg_csat = (sum(valid_csat_scores) / csat_responses) if csat_responses else 0.0
    csat_dist = Counter(valid_csat_scores)

    # Refunds & Replacements
    refund_tickets = [t for t in tickets if t["refund_amount"] > 0]
    total_refund_inr = sum(t["refund_amount"] for t in refund_tickets)
    refund_reasons = Counter(t["refund_reason_code"] for t in refund_tickets if t["refund_reason_code"])

    replacements = [t for t in tickets if t.get("replacement_issued") == "Y"]
    total_replacements = len(replacements)
    est_replacement_cost_inr = sum(
        t.get("product_unit_cost", 0.0) + REPLACEMENT_SHIPPING_LOGISTICS_INR
        for t in replacements
    )

    return {
        "total_tickets": total_tickets,
        "attendance_tickets": attendance_count,
        "status_counts": dict(status_counts),
        "channel_counts": dict(channel_counts),
        "priority_counts": dict(priority_counts),
        "category_counts": dict(category_counts),
        "team_counts": dict(team_counts),
        "sla": {
            "total_breaches": total_sla_breaches,
            "breach_rate_pct": sla_breach_rate,
            "total_liability_inr": sla_liability_inr,
            "quarterly_liability_inr": sla_quarterly_liability_inr,
            "by_channel": sla_by_channel
        },
        "csat": {
            "responses": csat_responses,
            "response_rate_pct": csat_response_rate,
            "average_csat": round(avg_csat, 2),
            "distribution": dict(csat_dist)
        },
        "financials": {
            "refund_ticket_count": len(refund_tickets),
            "total_refund_amount_inr": total_refund_inr,
            "refund_reasons": dict(refund_reasons),
            "replacement_count": total_replacements,
            "est_replacement_cost_inr": est_replacement_cost_inr
        }
    }

def calculate_repeat_contacts(
    tickets: List[Dict[str, Any]],
    window_days: int = 30,
    key_mode: str = "order"
) -> Tuple[List[str], Dict[str, Any]]:
    """
    Calculates repeat contacts according to support-policy.pdf §10:
    A ticket is a repeat contact if the same customer contacts again within window_days
    of the resolution/closure of an earlier ticket.
    key_mode options:
      - 'order': (customer_id, matched_order_id) [Primary Defensible Proxy]
      - 'product': (customer_id, product_sku)
      - 'customer': customer_id
    Returns:
      (list of repeat ticket IDs, metric summary dict)
    """
    # Group tickets by specified key
    groups = defaultdict(list)
    for t in tickets:
        if key_mode == "order":
            oid = t.get("matched_order_id", "").strip()
            if oid:
                groups[(t["customer_id"], oid)].append(t)
        elif key_mode == "product":
            sku = t.get("product_sku", "").strip()
            if sku:
                groups[(t["customer_id"], sku)].append(t)
        elif key_mode == "customer":
            groups[t["customer_id"]].append(t)

    repeat_ticket_ids = set()
    ticket_dict = {t["ticket_id"]: t for t in tickets}

    for key, group in groups.items():
        if len(group) < 2:
            continue
        # Ensure chronological ordering by creation time
        group.sort(key=lambda x: (x["created_dt"] or datetime.min, x["ticket_id"]))

        for i in range(1, len(group)):
            curr = group[i]
            curr_c = curr["created_dt"]
            if not curr_c:
                continue

            # Check if any prior ticket in group was resolved within window_days
            for j in range(i):
                prev = group[j]
                prev_res = prev["resolved_dt"]
                # Must have been resolved/closed
                if prev_res and prev.get("status") in {"resolved", "closed"}:
                    diff = curr_c - prev_res
                    if timedelta(days=0) <= diff <= timedelta(days=window_days):
                        repeat_ticket_ids.add(curr["ticket_id"])
                        break

    repeat_count = len(repeat_ticket_ids)
    total_count = len(tickets)
    rate_pct = (repeat_count / total_count * 100.0) if total_count else 0.0

    # Calculate actual contact-handling cost using channel-specific costs
    channel_breakdown = Counter()
    total_cost_inr = 0.0
    for tid in repeat_ticket_ids:
        t = ticket_dict[tid]
        ch = t.get("channel", "").lower()
        channel_breakdown[ch] += 1
        cost = CHANNEL_COST_INR.get(ch, BLENDED_CONTACT_COST_INR)
        total_cost_inr += cost

    blended_cost_inr = repeat_count * BLENDED_CONTACT_COST_INR

    summary = {
        "key_mode": key_mode,
        "window_days": window_days,
        "repeat_tickets_count": repeat_count,
        "total_tickets_count": total_count,
        "repeat_rate_pct": round(rate_pct, 2),
        "total_cost_channel_specific_inr": round(total_cost_inr, 2),
        "total_cost_blended_inr": round(blended_cost_inr, 2),
        "quarterly_cost_inr": round(total_cost_inr / 6.0, 2),
        "channel_breakdown": dict(channel_breakdown)
    }

    return sorted(list(repeat_ticket_ids)), summary

def run_repeat_sensitivity(tickets: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes repeat contact rates across all combinations:
    Windows: 14-day and 30-day
    Keys: Customer, Product, Order
    """
    results = {}
    for window in [14, 30]:
        for mode in ["customer", "product", "order"]:
            label = f"{mode}_{window}d"
            _, summary = calculate_repeat_contacts(tickets, window_days=window, key_mode=mode)
            results[label] = summary
    return results
