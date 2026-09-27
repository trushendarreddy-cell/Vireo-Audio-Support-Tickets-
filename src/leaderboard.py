"""
Fair Agent Leaderboard Module.
Separates Tier 1 and Tier 2 per support-policy.pdf §6.
Evaluates agents within functional teams on balanced operational metrics.
"""

import csv
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from typing import Dict, List, Any, Tuple
from pathlib import Path

from src.config import TIER1_TEAMS, TIER2_TEAMS

def build_agent_leaderboards(
    tickets: List[Dict[str, Any]],
    raw_agents: List[Dict[str, str]],
    repeat_ticket_ids: List[str],
    output_csv_path: Path
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Constructs fair Tier 1 and Tier 2 agent performance scorecards.
    Exports to CSV and returns structured records.
    """
    repeat_set = set(repeat_ticket_ids)

    # Aggregate tickets by resolving agent_id
    tickets_by_agent = defaultdict(list)
    for t in tickets:
        aid = t.get("agent_id", "").strip()
        if aid:
            tickets_by_agent[aid].append(t)

    agent_metrics = []

    for a in raw_agents:
        aid = a["agent_id"]
        name = a["name"]
        team = a["team"]
        site = a["site"]
        shift = a["shift"]
        tier = a["tier"]
        from_date = a.get("from_date", "")

        t_list = tickets_by_agent.get(aid, [])
        total_tickets = len(t_list)

        # Attended tickets (resolved or closed)
        attended_tickets = sum(1 for t in t_list if t.get("status") in {"resolved", "closed"})

        # Active weeks (distinct weeks agent resolved at least 1 ticket)
        active_weeks_set = set()
        for t in t_list:
            dt = t.get("created_dt")
            if dt:
                mon = dt.date() - timedelta(days=dt.weekday())
                active_weeks_set.add(mon)
        active_weeks = len(active_weeks_set) if active_weeks_set else 1

        tickets_per_week = round(attended_tickets / active_weeks, 1) if active_weeks else 0.0

        # SLA Breaches
        sla_breaches = sum(1 for t in t_list if t.get("is_sla_breach"))
        sla_breach_rate = round((sla_breaches / total_tickets * 100.0) if total_tickets else 0.0, 1)

        # CSAT (Excluding 0 and blank)
        valid_csats = [t["csat_valid"] for t in t_list if t.get("csat_valid") is not None]
        csat_count = len(valid_csats)
        avg_csat = round((sum(valid_csats) / csat_count), 2) if csat_count else None

        # Repeat contacts: tickets resolved by agent that resulted in customer calling back
        repeat_contacts = sum(1 for t in t_list if t["ticket_id"] in repeat_set)
        repeat_rate = round((repeat_contacts / total_tickets * 100.0) if total_tickets else 0.0, 1)

        # Transfers
        total_transfers = sum(int(t.get("transfers", 0) or 0) for t in t_list)
        transfer_rate = round((total_transfers / total_tickets), 2) if total_tickets else 0.0

        # Resolution Days (primarily for Tier 2)
        res_days_list = [t["resolution_days"] for t in t_list if t.get("resolution_days") is not None]
        avg_res_days = round(sum(res_days_list) / len(res_days_list), 2) if res_days_list else 0.0
        # Median resolution days
        if res_days_list:
            s_days = sorted(res_days_list)
            mid = len(s_days) // 2
            med_res_days = round((s_days[mid] if len(s_days) % 2 != 0 else (s_days[mid-1] + s_days[mid]) / 2.0), 2)
        else:
            med_res_days = 0.0

        agent_metrics.append({
            "agent_id": aid,
            "name": name,
            "team": team,
            "tier": tier,
            "site": site,
            "shift": shift,
            "from_date": from_date,
            "total_tickets": total_tickets,
            "attended_tickets": attended_tickets,
            "active_weeks": active_weeks,
            "tickets_per_week": tickets_per_week,
            "avg_resolution_days": avg_res_days,
            "median_resolution_days": med_res_days,
            "sla_breaches": sla_breaches,
            "sla_breach_rate_pct": sla_breach_rate,
            "csat_responses": csat_count,
            "avg_csat": avg_csat if avg_csat is not None else "N/A",
            "csat_sample_warning": "Low Sample (<10)" if csat_count < 10 else "Sufficient",
            "repeat_contacts_spawned": repeat_contacts,
            "repeat_contact_rate_pct": repeat_rate,
            "transfers_handled": total_transfers,
            "transfer_rate": transfer_rate
        })

    # Separate into Tier 1 and Tier 2
    tier1_agents = [a for a in agent_metrics if a["tier"] == "1"]
    tier2_agents = [a for a in agent_metrics if a["tier"] == "2"]

    # Sort Tier 1 by Team, then by tickets_per_week descending
    tier1_agents.sort(key=lambda x: (x["team"], -x["tickets_per_week"]))

    # Sort Tier 2 strictly by Resolution Speed (avg_resolution_days ascending), NOT volume
    tier2_agents.sort(key=lambda x: x["avg_resolution_days"])

    # Export to CSV
    output_csv_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "tier", "team", "agent_id", "name", "site", "shift",
        "total_tickets", "attended_tickets", "active_weeks", "tickets_per_week",
        "avg_resolution_days", "median_resolution_days",
        "sla_breach_rate_pct", "avg_csat", "csat_responses", "csat_sample_warning",
        "repeat_contact_rate_pct", "transfer_rate", "from_date"
    ]
    with open(output_csv_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for a in tier1_agents:
            writer.writerow(a)
        for a in tier2_agents:
            writer.writerow(a)

    return tier1_agents, tier2_agents
