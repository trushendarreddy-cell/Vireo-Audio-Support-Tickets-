"""
Data cleaning and normalization module.
Executes deduplication, timezone adjustments, CSAT normalization,
order fallback joins, and row-level SLA evaluations.
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple, Any, Optional

from src.config import SLA_TARGET_MINUTES, SLA_BREACH_PENALTY_INR

def parse_dt(s: Optional[str]) -> Optional[datetime]:
    if not s or not s.strip():
        return None
    try:
        return datetime.strptime(s.strip(), "%Y-%m-%d %H:%M")
    except ValueError:
        return None

def parse_date(s: Optional[str]) -> Optional[datetime]:
    if not s or not s.strip():
        return None
    try:
        return datetime.strptime(s.strip(), "%Y-%m-%d")
    except ValueError:
        return None

def clean_data(
    raw_tickets: List[Dict[str, str]],
    raw_orders: List[Dict[str, str]],
    raw_customers: List[Dict[str, str]],
    raw_products: List[Dict[str, str]],
    raw_agents: List[Dict[str, str]]
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """
    Cleans and normalizes tickets while preserving auditable diagnostics.
    """
    stats = {
        "raw_tickets_count": len(raw_tickets),
        "duplicate_id_count": 0,
        "dropped_duplicate_rows": 0,
        "legacy_utc_shifted_count": 0,
        "legacy_inversions_before_shift": 0,
        "legacy_inversions_after_shift": 0,
        "csat_zero_count": 0,
        "csat_blank_count": 0,
        "csat_valid_count": 0,
        "orders_direct_matched": 0,
        "orders_fallback_unique": 0,
        "orders_fallback_date_nearest": 0,
        "orders_fallback_ambiguous": 0,
        "orders_unmatched": 0,
    }

    # 1. Deduplication Logic
    tickets_by_id = defaultdict(list)
    for t in raw_tickets:
        tickets_by_id[t["ticket_id"]].append(t)

    deduped_raw = []
    for tid, rows in tickets_by_id.items():
        if len(rows) == 1:
            deduped_raw.append(rows[0])
        else:
            stats["duplicate_id_count"] += 1
            stats["dropped_duplicate_rows"] += len(rows) - 1
            # Retain helpdesk row if present, else first row
            hd_rows = [r for r in rows if r.get("source_system") == "helpdesk"]
            if hd_rows:
                deduped_raw.append(hd_rows[0])
            else:
                deduped_raw.append(rows[0])

    stats["unique_tickets_count"] = len(deduped_raw)

    # 2. Build Reference Lookups
    orders_by_id = {o["order_id"]: o for o in raw_orders}
    orders_by_cust_sku = defaultdict(list)
    for o in raw_orders:
        orders_by_cust_sku[(o["customer_id"], o["sku"])].append(o)

    products_by_sku = {p["sku"]: p for p in raw_products}
    customers_by_id = {c["customer_id"]: c for c in raw_customers}
    agents_by_id = {a["agent_id"]: a for a in raw_agents}

    cleaned_tickets = []

    for t in deduped_raw:
        item = dict(t)  # copy

        # Parse timestamps
        c_dt = parse_dt(item.get("created_at"))
        r_dt = parse_dt(item.get("first_response_at"))
        res_raw_dt = parse_dt(item.get("resolved_at"))

        item["created_dt"] = c_dt
        item["first_response_dt"] = r_dt

        # Timezone Normalization:
        # Legacy event-log resolution timestamps are in UTC.
        # Shift +5h 30m to convert UTC to IST. Helpdesk rows are already in IST.
        if res_raw_dt and item.get("source_system") == "legacy_fd":
            stats["legacy_utc_shifted_count"] += 1
            if res_raw_dt < c_dt:
                stats["legacy_inversions_before_shift"] += 1
            res_dt = res_raw_dt + timedelta(hours=5, minutes=30)
            if res_dt < c_dt:
                stats["legacy_inversions_after_shift"] += 1
        else:
            res_dt = res_raw_dt

        item["resolved_dt"] = res_dt
        item["resolved_at_ist"] = res_dt.strftime("%Y-%m-%d %H:%M") if res_dt else ""

        # Response Time and SLA Metrics
        if c_dt and r_dt:
            resp_min = (r_dt - c_dt).total_seconds() / 60.0
        else:
            resp_min = None
        item["first_response_minutes"] = resp_min

        ch = item.get("channel", "").lower()
        sla_target = SLA_TARGET_MINUTES.get(ch, 15)
        item["sla_target_minutes"] = sla_target

        if resp_min is not None and resp_min > sla_target:
            item["is_sla_breach"] = True
            item["sla_penalty_inr"] = SLA_BREACH_PENALTY_INR
        else:
            item["is_sla_breach"] = False
            item["sla_penalty_inr"] = 0.0

        # Handle time and Resolution duration
        if res_dt and c_dt:
            item["resolution_hours"] = (res_dt - c_dt).total_seconds() / 3600.0
            item["resolution_days"] = (res_dt - c_dt).total_seconds() / 86400.0
        else:
            item["resolution_hours"] = None
            item["resolution_days"] = None

        if res_dt and r_dt:
            item["handle_time_hours"] = (res_dt - r_dt).total_seconds() / 3600.0
        else:
            item["handle_time_hours"] = None

        # CSAT Normalization (Policy §8: CSAT 0 = no response)
        raw_csat = item.get("csat_score", "").strip()
        if raw_csat == "0":
            stats["csat_zero_count"] += 1
            item["csat_valid"] = None
            item["csat_status"] = "no_response_legacy_zero"
        elif raw_csat in {"1", "2", "3", "4", "5"}:
            stats["csat_valid_count"] += 1
            item["csat_valid"] = int(raw_csat)
            item["csat_status"] = "valid_response"
        else:
            stats["csat_blank_count"] += 1
            item["csat_valid"] = None
            item["csat_status"] = "no_response_blank"

        # Order ID Fallback Resolution
        raw_oid = item.get("order_id", "").strip()
        cust_id = item.get("customer_id", "").strip()
        sku = item.get("product_sku", "").strip()

        if raw_oid and raw_oid in orders_by_id:
            stats["orders_direct_matched"] += 1
            item["matched_order_id"] = raw_oid
            item["order_match_type"] = "direct"
        elif not raw_oid:
            candidates = orders_by_cust_sku.get((cust_id, sku), [])
            if len(candidates) == 1:
                stats["orders_fallback_unique"] += 1
                item["matched_order_id"] = candidates[0]["order_id"]
                item["order_match_type"] = "fallback_unique"
            elif len(candidates) > 1:
                # Disambiguate by order date <= ticket created date
                t_date = datetime(c_dt.year, c_dt.month, c_dt.day) if c_dt else None
                priors = [c for c in candidates if parse_date(c["order_date"]) and parse_date(c["order_date"]) <= t_date]
                if len(priors) == 1:
                    stats["orders_fallback_date_nearest"] += 1
                    item["matched_order_id"] = priors[0]["order_id"]
                    item["order_match_type"] = "fallback_date_nearest"
                elif len(priors) > 1:
                    priors.sort(key=lambda x: parse_date(x["order_date"]), reverse=True)
                    # Check if top 2 have distinct dates
                    d0 = parse_date(priors[0]["order_date"])
                    d1 = parse_date(priors[1]["order_date"])
                    if d0 > d1:
                        stats["orders_fallback_date_nearest"] += 1
                        item["matched_order_id"] = priors[0]["order_id"]
                        item["order_match_type"] = "fallback_date_nearest"
                    else:
                        stats["orders_fallback_ambiguous"] += 1
                        item["matched_order_id"] = priors[0]["order_id"]
                        item["order_match_type"] = "fallback_ambiguous"
                else:
                    stats["orders_fallback_ambiguous"] += 1
                    item["matched_order_id"] = ""
                    item["order_match_type"] = "fallback_ambiguous"
            else:
                stats["orders_unmatched"] += 1
                item["matched_order_id"] = ""
                item["order_match_type"] = "unmatched"
        else:
            stats["orders_unmatched"] += 1
            item["matched_order_id"] = raw_oid
            item["order_match_type"] = "invalid_order_id"

        # Financial values normalization
        refund_str = item.get("refund_amount_inr", "").strip()
        item["refund_amount"] = float(refund_str) if refund_str else 0.0

        # Agent metadata enrichment
        aid = item.get("agent_id", "").strip()
        agent_meta = agents_by_id.get(aid, {})
        item["agent_name"] = agent_meta.get("name", "Unknown")
        item["agent_team"] = agent_meta.get("team", item.get("assigned_team", "Unknown"))
        item["agent_site"] = agent_meta.get("site", "Unknown")
        item["agent_shift"] = agent_meta.get("shift", "Unknown")
        item["agent_tier"] = agent_meta.get("tier", "1")

        # Product metadata enrichment
        prod_meta = products_by_sku.get(sku, {})
        item["product_name"] = prod_meta.get("product_name", sku)
        item["product_family"] = prod_meta.get("family", "Unknown")
        unit_cost_str = prod_meta.get("unit_cost_inr", "").strip()
        item["product_unit_cost"] = float(unit_cost_str) if unit_cost_str else 0.0

        cleaned_tickets.append(item)

    # Sort deterministically by created_dt then ticket_id
    cleaned_tickets.sort(key=lambda x: (x["created_dt"] or datetime.min, x["ticket_id"]))

    return cleaned_tickets, stats
