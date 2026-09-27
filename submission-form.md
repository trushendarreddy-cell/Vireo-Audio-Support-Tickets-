# Vireo Audio — Task 1 V3 Submission Form

## What did you build, and what business outcome does it move? State the number and the money.

I built a small support analytics tool around Vireo's 18 months of ticket data. It gives a weekly complaint digest, an agent leaderboard, operational/SLA numbers, ticket search, validation checks, and an optional AI analyst.

The primary business metric is **30-day same-order repeat contact rate**. The verified baseline is **3,201 repeat tickets / 11,875 unique tickets = 26.96%**.

The target I used is to reduce that rate from **27.0% to 22.0%** at Vireo's stated planning volume of **650 tickets/week**. A 5 percentage-point reduction represents:

- 650 × 52 / 4 = **8,450 tickets/quarter**
- 8,450 × 5% = **422.5 fewer repeat contacts/quarter** (about 423)
- 8,450 × 5% × ₹290 = **₹122,525/quarter**

This is a measurable operating target, not a claim that the tool itself has already produced the savings.

The tool also surfaces a concrete product/support issue: **324 tickets**, or **19.2% of the "Other" category**, contain the cancellation/address-editing friction pattern.

## What does one run cost, and what would a month cost at Vireo's volume (roughly 650 tickets a week)?

The core pipeline uses Python's standard library and makes **no paid API calls**.

- One deterministic analysis run: **₹0**
- 650 tickets/week × 52/12 = **~2,817 tickets/month**
- Core processing at that volume: **₹0 in model/API fees**
- The optional AI Support Analyst can use cloud providers, but it is not required for the digest or leaderboard. During development/testing I incurred **₹0 in paid API spend** using available free access/quotas.

That ₹0 figure is for the core delivered tool. The optional cloud AI can have a cost depending on the provider and quota.

## How do you know it works? Sample size, how you checked, error rate, and the kind of case it gets wrong.

I checked it in a few different ways:

1. **Dataset reconciliation:** 12,528 raw rows reconcile to **11,875 unique tickets** after **653 duplicate rows** are removed.
2. **17 automated validation checks:** the cleaning, timestamps, CSAT, SLA, repeat-contact, refund and replacement calculations are programmatically reconciled.
3. **Theme audit:** the cancellation/address-editing classifier was manually audited on **50 tickets** and achieved **100% precision and recall on that audit sample**.
4. **AI analyst tests:** automated tests cover grounding, schema handling, provider failover, local fallback and secret-leak checks.
5. **Scenario checks:** repeat-contact, cancellation, SLA, greeting/capability and fallback scenarios are exercised in the test suite.

I am also keeping the known limitations visible instead of hiding them. **10 tickets with blank order IDs remain ambiguous** because the same customer bought the same SKU on the same date more than once. I deliberately leave those relationships unlinked rather than guessing.

The biggest conceptual limitation is that the dataset has no unique root-cause/problem ID. Therefore, **same customer + same order within 30 days is a proxy for repeat contact, not proof that the underlying problem was identical**.

## Did you change, narrow, or push back on the client's ask? What, when, and why.

Yes.

- **Agent leaderboard:** Priya asked for tickets closed per week, but Neha explicitly warned not to rank the warranty team that way. I kept the leaderboard but separated Tier 2 Escalations & Warranty and evaluate it on **resolution speed in days**, while Tier 1 agents are compared within their functional teams.
- **Repeat contacts:** I did not claim "same issue" directly. I tested customer-, product- and order-level proxies and chose **same-order within 30 days** because it is the most defensible join available in the data.
- **AI usage:** I did not make an LLM the source of truth. Deterministic Python calculations remain authoritative because the business numbers need to be reproducible and auditable.
- **Cost:** I deliberately kept the core workflow at **₹0 per run** rather than making the business case depend on a per-ticket model bill.

## What is wrong with what you are handing us?

