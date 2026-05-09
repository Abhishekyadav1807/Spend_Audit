import type { PlanId, ToolId } from "./types.js";

type PlanPriceMap = Partial<Record<PlanId, number>>;

export const TOOL_PLAN_PRICING_USD: Record<ToolId, PlanPriceMap> = {
  // Enterprise prices are often custom; we use conservative placeholders for comparisons.
  cursor: { hobby: 0, pro: 20, business: 40, enterprise: 80 },
  github_copilot: { individual: 10, business: 19, enterprise: 39 },
  claude: { free: 0, pro: 20, max: 100, team: 30, enterprise: 80, api: 30 },
  chatgpt: { free: 0, plus: 20, team: 30, enterprise: 80, api: 30 },
  anthropic_api: { api: 30 },
  openai_api: { api: 30 },
  gemini: { pro: 20, ultra: 250, api: 25 },
  windsurf: { free: 0, pro: 20, team: 40, enterprise: 80 },
};

export function getPlanSeatPrice(toolId: ToolId, planId: PlanId): number | null {
  const value = TOOL_PLAN_PRICING_USD[toolId][planId];
  return typeof value === "number" ? value : null;
}
