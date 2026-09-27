"""
Data loader module for reading and validating raw input CSV files.
Raw files are treated as strictly read-only.
"""

import csv
from pathlib import Path
from typing import Dict, List, Any
from src.config import DATA_DIR

EXPECTED_COLUMNS = {
    "tickets.csv": [
        "ticket_id", "created_at", "first_response_at", "resolved_at", "status",
        "channel", "customer_id", "order_id", "product_sku", "category",
        "priority", "assigned_team", "agent_id", "transfers", "csat_score",
        "refund_amount_inr", "refund_reason_code", "replacement_issued",
        "customer_message", "agent_notes", "source_system"
    ],
    "agents.csv": [
        "agent_id", "name", "site", "team", "shift", "tier", "from_date", "to_date"
    ],
    "orders.csv": [
        "order_id", "customer_id", "sku", "order_date", "channel", "qty",
        "order_value_inr", "lot_code"
    ],
    "customers.csv": [
        "customer_id", "name", "city", "state", "signup_date", "care_plus"
    ],
    "products.csv": [
        "sku", "product_name", "family", "launch_date", "unit_cost_inr",
        "retail_price_inr", "warranty_months"
    ]
}

def load_csv(file_path: Path) -> List[Dict[str, str]]:
    if not file_path.exists():
        raise FileNotFoundError(f"Required input file missing: {file_path}")
    with open(file_path, mode="r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        return list(reader)

def load_and_validate_all(data_dir: Path = DATA_DIR) -> Dict[str, List[Dict[str, str]]]:
    datasets = {}
    for filename, cols in EXPECTED_COLUMNS.items():
        fp = data_dir / filename
        data = load_csv(fp)
        if not data:
            raise ValueError(f"File {filename} is empty")
        # Validate column headers
        actual_cols = list(data[0].keys())
        missing = [c for c in cols if c not in actual_cols]
        if missing:
            raise ValueError(f"File {filename} missing required columns: {missing}")
        datasets[filename] = data
    return datasets
