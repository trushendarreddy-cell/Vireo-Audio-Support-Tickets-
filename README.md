# Vireo Audio — Support Intelligence

A small support analytics tool for Vireo Audio. It takes the 18 months of ticket data, cleans it, finds the main support problems, builds the weekly digest and agent leaderboard, and lets you ask questions through the AI analyst. The numbers come from the Python pipeline first; the AI is there to explain them.

Works with 18 months of customer support records (12,528 raw records; 11,875 unique tickets) to deliver an **Executive Dashboard**, a grounded **AI Support Analyst**, **Complaint Intelligence** with defect isolation, **Operations & Cost Analysis**, a **Fair Agent Leaderboard**, and a **Ticket Explorer**.

---

## 1. Run it on a clean machine

### Prerequisites
* **Python 3.8+** (Tested on Python 3.10)
* **Node.js 18+** & **npm** (for the web interface)

### Option A: Run the Web Application
1. **Start the FastAPI Backend:**
   ```bash
   pip install -r requirements.txt
   python -m uvicorn backend.main:app --port 8000
   ```
   *Backend API runs at: `http://localhost:8000` (API documentation at `/docs`)*

2. **Start the Next.js Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   npm run start -- -p 3000
   # (Or for development: npm run dev)
   ```
   *Web application runs at: `http://localhost:3000`*

*(On Windows, you can also use `.\start.ps1` after installing the prerequisites; the script builds the frontend before starting it.)*

### Option B: Run the Pure CLI Analysis Engine
If you prefer running just the analytical pipeline without the web server:
```bash
python run.py
```
*Executes in **~0.75 seconds** using only the Python Standard Library and populates the `output/` directory with verified Markdown and CSV deliverables.*

---

## 2. What is in the app

1. **Executive Dashboard:** Live high-level KPIs (Volume, 8.85% SLA breach, 3.32 CSAT, 27.0% repeat contact, ₹3.67L liability), support health channel mix, and operational cost projections.
2. **AI Support Analyst:** Interactive operational analyst grounded strictly in the 11,875 verified records. Delivers structured responses with **Direct Answer**, **Supporting Evidence**, and **Source Citations** at ₹0 API cost.
3. **Complaint Intelligence:** Interactive category shares and audited theme cards with one-click drilldown into the **Cancellation UI Flaw** (324 tickets, 19.2% of "Other").
4. **Operations & Costs:** Side-by-side comparison of the **14-day (1,910 tickets, ₹5.21L)** and **30-day (3,201 tickets, ₹8.58L)** repeat-contact windows, SLA store credit exposure by channel, and CSAT survey distribution.
5. **Agent Leaderboard:** Strict policy-compliant segregation: Tier 1 ranked within functional teams on tickets/active week; Tier 2 (Escalations & Warranty) ranked strictly on **Resolution Speed in Days** (5.3 to 6.1 days avg).
6. **Weekly Digest:** Interactive reader of recent complete operating weeks with week selector and anonymized customer voice quotes.
7. **Ticket Explorer:** Search across customer messages and agent notes with multi-attribute filtering (channel, category, theme, SLA status) and ticket detail modals.
8. **Data & Validation:** Live audit cards showing the **17/17 automated validation checks passed** and the 8 diagnosed data quality traps.

---

## 3. Main business number

### Business goal
Use the tool to reduce **30-day same-order repeat contacts from 27.0% to 22.0%** at Vireo's stated operating volume of **650 tickets/week**. A 5 percentage-point reduction represents **422.5 fewer repeat contacts per quarter on the planning model** (about 423). At the policy's blended contact cost of **₹290**, the modeled capacity/cost opportunity is **₹122,525 per quarter**. This is a target, not a claim that the tool has already saved this money.

### Verified analytical baselines

| Dimension / Metric | Authoritative Benchmark | Calculated System Value | Status |
| :--- | :--- | :--- | :--- |
| **Raw Ticket Rows** | 12,528 | 12,528 | **PASS** |
| **Duplicate Pairs Dropped** | 653 (helpdesk kept, legacy dropped) | 653 | **PASS** |
| **Unique Deduped Tickets** | 11,875 | 11,875 | **PASS** |
| **Legacy Timezone Normalization** | +5.5h shift on legacy `resolved_at` | 0 inversions remaining | **PASS** |
| **Valid CSAT Responses** | 5,269 (CSAT 0 excluded as no response) | 5,269 (44.4% rate, 3.32 avg) | **PASS** |
| **First-Response SLA Breaches** | 1,051 (8.85% breach rate) | 1,051 (₹367,850 liability) | **PASS** |
| **Repeat Contacts (14-day Same Order)** | 1,910 (16.08% baseline) | 1,910 (₹520,560 handling cost) | **PASS** |
| **Repeat Contacts (30-day Same Order)** | 3,201 (26.96% baseline) | 3,201 (₹858,520 handling cost) | **PASS** |
| **Total Refunds Raised** | ₹59,92,919.00 across 2,105 tickets | ₹59,92,919.00 | **PASS** |
| **Replacements Issued** | 1,202 tickets | 1,202 | **PASS** |
| **Automated Validation Suite** | 17 programmatic checks | 17 / 17 passed (100%) | **PASS** |
| **Theme Classifier Accuracy** | 50 audited customer tickets | 100% precision & recall | **PASS** |

