# Vireo Audio — Support Ticket Analysis

This folder contains the Next.js frontend for the Vireo Audio support-ticket analysis tool.

The frontend reads the analytical results from the FastAPI backend and provides the main dashboard, complaint views, agent views, ticket search, validation information, and the optional AI analyst.

## Run locally

From this folder:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

For a production-style local run:

```bash
npm install
npm run build
npm run start -- -p 3000
```

The backend should be running on `http://localhost:8000`.

## Frontend structure

- `src/app/` — pages and application routes
- `src/components/` — reusable UI components
- `public/` — static assets
- `package.json` — frontend dependencies and scripts

## Notes

- The frontend does not calculate the main business metrics itself.
- The FastAPI backend loads the cleaned dataset and serves the verified analysis.
- The optional AI analyst can use configured providers, but the core dashboard does not require a paid AI API.
- This is a task prototype, not a production support platform.
