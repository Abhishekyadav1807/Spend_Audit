import { describe, expect, it } from "vitest";
import { generatePersonalizedSummary } from "../src/services/summary.js";

describe("generatePersonalizedSummary", () => {
  it("returns fallback summary when API key is not configured", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await generatePersonalizedSummary({
      auditInput: {
        teamSize: 5,
        primaryUseCase: "coding",
        tools: [{ toolId: "cursor", planId: "pro", monthlySpendUsd: 20, seats: 1 }],
      },
      auditResult: {
        teamSize: 5,
        primaryUseCase: "coding",
        totalCurrentMonthlySpendUsd: 20,
        totalPotentialMonthlySavingsUsd: 120,
        totalPotentialAnnualSavingsUsd: 1440,
        recommendations: [
          {
            toolId: "cursor",
            currentMonthlySpendUsd: 20,
            recommendedAction: "keep_current",
            recommendedPlanOrTool: "pro",
            estimatedMonthlySavingsUsd: 0,
            reason: "Current plan appears reasonable for stated seats and spend.",
          },
        ],
      },
    });

    expect(response.usedFallback).toBe(true);
    expect(response.model).toBe("fallback-template");
    expect(response.text.length).toBeGreaterThan(20);

    if (previous) {
      process.env.ANTHROPIC_API_KEY = previous;
    }
  });
});

