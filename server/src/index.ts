import "dotenv/config";
import express from "express";
import cors from "cors";
import { auditInputSchema } from "./audit/schema.js";
import { runAudit } from "./audit/engine.js";

const app = express();
const port = Number(process.env.PORT || 8080);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aispendaudit-api" });
});

app.post("/api/audit", (req, res) => {
  const parsed = auditInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid audit input",
      details: parsed.error.flatten(),
    });
  }

  const result = runAudit(parsed.data);
  return res.json(result);
});

app.listen(port, () => {
  // Keep startup log simple for local development.
  console.log(`AISpendAudit API running on port ${port}`);
});
