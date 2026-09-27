# Memorandum

**To:** Priya Raman, Head of Customer Experience, Vireo Audio  
**From:** Rushendar Reddy  
**Date:** 27 September 2026  
**Subject:** Support ticket findings and what I would focus on next

I went through the 18 months of support tickets and built a small tool to make the weekly analysis easier. It produces a complaint digest, agent views, the main support metrics, ticket search, and an optional AI analyst.

After cleaning the export, there are **11,875 unique tickets** from **12,528 rows**.

## The main number

The clearest number I found is the repeat-contact rate.

**3,201 of 11,875 tickets (27.0%)** match a same-customer, same-order repeat contact within 30 days.

The dataset does not have a root-cause ID, so I would not call all of these the exact same problem. I am using this as a practical repeat-contact proxy.

The brief gives **650 tickets/week** as the planning volume. If the 30-day repeat-contact rate moved from 27% to 22%, that would be roughly **423 fewer repeat contacts per quarter**.

At **₹290 per contact**, that is about **₹1.23 lakh per quarter** of modeled contact-handling capacity.

That is a target/opportunity estimate, not a claim that the tool has already saved that money.

## A pattern worth checking

I found **324 tickets** in the "Other" category that match a cancellation or address-editing text pattern.

Some customers describe the cancel button being unavailable or being unable to change the delivery address in the app.

I would reproduce this flow before putting a savings figure on it. The tickets show that customers are reporting the problem, but they do not prove the exact product cause or how many contacts a fix would prevent.

## What the repeat-contact data looks like

I checked two windows:

- **14 days:** 1,910 / 11,875 = **16.1%**
- **30 days:** 3,201 / 11,875 = **27.0%**

I used the 30-day figure for the main metric because it gives more room to catch a follow-up contact while still using the same customer + order relationship.

Again, it is a proxy rather than a direct measure of repeated root causes.

## SLA

There are **1,051 first-response SLA breaches**.

Under the support policy, that corresponds to **₹367,850** in store-credit exposure.

This is another number I would keep in the weekly view because it gives a direct way to see whether response-time problems are improving.

## Agent view

I did not put every agent into one overall ranking.

The warranty and Tier 2 work is different from normal Tier 1 ticket handling. Those cases can take several days and can involve physical RMAs, so I kept that group separate and looked at resolution time for it.

For Tier 1, the tool compares agents within their functional teams and shows the underlying numbers such as tickets closed, SLA, CSAT and repeat contact instead of turning everything into one score.

## Data checks and limitations

A few things in the export needed attention:

- **653 duplicate rows** were removed.
- Legacy `resolved_at` timestamps needed a **+5.5 hour correction**.
- A CSAT value of **0** is treated as no response, based on the support policy.
- **10 tickets** have blank order IDs and are left unresolved because the same customer had multiple orders for the same SKU on the same date.
- Historical volume averages roughly **189 tickets/week**. I have kept that separate from the **650/week** planning scenario in the brief.

## What I would do next

1. Reproduce the cancellation/address-editing flow and check whether the reported friction still exists.
2. Look into the high SLA-breach pattern, especially for email.
3. Keep the weekly digest running and track whether repeat contacts and SLA breaches move after the underlying issues are fixed.

The core analysis runs without paid API calls. The AI analyst is optional and is not used to calculate the main numbers.

**Bottom line:** the main number I would track from this dataset is the **27.0% repeat-contact rate**. The useful next step is not to assume the cause, but to use the weekly data to find the specific issues behind those repeat contacts and check whether fixing them changes the number.
