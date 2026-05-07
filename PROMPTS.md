# LLM Prompts

## Purpose

LLM is only used for personalized summary text on top of deterministic audit output.

## Prompt (Draft V1)

```text
You are an AI spend analyst. Write a concise 90-120 word summary for a startup team.
Use the audit JSON provided. Mention:
1) current monthly spend,
2) potential monthly and annual savings,
3) top 2 recommended actions,
4) a realistic confidence statement.
Do not invent pricing numbers. If savings are low, say spend is already efficient.
Tone: practical, non-hype, founder-friendly.
```

## Why This Prompt

- Keeps summary concise and decision-ready.
- Prevents fabricated numbers by explicitly restricting invention.
- Handles both high-savings and low-savings cases honestly.

## What Did Not Work (To Update)

- Overly generic prompts that produced marketing-style fluff.
- Prompts without hard constraints that occasionally hallucinated tool details.

