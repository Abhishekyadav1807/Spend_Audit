# AISpendAudit

AISpendAudit is a free web app for startup engineering leaders who want a fast, defensible AI spend audit.  
It helps teams identify plan mismatches, downgrade opportunities, and equivalent lower-cost alternatives across major AI tools, with clear monthly and annual savings estimates.

## Who This Is For

Primary user: CTO or Founding Engineer at a seed to Series A SaaS startup (5 to 30 employees), spending roughly $300 to $8,000 per month on AI tools, without dedicated procurement or finance ops support.

## Core Promise

AISpendAudit delivers a 3-minute audit that identifies AI overspend and shows concrete monthly and annual savings actions.

## What I Built

- Spend input flow for tools, plans, monthly spend, seats, team size, and primary use case
- Rule-based audit engine with per-tool recommendations and savings math
- Results page with total monthly and annual savings, plus per-tool breakdown
- Personalized AI summary (with fallback when model/API fails)
- Post-value lead capture and backend storage
- Public shareable audit URL with private fields removed

## Product Principles

- Show value before asking for email
- Be honest when savings are low or the stack is already efficient
- Keep recommendations explainable to non-engineering stakeholders
- Prefer deterministic pricing logic over black-box AI for audit math

## Tech Stack

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL
- AI summary: Anthropic API (fallback template on failure)
- Email: Resend (transactional confirmation)

## Screenshots / Demo

- Add at least 3 screenshots before submission
- Or add a 30-second Loom/YouTube walkthrough

## Deployed URL

- Add live URL before submission

## Deployment

Recommended deployment split:

- Frontend: Vercel or Netlify from `client`
- Backend API: Render from `server`
- Database: Supabase Postgres or Render Postgres

Required backend environment variables:

- `DATABASE_URL`
- `APP_BASE_URL`
- `PUBLIC_REPORT_BASE_URL`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Required frontend environment variable:

- `VITE_API_BASE_URL`
- `VITE_CONSULTATION_URL`

Before submission, verify the live URL, share URL, email capture, and Lighthouse mobile targets.

## Quick Start

```bash
# Install dependencies
npm install
npm install --prefix client
npm install --prefix server

# Run backend API
npm run dev:server

# Run frontend app in a second terminal
npm run dev:client

# Run lint
npm run lint

# Run tests
npm test
```

## Decisions (Trade-offs)

1. Rule-based audit logic over LLM-generated recommendations to keep pricing decisions deterministic and auditable.
2. Email capture after results (not before) to improve trust and completion rate for cold visitors.
3. Split frontend and backend so API keys, rate limiting, and email workflows stay server-side.
4. Keep MVP scope tight (core tools + clear savings math) before adding advanced benchmark or referral features.
5. Use PostgreSQL for structured audit records and share-link retrieval instead of local-only/session-only state.
6. Use a honeypot plus simple IP rate limit for abuse protection because it avoids adding friction before the user sees audit value.

## Known Limitations (Current)

- Pricing assumptions can drift if vendor pricing pages change, so periodic updates are required.
- Alternative-tool recommendations are heuristic and should improve with real user feedback.
- The first version is optimized for startup teams, not large enterprise procurement workflows.