---

## 4. One important data issue I found

### Why the repeat numbers changed during development
* **The Variance:** An intermediate run produced 1,912 (14d) and 3,204 (30d) vs the verified baselines of 1,910 (14d) and 3,201 (30d).
* **Root Cause Identified:** When customers placed multiple orders for the same SKU on the exact same date with blank ticket order IDs (only 10 tickets out of 4,023), `cleaner.py` initially assigned `candidates[0]['order_id']` regardless of date precedence. This artificially linked ticket `TK-244398` to `TK-243985` and `TK-242745` to `TK-242577`, creating false repeat relationships.
* **Resolution:** Strictly enforced the task requirement: *"Do not create false order relationships if ambiguity exists."* Ambiguous orders without clear date precedence remain unlinked, perfectly reconciling the dataset to the authoritative baselines:
  * **14-day Same Order:** Exactly **1,910 tickets** | **₹520,560.00**
  * **30-day Same Order:** Exactly **3,201 tickets** | **₹858,520.00**

---

## 5. Project structure

```
vireo/
├── run.py                     # Master CLI pipeline entry point
├── requirements.txt           # Python dependencies
├── README.md                  # Documentation and quick start guide
├── memo-to-priya.md           # 1-page executive memo for Priya Raman
├── submission-form.md         # Completed official evaluation form
├── recording-script.md        # 3-minute video presentation script
├── start.ps1 / start.sh       # One-click startup scripts
├── prompts/
│   └── development-log.md     # Development & prompt audit trail
├── data/                      # Raw, untouched task datasets
├── src/                       # Analytical core (cleaner, metrics, themes, etc.)
├── backend/                   # FastAPI REST service & AI Analyst router
│   ├── main.py                # REST endpoints
│   └── ai/                    # Multi-provider grounded AI module
│       ├── router.py          # Provider priority & automatic failover router
│       ├── context.py         # Authoritative context builder
│       ├── prompts.py         # Strict system prompt & JSON schema instructions
│       ├── schemas.py         # Pydantic request/response models
│       └── providers/         # Gemini, Groq, Nemotron, Local Fallback
├── tests/                     # Automated test suites
│   ├── test_ai_analyst.py     # Unit tests with mocks (<0.01s)
│   └── smoke_test_live_apis.py# Live provider chain smoke test
├── frontend/                  # Next.js 16 + TypeScript + Tailwind CSS (Editorial UI)
│   └── src/app/page.tsx       # Interactive operations workspace
└── output/                    # Generated analytical artifacts
    ├── cleaned_tickets.csv    # Auditable row-level normalized dataset
    ├── weekly_digest.md       # Weekly complaint digest
    ├── leaderboard.csv        # Fair agent performance scorecard
    ├── validation.md          # 17/17 automated validation report
    ├── data_quality.md        # Data quality & migration traps report
    └── metrics.json           # Exported machine-readable metrics
```

---

## 6. How the AI analyst works

The AI Support Analyst uses real LLM inference grounded strictly in the verified deterministic analytics engine:

```
Browser (Next.js Frontend)
   │
   ▼
FastAPI `/api/ai/chat` (Backend)
   │
   ▼
Targeted Context Builder (Injects verified figures, relevant ticket samples, policy rules)
   │
   ▼
Provider Priority Router (Automatic Failover)
   ├─► [1] Google Gemini (Primary)
   ├─► [2] Groq (Fast Inference Fallback)
   ├─► [3] NVIDIA Nemotron (Enterprise Fallback)
   └─► [4] Local Deterministic Engine (Guaranteed ₹0 offline fallback)
   │
   ▼
JSON Schema Validator (Enforces answer, analysis, evidence, data_used, relevant_tickets)
   │
   ▼
Frontend Operations Workspace (Editorial UI displaying Analysis, Evidence, Citations, Badges)
```

### Environment Configuration (`.env`)
Copy `.env.example` to `.env` and configure your credentials:
```bash
# Provider Priority (comma-separated fallback chain)
AI_PRIMARY_PROVIDER=gemini
AI_FALLBACK_PROVIDERS=groq,nemotron,local

# API Credentials (never committed, read exclusively server-side)
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=your_xai_key
NVIDIA_API_KEY=your_nvidia_key

# Configurable Model Overrides
GEMINI_MODEL=gemini-3.8-flash
GROQ_MODEL=qwen/qwen3.8-27b
NEMOTRON_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning
```

### Security
* **Zero Client Exposure:** API keys are never bundled, transmitted, or accessible to client-side code.
* **Zero Commitments:** `.env` is permanently gitignored.
* **PII Masking:** Customer names, phone numbers, and emails are scrubbed before reaching any LLM prompt.

### Testing the AI analyst
1. **Fast Automated Unit Tests (with mocks):**
   ```bash
   python -m unittest tests/test_ai_analyst.py
   ```
   *Runs in ~0.01 seconds across 8 test suites verifying failover chains, schema validation, and zero secret leakage.*

2. **Live Multi-Provider Smoke Test (with real cloud APIs):**
   ```bash
   python tests/smoke_test_live_apis.py
   ```
   *Directly queries each configured cloud provider, verifies automatic fallback under quota/spike errors, and reconciles all 6 core repeat-contact numbers in the AI response.*

