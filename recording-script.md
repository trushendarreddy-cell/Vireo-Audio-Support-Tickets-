# 3-Minute Video Walkthrough Script (Vireo Audio Support Desk)

*Target Duration: 2 minutes 45 seconds to 3 minutes max.*  
*Setup: Have terminal open on the left, VS Code with project files open on the right.*

---

### [0:00 – 0:25] 1. Introduction & What Was Built
*(Action: Show project directory structure in VS Code: `run.py`, `src/`, `output/`, `data/`)*

> "Hi everyone. Today I'm presenting the auditable CX analytics and digest tool built for Priya Raman, Head of Customer Experience at Vireo Audio.
> 
> Priya requested two things: a weekly customer complaint digest, and an agent leaderboard based on closed tickets, while Finance explicitly mandated zero surprise model bills. 
> 
> Instead of building an over-engineered web dashboard or a costly LLM API wrapper, I built a lightweight, deterministic Python tool using only the standard library. It processes all 18 months of Vireo's support data in under one second with zero runtime cost."

---

### [0:25 – 0:50] 2. The Main Tool Running & Speed
*(Action: In terminal, type `python run.py` and hit Enter. Let the audience see the 6-step pipeline execute in ~0.76 seconds)*

> "Let's run it live. With a single command, `python run.py`, the pipeline loads the 12,528 raw records, deduplicates the 653 duplicate pairs between Freshdesk and the current helpdesk, normalizes legacy UTC timestamps to IST, calculates operational and SLA metrics, and generates all executive deliverables.
> 
> Notice the execution time: 0.76 seconds, 100% locally, with exactly ₹0 per-run API cost."

---

### [0:50 – 1:20] 3. Weekly Digest & Key Discovery
*(Action: Click open `output/weekly_digest.md` and scroll down to the Cancellation UI theme and recent week)*

> "Here is `output/weekly_digest.md`. For every operating week, it breaks down channel mix, SLA breach penalties, CSAT, and extracted complaint themes.
> 
> One major discovery we surfaced is a hidden product bug: nearly 20% of tickets categorized under 'Other' are customers trying to cancel an accidental order or fix a shipping address right after checkout, complaining that the 'cancel button is greyed out' or 'in-app edit failed.' 
> 
> Because this self-service UI fails, dozens of customers per week flood the chat and email queues to intercept shipments before dispatch. This is a concrete product issue to reproduce and fix; the dataset shows the contact pattern, but not the exact post-fix reduction."

---

### [1:20 – 1:45] 4. Fair Agent Leaderboard
*(Action: Click open `output/leaderboard.csv` or view it in editor)*

> "Next is the agent leaderboard in `output/leaderboard.csv`. Following Support Policy Section 6 and Operations Manager Neha's advice, we strictly separated Tier 1 frontline agents from Tier 2 warranty technicians.
> 
> Tier 2 handles multi-touch physical RMAs that take days. Ranking them on raw ticket volume would make top technicians look idle. So Tier 2 is ranked strictly by Resolution Speed in Days—averaging 5.3 to 6.1 days. 
> 
> Meanwhile, Tier 1 agents are ranked within their respective functional teams—Chat, Email, Voice, Logistics, Billing, Returns—on balanced tickets per active week, while displaying their SLA breach rate, CSAT, and repeat-contact rate side-by-side."

---

### [1:45 – 2:15] 5. Validation & Evolution (What Changed & What Was Discarded)
*(Action: Open `output/validation.md` showing 17/17 passed checks, then switch to `prompts/development-log.md`)*

> "Every single number in this system is independently validated. In `output/validation.md`, all 17 automated reconciliation checks passed 100%, including the 1,051 SLA breaches and ₹3.67 lakh in credit exposure.
> 
> During development, we tested AI-assisted hypotheses. Initially, we tested whether `created_at` was also in UTC. By empirically subtracting duplicate pairs, we proved `created_at` was already in IST, and only `resolved_at` in legacy was in UTC (+5.5h shift). Adding 5.5 hours resolved 1,874 negative resolution durations down to exactly zero inversions.
> 
> We also deliberately rejected an opaque composite scoring formula and rejected a per-ticket LLM classifier to honor the client's requirement of zero surprise API fees."

---

### [2:15 – 2:45] 6. Limitations & Measurable Business Outcome
*(Action: Open `memo-to-priya.md`)*

> "Let's talk honest limitations: without a unique problem ID, our repeat contact metric is a same-order return contact proxy. Also, 10 tickets out of 4,000 with blank order IDs had ambiguous same-day orders.
> 
> But the business outcome is crystal clear:
> Over 18 months, same-order repeat contacts accounted for 27.0% of tickets (3,201 tickets)—or 16.1% on a 14-day window (1,910 tickets)—consuming ₹8.58 lakh in handling costs. 
> 
> Reducing repeat contacts by just 5 percentage points at Vireo's operating scale of 650 tickets per week frees up over ₹1.2 lakh per quarter in contact-handling capacity, alongside ₹61,000 per quarter in SLA credit savings.
> 
> The core pipeline is documented and validated; the web app and optional AI analyst are presentation layers around the deterministic source of truth. Thank you."
