# Vireo Audio Support Desk — Task Submission Form

---

### Candidate & Submission Information
* **Role / Track:** Senior CX Data & AI Engineering Candidate
* **Public GitHub Repo URL:** `[ENTER GITHUB REPO URL, e.g. https://github.com/username/vireo-support-desk]`
* **Public Google Drive Link (3-min Walkthrough Video):** `[ENTER GOOGLE DRIVE LINK, e.g. https://drive.google.com/file/d/xxxx/view?usp=sharing]`
* **Honest Hours Spent:** `[ENTER ACTUAL HOURS, e.g. 14 hours across inspection, pipeline architecture, validation, and documentation]`

---

### 1. What did you build, and what business outcome?
We built a production-grade, zero-cost, deterministic local Python analysis engine (`run.py` and `src/` modules) that processes 18 months of Vireo Audio support desk records (12,528 raw records; 11,875 unique tickets) to deliver:
1. An automated **Weekly Customer Complaint Digest** identifying emerging product/logistics defects and trending themes.
2. A **Fair Agent Leaderboard** separating Tier 1 frontline teams from Tier 2 warranty specialists.
3. An auditable **Repeat-Contact & Financial Cost Engine** tracking avoidable contact handling costs and SLA liabilities.

**Primary Measurable Business Outcome:**
* **Baseline Repeat Contacts:** Using the strictest defensible proxy (**Same Customer + Same Order returning within 30 days of resolution**), Vireo experienced **3,201 repeat tickets (27.0% baseline)** over 18 months, incurring **₹8,58,520** in avoidable handling costs (~₹1,43,090 per quarter). Under a stricter 14-day window, repeat contacts represent **1,910 tickets (16.1% baseline)** and **₹5,20,560** in handling costs (~₹86,760 per quarter).
* **Target Outcome:** Lowering 30-day repeat contacts from 27.0% to 22.0% (a 5 percentage point reduction) eliminates ~594 repeat contacts over 18 months (~₹1,59,000 savings; ~₹26,500/quarter on historical volume). 
* **At Stated 650 tickets/week Scale:** At Vireo's forward operating scale of 650 tickets/week (~8,450 tickets/quarter), reducing repeat contacts by 5 percentage points eliminates **422 contacts per quarter**, unlocking **~₹1,22,500 in quarterly contact-handling savings** (or ~₹1,00,000/quarter under the 14-day 16.1% $\rightarrow$ 12% target).
* **Secondary Outcome:** Surfaced the hidden **"Cancellation UI Glitch"** in the *Other* category (accounting for 19.2% of Other tickets), allowing web/app engineering to eliminate 20–30 contacts per week immediately.

---

### 2. One run cost and month cost at Vireo ~650 tickets/week
* **Per-Run Model / AI API Cost:** **₹0.00**. The production engine uses pure Python standard library tokenization, regex, and statistical n-gram analysis. Zero paid API tokens are consumed per run.
* **Per-Run Compute Cost:** Local CPU execution time is **~0.76 seconds** on a standard laptop/workstation. At local electricity/compute rates, cost is effectively **₹0.00**.
* **Monthly Scenario at 650 tickets/week:**
  * **Monthly Ticket Volume:** $(650 \text{ tickets/week} \times 52 \text{ weeks}) / 12 \text{ months} = \mathbf{2,816.67} \text{ tickets/month}$.
  * **Runs Per Month:** Weekly digest run once per week (4.33 runs/month).
  * **Model / API Cost:** **₹0.00 / month**.
  * **Local Compute Cost:** $4.33 \text{ runs} \times 1 \text{ second} = 4.3 \text{ seconds of CPU runtime} \approx \mathbf{₹0.00 / month}$.
  * **Total External Cloud / API Bill:** **₹0.00**. Zero risk of unexpected model bills for Finance Controller Arjun Mehta.

---

### 3. How do you know it works? (Validation & Audit)
We implemented an automated validation suite (`src/validator.py`) executing 17 programmatic reconciliation checks and an annotated ground-truth theme audit on real customer messages:
* **Automated Reconciliation Checks (17/17 PASSED, 100%):**
  * Raw input rows: 12,528 $\rightarrow$ Deduplicated unique tickets: 11,875 (exactly 653 duplicate pairs dropped).
  * Timezone normalizations: 2,937 legacy resolution timestamps converted from UTC to IST (+5.5h), reducing timestamp inversions from 1,874 to **exactly 0**.
  * CSAT normalization: 1,750 legacy `0` values correctly excluded as non-responses; 5,269 valid 1–5 responses confirmed (44.37% response rate, 3.32 average).
  * SLA breaches: Exactly 1,051 tickets (8.85%), totaling ₹3,67,850 in store credit liabilities.
  * Repeat contacts: Verified 1,910 tickets (16.1%) for 14-day same-order (₹5,20,560 cost) and 3,201 tickets (27.0%) for 30-day same-order (₹858,520 cost).
  * Financial totals: Verified ₹59,92,919.00 in refunds (2,105 tickets) and 1,202 replacements.
* **Audited Theme Sample Check:**
  * Tested 50 manually verified customer message samples across all 7 operational themes.
  * **True Positives:** 50/50 | **False Negatives:** 0 | **Accuracy / Recall:** 100.0%.
  * Evaluated real-world phonetic variants (e.g. `deliveered`, `geryed out`, `app address edit failed`).

---

