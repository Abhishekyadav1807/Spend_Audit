import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { auditInputSchema } from "./audit/schema.js";
import { runAudit } from "./audit/engine.js";
import { ensureTables, hasDatabase, pool } from "./db.js";
import { leadCaptureSchema } from "./lead/schema.js";
import { sendConfirmationEmail } from "./services/email.js";
import { shareRequestSchema } from "./share/schema.js";
import { summaryRequestSchema } from "./summary/schema.js";
import { generatePersonalizedSummary } from "./services/summary.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const requestWindowMs = 60_000;
const maxRequestsPerWindow = 30;
const ipRateMap = new Map<string, { count: number; windowStart: number }>();

function getPublicReportBaseUrl(req: express.Request): string {
  return (
    process.env.PUBLIC_REPORT_BASE_URL ||
    process.env.APP_BASE_URL ||
    `${req.protocol}://${req.get("host")}`
  ).replace(/\/$/, "");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  const now = Date.now();
  const ip = req.ip || "unknown";
  const existing = ipRateMap.get(ip);
  if (!existing || now - existing.windowStart > requestWindowMs) {
    ipRateMap.set(ip, { count: 1, windowStart: now });
    return next();
  }
  existing.count += 1;
  if (existing.count > maxRequestsPerWindow) {
    return res.status(429).json({ error: "Too many requests. Try again shortly." });
  }
  return next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "aispendaudit-api", hasDatabase });
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

app.post("/api/leads", async (req, res) => {
  const parsed = leadCaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid lead payload",
      details: parsed.error.flatten(),
    });
  }

  if (parsed.data.honeypot && parsed.data.honeypot.trim().length > 0) {
    return res.status(200).json({ ok: true });
  }

  const auditResult = runAudit(parsed.data.auditInput);

  if (pool) {
    await pool.query(
      `
        INSERT INTO leads (id, email, company_name, role, team_size)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        randomUUID(),
        parsed.data.email,
        parsed.data.companyName || null,
        parsed.data.role || null,
        parsed.data.teamSize || parsed.data.auditInput.teamSize,
      ]
    );
  }

  try {
    await sendConfirmationEmail({
      email: parsed.data.email,
      monthlySavingsUsd: auditResult.totalPotentialMonthlySavingsUsd,
      annualSavingsUsd: auditResult.totalPotentialAnnualSavingsUsd,
    });
  } catch (error) {
    console.warn("Email send failed:", error);
  }

  return res.json({ ok: true });
});

app.post("/api/share", async (req, res) => {
  const parsed = shareRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid share payload",
      details: parsed.error.flatten(),
    });
  }

  const id = randomUUID();
  const payload = {
    auditInput: parsed.data.auditInput,
    auditResult: parsed.data.auditResult,
    createdAt: new Date().toISOString(),
  };

  if (pool) {
    await pool.query("INSERT INTO shared_reports (id, payload) VALUES ($1, $2)", [id, payload]);
  }

  return res.json({ shareId: id, publicUrl: `${getPublicReportBaseUrl(req)}/r/${id}` });
});

app.post("/api/summary", async (req, res) => {
  const parsed = summaryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid summary payload",
      details: parsed.error.flatten(),
    });
  }
  const summary = await generatePersonalizedSummary(parsed.data);
  return res.json(summary);
});

app.get("/api/share/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: "Missing share id" });
  }
  if (!pool) {
    return res.status(503).json({ error: "Database unavailable" });
  }

  const result = await pool.query("SELECT payload FROM shared_reports WHERE id = $1 LIMIT 1", [id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "Share report not found" });
  }

  return res.json(result.rows[0].payload);
});

app.get("/r/:id", async (req, res) => {
  const { id } = req.params;
  if (!pool || !id) {
    return res.status(404).send("Report not available");
  }
  const result = await pool.query("SELECT payload FROM shared_reports WHERE id = $1 LIMIT 1", [id]);
  if (result.rowCount === 0) {
    return res.status(404).send("Report not found");
  }
  const payload = result.rows[0].payload as {
    auditResult: {
      totalCurrentMonthlySpendUsd: number;
      totalPotentialMonthlySavingsUsd: number;
      totalPotentialAnnualSavingsUsd: number;
      recommendations: Array<{
        toolId: string;
        currentMonthlySpendUsd: number;
        recommendedAction: string;
        recommendedPlanOrTool: string;
        estimatedMonthlySavingsUsd: number;
        reason: string;
      }>;
    };
  };
  const title = "AISpendAudit Report";
  const description = `Potential savings: $${payload.auditResult.totalPotentialMonthlySavingsUsd.toFixed(
    2
  )}/mo, $${payload.auditResult.totalPotentialAnnualSavingsUsd.toFixed(2)}/yr`;
  const publicUrl = `${getPublicReportBaseUrl(req)}/r/${id}`;
  const recommendationRows = payload.auditResult.recommendations
    .map(
      (rec) => `<li>
        <strong>${escapeHtml(rec.toolId)}</strong>
        <span>$${rec.currentMonthlySpendUsd.toFixed(2)} current -> ${escapeHtml(
          rec.recommendedAction
        )} (${escapeHtml(rec.recommendedPlanOrTool)})</span>
        <em>$${rec.estimatedMonthlySavingsUsd.toFixed(2)}/mo savings</em>
        <p>${escapeHtml(rec.reason)}</p>
      </li>`
    )
    .join("");
  res.setHeader("Content-Type", "text/html");
  return res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${publicUrl}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <style>
      body { margin: 0; font-family: Arial, sans-serif; background: #f6f7f1; color: #172019; }
      main { max-width: 920px; margin: 0 auto; padding: 40px 20px; }
      .hero { border-bottom: 1px solid #d8ddcf; padding-bottom: 24px; margin-bottom: 24px; }
      h1 { font-size: clamp(2rem, 7vw, 4rem); margin: 0 0 12px; }
      .savings { font-size: clamp(2rem, 6vw, 3.5rem); font-weight: 800; margin: 12px 0 0; }
      ul { list-style: none; padding: 0; display: grid; gap: 12px; }
      li { background: #fffdf6; border: 1px solid #d8ddcf; border-radius: 8px; padding: 16px; }
      li strong, li span, li em { display: block; }
      li p { margin-bottom: 0; color: #5b655d; }
      a { color: #163f31; font-weight: 800; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>${title}</h1>
        <p>${description}</p>
        <p class="savings">$${payload.auditResult.totalPotentialMonthlySavingsUsd.toFixed(2)}/mo</p>
        <p>$${payload.auditResult.totalCurrentMonthlySpendUsd.toFixed(2)} current monthly spend</p>
      </section>
      <h2>Public recommendations</h2>
      <ul>${recommendationRows}</ul>
      <p><a href="${escapeHtml(process.env.APP_BASE_URL || publicUrl)}">Run your own audit</a></p>
    </main>
  </body>
</html>`);
});

async function startServer(): Promise<void> {
  await ensureTables();
  app.listen(port, () => {
    console.log(`AISpendAudit API running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
