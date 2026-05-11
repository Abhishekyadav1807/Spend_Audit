import { useEffect, useMemo, useState } from "react";
import "./App.css";

type ToolId =
  | "cursor"
  | "github_copilot"
  | "claude"
  | "chatgpt"
  | "anthropic_api"
  | "openai_api"
  | "gemini"
  | "windsurf";

type PlanId =
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

type UseCase = "coding" | "writing" | "data" | "research" | "mixed";

interface ToolSpendInput {
  toolId: ToolId;
  planId: PlanId;
  monthlySpendUsd: number;
  seats: number;
}

interface AuditInput {
  teamSize: number;
  primaryUseCase: UseCase;
  tools: ToolSpendInput[];
}

interface ToolRecommendation {
  toolId: ToolId;
  currentMonthlySpendUsd: number;
  recommendedAction: "downgrade_plan" | "switch_tool" | "keep_current" | "use_credits";
  recommendedPlanOrTool: string;
  estimatedMonthlySavingsUsd: number;
  reason: string;
}

interface AuditResult {
  teamSize?: number;
  primaryUseCase?: string;
  totalCurrentMonthlySpendUsd: number;
  totalPotentialMonthlySavingsUsd: number;
  totalPotentialAnnualSavingsUsd: number;
  recommendations: ToolRecommendation[];
}
interface SummaryResponse {
  text: string;
  model: string;
  usedFallback: boolean;
}
interface LeadForm {
  email: string;
  companyName: string;
  role: string;
  teamSize?: number;
}

const STORAGE_KEY = "aispendaudit.form.v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
const CONSULTATION_URL = import.meta.env.VITE_CONSULTATION_URL || "https://credex.rocks";

const TOOL_OPTIONS: Array<{ value: ToolId; label: string }> = [
  { value: "cursor", label: "Cursor" },
  { value: "github_copilot", label: "GitHub Copilot" },
  { value: "claude", label: "Claude" },
  { value: "chatgpt", label: "ChatGPT" },
  { value: "anthropic_api", label: "Anthropic API Direct" },
  { value: "openai_api", label: "OpenAI API Direct" },
  { value: "gemini", label: "Gemini" },
  { value: "windsurf", label: "Windsurf" },
];

const PLANS_BY_TOOL: Record<ToolId, PlanId[]> = {
  cursor: ["hobby", "pro", "business", "enterprise"],
  github_copilot: ["individual", "business", "enterprise"],
  claude: ["free", "pro", "max", "team", "enterprise", "api"],
  chatgpt: ["plus", "team", "enterprise", "api"],
  anthropic_api: ["api"],
  openai_api: ["api"],
  gemini: ["pro", "ultra", "api"],
  windsurf: ["free", "pro", "team", "enterprise"],
};

const PLAN_LABELS: Record<PlanId, string> = {
  hobby: "Hobby",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
  individual: "Individual",
  free: "Free",
  plus: "Plus",
  team: "Team",
  max: "Max",
  ultra: "Ultra",
  api: "API Direct",
};