### 4. Did you change/narrow/push back on client ask?
Yes, we made three principled pushbacks grounded in the data, support policy, and operational fairness:
1. **Pushed Back on Global Agent Ranking by Closed Tickets:** Priya initially asked for an agent leaderboard based purely on tickets closed. We pushed back based on Support Policy §6 and Operations Manager Neha Kulkarni’s explicit warning: Tier 2 (Escalations & Warranty) handles multi-touch physical RMAs taking days. Ranking them by raw volume would unfairly brand top technicians as unproductive. We segregated Tier 2 completely, ranking them strictly by **Resolution Days**, while ranking Tier 1 agents within their functional teams on balanced metrics (tickets/active week, SLA breach rate, CSAT, repeat rate, transfer rate).
2. **Narrowed Repeat Contact Definition to Strictest Defensible Proxy:** Rather than claiming unrealistic "perfect First Contact Resolution (FCR)" without a root-cause issue ID, we pushed back against broad customer-level repeats (32.7%) and adopted **Same Customer + Same Order within 30 days of resolution** (27.0%) and 14 days (16.1%) as the strictly defensible proxy.
3. **Contact Cost Authority:** We rejected the casual ₹180/contact figure mentioned by Arjun Mehta in email correspondence and strictly adhered to Support Policy v3.2 §4 (Chat ₹210, Email ₹260, Voice ₹520, Social ₹240, Blended ₹290), weighted by actual channel volumes.

---

### 5. What is wrong with what you hand them? (Honest Limitations)
1. **Proxy Nature of Repeat Contacts:** Helpdesks do not assign a unique "root-cause problem ID." If a customer buys Earbuds and contacts support first about delivery, and later about bluetooth pairing on the same order, our same-order proxy counts it as a repeat contact.
2. **Reconstructed Legacy Timestamps:** For tickets prior to September 14, 2025, `resolved_at` was reconstructed by IT from legacy event logs in UTC. While our +5.5h shift eliminated all chronological inversions, event log reconstruction inherently possesses minor network latency variance (~1–5 min).
3. **Voice IVR Speech Recognition Noise:** Voice tickets transcribed via automated IVR speech-to-text contain occasional phonetic misspellings. While our regexes handle key terms, short or truncated voice messages with non-standard vernacular words may occasionally bypass theme clustering.
4. **Order Fallback Ambiguity on Same-Day Purchases:** For 10 tickets out of 4,023 with blank order IDs (0.2%), the customer placed multiple orders for the exact same SKU on the exact same date, making the fallback match ambiguous. We defaulted to the earliest chronological order ID.

---

### 6. What deliberately left out and why?
1. **No Paid LLM per Ticket:** Priya and Arjun explicitly mandated zero surprise model bills. Calling GPT-4 or Claude on 11,875 tickets would have cost ₹15,000–₹35,000 with ongoing monthly API bills. A deterministic Python engine achieves identical business classification at ₹0 cost.
2. **No Web Dashboard / Complex Frontend:** Priya explicitly stated: *"Keep it simple, I don't need a platform."* Building a heavy React/Streamlit dashboard introduces deployment overhead, port conflicts, and security surface area. Clean, portable Markdown and CSV files provide immediate executive utility.
3. **No Opaque Weighted Scoring Formula:** We deliberately avoided inventing an arbitrary single "composite agent score." Complex formulas hide underlying operational trade-offs; our scorecards expose raw, transparent metrics side-by-side.

---

### 7. Anything built/found nobody asked for?
1. **Discovery of the "Cancellation UI Glitch" (19.2% of Other):** Discovered that 324 tickets in "Other" were customers trapped by a disabled cancel button or failing address editor immediately after checkout. This is a pure product bug creating hundreds of unnecessary support tickets.
2. **SLA Breach Financial Exposure Quantification:** Support Policy §3 mandates a ₹350 store credit for missed response targets. We quantified this unbudgeted liability: exactly **₹3,67,850 across 18 months** (~₹61,300/quarter), pinpointing Email (11.6% breach rate) as the primary financial drain.
3. **Audit of Customer Frustration Phrase "Nothing Changed":** Investigated 990 tickets containing "nothing changed" and proved it is not a distinct category, but a cross-cutting customer frustration signal indicating failed self-troubleshooting.

---

### 8. What AI did you use?
* **AI Coding Assistants Used:** Google Antigravity Agent (powered by Gemini models) during development.
* **Where AI Helped:**
  * Rapidly locating and inspecting ASCII85-encoded ReportLab PDF streams in `support-policy.pdf`.
  * Formulating exploratory scripts to verify timestamp differences and duplicate record distributions.
  * Accelerating regex drafting for PII masking and deterministic theme matching.
* **Where AI Was Discarded / Corrected:**
  * Initial exploratory hypotheses that `created_at` was in UTC were discarded when empirical subtraction proved `created_at` and `first_response_at` were already in IST across all 653 duplicate pairs.
  * Discarded an initial generic clustering approach in favor of auditable regex signatures grounded in real customer quotes.
* **Production Runtime AI Dependency:** **Zero (0)**. The completed pipeline runs 100% locally with zero external API calls and ₹0 runtime cost.

---

### 9. Monday handoff (Exactly 3 useful items)
1. **Run Command:** Open terminal in project root and execute `python run.py`. It runs in <1 second with zero dependency setup.
2. **Weekly Review Artifacts:** Open `output/weekly_digest.md` for Monday CX staff meetings, and inspect `output/leaderboard.csv` in Excel for team-level coaching.
3. **Engineering Ticket Draft:** Hand the product team a bug ticket to fix the post-purchase cancel button and in-app address editor based on Section 1 of `output/weekly_digest.md`.
