# Vireo Audio Support Desk — Development Log

This is a record of how I built the project, what AI helped with, what I changed, and what I threw away.

---

## 1. AI Tools Used
* **Primary coding/reasoning tools:** Google Antigravity Agent (Gemini models) and GLM 5.3 Flash through Freebuff AI.
* **Environment:** Local VS Code / PowerShell on Windows with direct terminal and file operations.
* **Paid API spend:** ₹0 during the task. Free access/quotas were used for model-assisted development/testing.
* **Production Runtime Dependency:** **None (₹0.00)**. All production analysis code uses the Python Standard Library (`csv`, `datetime`, `collections`, `re`, `json`, `pathlib`).

---

## 2. Chronological Log of Prompts & Development Iterations

### 1. First pass: understand the data and policy
* **Prompt Received:** Task specification and business context for Priya Raman (Head of CX), Neha Kulkarni (Ops Manager), Sameer Qureshi (IT), and Arjun Mehta (Finance Controller).
* **AI Action:**
  * Located all raw files in `Downloads/` and staged them cleanly in `data/`.
  * Parsed Adobe ASCII85-encoded streams in `support-policy.pdf` using pure Python `base64.a85decode` and `zlib.decompress` to establish authoritative policy rules.
* **Key Finding:**
  * Contact costs: Chat ₹210, Email ₹260, Voice ₹520, Social ₹240, Blended ₹290. Confirmed Arjun's ₹180 in email thread was an informal estimate; Support Policy v3.2 §4 is authoritative.
  * First-response SLAs: Chat 15 min, Voice 2h, Social 4h, Email 8h. Missed SLA = ₹350 store credit per breach.
  * Support Policy §6: Tier 2 must be evaluated on resolution days, not tickets closed per week.

### 2. Cleaning duplicates and timestamps
* **Prompt / Task:** Inspect 12,528 raw rows, verify 653 duplicate ticket pairs, and resolve timestamp conventions between Helpdesk and Legacy Freshdesk.
* **What AI Explored:**
  * Checked whether `created_at`, `first_response_at`, or `resolved_at` had timezone offsets.
* **Empirical Validation:**
  * Subtracted Helpdesk timestamps from Legacy timestamps for all 653 duplicated tickets:
    * `created_at` difference: exactly 0.0 hours (already in IST).
    * `first_response_at` difference: exactly 0.0 hours (already in IST).
    * `resolved_at` difference: exactly +5.5 hours (Legacy in UTC; Helpdesk in IST).
  * On non-duplicated legacy rows (3,109 rows), raw `resolved_at < created_at` occurred in 1,874 rows.
  * Adding +5.5 hours (+5h 30m) to legacy `resolved_at` dropped inversions to **exactly 0**.
* **Decision Accepted:**
  * Keep Helpdesk row for duplicate pairs.
  * Apply +5.5h shift to `resolved_at` on all `legacy_fd` tickets.

### 3. Handling missing order IDs
* **Prompt / Task:** Verify the 33.9% blank `order_id` tickets and assess fallback join using `(customer_id, product_sku)`.
* **Empirical Validation:**
  * Direct order IDs: 7,852 tickets matched 100% to `orders.csv`.
  * Blank order IDs: 4,023 tickets.
  * Fallback `(customer_id, product_sku)` matches:
    * Unique order match: 3,303 tickets.
    * Multiple order candidates: 720 tickets.
    * Zero matches: 0 tickets (all customers and products exist in orders).
  * Disambiguated 710 out of 720 multi-matches by filtering for `order_date <= ticket_created_date` and selecting the nearest prior purchase date.
  * Only 10 tickets out of 4,023 remained ambiguous (customer ordered same SKU multiple times on the same date).

### 4. Choosing the repeat-contact metric
* **Prompt / Task:** Calculate repeat contact rates across 14-day and 30-day windows, testing Same Customer, Same Product, and Same Order.
* **What AI Generated vs What Was Verified:**
  * Verified 14-day same-order return contacts: 1,912 tickets (16.1%), handling cost ₹5,20,980.
  * Verified 30-day same-order return contacts: 3,204 tickets (27.0%), handling cost ₹8,59,460.
  * Verified sensitivity: Same customer 30-day = 32.7% (₹10.47 lakh); Same product 30-day = 27.8% (₹8.88 lakh).
* **Decision Accepted:**
  * Adopt Same-Order repeat contact as the primary, strictly defensible business proxy.
  * Refrain from claiming "perfect First Contact Resolution" because helpdesks lack a root-cause problem ID.

### 5. Finding complaint themes
* **Prompt / Task:** Mine complaints from `customer_message` without paid per-ticket LLM APIs.
* **What AI Discovered:**
  * 1,031 voice tickets started with boilerplate `[IVR transcript]`. Filtered out to avoid indexing the word "IVR".
  * 19.2% of tickets in the catch-all category "Other" were customers complaining about a disabled cancel button (`cancel button greyed out`, `tried editing in app`, `don't ship`).
  * 990 tickets contained "nothing changed"; determined this was an expression of customer frustration (stating that self-troubleshooting did not help), not a distinct issue category.
* **Corrections & Modifications:**
  * First regex pass missed phonetic variants (`deliveered`, `geryed out`, `app address edit failed`).
  * Enhanced regex patterns with fuzzy/character-class matching, achieving 100% accuracy on the 50-ticket ground-truth audit sample.

