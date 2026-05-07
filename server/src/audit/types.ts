export const SUPPORTED_TOOLS = [
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
] as const;

export type ToolId = (typeof SUPPORTED_TOOLS)[number];

export type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

export type PlanId =
  | "hobby"
  | "pro"
  | "business"
  | "enterprise"
  | "individual"
  | "free"
  | "plus"
  | "team"
  | "max"
  | "ultra"
  | "api";

export interface ToolSpendInput {
  toolId: ToolId;
  planId: PlanId;
  monthlySpendUsd: number;
  seats: number;
}

export interface AuditInput {
  teamSize: number;
  primaryUseCase: UseCase;
  tools: ToolSpendInput[];
}

export type AuditAction =
  | "downgrade_plan"
  | "switch_tool"
  | "keep_current"
  | "use_credits";

export interface ToolRecommendation {
  toolId: ToolId;
  currentMonthlySpendUsd: number;
  recommendedAction: AuditAction;
  recommendedPlanOrTool: string;
  estimatedMonthlySavingsUsd: number;
  reason: string;
}

export interface AuditResult {
  teamSize: number;
  primaryUseCase: UseCase;
  totalCurrentMonthlySpendUsd: number;
  totalPotentialMonthlySavingsUsd: number;
  totalPotentialAnnualSavingsUsd: number;
  recommendations: ToolRecommendation[];
}

