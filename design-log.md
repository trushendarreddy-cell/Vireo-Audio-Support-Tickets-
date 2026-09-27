# Design Log

## Why I built it this way

The task had a lot of data but a short time limit. I decided not to build a huge AI system.

I wanted the important numbers to come from code that I could check myself. Then I could use the web app and AI to make those results easier to explore.

So the basic approach became:

**clean the data → calculate the numbers → check them → build the UI → add AI on top**

## What I built

The product has four main parts:

1. **Python analysis**
   - cleans the support export;
   - removes duplicate rows;
   - joins the available data;
   - calculates repeat contact, SLA and agent metrics;
   - finds useful complaint patterns.

2. **Validation**
   - automated checks for the main calculations;
   - manual review of the cancellation/address-editing theme;
   - explicit handling for ambiguous order matches.

3. **Web app**
   - FastAPI backend;
   - Next.js frontend;
   - dashboard-style views;
   - ticket search and support metrics.

4. **Optional AI analyst**
   - uses the verified analysis as context;
   - helps answer questions about the data;
   - is not used as the source of truth for the main numbers.

## Important decisions I made

### I used repeat contact instead of trying to guess root causes

The data does not have a root-cause ID.

The cleanest join I found was the same customer + same order within 30 days.

That gives:

**3,201 / 11,875 = 26.96%**

I call this a repeat-contact proxy rather than claiming it is the exact repeat-problem rate.

### I did not force the ambiguous orders

There are 10 tickets with blank order IDs where the same customer bought the same SKU more than once on the same date.

I could have guessed the order, but that would make the metric look cleaner while making the data less trustworthy.

I left them unresolved.

### I changed the agent leaderboard

The original request was tickets closed per week.

I did not use one ranking for everyone because Tier 2 Escalations & Warranty work is different from normal Tier 1 work. Warranty cases can take days and involve physical RMAs.

I kept Tier 2 separate and use resolution time there. Tier 1 is compared within functional teams.

I also kept the individual metrics visible instead of making an arbitrary combined score.

### I kept AI away from the calculations

I tried AI-assisted approaches during development, but I did not want a model deciding what the business numbers were.

The Python pipeline calculates the numbers first.

That also makes the product cheaper and easier to reproduce.

## What I found

The main number is **27.0% 30-day same-order repeat contact**.

At the 650 tickets/week planning volume from the brief, moving that to 22% would model roughly **423 fewer repeat contacts per quarter**, or about **₹1.23 lakh per quarter** at ₹290 per contact.

That is an opportunity estimate, not a measured saving.

I also found:

- **324** cancellation/address-editing tickets;
- **1,051** SLA breaches;
- **₹367,850** in store-credit exposure under the policy.

The cancellation/address-editing pattern should be reproduced in the actual product before anyone turns it into a savings claim.

## Data issues I found

- 653 duplicate rows.
- Legacy resolved_at timestamps needed a +5.5 hour correction.
- CSAT value 0 is treated as no response according to the policy.
- 10 blank-order tickets remain ambiguous.
- Historical volume is about 189 tickets/week, while 650/week is the planning scenario in the brief.

## Validation

I built **17 automated checks** around the main analysis.

I also manually checked the cancellation/address-editing theme on **50 tickets**.

The validation is meant to catch calculation mistakes and bad assumptions before the numbers reach the dashboard.

## What I left out

I did not spend the limited task time on:

- sending every ticket to an LLM;
- a complicated sentiment/embedding pipeline;
- a global agent score;
- full ticket management;
- production authentication and deployment.

Those things could be added later, but they were not necessary to answer the main question in this task.

## AI used during development

I used **Google Antigravity/Gemini** and **GLM 5.3 Flash through Freebuff AI**.

I used them for things like:

- exploring the data;
- generating and refactoring code;
- debugging;
- checking edge cases;
- testing the AI analyst;
- thinking through different ways to calculate the metrics.

I did not keep every suggestion. I changed or removed approaches when they did not match the data or the task.

Some important examples were:

- not using arbitrary order matching;
- not using an LLM for the main calculations;
- not combining all agents into one score;
- correcting the legacy timestamp handling.

Paid API spend during development: **₹0**.

## Final product scope

The result is intentionally a prototype rather than a production support platform.

It is meant to answer:

**What are customers contacting support about, where are repeat contacts happening, how is support performing, and what should we investigate next?**

That is the part I wanted to make useful and checkable within the time available.

## Recording / handoff

The required screen recording should show the actual product and the development process naturally: what I started with, what I built, what changed, and what I decided not to keep.

No separate presentation or reading script is needed.

The client-facing explanation is in memo-to-priya.md.
