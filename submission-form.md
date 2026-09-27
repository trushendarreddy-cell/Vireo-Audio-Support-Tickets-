# Vireo Audio — Task 1 V3 Submission Form

## What did you build, and what business outcome does it move? State the number and the money.

I built a small tool for the Vireo support-ticket data.

It cleans the data, gives a weekly complaint digest, shows an agent leaderboard, calculates SLA/repeat-contact numbers, lets you search tickets, and has an optional AI chat for questions about the data.

The main number I used is **30-day same-order repeat contact**:

**3,201 / 11,875 = 26.96%**

The target is to bring that from 27.0% to 22.0% at the **650 tickets/week** planning volume in the brief.

That means:

- 650 × 52 / 4 = **8,450 tickets/quarter**
- 8,450 × 5% = **422.5 fewer repeat contacts/quarter**
- 422.5 × ₹290 = **₹122,525/quarter**

This is the modelled opportunity, not a claim that the tool itself has already created that saving.

I also found **324 tickets (19.2% of "Other")** matching a cancellation/address-editing problem.

## What does one run cost, and what would a month cost at Vireo's volume?

The main analysis is local Python and does not need a paid API.

- One core run: **₹0**
- 650/week is about **2,817 tickets/month**
- Core model/API cost at that volume: **₹0**
- I spent **₹0 on paid API calls** during development/testing.

The optional AI analyst can use cloud models, so that part depends on the provider and quota. It is not needed for the main numbers.

## How do you know it works?

I checked it against the raw data and against a few smaller manual/test cases.

1. **12,528 raw rows → 11,875 unique tickets** after 653 duplicates are removed.
2. **17 automated checks** cover the main cleaning and metric calculations, and all 17 passed.
3. The cancellation/address-editing theme was manually checked on **50 tickets**. It had 100% precision and recall on that sample.
4. The AI analyst has tests for grounding, response format, provider fallback, local fallback and secret leakage.
5. I also tested repeat-contact, SLA, cancellation and fallback scenarios.

Known bad/uncertain cases:

- **10 tickets** have ambiguous order matches because the same customer bought the same SKU multiple times on the same date. I leave them unlinked.
- The repeat-contact number is a **proxy**, not proof that the exact same underlying problem happened again.
- The theme audit is 50 tickets, not every ticket in the dataset.

## Did you change, narrow, or push back on the client's ask?

Yes.

The biggest change was the leaderboard.

The brief asks for tickets closed per week, but the email thread/policy says Tier 2 warranty work should not be judged that way. So I kept Tier 2 separate and used resolution time for it. Tier 1 is compared within teams.

I also pushed back on using an LLM as the source of truth. The Python calculations stay authoritative.

For repeat contact, I tested different joins and used same customer + same order within 30 days because it was the most defensible one I could get from the data.

## What is wrong with what you are handing us?

A few things:

- Repeat contact is only a proxy because there is no root-cause ID.
- 10 order matches are still ambiguous.
- The cancellation theme was manually audited on 50 tickets.
- Cloud AI can hit rate limits or temporary errors.
- The historical dataset averages about 189 tickets/week; 650/week is a planning scenario.
- The web app is a prototype, not a production helpdesk. There is no auth/RBAC/production database.

## What did you deliberately leave out, and why?

I did not build:

- an LLM classification call for every ticket;
- a single combined agent score;
- production auth/deployment/full ticket management;
- a large sentiment/embedding system.

Those would have added time and complexity without helping much with the actual task.

## Anything built/found that nobody asked for?

Yes:

- cancellation/address-editing theme: 324 tickets;
- SLA exposure: 1,051 breaches / ₹367,850 store credit;
- data-quality checks for duplicates, timestamps, CSAT and order matching;
- optional AI analyst.

## What did you use AI for?

I used **Google Antigravity/Gemini** and **GLM 5.3 Flash through Freebuff AI**.

I used them for data exploration, code generation/refactoring, debugging, thinking through edge cases, and testing the AI analyst.

I did not keep everything the models suggested. I corrected or removed things when the data did not support them. Examples include the old timestamp assumption, arbitrary order matching, using the LLM for the actual numbers, and a global agent ranking.

**Paid API spend: ₹0.**

**Three-minute recording:** PASTE_PUBLIC_GOOGLE_DRIVE_RECORDING_LINK_HERE

## Public Google Drive Link

PASTE_PUBLIC_GOOGLE_DRIVE_FOLDER_OR_FILE_LINK_HERE

## Monday handoff — three things to know

1. Run `python run.py` first. That is the main analysis and it reads the raw files from `data/`.
2. The main number is **3,201 / 11,875 = 26.96%** 30-day same-order repeat contact.
3. The web app is just the easier way to look at the results. The AI chat is optional and should not replace the Python numbers.

## Honest hours spent

**PUT YOUR ACTUAL HOURS HERE.**

## Github Repo Link

https://github.com/trushendarreddy-cell/Vireo-Audio-Support-Tickets-
