import { z } from "zod";

const toolIdSchema = z.enum([
  "cursor",
  "github_copilot",
  "claude",
  "chatgpt",
  "anthropic_api",
  "openai_api",
  "gemini",
  "windsurf",
]);

const planIdSchema = z.enum([
  "hobby",
  "pro",
  "business",
  "enterprise",
  "individual",
  "free",
  "plus",
  "team",
  "max",
  "ultra",
  "api",
]);

const useCaseSchema = z.enum(["coding", "writing", "data", "research", "mixed"]);

export const toolSpendInputSchema = z.object({
  toolId: toolIdSchema,
  planId: planIdSchema,
  monthlySpendUsd: z.number().nonnegative(),
  seats: z.number().int().min(1),
});

export const auditInputSchema = z.object({
  teamSize: z.number().int().min(1),
  primaryUseCase: useCaseSchema,
  tools: z.array(toolSpendInputSchema).min(1),
});

export type AuditInputDTO = z.infer<typeof auditInputSchema>;

