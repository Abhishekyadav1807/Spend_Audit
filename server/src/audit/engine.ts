import { getPlanSeatPrice } from "./pricing.js";
import type {
  AuditInput,
  AuditResult,
  PlanId,
  ToolRecommendation,
  ToolSpendInput,
} from "./types.js";

function pickFallbackPlan(tool: ToolSpendInput): PlanId {
  if (tool.toolId === "cursor") {
    return tool.seats <= 1 ? "pro" : "business";
  }
  if (tool.toolId === "github_copilot") {
    return tool.seats <= 1 ? "individual" : "business";
  }
  if (tool.toolId === "chatgpt" || tool.toolId === "claude") {
    return tool.seats <= 1 ? "plus" : "team";
  }
  if (tool.toolId === "gemini") {
    return "pro";
  }
  if (tool.toolId === "windsurf") {
    return tool.seats <= 1 ? "pro" : "team";
  }
  return "api";
}

function buildRecommendation(tool: ToolSpendInput): ToolRecommendation {
  const current = tool.monthlySpendUsd;
  const fallbackPlan = pickFallbackPlan(tool);
  const fallbackUnitPrice = getPlanSeatPrice(tool.toolId, fallbackPlan) ?? 0;
  const fallbackSpend = fallbackUnitPrice * tool.seats;

  if (tool.planId === "enterprise" && tool.seats <= 3 && fallbackSpend < current) {
    return {
      toolId: tool.toolId,
      currentMonthlySpendUsd: current,
      recommendedAction: "downgrade_plan",
      recommendedPlanOrTool: fallbackPlan,
      estimatedMonthlySavingsUsd: roundUsd(current - fallbackSpend),
      reason: "Enterprise plan is usually excessive for very small seat counts.",
    };
  }

  if (
    (tool.toolId === "chatgpt" || tool.toolId === "claude") &&
    tool.planId === "team" &&
    tool.seats <= 2
  ) {
    const plusSpend = (getPlanSeatPrice(tool.toolId, "plus") ?? 20) * tool.seats;
    if (plusSpend < current) {
      return {
        toolId: tool.toolId,
        currentMonthlySpendUsd: current,
        recommendedAction: "downgrade_plan",
        recommendedPlanOrTool: "plus",
        estimatedMonthlySavingsUsd: roundUsd(current - plusSpend),
        reason: "Team tier has collaboration overhead that may not pay off for very small teams.",
      };
    }
  }

  if (
    tool.toolId === "github_copilot" &&
    tool.planId === "business" &&
    tool.seats === 1 &&
    current > 10
  ) {
    return {
      toolId: tool.toolId,
      currentMonthlySpendUsd: current,
      recommendedAction: "downgrade_plan",
      recommendedPlanOrTool: "individual",
      estimatedMonthlySavingsUsd: roundUsd(current - 10),
      reason: "Single-seat teams usually do not need admin controls in business tier.",
    };
  }

  if (tool.toolId === "anthropic_api" && current >= 200) {
    const savings = current * 0.15;
    return {
      toolId: tool.toolId,
      currentMonthlySpendUsd: current,
      recommendedAction: "use_credits",
      recommendedPlanOrTool: "Credex discounted credits",
      estimatedMonthlySavingsUsd: roundUsd(savings),
      reason: "High direct API spend can often be reduced via discounted infrastructure credits.",
    };
  }

  if (tool.toolId === "openai_api" && current >= 200) {
    const savings = current * 0.12;
    return {
      toolId: tool.toolId,
      currentMonthlySpendUsd: current,
      recommendedAction: "use_credits",
      recommendedPlanOrTool: "Credex discounted credits",
      estimatedMonthlySavingsUsd: roundUsd(savings),
      reason: "Large direct API invoices are frequently discount-eligible through credits.",
    };
  }

  return {
    toolId: tool.toolId,
    currentMonthlySpendUsd: current,
    recommendedAction: "keep_current",
    recommendedPlanOrTool: tool.planId,
    estimatedMonthlySavingsUsd: 0,
    reason: "Current plan appears reasonable for stated seats and spend.",
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

export function runAudit(input: AuditInput): AuditResult {
  const recommendations = input.tools.map(buildRecommendation);
  const totalCurrentMonthlySpendUsd = roundUsd(
    input.tools.reduce((sum, t) => sum + t.monthlySpendUsd, 0)
  );
  const totalPotentialMonthlySavingsUsd = roundUsd(
    recommendations.reduce((sum, rec) => sum + rec.estimatedMonthlySavingsUsd, 0)
  );

  return {
    teamSize: input.teamSize,
    primaryUseCase: input.primaryUseCase,
    totalCurrentMonthlySpendUsd,
    totalPotentialMonthlySavingsUsd,
    totalPotentialAnnualSavingsUsd: roundUsd(totalPotentialMonthlySavingsUsd * 12),
    recommendations,
  };
}

