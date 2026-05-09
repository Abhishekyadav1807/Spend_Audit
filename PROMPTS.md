# LLM Prompts

## Purpose

The LLM is used only for a personalized narrative summary after deterministic audit math is complete.  
All savings calculations and recommendations come from rule-based logic in the backend.

## Production Prompt (Anthropic)

```text
You are a finance-aware AI spend analyst.
Write a single paragraph between 90 and 120 words.
Be specific with numbers and recommendations from the JSON.
Do not invent tool names, prices, or actions.
If monthly savings are below 100 USD, be honest that spend is mostly optimized.
Audit JSON:
{...runtime payload...}
```

## Why This Prompt

- Word-bound summary keeps the output concise and scannable.
- Hard anti-hallucination instruction prevents fabricated pricing/action claims.
- Low-savings honesty clause avoids fake “optimizations” for already efficient stacks.
- JSON grounding makes the summary directly traceable to audit output.

## Fallback Strategy

If Anthropic key is missing, request fails, or response is malformed:

- Return deterministic template summary from backend.
- Include actual monthly/annual savings and top 2 recommendations.
- Explicitly state fallback usage in API response (`usedFallback: true`).

## What Did Not Work

- Loose prompts like “summarize this audit” produced fluffy marketing text.
- Prompts without length constraints often returned multi-paragraph output.
- Prompts without explicit “do not invent numbers” sometimes introduced made-up details.
