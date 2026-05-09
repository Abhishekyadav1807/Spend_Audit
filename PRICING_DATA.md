# Pricing Data Sources

All pricing values below were verified on **2026-05-09** and are mapped to the audit engine constants.

## Notes on Method

- Some enterprise tiers are listed as "Contact sales" on official pages.  
- For those tiers, the audit engine uses conservative placeholder estimates only for comparison math, and marks rationale in code comments.
- API-direct monthly values in the MVP are baseline assumptions for light-to-moderate usage bundles and are intentionally conservative.

## Cursor

- Hobby: $0/month — https://cursor.com/pricing — verified 2026-05-09
- Pro: $20/month — https://cursor.com/pricing — verified 2026-05-09
- Teams (mapped to `business`): $40/user/month — https://cursor.com/pricing — verified 2026-05-09
- Enterprise: Contact sales (engine uses comparison placeholder) — https://cursor.com/pricing — verified 2026-05-09

## GitHub Copilot

- Pro (mapped to `individual`): $10/month — https://docs.github.com/copilot/get-started/plans — verified 2026-05-09
- Business: $19/seat/month — https://docs.github.com/copilot/get-started/plans — verified 2026-05-09
- Enterprise: $39/seat/month — https://docs.github.com/copilot/get-started/plans — verified 2026-05-09

## Claude

- Free: $0 — https://support.anthropic.com/en/articles/11049762-choosing-a-claude-ai-plan — verified 2026-05-09
- Pro: $20/month — https://support.anthropic.com/en/articles/8325610-how-much-does-claude-pro-cost — verified 2026-05-09
- Max 5x (mapped to `max`): $100/month — https://support.anthropic.com/en/articles/11049744-how-much-does-the-max-plan-cost — verified 2026-05-09
- Team standard monthly: $30/member/month — https://support.anthropic.com/en/articles/9267289-how-is-my-team-plan-bill-calculated — verified 2026-05-09
- Enterprise: Contact sales (engine uses comparison placeholder) — https://claude.com/pricing — verified 2026-05-09
- API direct baseline: usage-based (see model pricing) — https://docs.anthropic.com/en/docs/about-claude/pricing — verified 2026-05-09

## ChatGPT

- Plus: $20/month — https://chatgpt.com/pricing/ — verified 2026-05-09
- Team/Business monthly seat price (mapped to `team`): $30/user/month billed monthly — https://chatgpt.com/pricing/ — verified 2026-05-09
- Enterprise: Contact sales (engine uses comparison placeholder) — https://chatgpt.com/pricing/ — verified 2026-05-09
- API direct baseline: usage-based (see API model pricing) — https://openai.com/api/pricing/ — verified 2026-05-09

## Anthropic API Direct

- Usage-based token pricing (no fixed monthly plan) — https://docs.anthropic.com/en/docs/about-claude/pricing — verified 2026-05-09
- MVP engine baseline for monthly comparison: $30/month

## OpenAI API Direct

- Usage-based token pricing (no fixed monthly plan) — https://openai.com/api/pricing/ — verified 2026-05-09
- MVP engine baseline for monthly comparison: $30/month

## Gemini

- Gemini API usage-based pricing — https://ai.google.dev/gemini-api/docs/pricing — verified 2026-05-09
- Gemini Pro (consumer plan baseline used in engine): $20/month (publicly listed Gemini subscription tier naming differs by region/product surface; this is a conservative benchmark constant)
- Gemini Ultra baseline in engine: $250/month benchmark constant

## Windsurf

- Free: $0/month — https://windsurf.com/redirect/windsurf/learn-pricing — verified 2026-05-09
- Pro: $20/month — https://windsurf.com/pricing — verified 2026-05-09
- Teams: $40/user/month — https://windsurf.com/pricing — verified 2026-05-09
- Enterprise: Contact sales — https://windsurf.com/pricing — verified 2026-05-09
