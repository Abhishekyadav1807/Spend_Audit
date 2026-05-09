import type { SummaryRequestInput } from "../summary/schema.js";

function fallbackSummary(input: SummaryRequestInput): string {
  const monthly = input.auditResult.totalPotentialMonthlySavingsUsd.toFixed(2);
  const annual = input.auditResult.totalPotentialAnnualSavingsUsd.toFixed(2);
  const top = [...input.auditResult.recommendations]
    .sort((a, b) => b.estimatedMonthlySavingsUsd - a.estimatedMonthlySavingsUsd)
    .slice(0, 2)
    .map((x) => `${x.toolId}: ${x.recommendedAction}`)
    .join("; ");

  if (input.auditResult.totalPotentialMonthlySavingsUsd < 100) {
    return `Your stack appears relatively efficient right now. We found limited immediate savings (${monthly}/month, ${annual}/year), which usually means your current plans are mostly aligned with team size and use case. Keep monitoring vendor pricing and seat mix each month, especially if your team or workflow changes.`;
  }

  return `Your audit indicates meaningful savings potential: about $${monthly} per month ($${annual} annually). The biggest optimization opportunities come from ${top}. Prioritize plan-fit changes first, then review direct API spend for possible credit discounts. Re-running this audit monthly should help you capture new savings as pricing and usage evolve.`;
}

export async function generatePersonalizedSummary(input: SummaryRequestInput): Promise<{
  text: string;
  model: string;
  usedFallback: boolean;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { text: fallbackSummary(input), model: "fallback-template", usedFallback: true };
  }

  const prompt = `You are a finance-aware AI spend analyst.
Write a single paragraph between 90 and 120 words.
Be specific with numbers and recommendations from the JSON.
Do not invent tool names, prices, or actions.
If monthly savings are below 100 USD, be honest that spend is mostly optimized.
Audit JSON:
${JSON.stringify(input)}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
        max_tokens: 220,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      return { text: fallbackSummary(input), model: "fallback-template", usedFallback: true };
    }
    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      model?: string;
    };
    const text = data.content?.find((c) => c.type === "text")?.text?.trim();
    if (!text) {
      return { text: fallbackSummary(input), model: "fallback-template", usedFallback: true };
    }
    return { text, model: data.model || "anthropic", usedFallback: false };
  } catch {
    return { text: fallbackSummary(input), model: "fallback-template", usedFallback: true };
  }
}

