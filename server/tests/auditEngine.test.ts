import { describe, expect, it } from "vitest";
import { runAudit } from "../src/audit/engine.js";
import { auditInputSchema } from "../src/audit/schema.js";

describe("audit input schema", () => {
  it("accepts a valid payload", () => {
    const parsed = auditInputSchema.safeParse({
      teamSize: 4,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", planId: "business", monthlySpendUsd: 80, seats: 2 }],
    });
    expect(parsed.success).toBe(true);
  });
});

describe("runAudit", () => {
  it("recommends downgrade for small-team enterprise plan", () => {
    const result = runAudit({
      teamSize: 3,
      primaryUseCase: "coding",
      tools: [{ toolId: "cursor", planId: "enterprise", monthlySpendUsd: 180, seats: 3 }],
    });
    expect(result.recommendations[0].recommendedAction).toBe("downgrade_plan");
    expect(result.recommendations[0].estimatedMonthlySavingsUsd).toBeGreaterThan(0);
  });

  it("recommends copilot individual for single-seat business", () => {
    const result = runAudit({
      teamSize: 1,
      primaryUseCase: "coding",
      tools: [{ toolId: "github_copilot", planId: "business", monthlySpendUsd: 19, seats: 1 }],
    });
    expect(result.recommendations[0].recommendedPlanOrTool).toBe("individual");
  });

  it("recommends credits for high direct anthropic api spend", () => {
    const result = runAudit({
      teamSize: 6,
      primaryUseCase: "research",
      tools: [{ toolId: "anthropic_api", planId: "api", monthlySpendUsd: 500, seats: 1 }],
    });
    expect(result.recommendations[0].recommendedAction).toBe("use_credits");
    expect(result.recommendations[0].estimatedMonthlySavingsUsd).toBe(75);
  });

  it("keeps plan when no clear savings rule applies", () => {
    const result = runAudit({
      teamSize: 4,
      primaryUseCase: "mixed",
      tools: [{ toolId: "windsurf", planId: "pro", monthlySpendUsd: 60, seats: 4 }],
    });
    expect(result.recommendations[0].recommendedAction).toBe("keep_current");
    expect(result.recommendations[0].estimatedMonthlySavingsUsd).toBe(0);
  });

  it("aggregates monthly and annual savings across tools", () => {
    const result = runAudit({
      teamSize: 5,
      primaryUseCase: "coding",
      tools: [
        { toolId: "openai_api", planId: "api", monthlySpendUsd: 500, seats: 1 },
        { toolId: "cursor", planId: "enterprise", monthlySpendUsd: 120, seats: 2 },
      ],
    });
    expect(result.totalPotentialMonthlySavingsUsd).toBeGreaterThan(0);
    expect(result.totalPotentialAnnualSavingsUsd).toBe(
      result.totalPotentialMonthlySavingsUsd * 12
    );
  });
});

