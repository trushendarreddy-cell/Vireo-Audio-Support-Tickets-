"""
Vireo Audio Support Desk Analysis & Digest Tool.
Master pipeline entry point.
Run via: python run.py
"""

import csv
import json
import sys
from pathlib import Path
from datetime import datetime

from src.config import DATA_DIR, OUTPUT_DIR
from src.loader import load_and_validate_all
from src.cleaner import clean_data
from src.metrics import calculate_operational_metrics, calculate_repeat_contacts, run_repeat_sensitivity
from src.digest import generate_weekly_digest
from src.leaderboard import build_agent_leaderboards
from src.validator import run_validations

def export_cleaned_tickets_csv(cleaned_tickets, output_path: Path):
    """Exports row-level intermediate dataset for complete auditability."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "ticket_id", "source_system", "created_at", "first_response_at", "resolved_at_ist",
        "status", "channel", "category", "priority", "assigned_team", "agent_id", "agent_name",
        "agent_team", "agent_tier", "transfers", "csat_valid", "csat_status",
        "first_response_minutes", "is_sla_breach", "sla_penalty_inr",
        "resolution_days", "handle_time_hours",
        "customer_id", "product_sku", "matched_order_id", "order_match_type",
        "refund_amount", "refund_reason_code", "replacement_issued"
    ]
    with open(output_path, mode="w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for t in cleaned_tickets:
            writer.writerow(t)

def main():
    print("=" * 70)
    print("VIREO AUDIO SUPPORT DESK — OPERATIONAL & CX DIGEST ENGINE")
    print("=" * 70)
    start_time = datetime.now()

    # 1. Load Data
    print("\n[1/6] Loading raw data files from data/ ...")
    raw_data = load_and_validate_all(DATA_DIR)
    raw_tickets = raw_data["tickets.csv"]
    raw_orders = raw_data["orders.csv"]
    raw_customers = raw_data["customers.csv"]
    raw_products = raw_data["products.csv"]
    raw_agents = raw_data["agents.csv"]
    print(f"      Loaded {len(raw_tickets):,} raw tickets across 5 relational tables.")

    # 2. Clean & Deduplicate
    print("\n[2/6] Executing data cleaning, deduplication & timezone normalization...")
    cleaned_tickets, clean_stats = clean_data(
        raw_tickets, raw_orders, raw_customers, raw_products, raw_agents
    )
    print(f"      Raw rows: {clean_stats['raw_tickets_count']:,}")
    print(f"      Duplicate pairs dropped: {clean_stats['dropped_duplicate_rows']:,}")
    print(f"      Unique deduped tickets: {clean_stats['unique_tickets_count']:,}")
    print(f"      Legacy UTC resolution timestamps shifted: {clean_stats['legacy_utc_shifted_count']:,}")
    print(f"      Legacy timestamp inversions resolved to: {clean_stats['legacy_inversions_after_shift']}")

    # Export intermediate auditable dataset
    cleaned_csv_path = OUTPUT_DIR / "cleaned_tickets.csv"
    export_cleaned_tickets_csv(cleaned_tickets, cleaned_csv_path)
    print(f"      Auditable row-level dataset exported to {cleaned_csv_path.name}")

    # 3. Compute Metrics
    print("\n[3/6] Computing operational, SLA, CSAT and repeat-contact metrics...")
    op_metrics = calculate_operational_metrics(cleaned_tickets)
    repeat_sensitivity = run_repeat_sensitivity(cleaned_tickets)

    # Primary Repeat Metric: Same-Order within 30 days and 14 days
    rep_ids_30d, rep_summary_30d = calculate_repeat_contacts(cleaned_tickets, window_days=30, key_mode="order")
    rep_ids_14d, rep_summary_14d = calculate_repeat_contacts(cleaned_tickets, window_days=14, key_mode="order")

    print(f"      SLA Breaches: {op_metrics['sla']['total_breaches']:,} ({op_metrics['sla']['breach_rate_pct']:.2f}%)")
    print(f"      SLA Liability: INR {op_metrics['sla']['total_liability_inr']:,.2f}")
    print(f"      Valid CSAT Responses: {op_metrics['csat']['responses']:,} ({op_metrics['csat']['response_rate_pct']:.1f}% resp rate, avg {op_metrics['csat']['average_csat']:.2f})")
    print(f"      Repeat Contacts (14-day Same Order): {rep_summary_14d['repeat_tickets_count']:,} ({rep_summary_14d['repeat_rate_pct']}%), Cost: INR {rep_summary_14d['total_cost_channel_specific_inr']:,.2f}")
    print(f"      Repeat Contacts (30-day Same Order): {rep_summary_30d['repeat_tickets_count']:,} ({rep_summary_30d['repeat_rate_pct']}%), Cost: INR {rep_summary_30d['total_cost_channel_specific_inr']:,.2f}")

    # 4. Generate Weekly Digest
    print("\n[4/6] Generating Weekly Customer Complaint Digest...")
    digest_path = OUTPUT_DIR / "weekly_digest.md"
    generate_weekly_digest(cleaned_tickets, digest_path, num_recent_weeks=8)
    print(f"      Digest generated at {digest_path.name}")

    # 5. Build Agent Leaderboards
    print("\n[5/6] Building Tier 1 & Tier 2 fair agent leaderboards...")
    leaderboard_path = OUTPUT_DIR / "leaderboard.csv"
    tier1_agents, tier2_agents = build_agent_leaderboards(
        cleaned_tickets, raw_agents, rep_ids_30d, leaderboard_path
    )
    print(f"      Leaderboard exported to {leaderboard_path.name} (Tier 1: {len(tier1_agents)} agents, Tier 2: {len(tier2_agents)} agents)")

    # 6. Run Validations and Data Quality Report
    print("\n[6/6] Executing automated reconciliation and theme audit...")
    val_path = OUTPUT_DIR / "validation.md"
    dq_path = OUTPUT_DIR / "data_quality.md"
    val_results = run_validations(
        clean_stats, cleaned_tickets, op_metrics, repeat_sensitivity, val_path, dq_path
    )
    print(f"      Validation checks passed: {val_results['checks_passed']}/{val_results['checks_total']}")
    print(f"      Theme audit sample accuracy: {val_results['theme_recall']*100:.1f}%")

    # Export complete metrics JSON
    metrics_export = {
        "execution_timestamp": datetime.now().isoformat(),
        "cleaning_stats": clean_stats,
        "operational_metrics": op_metrics,
        "repeat_contact_metrics": {
            "primary_14d_order": rep_summary_14d,
            "primary_30d_order": rep_summary_30d,
            "sensitivity": repeat_sensitivity
        },
        "validation_results": val_results
    }
    metrics_json_path = OUTPUT_DIR / "metrics.json"
    with open(metrics_json_path, "w", encoding="utf-8") as f:
        json.dump(metrics_export, f, indent=2, default=str)
    print(f"      Metrics JSON saved to {metrics_json_path.name}")

    elapsed = (datetime.now() - start_time).total_seconds()
    print("\n" + "=" * 70)
    print(f"PIPELINE COMPLETED SUCCESSFULLY IN {elapsed:.2f} SECONDS (Cost: INR 0.00)")
    print("=" * 70)

if __name__ == "__main__":
    main()
