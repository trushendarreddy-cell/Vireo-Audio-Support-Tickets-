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

## AI used during development

I used **Google Antigravity/Gemini** and **GLM 5.3 Flash through Freebuff AI**.

I used different AI tools for different parts of the work instead of expecting one model to do everything.

### Google Antigravity / Gemini

I mainly used it when I wanted to work directly on the project and see changes across the codebase.

I used it for:

- understanding the existing project structure;
- building and changing the backend/frontend;
- connecting the analysis to the web app;
- debugging issues;
- testing flows;
- cleaning up UI and code when something was not working.

The useful part was being able to give it the project context and ask it to make a change, then check the actual result myself.

### GLM 5.3 Flash through Freebuff AI

I used GLM more as a second pair of eyes and for faster iterations.

I used it for:

- reading the supplied task files and understanding the requirements;
- checking whether the product matched the brief;
- exploring the CSV data and possible metrics;
- looking for edge cases;
- reviewing calculations and assumptions;
- checking the final README/memo;
- asking it to review the product as if it were the client;
- generating focused prompts when I wanted another AI tool to perform a specific change.

I did not just accept the first answer. I kept giving it the actual files/context and asking it to verify things against the data.

### What my prompts were trying to do

The prompts were mostly practical rather than asking the AI to build the whole project and trusting whatever came back.

A typical workflow was:

**1. Give the AI the actual task and files**

I first gave it the client brief, README/email context and data files so it knew what the task was actually asking.

**2. Ask it to inspect before changing**

For example, I would ask it to inspect the current code/data and tell me what was already there, what was missing and what could be wrong.

**3. Give a specific change**

Instead of saying make it better, I would ask for a concrete change such as checking duplicate handling, fixing a metric, changing a leaderboard rule, improving a page, or validating a particular calculation.

**4. Make it verify its own work**

After changes, I asked it to run/check the relevant files, compare the output with the source data and look for edge cases.

**5. Challenge the result**

If an answer looked too convenient, I asked the AI to prove where the number came from or explain the assumption. This is how I caught things that I did not want to blindly keep.

### Examples of the kind of prompts I used

I used prompts along these lines:

> Read all the task files first. Do not change anything yet. Tell me what the client actually asked for, what is required for submission, and what is optional.

> Inspect the ticket data and find a business metric that can actually be calculated from the available fields. Show the formula, the rows used, and the limitations. Do not invent a metric.

> Verify this calculation against the raw CSV. If the join is ambiguous, do not guess. Tell me exactly which rows are affected.

> Review the current product against the original brief. Check what is missing, what is unnecessary, and what could be misleading to the client.

> Do a final product check. Verify the calculations, edge cases, frontend flow, README and client memo. Do not just say it looks good; point out anything that could fail.

> Look at the frontend as a real user would. Tell me what is confusing, what looks unfinished, and what should be changed without adding unnecessary features.

The exact wording changed during the work. The important part was that I kept the prompts tied to the actual files and the task rather than asking the model to make generic improvements.

## What AI got wrong or what I did not keep

I did not keep everything the models suggested.

Some important corrections/decisions were:

- not using arbitrary order matching;
- not using an LLM for the main calculations;
- not combining all agents into one score;
- correcting the legacy timestamp handling;
- treating the repeat-contact metric as a proxy rather than a confirmed root-cause metric;
- leaving ambiguous tickets unresolved;
- removing extra documentation that made the project look more complicated than the actual work.

This was important because an AI can produce something that looks reasonable while still being wrong for the actual data.

## Why I used more than one AI

I found it useful to have different models look at the same work.

One model could make a code change, while another could review the result or question an assumption. I could then check both against the actual files and data.

The final decision was mine, not the model's.

## Cost

Paid API spend during development: **₹0**.

The core analysis also runs without a paid API. The AI analyst is optional.

## What I left out

I did not spend the limited task time on:

- sending every ticket to an LLM;
- a complicated sentiment/embedding pipeline;
- a global agent score;
- full ticket management;
- production authentication and deployment.

Those things could be added later, but they were not necessary to answer the main question in this task.

## Final product scope

The result is intentionally a prototype rather than a production support platform.

It is meant to answer:

**What are customers contacting support about, where are repeat contacts happening, how is support performing, and what should we investigate next?**

That is the part I wanted to make useful and checkable within the time available.

## Recording / handoff

The required screen recording should show the actual product and the development process naturally: what I started with, what I built, what changed, and what I decided not to keep.

No separate presentation or reading script is needed.

The client-facing explanation is in memo-to-priya.md.
