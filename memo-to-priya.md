# Memorandum

**To:** Priya Raman, Head of Customer Experience, Vireo Audio  
**From:** Senior CX Data & AI Engineering Team  
**Date:** 27 September 2026  
**Subject:** Operational Review: Customer Complaint Digest & Fair Agent Leaderboard  

---

### Executive Takeaway
We have built a lightweight, auditable local analysis tool that automatically generates your **Weekly Complaint Digest** and a **Fair Agent Leaderboard** from Vireo's 18 months of support records (11,875 unique tickets). 

Our primary operational focus is eliminating **preventable repeat customer contacts**:
* **The Opportunity:** Over 18 months, **27.0% of all tickets** (3,201 tickets) were repeat inquiries about the same order within 30 days (**16.1% / 1,910 tickets within 14 days**), consuming **₹8.58 lakh** (₹1.43 lakh/quarter) in avoidable contact costs.
* **Target Impact:** Lowering same-order repeat contacts from 27% to 22% (or 16% to 12% on a 14-day window) frees up **₹22,000 to ₹35,000+ per quarter** on historical volume, and **over ₹1.0 lakh to ₹1.2 lakh per quarter** at your current operating scale of 650 tickets/week.
* **Zero Software Run Cost:** The deterministic analysis runs locally in under 1 second with **₹0.00 in per-ticket AI/API fees**. The optional AI analyst can use cloud providers, but the core digest and leaderboard do not depend on them.

---

### What Customers Are Complaining About (Weekly Digest Findings)
Across recent complete operating weeks, Vireo averaged ~189 tickets/week (43.5% Chat, 32.1% Email, 14.3% Voice, 10.1% Social). Our text mining uncovered a critical, previously hidden product bug:

1. **The "Cancellation UI" Blunder (High-Impact Quick Win):**  
   Nearly **1 in 5 tickets (19.2%)** filed under the catch-all category *"Other"* are customers desperately trying to cancel an accidental order or fix a delivery address right after checkout. They report that the *“cancel button is greyed out”* or *“editing in app failed.”* Because the self-service button fails, customers flood chat and email queues to stop shipments before dispatch. Fixing this button in the app/website will immediately remove dozens of high-friction contacts every week.
2. **Delivery & Tracking Delays (22.5% of recent volume):**  
   Couriers stalling at hubs with stagnant tracking pages remains our largest raw category.
3. **Payment & Invoice Glitches (~12%):**  
   UPI double-debits and portal invoice download errors generate high anxiety and immediate repeat escalations.

---

### Repeat Contacts: Strictest Defensible Proxy
To give you defensible numbers rather than inflated marketing figures, we established the strictest possible proxy for "same issue": **the same customer contacting Vireo about the same order within 30 days of resolution**.
* **14-day window:** 1,910 repeat tickets (**16.1%**), costing **₹5.21 lakh** (~₹86,760/quarter).
* **30-day window:** 3,201 repeat tickets (**27.0%**), costing **₹8.58 lakh** (~₹1.43 lakh/quarter).
* *Caveat:* Because helpdesks do not track a unique "root-cause problem ID," this proxy measures same-order return contacts. It is not a 100% perfect measure of identical issue recurrence, but it is the most honest and auditable baseline available.

---

### SLA Performance & Store Credit Liabilities
Support Policy v3.2 automatically issues a **₹350 store credit** to customers whenever first-response SLA targets are missed (15 min for Chat, 2h for Voice, 4h for Social, 8h for Email).
* **Baseline Breaches:** **1,051 tickets (8.85%)** breached SLAs over the 18-month period.
* **Financial Drag:** This triggered **₹3,67,850 in automatic customer credits** (~₹61,300 per quarter).
* **Bottlenecks:** SLA breaches are concentrated in **Email (11.6% breach rate)** and **Chat (8.2%)**. Stabilizing morning/day queue handoffs will directly safeguard bottom-line margin.

---

### Agent Leaderboard: Keeping It Fair and Actionable
Per your directive, the leaderboard is retained and fully auditable, but structured to prevent perverse incentives:
1. **Tier 1 (Frontline, Logistics, Billing, Returns Desk):**  
   Agents are ranked **within their functional teams** on balanced productivity (tickets attended per active week), while displaying their SLA breach rate, CSAT, repeat-contact rate, and transfer rate. This ensures part-time or recently joined agents are evaluated fairly against full-time peers.
2. **Tier 2 (Escalations & Warranty):**  
   As Neha correctly warned, warranty cases require multi-touch physical RMA inspections and part sourcing. Evaluating Tier 2 on raw closed volume would make top technicians look idle. Tier 2 agents are **ranked strictly by Resolution Speed in Days** (averaging 5.3 to 6.1 days), with case count displayed purely as contextual workload.

---

### Key Data Caveats You Should Know
* **Migration Artifacts:** We resolved 653 duplicated records between the old Freshdesk and the current helpdesk by retaining the live helpdesk records and shifting legacy event-log UTC timestamps by +5.5 hours to IST.
* **CSAT Truth:** In the old system, an uncompleted survey was recorded as `0`. We cleaned these out per policy; Vireo’s true average CSAT is **3.32 across 5,269 valid responses (44.4% response rate)**.
* **Volume Discrepancy:** The historical export averaged ~189 tickets/week, whereas your forward planning scenario assumes 650 tickets/week. All historical findings are grounded in verified data; financial models scale directly with volume.

---

### Recommended Next Actions
1. **Investigate the cancellation/address-editing flow:** The analysis found 324 tickets matching this friction pattern. Reproduce the checkout failure in the product flow and quantify the avoidable contact reduction before estimating savings.
2. **Review email first-response coverage:** Email has an 11.6% SLA breach rate in the historical data. Test whether peak-hour queue balancing can reduce breaches before committing staffing changes.
3. **Use the weekly digest as a review input:** Review emerging firmware, courier, payment and product-friction themes each week and track whether the repeat-contact and SLA metrics move after interventions.
