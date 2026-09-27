# Vireo Audio — Support Ticket Analysis

This is the tool I built for the Vireo Audio support-ticket task.

I took the 18 months of ticket data, cleaned it up, looked for the main problems, built the weekly digest and agent leaderboard, and put the results behind a small web app. There is also an AI chat box, but I did not let the AI make up the numbers. The Python analysis is the source of truth.

There are 12,528 rows in the raw export. After removing 653 duplicate rows, there are 11,875 tickets to work with.

## Run it

### You need

- Python 3.8+
- Node.js 18+
- npm

### Web app

Backend:

```bash
pip install -r requirements.txt
python -m uvicorn backend.main:app --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run start -- -p 3000
```

Then open `http://localhost:3000`.

On Windows, `.start.ps1` does the setup and starts both parts.

### Just run the analysis

If you don't care about the web app:

```bash
python run.py
```

This reads the files in `data/` and writes the results to `output/`. It uses the Python standard library for the actual analysis and takes about a second on this dataset.

## What I actually built

- Weekly complaint digest
- Agent leaderboard
- Repeat-contact analysis
- SLA and store-credit numbers
- Ticket search
- Data-quality checks
- Optional AI analyst

The dashboard puts these things together so someone can look through the data without opening a bunch of CSV files.

## The main number

The number I ended up using is **30-day same-order repeat contact**.

There are **3,201 repeat contacts out of 11,875 unique tickets = 26.96%**.

For the business target, I used Vireo's stated planning volume of **650 tickets/week** and a target of bringing 27.0% down to 22.0%.

That works out to:

- 8,450 tickets/quarter at 650/week
- 422.5 fewer repeat contacts if the rate drops by 5 percentage points
- 422.5 × ₹290 = **₹122,525 per quarter**

That is a target/model, not me claiming the tool has already saved ₹122,525.

There is also a useful product/support pattern in the data: **324 tickets**, or **19.2% of the "Other" category**, mention the cancellation/address-editing problem. I would reproduce that flow before saying exactly how much a fix would save.

## Numbers I checked

| Thing | Result |
|---|---:|
| Raw rows | 12,528 |
| Duplicate rows removed | 653 |
| Unique tickets | 11,875 |
| 14-day same-order repeats | 1,910 (16.08%) |
| 30-day same-order repeats | 3,201 (26.96%) |
| SLA breaches | 1,051 (8.85%) |
| Store-credit exposure | ₹367,850 |
| Valid CSAT responses | 5,269 |
| Average CSAT | 3.32 |
| Automated checks | 17/17 passed |
| Theme audit | 50 tickets |

One important detail: there are **10 tickets with blank order IDs where the same customer bought the same SKU more than once on the same date**. I leave those alone instead of guessing which order they belong to.

Also, "same customer + same order within 30 days" is a repeat-contact proxy. The data does not have a root-cause/problem ID, so I cannot honestly say every one of those tickets is the exact same underlying problem.

## Why the leaderboard is split

The original ask was to show tickets closed per week. I did not use one ranking for everybody.

Tier 2 Escalations & Warranty work can take days because of physical RMAs and parts. Comparing that work directly with frontline ticket volume is misleading. So Tier 2 is shown separately using resolution time, while Tier 1 agents are compared inside their own teams.

I kept the comparison simple instead of inventing one big score.

## What is AI doing here?

The AI is an extra layer, not the calculator.

```
ticket files
   ↓
Python cleaning + calculations
   ↓
verified metrics
   ↓
FastAPI
   ↓
AI analyst (optional)
   ↓
web app
```

The analyst gets the verified numbers and relevant ticket context. If a cloud model is unavailable, the app can fall back.

The core analysis does not need a paid API call.

## Things I left out

This was a short task, so I did not try to turn it into a full helpdesk product.

I left out:

- sending all 11,875 tickets through an LLM;
- a single "agent score" made from arbitrary weights;
- login, roles, production deployment and a real ticket-management system;
- a big sentiment/embedding pipeline that was not needed for the questions in the brief.

I also did not force the 10 ambiguous order matches.

## Project layout

```
run.py
src/                 # cleaning, metrics, themes, validation
data/                # task files
output/              # generated results
backend/             # FastAPI + optional AI analyst
frontend/            # Next.js app
tests/               # tests
memo-to-priya.md
submission-form.md
recording-script.md
prompts/development-log.md
```

If you want to understand the numbers, start with `run.py` and the files in `src/`. The web app is mainly there to make the results easier to use.