### 6. Building the leaderboard
* **Prompt / Task:** Build an agent leaderboard without penalizing Tier 2 warranty technicians.
* **Decision Accepted:**
  * Segregated Tier 2 (Escalations & Warranty) into a dedicated scorecard ranked by **Resolution Duration in Days** (averaging 5.34 to 6.11 days).
  * Evaluated Tier 1 agents within functional teams on balanced tickets per active week, showing SLA breach rate, CSAT, repeat contact rate, and transfer rate.

---

### 7. Adding the AI analyst
* **Prompt / Task:** Transform the AI Support Analyst into a real, multi-provider LLM reasoning layer integrated with Google Gemini, Groq, and NVIDIA Nemotron, while keeping deterministic analytics as the single source of truth.
* **Architecture Implemented:**
  * Created `backend/ai/` module with `BaseLLMProvider`, `AIRouter`, `build_grounded_context`, system prompts, and Pydantic schemas.
  * Router implements priority chain: `Gemini (Primary) → Groq (Fallback 1) → NVIDIA Nemotron (Fallback 2) → Local Engine (Final Fallback)`.
  * Dynamic context builder extracts exact unrounded figures from backend state (11,875 tickets, 3,201 30d repeats, 1,910 14d repeats, ₹858,520 cost, ₹122,500 savings, 324 cancellation friction tickets).
  * System prompts strictly mandate output format (`answer`, `analysis`, `evidence`, `data_used`, `relevant_tickets`) and forbid calculating or inventing alternative metrics.
* **Empirical Live Testing & Failover Observations:**
  * **Google Gemini:** Model `gemini-3.8-flash` intermittently returned `HTTP 503 (high demand spike)` during heavy traffic, and `gemma-4-26b-a4b-it` required `responseMimeType: "application/json"`. When Gemini succeeded, it generated high-quality grounded analysis in ~21s.
  * **Groq:** Model `qwen/qwen3.8-27b` succeeded consistently and with extreme speed (~1.3s latency), generating comprehensive analysis reconciling all 6 repeat-contact metrics.
  * **NVIDIA Nemotron:** Model `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` returned `HTTP 503 (Worker local total request limit reached 1763/16)` on the shared public endpoint. Handled gracefully by the router without crashing.
  * **Local Deterministic Fallback:** Successfully tested as the final ₹0 offline safety net.
* **Security Verification:**
  * Verified that `.env` is gitignored and credentials never reach the browser or client-side Next.js code.
  * Reconciled all 6 authoritative repeat-contact numbers in live model outputs.
  * Ran 8 automated test cases in `tests/test_ai_analyst.py` passing in ~0.01s.

---

## 8. Things I tried and did not keep

| Discarded Approach | Reason for Rejection | Final Accepted Solution |
| :--- | :--- | :--- |
| **LLM as the source of truth for metrics** | High risk of hallucinating costs, breach counts, or ticket volumes. | Deterministic Python engine computes all metrics; LLM strictly acts as reasoning/explanation layer over verified context. |
| **Direct client-to-LLM API calls from browser** | Leaks private API keys and breaks security boundaries. | Browser communicates exclusively with FastAPI `/api/ai/chat`, which securely routes requests server-side. |
| **Single-provider dependency** | Cloud rate limits, 503 capacity spikes, and quota exhaustion break operational uptime. | Multi-tier provider failover chain: Gemini → Groq → Nemotron → Local Deterministic Engine. |
| **Global agent ranking on closed tickets** | Violates Support Policy §6; unfairly penalizes multi-day Tier 2 warranty cases. | Segregated Tier 1 (within teams) and Tier 2 (ranked by resolution speed in days). |
| **Single composite weighted score** | Opaque formulas obscure operational reality and trade-offs. | Multi-dimensional scorecard displaying throughput, SLA, CSAT, repeat rate, and transfers. |
| **Assuming legacy created_at was UTC** | Empirical subtraction proved created_at and first_response_at are identical in IST across duplicates. | Shifted only legacy resolved_at by +5.5h, resolving all 1,874 inversions to 0. |
| **Broad Customer-level repeat proxy** | 33% customer repeat rate overstates issue recurrence for multi-item repeat buyers. | Adopted strictly defensible Same-Order proxy (27.0% for 30d, 16.1% for 14d). |



---

## 9. Final submission check — 27 Sep 2026

I checked the project again against the Task 1 V3 brief and cleaned up the parts that could be misleading or too ambitious.

* Added the completed `submission-form.md` with the business number, cost arithmetic, validation evidence, scope decisions, limitations, AI disclosure, and handoff notes.
* Corrected the business-impact arithmetic to **₹122,525/quarter** for a 5 percentage-point reduction at 650 tickets/week and ₹290 blended contact cost.
* Removed unsupported language suggesting that the cancellation fix would automatically eliminate 20–30 contacts per week. The dataset supports the existence of the friction pattern, not a measured post-fix effect.
* Corrected clean-machine web startup instructions so the Next.js production build is run before `npm start`.
* Kept the deterministic Python pipeline as the numerical source of truth and the optional LLM analyst as an explanation layer with fallback.
* Explicitly documented the 10 ambiguous same-day order matches, the 50-ticket theme audit, the 650-ticket/week planning assumption, and the optional cloud-provider limitations.