const DEFAULT_FORM: AuditInput = {
  teamSize: 5,
  primaryUseCase: "coding",
  tools: [{ toolId: "cursor", planId: "pro", monthlySpendUsd: 20, seats: 1 }],
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function actionLabel(action: ToolRecommendation["recommendedAction"]): string {
  const labels: Record<ToolRecommendation["recommendedAction"], string> = {
    downgrade_plan: "Downgrade plan",
    switch_tool: "Switch tool",
    keep_current: "Keep current",
    use_credits: "Use credits",
  };
  return labels[action];
}

export function App() {
  const [form, setForm] = useState<AuditInput>(DEFAULT_FORM);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [leadForm, setLeadForm] = useState<LeadForm>({
    email: "",
    companyName: "",
    role: "",
    teamSize: DEFAULT_FORM.teamSize,
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as AuditInput;
      if (parsed && Array.isArray(parsed.tools) && parsed.tools.length > 0) {
        setForm(parsed);
      }
    } catch {
      // Ignore corrupted local state and keep defaults.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const canSubmit = useMemo(() => form.tools.length > 0 && form.teamSize > 0, [form]);

  function updateTool(index: number, updates: Partial<ToolSpendInput>) {
    setForm((prev) => {
      const nextTools = [...prev.tools];
      nextTools[index] = { ...nextTools[index], ...updates };
      return { ...prev, tools: nextTools };
    });
  }

  function addTool() {
    setForm((prev) => ({
      ...prev,
      tools: [...prev.tools, { toolId: "chatgpt", planId: "plus", monthlySpendUsd: 20, seats: 1 }],
    }));
  }

  function removeTool(index: number) {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Audit API failed. Check backend is running and try again.");
      }

      const data = (await response.json()) as AuditResult;
      setResult(data);
      const summaryResponse = await fetch(`${API_BASE_URL}/api/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditInput: form,
          auditResult: data,
        }),
      });
      if (summaryResponse.ok) {
        const summaryData = (await summaryResponse.json()) as SummaryResponse;
        setSummary(summaryData);
      } else {
        setSummary(null);
      }
      setLeadStatus("");
      setShareUrl("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!result) return;
    setLeadStatus("Saving...");
    try {
      const leadResponse = await fetch(`${API_BASE_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...leadForm,
          honeypot: "",
          auditInput: form,
        }),
      });
      if (!leadResponse.ok) {
        throw new Error("Lead save failed");
      }

      const shareResponse = await fetch(`${API_BASE_URL}/api/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auditInput: form,
          auditResult: result,
        }),
      });
      if (!shareResponse.ok) {
        throw new Error("Share link generation failed");
      }
      const shareData = (await shareResponse.json()) as { shareId: string; publicUrl: string };
      setShareUrl(shareData.publicUrl);
      setLeadStatus("Saved. Confirmation email sent if email provider is configured.");
    } catch (saveError) {
      setLeadStatus(saveError instanceof Error ? saveError.message : "Failed to save report.");
    }
  }

  const highSavings = (result?.totalPotentialMonthlySavingsUsd || 0) > 500;
  const lowSavings = result !== null && result.totalPotentialMonthlySavingsUsd < 100;

  return (
    <main className="app-shell">
      <section className="intro">
        <div>
          <p className="eyebrow">AI spend audit</p>
          <h1>AISpendAudit</h1>
          <p className="intro-copy">
            Enter the AI tools your team pays for and get an immediate, source-backed savings report.
          </p>
        </div>
        <div className="intro-stats" aria-label="Audit flow summary">
          <span>3 min audit</span>
          <span>No login</span>
          <span>Email after value</span>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="audit-panel">
        <div className="section-heading">
          <p className="eyebrow">Step 1</p>
          <h2>Current AI Stack</h2>
        </div>

        <section className="two-col">
          <label className="field">
            <span>Team size</span>
            <input
              type="number"
              min={1}
              value={form.teamSize}
              onChange={(e) => setForm((prev) => ({ ...prev, teamSize: Number(e.target.value) || 1 }))}
            />
          </label>

          <label className="field">
            <span>Primary use case</span>
            <select
              value={form.primaryUseCase}
              onChange={(e) => setForm((prev) => ({ ...prev, primaryUseCase: e.target.value as UseCase }))}
            >
              <option value="coding">Coding</option>
              <option value="writing">Writing</option>
              <option value="data">Data</option>
              <option value="research">Research</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </section>

        <div className="tool-header">
          <h3>Tools</h3>
          <button type="button" onClick={addTool} className="secondary-button">
            + Add tool
          </button>
        </div>
        {form.tools.map((tool, index) => (
          <div
            key={`${tool.toolId}-${index}`}
            className="tool-row"
          >
            <label className="field">
              <span>Tool</span>
              <select
                value={tool.toolId}
                onChange={(e) => {
                  const nextTool = e.target.value as ToolId;
                  updateTool(index, {
                    toolId: nextTool,
                    planId: PLANS_BY_TOOL[nextTool][0],
                  });
                }}
              >
                {TOOL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Plan</span>
              <select
                value={tool.planId}
                onChange={(e) => updateTool(index, { planId: e.target.value as PlanId })}
              >
                {PLANS_BY_TOOL[tool.toolId].map((plan) => (
                  <option key={plan} value={plan}>
                    {PLAN_LABELS[plan]}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Spend/mo ($)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={tool.monthlySpendUsd}
                onChange={(e) =>
                  updateTool(index, { monthlySpendUsd: Number(e.target.value) >= 0 ? Number(e.target.value) : 0 })
                }
              />
            </label>

            <label className="field">
              <span>Seats</span>
              <input
                type="number"
                min={1}
                value={tool.seats}
                onChange={(e) => updateTool(index, { seats: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>

            <button
              type="button"
              onClick={() => removeTool(index)}
              disabled={form.tools.length === 1}
              className="ghost-button"
            >
              Remove
            </button>
          </div>
        ))}

        <div className="form-actions">
          <button type="submit" disabled={!canSubmit || loading} className="primary-button">
            {loading ? "Running audit..." : "Run Audit"}
          </button>
        </div>
      </form>

      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

      {result && (
        <section className="results-panel">
          <div className="results-hero">
            <div>
              <p className="eyebrow">Audit result</p>
              <h2>{lowSavings ? "Your spend looks disciplined" : "Savings opportunity found"}</h2>
              <p className="result-note">
                {highSavings
                  ? "This audit crosses the threshold where Credex should be part of the savings conversation."
                  : lowSavings
                    ? "No forced savings here. The current stack looks mostly aligned with team size and use case."
                    : "These recommendations focus on plan fit, seat count, and discounted credit opportunities."}
              </p>
            </div>
            <div className="savings-card">
              <span>Potential savings</span>
              <strong>{formatUsd(result.totalPotentialMonthlySavingsUsd)}</strong>
              <small>{formatUsd(result.totalPotentialAnnualSavingsUsd)} per year</small>
            </div>
          </div>

          <div className="metric-grid">
            <div>
              <span>Current monthly spend</span>
              <strong>{formatUsd(result.totalCurrentMonthlySpendUsd)}</strong>
            </div>
            <div>
              <span>Team size</span>
              <strong>{form.teamSize}</strong>
            </div>
            <div>
              <span>Use case</span>
              <strong>{form.primaryUseCase}</strong>
            </div>
          </div>

          <div className="recommendations">
            <h3>Per-tool recommendations</h3>
            {result.recommendations.map((rec, index) => (
              <article key={`${rec.toolId}-${index}`} className="recommendation-row">
                <div>
                  <strong>{TOOL_OPTIONS.find((x) => x.value === rec.toolId)?.label}</strong>
                  <span>{actionLabel(rec.recommendedAction)}: {rec.recommendedPlanOrTool}</span>
                </div>
                <div>
                  <span>{formatUsd(rec.currentMonthlySpendUsd)} current</span>
                  <strong>{formatUsd(rec.estimatedMonthlySavingsUsd)} saved/mo</strong>
                </div>
                <p>{rec.reason}</p>
              </article>
            ))}
          </div>

          {summary && (
            <div className="summary-block">
              <h3>Personalized Summary</h3>
              <p>{summary.text}</p>
              <p className="summary-meta">
                Generated via {summary.model}
                {summary.usedFallback ? " (fallback template used)" : ""}.
              </p>
            </div>
          )}

          <div className="capture-panel">
            <div>
              <h3>{highSavings ? "Talk to Credex about credits" : "Save this report"}</h3>
              <p>
                {highSavings
                  ? "Your savings estimate is high enough to justify a deeper credit review."
                  : "Get the report link and a confirmation email after seeing the value."}
              </p>
            </div>
            <form onSubmit={handleLeadSubmit} className="lead-form">
              <label className="field">
                <span>Email</span>
              <input
                type="email"
                required
                value={leadForm.email}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
              />
            </label>
              <label className="field">
                <span>Company name (optional)</span>
              <input
                type="text"
                value={leadForm.companyName}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, companyName: e.target.value }))}
              />
            </label>
              <label className="field">
                <span>Role (optional)</span>
              <input
                type="text"
                value={leadForm.role}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, role: e.target.value }))}
              />
            </label>
              <button type="submit" className="primary-button">Save Report & Create Share Link</button>
              {highSavings && (
                <a className="consult-link" href={CONSULTATION_URL} target="_blank" rel="noreferrer">
                  Book Credex Consultation
                </a>
              )}
            </form>
          </div>
          {leadStatus && <p className="status-message">{leadStatus}</p>}
          {shareUrl && (
            <p className="share-link">
              Public share URL: <a href={shareUrl}>{shareUrl}</a>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