- The repeat-contact metric is a **proxy**, because there is no root-cause problem ID.
- **10 ambiguous same-day order matches** are intentionally left unresolved.
- The cancellation theme audit is based on a **50-ticket sample**, not a manual review of every ticket.
- The optional cloud AI analyst can experience provider rate limits, latency or temporary 5xx errors. The router falls back to another provider or the local deterministic engine.
- The local fallback is intentionally less flexible than a general-purpose LLM.
- The historical dataset averages roughly **189 tickets/week**, while the client supplied **650 tickets/week** as the forward planning scenario. Financial impact at 650/week is therefore a scenario model, not historical observed volume.
- The web product requires the FastAPI backend and Next.js frontend to be running; the deterministic CLI remains available independently.
- The UI is an operational prototype, not a production helpdesk replacement. Authentication, role-based access and a production database were deliberately not built.

## What did you deliberately leave out, and why that rather than something else?

I left out:

- Per-ticket LLM classification of all 11,875 tickets — unnecessary for the requested digest and leaderboard, and it introduces cost, latency and reproducibility risk.
- A global composite agent score — it would hide trade-offs between productivity, CSAT, SLA and transfers and could unfairly mix Tier 1 and Tier 2 work.
- Production authentication, deployment infrastructure and a full ticket-management workflow — useful for a platform product, but outside the five-hour task and not required to answer Priya's business question.
- Broad sentiment/embedding infrastructure — it would add complexity without being necessary to identify the strongest operational themes in this dataset.

I focused on the things the brief actually asks for: **reproducible numbers, the weekly digest, a fair leaderboard, validation, and a clear business outcome**.

## Anything you built or found that nobody asked for?

Yes.

- A **cancellation/address-editing friction theme** affecting 324 tickets and 19.2% of the "Other" category.
- **SLA breach exposure:** 1,051 breaches and ₹367,850 in store-credit liability.
- Data-quality diagnostics covering the migration duplicates, legacy timestamp normalization, CSAT=0 semantics and ambiguous order joins.
- An optional grounded AI analyst that lets CX leadership ask questions against the verified metrics without allowing the LLM to become the numerical source of truth.

## What did you use AI for?

I used **Google Antigravity/Gemini** and **GLM 5.3 Flash through Freebuff AI** while building and checking the project.

They helped with:
- exploring the data and proposing hypotheses;
- generating and refactoring Python/TypeScript;
- debugging the FastAPI/Next.js integration;
- designing and testing the grounded AI analyst;
- reviewing edge cases and producing the development log.

I also threw away or corrected approaches when the data did not support them. For example:
- treating all legacy timestamps as UTC;
- choosing an arbitrary order when multiple same-day orders existed;
- using an LLM as the source of truth for business metrics;
- ranking all agents globally by ticket count;
- building an opaque composite score.

**Paid API spend: ₹0.** Available free access/quotas were used during development/testing. Cloud-model availability can vary by provider.

**Three-minute screen recording:** PASTE_PUBLIC_GOOGLE_DRIVE_RECORDING_LINK_HERE

## Public Google Drive Link

PASTE_PUBLIC_GOOGLE_DRIVE_FOLDER_OR_FILE_LINK_HERE

## Someone picks this up on Monday and you are unreachable. The three things they need to know.

1. Run `python run.py` first. It is the source-of-truth deterministic pipeline and regenerates the analytical outputs from the raw files in `data/`.
2. The primary business metric is **30-day same-order repeat contact**: **3,201 / 11,875 = 26.96%**, with a planning target of **22% at 650 tickets/week**.
3. The web app is mainly the presentation layer: start the FastAPI backend on port 8000 and the Next.js frontend on port 3000. The AI analyst is an explanation layer with provider fallback; it must not replace the deterministic metrics.

## Honest hours spent

**PUT YOUR ACTUAL HOURS HERE.**

## Github Repo Link

https://github.com/trushendarreddy-cell/Vireo-Audio-Support-Tickets-
