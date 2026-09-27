# Vireo Audio — Development Notes

This is basically my build log: what I checked, what I tried, and what I changed.

## AI I used

I used:

- Google Antigravity / Gemini
- GLM 5.3 Flash through Freebuff AI

I used them for data exploration, coding, debugging, edge cases and testing.

Paid API spend: **₹0**.

The actual ticket calculations run locally in Python.

## 1. First I read the data and policy

I loaded the CSV files and read the support policy and email thread.

The policy gave me the contact costs and SLA rules. It also made it clear that Tier 2 warranty work should not be judged only by tickets closed.

That affected the leaderboard later.

## 2. Duplicates and timestamps

There are **12,528 raw rows**.

I found **653 duplicate ticket pairs** between the old and current helpdesk exports. I kept the current helpdesk row.

I also compared the duplicate timestamps instead of assuming they were all UTC.

The result:

- `created_at`: already matched
- `first_response_at`: already matched
- legacy `resolved_at`: needed **+5.5 hours**

After that correction, the negative resolution-time problem went away.

## 3. Missing order IDs

A lot of tickets do not have an order ID.

I tried matching them using customer + product.

Most could be matched by checking the purchase date. But **10 tickets were still ambiguous** because the customer had bought the same SKU more than once on the same date.

I left those alone.

This is one of the places where I would rather have a missing number than a made-up relationship.

## 4. Picking the repeat-contact number

I checked different ways of defining a repeat contact:

- same customer
- same product
- same order

The customer-level number was too broad for what I wanted. A customer can buy multiple things and contact support about completely different issues.

So I used **same customer + same order within 30 days**.

That gives:

- 14 days: **1,910 / 16.08%**
- 30 days: **3,201 / 26.96%**

I call this a proxy because the data has no root-cause/problem ID.

## 5. Finding the complaint theme

I looked through the customer messages and built a small rule-based theme check instead of sending every ticket to an LLM.

One useful pattern was cancellation/address editing.

There are **324 tickets** matching that pattern, which is **19.2% of the "Other" category**.

I manually checked 50 tickets for the theme classifier. It got 100% precision and recall on that sample.

That is a sample result, not a claim that the classifier is perfect on every possible ticket.

## 6. Building the leaderboard

I first looked at the simple tickets-closed approach.

I did not keep one global ranking because Tier 2 warranty cases are different from frontline tickets.

Final approach:

- Tier 1: compare agents inside their teams.
- Tier 2: separate scorecard using resolution time.
- Show SLA, CSAT, repeat contact and transfer rate alongside the main number.

No made-up weighted "agent score".

## 7. Adding the AI analyst

I added an optional AI chat so someone can ask questions about the results.

The important part is that the AI gets the verified numbers from the Python side. It is not allowed to replace those numbers with its own calculations.

There is also provider fallback and a local fallback so the app does not completely depend on one API.

## 8. Things I threw away

I tried or considered:

- using an LLM as the source of truth;
- guessing ambiguous orders;
- treating every legacy timestamp as UTC;
- ranking every agent globally by tickets;
- making one big weighted agent score;
- sending all 11,875 tickets through an LLM;
- building a much bigger sentiment/embedding system.

I dropped these because they either gave me less reliable results or were not worth the extra time for this task.

## 9. Final check — 27 Sep 2026

Before finishing, I checked the project against the actual brief.

I made sure:

- `submission-form.md` is filled out except for my actual recording/Drive links and actual hours;
- the ₹122,525 quarterly model is calculated correctly;
- the cancellation pattern is described as a finding, not guaranteed savings;
- the 10 ambiguous orders are documented;
- the web startup instructions are clear;
- the Python pipeline stays the source of truth;
- the optional AI layer is clearly optional.

That is where I stopped instead of adding more features just to make the project look bigger.
