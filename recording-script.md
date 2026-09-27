# 3-minute recording script

Don't read this like a presentation. Just talk through what you built while showing it.

### 0:00–0:30 — What I built

"Hey, this is my Vireo Audio support-ticket project.

The main ask was a weekly complaint digest and an agent leaderboard. I also needed to show a business number, explain how I checked the results, and show what I changed or left out.

I kept the actual analysis in Python. The web app is just a way to look at the results, and the AI chat is optional."

### 0:30–1:00 — Run it

Show the terminal and run:

```bash
python run.py
```

Say:

"This takes the raw ticket files, removes the duplicate rows, fixes the legacy timestamp issue, calculates the metrics and writes the output files.

There are 12,528 raw rows and 653 duplicates, leaving 11,875 tickets."

### 1:00–1:30 — What I found

Show the weekly digest.

"The main number I ended up using is same-order repeat contact within 30 days.

It's 3,201 out of 11,875 tickets, so about 27%.

I also found 324 tickets with the same cancellation/address-editing complaint pattern. I would reproduce that issue before claiming a saving from fixing it."

### 1:30–2:00 — Leaderboard

Show the leaderboard.

"I didn't rank every agent together. Tier 2 warranty cases can take several days and involve physical RMAs, so I kept those separate and used resolution time.

For Tier 1, agents are compared inside their own teams. I also show the other metrics instead of hiding everything in one score."

### 2:00–2:30 — What changed during the build

Show `prompts/development-log.md` and `output/validation.md`.

"I checked the data instead of just trusting the first result.

For example, I found that only legacy resolved timestamps needed the timezone correction. I also found 10 tickets where the order was genuinely ambiguous, so I stopped trying to guess.

I also kept the LLM away from the source-of-truth numbers."

### 2:30–3:00 — Business number + limits

Show the memo.

"At 650 tickets a week, taking the repeat-contact rate from 27% to 22% would mean about 423 fewer repeat contacts per quarter. At ₹290 each, that's about ₹1.23 lakh per quarter in modelled capacity.

The important limitation is that same-order repeat contact is only a proxy because there isn't a root-cause ID in the data.

The core analysis costs zero in API fees. That's basically the project."

