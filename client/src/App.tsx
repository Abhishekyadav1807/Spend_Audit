import { useEffect, useMemo, useState } from "react";

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
interface LeadForm {
  email: string;
  companyName: string;
  role: string;
  teamSize?: number;
}

const STORAGE_KEY = "aispendaudit.form.v1";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

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

export function App() {
  const [form, setForm] = useState<AuditInput>(DEFAULT_FORM);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadStatus, setLeadStatus] = useState<string>("");
  const [shareUrl, setShareUrl] = useState<string>("");
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
      setShareUrl(`${window.location.origin}/r/${shareData.shareId}`);
      setLeadStatus("Saved. Confirmation email sent if email provider is configured.");
    } catch (saveError) {
      setLeadStatus(saveError instanceof Error ? saveError.message : "Failed to save report.");
    }
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>AISpendAudit</h1>
      <p style={{ marginTop: 0, color: "#444" }}>
        Enter your current AI stack to get a defensible spend optimization report.
      </p>

      <form onSubmit={handleSubmit} style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Spend Input</h2>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginBottom: 16 }}>
          <label>
            Team size
            <input
              type="number"
              min={1}
              value={form.teamSize}
              onChange={(e) => setForm((prev) => ({ ...prev, teamSize: Number(e.target.value) || 1 }))}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            />
          </label>

          <label>
            Primary use case
            <select
              value={form.primaryUseCase}
              onChange={(e) => setForm((prev) => ({ ...prev, primaryUseCase: e.target.value as UseCase }))}
              style={{ display: "block", width: "100%", marginTop: 4 }}
            >
              <option value="coding">Coding</option>
              <option value="writing">Writing</option>
              <option value="data">Data</option>
              <option value="research">Research</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </section>

        <h3>Tools</h3>
        {form.tools.map((tool, index) => (
          <div
            key={`${tool.toolId}-${index}`}
            style={{
              border: "1px solid #eee",
              borderRadius: 6,
              padding: "0.75rem",
              marginBottom: "0.75rem",
              display: "grid",
              gap: 8,
              gridTemplateColumns: "2fr 2fr 1fr 1fr auto",
              alignItems: "end",
            }}
          >
            <label>
              Tool
              <select
                value={tool.toolId}
                onChange={(e) => {
                  const nextTool = e.target.value as ToolId;
                  updateTool(index, {
                    toolId: nextTool,
                    planId: PLANS_BY_TOOL[nextTool][0],
                  });
                }}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              >
                {TOOL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Plan
              <select
                value={tool.planId}
                onChange={(e) => updateTool(index, { planId: e.target.value as PlanId })}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              >
                {PLANS_BY_TOOL[tool.toolId].map((plan) => (
                  <option key={plan} value={plan}>
                    {PLAN_LABELS[plan]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Spend/mo ($)
              <input
                type="number"
                min={0}
                step="0.01"
                value={tool.monthlySpendUsd}
                onChange={(e) =>
                  updateTool(index, { monthlySpendUsd: Number(e.target.value) >= 0 ? Number(e.target.value) : 0 })
                }
                style={{ display: "block", width: "100%", marginTop: 4 }}
              />
            </label>

            <label>
              Seats
              <input
                type="number"
                min={1}
                value={tool.seats}
                onChange={(e) => updateTool(index, { seats: Math.max(1, Number(e.target.value) || 1) })}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              />
            </label>

            <button
              type="button"
              onClick={() => removeTool(index)}
              disabled={form.tools.length === 1}
              style={{ height: 32 }}
            >
              Remove
            </button>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={addTool}>
            + Add Tool
          </button>
          <button type="submit" disabled={!canSubmit || loading}>
            {loading ? "Running audit..." : "Run Audit"}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ color: "#b00020", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {result && (
        <section style={{ marginTop: "1.5rem", border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
          <h2 style={{ marginTop: 0 }}>Audit Results</h2>
          <p>
            Current monthly spend: <strong>{formatUsd(result.totalCurrentMonthlySpendUsd)}</strong>
          </p>
          <p>
            Potential monthly savings: <strong>{formatUsd(result.totalPotentialMonthlySavingsUsd)}</strong>
          </p>
          <p>
            Potential annual savings: <strong>{formatUsd(result.totalPotentialAnnualSavingsUsd)}</strong>
          </p>

          <h3>Per-tool recommendations</h3>
          <ul>
            {result.recommendations.map((rec, index) => (
              <li key={`${rec.toolId}-${index}`} style={{ marginBottom: 8 }}>
                <strong>{TOOL_OPTIONS.find((x) => x.value === rec.toolId)?.label}:</strong>{" "}
                {formatUsd(rec.currentMonthlySpendUsd)} {"->"} {rec.recommendedAction} ({rec.recommendedPlanOrTool}),
                savings {formatUsd(rec.estimatedMonthlySavingsUsd)}. {rec.reason}
              </li>
            ))}
          </ul>

          <h3>Save Report</h3>
          <form onSubmit={handleLeadSubmit} style={{ display: "grid", gap: 8, maxWidth: 560 }}>
            <label>
              Email
              <input
                type="email"
                required
                value={leadForm.email}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, email: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              />
            </label>
            <label>
              Company name (optional)
              <input
                type="text"
                value={leadForm.companyName}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, companyName: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              />
            </label>
            <label>
              Role (optional)
              <input
                type="text"
                value={leadForm.role}
                onChange={(e) => setLeadForm((prev) => ({ ...prev, role: e.target.value }))}
                style={{ display: "block", width: "100%", marginTop: 4 }}
              />
            </label>
            <button type="submit">Save Report & Create Share Link</button>
          </form>
          {leadStatus && <p>{leadStatus}</p>}
          {shareUrl && (
            <p>
              Public share URL: <a href={shareUrl}>{shareUrl}</a>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
