# Memorandum

**To:** Priya Raman, Head of Customer Experience, Vireo Audio  
**From:** Rushendar Reddy  
**Date:** 27 September 2026  
**Subject:** Operational Review: Customer Complaint Digest & Fair Agent Leaderboard  

---

### Executive Takeaway
I built a small local analysis tool that turns Vireo's 18 months of support records into a **Weekly Complaint Digest** and a **Fair Agent Leaderboard**. After cleaning the data, there are 11,875 unique tickets. 

The main number I would watch is **repeat customer contact**:
* **The Opportunity:** Over 18 months, **27.0% of all tickets** (3,201 tickets) were repeat inquiries about the same order within 30 days (**16.1% / 1,910 tickets within 14 days**), with a modeled handling cost of **₹8.58 lakh** over the 18-month period.
* **Target Impact:** At the stated 650 tickets/week planning volume, moving the 30-day repeat rate from 27% to 22% means about 422.5 fewer repeat contacts per quarter. At ₹290 per contact, that is a modeled **₹122,525 per quarter**.
* **Zero Software Run Cost:** The core analysis runs locally and uses **₹0 in API fees**. The AI analyst is optional and can use cloud models. The optional AI analyst can use cloud providers, but the core digest and leaderboard do not depend on them.

---

### What the data says customers are complaining about
Across recent complete operating weeks, Vireo averaged ~189 tickets/week (43.5% Chat, 32.1% Email, 14.3% Voice, 10.1% Social). The text analysis found a product/support issue worth checking:

1. **The "Cancellation UI" Blunder (High-Impact Quick Win):**  
   **324 tickets, or 19.2% of the "Other" category,** match a cancellation/address-editing problem. They report that the *“cancel button is greyed out”* or *“editing in app failed.”* Customers describe the cancel button being greyed out or address editing failing. I would reproduce this flow before estimating how many contacts a fix would remove.
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

### Agent leaderboard
I did not use one ranking rule for all 44 agents:
1. **Tier 1 (Frontline, Logistics, Billing, Returns Desk):**  
   Agents are ranked **within their functional teams** on balanced productivity (tickets attended per active week), while displaying their SLA breach rate, CSAT, repeat-contact rate, and transfer rate. This keeps agents in different teams from being compared as if they were doing the same work.
2. **Tier 2 (Escalations & Warranty):**  
   As Neha correctly warned, warranty cases require multi-touch physical RMA inspections and part sourcing. Evaluating Tier 2 on raw closed volume would make top technicians look idle. Tier 2 agents are **ranked strictly by Resolution Speed in Days** (averaging 5.3 to 6.1 days), with case count displayed purely as contextual workload.

---

### Things worth knowing about the data
* **Migration Artifacts:** We resolved 653 duplicated records between the old Freshdesk and the current helpdesk by retaining the live helpdesk records and shifting legacy event-log UTC timestamps by +5.5 hours to IST.
* **CSAT Truth:** In the old system, an uncompleted survey was recorded as `0`. We cleaned these out per policy; Vireo’s true average CSAT is **3.32 across 5,269 valid responses (44.4% response rate)**.
* **Volume Discrepancy:** The historical export averaged ~189 tickets/week, whereas your forward planning scenario assumes 650 tickets/week. All historical findings are grounded in verified data; financial models scale directly with volume.

---

### What I would check next
1. **Investigate the cancellation/address-editing flow:** The analysis found 324 tickets matching this friction pattern. Reproduce the checkout failure in the product flow and quantify the avoidable contact reduction before estimating savings.
2. **Review email first-response coverage:** Email has an 11.6% SLA breach rate in the historical data. Test whether peak-hour queue balancing can reduce breaches before committing staffing changes.
3. **Use the weekly digest as a review input:** Review emerging firmware, courier, payment and product-friction themes each week and track whether the repeat-contact and SLA metrics move after interventions.
