import { z } from "zod";
import { auditInputSchema } from "../audit/schema.js";
import { shareRequestSchema } from "../share/schema.js";

export const summaryRequestSchema = z.object({
  auditInput: auditInputSchema,
  auditResult: shareRequestSchema.shape.auditResult,
});

export type SummaryRequestInput = z.infer<typeof summaryRequestSchema>;

