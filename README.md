# Vireo Audio — Support Ticket Analysis

This is the support-ticket analysis tool I built for Vireo Audio.

The task gave me 18 months of support data and asked for something useful from it: a weekly view of customer complaints and a way to understand agent workload. I cleaned the data, calculated the main metrics in Python, built a web app around the results, and added an optional AI analyst.

The raw export has **12,528 rows**. After removing **653 duplicate rows**, there are **11,875 unique tickets**.

The important part of the design is that **Python calculates the numbers first**. AI can explain or explore the results, but it is not trusted to invent the main metrics.

## What the product does

- Weekly complaint digest
- Repeat-contact analysis
- SLA and store-credit tracking
- Agent performance views
- Ticket search
- Data-quality checks
- Optional AI analyst

It turns the raw CSV files into something a support lead can look through without manually joining files and calculating everything again.

### How it works

    Raw ticket files
          ↓
    Python cleaning
          ↓
    Metrics + theme analysis
          ↓
    Validation checks
          ↓
    FastAPI backend
          ↓
    Next.js web app
          ↓
    Optional AI analyst

## How I built it

### 1. Data cleaning

I checked duplicates, missing values, timestamps and the joins between tickets, customers, orders, products and agents.

There were **653 duplicate rows**, which I removed before calculating the main metrics.

I also corrected the legacy `resolved_at` timestamp issue by **+5.5 hours**. I did not change the other main timestamps.

### 2. Analysis

The main calculations live in the Python code under `src/`.

They cover repeat contact, SLA, agent data, complaint themes, cleaning and validation.

The same input data should produce the same main numbers every time.

### 3. Validation

There are **17 automated checks** for the main cleaning and calculations.

I also manually checked the cancellation/address-editing theme on a **50-ticket sample**.

I found **10 tickets with blank order IDs** where the same customer had multiple purchases of the same SKU on the same date. I leave those unresolved rather than guessing.

### 4. Web app

The backend uses **FastAPI** and the frontend uses **Next.js**.

The app puts the results in one place so the user does not have to work directly with the CSV files.

### 5. AI layer

The AI analyst receives verified numbers and relevant ticket context.

It is useful for questions and explanations, but the Python analysis remains the source of truth.

The core analysis does not require a paid API.

## Main business finding

The main metric I used is **30-day same-order repeat contact**.

**3,201 / 11,875 = 26.96%**

That means about **27% of tickets match a same-customer, same-order repeat contact within 30 days**.

This is a proxy. There is no root-cause/problem ID in the data, so I cannot honestly say every repeat contact is the exact same underlying problem.

The brief gives **650 tickets/week** as the planning volume. If repeat contact moved from **27% to 22%**, that would mean roughly:

- **8,450 tickets/quarter**
- **423 fewer repeat contacts/quarter**
- **₹1.23 lakh/quarter** at ₹290 per contact

This is a modeled target/opportunity, not a claim that the tool has already saved that money.

## Other findings

### Cancellation / address editing

I found **324 tickets** in the `Other` category matching a cancellation/address-editing problem.

Customers mention problems such as the cancel button being unavailable or not being able to change the delivery address.

This is a text pattern, not proof of a specific product bug. I would reproduce the product flow before attaching a savings number to it.

### SLA

There are **1,051 first-response SLA breaches**, corresponding to **₹367,850** in store-credit exposure under the policy.

### Agent leaderboard

I did not put every agent into one overall ranking.

Tier 2 Escalations & Warranty work can take days and can involve physical RMAs, so I kept that group separate and use resolution time there. Tier 1 agents are compared within their functional teams, with the underlying numbers visible.

I did this instead of inventing one combined agent score.

## What I deliberately left out

This was a short task, so I kept the product focused.

I did not build:

- an LLM call for every ticket;
- one combined agent score;
- a full production helpdesk;
- production authentication/RBAC and deployment;
- a large sentiment/embedding system that was not needed for the task.

The goal was a small working tool that can be checked, not a large system that looks impressive but is hard to trust.

## Quick numbers

| Metric | Result |
|---|---:|
| Raw rows | 12,528 |
| Duplicate rows removed | 653 |
| Unique tickets | 11,875 |
| 14-day same-order repeats | 1,910 (16.1%) |
| 30-day same-order repeats | 3,201 (27.0%) |
| SLA breaches | 1,051 |
| Store-credit exposure | ₹367,850 |
| Automated checks | 17 |
| Theme audit | 50 tickets |

## Project structure

    run.py
    src/                 # cleaning, metrics, themes and validation
    data/                # task files
    backend/             # FastAPI + optional AI analyst
    frontend/            # Next.js web app
    tests/               # tests
    memo-to-priya.md     # client memo
    design-log.md        # build decisions
    README.md            # this file

## Run it

### Requirements

- Python 3.10+
- Node.js 18+
- npm

### Analysis only

    python run.py

### Backend

    pip install -r requirements.txt
    python -m uvicorn backend.main:app --port 8000

### Frontend

    cd frontend
    npm install
    npm run build
    npm run start -- -p 3000

Then open `http://localhost:3000`.

On Windows, `start.ps1` is included as well.

## Important limitations

- Repeat contact is a proxy because there is no root-cause ID.
- 10 blank-order tickets are intentionally left unresolved.
- The cancellation/address-editing finding is a text pattern and needs product-flow reproduction before estimating savings.
- Historical volume is roughly 189 tickets/week; 650/week is the planning scenario from the brief.
- The web app is a prototype, not a production helpdesk.
- The AI analyst is optional and should not replace the Python numbers.

For the client-facing summary, see `memo-to-priya.md`.
For the build decisions and AI-assisted work notes, see `design-log.md`.
