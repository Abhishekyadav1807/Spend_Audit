import { z } from "zod";
import { auditInputSchema } from "../audit/schema.js";

export const leadCaptureSchema = z.object({
  email: z.string().email(),
  companyName: z.string().max(120).optional().or(z.literal("")),
  role: z.string().max(120).optional().or(z.literal("")),
  teamSize: z.number().int().min(1).max(5000).optional(),
  honeypot: z.string().optional(),
  auditInput: auditInputSchema,
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;

