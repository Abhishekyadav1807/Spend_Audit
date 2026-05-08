import { z } from "zod";
import { auditInputSchema } from "../audit/schema.js";

const recommendationSchema = z.object({
  toolId: z.string(),
  currentMonthlySpendUsd: z.number(),
  recommendedAction: z.string(),
  recommendedPlanOrTool: z.string(),
  estimatedMonthlySavingsUsd: z.number(),
  reason: z.string(),
});

const auditResultSchema = z.object({
  teamSize: z.number(),
  primaryUseCase: z.string(),
  totalCurrentMonthlySpendUsd: z.number(),
  totalPotentialMonthlySavingsUsd: z.number(),
  totalPotentialAnnualSavingsUsd: z.number(),
  recommendations: z.array(recommendationSchema),
});

export const shareRequestSchema = z.object({
  auditInput: auditInputSchema,
  auditResult: auditResultSchema,
});

export type ShareRequestInput = z.infer<typeof shareRequestSchema>;
