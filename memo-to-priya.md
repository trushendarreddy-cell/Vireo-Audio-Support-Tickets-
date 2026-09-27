# Memorandum

**To:** Priya Raman, Head of Customer Experience, Vireo Audio  
**From:** Rushendar Reddy  
**Date:** 27 September 2026  
**Subject:** What I found in the support tickets

I built a small tool around the 18 months of support data. The main things it does are the weekly complaint digest, the agent leaderboard, some operational numbers, and ticket search. I also added an optional AI analyst for asking questions about the data.

After cleaning the export, I have **11,875 unique tickets**.

### The number I'd watch

**3,201 tickets out of 11,875 (27.0%)** are same-order repeat contacts within 30 days.

Using the 650 tickets/week planning number from the brief, taking that from 27% to 22% would mean about **423 fewer repeat contacts per quarter**.

At ₹290 per contact, that is about **₹1.23 lakh per quarter** in modeled contact-handling capacity.

I am treating that as a target, not as money the tool has already saved.

### One thing I would investigate

I found **324 tickets** in the "Other" category that match a cancellation/address-editing problem. Customers mention things like the cancel button being greyed out or being unable to change the address in the app.

I would reproduce that flow before putting a savings number on it. The ticket data shows the pattern, but it does not prove how many contacts a fix would prevent.

### Repeat contacts

I checked 14-day and 30-day windows:

- 14 days: **1,910 tickets / 16.1%**
- 30 days: **3,201 tickets / 27.0%**

I used the 30-day number because it is based on the same customer and same order, which is the cleanest join available here.

It is still only a proxy. There is no root-cause ID in the export, so a return contact does not automatically mean the exact same problem happened again.

### SLA

There were **1,051 first-response SLA breaches**, which means **₹367,850** in store-credit exposure under the policy.

The historical data has an average of roughly 189 tickets/week. The 650/week number is the planning scenario from the brief, so I kept those two things separate instead of pretending historical volume was 650.

### Leaderboard

I did not rank all agents together.

Tier 2 Escalations & Warranty handles cases that can take several days and involve physical RMAs. I kept those cases separate and looked at resolution time.

Tier 1 agents are compared inside their own teams. I also show the other numbers like SLA, CSAT and repeat contact rather than hiding everything inside one score.

### A few data things worth knowing

- 653 duplicate rows were removed.
- Legacy `resolved_at` timestamps needed a +5.5 hour correction; the other main timestamps did not.
- CSAT value 0 is treated as no response, following the policy.
- 10 blank-order tickets are still ambiguous because the customer had multiple orders for the same SKU on the same date.

### What I would do next

1. Reproduce the cancellation/address-editing flow.
2. Look at why email has the highest SLA breach rate.
3. Keep using the weekly digest to see whether the repeat-contact number actually moves after fixes.

The core analysis costs **₹0 in API fees**. The AI chat is optional.
