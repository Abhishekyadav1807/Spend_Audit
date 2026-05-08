interface ConfirmationEmailInput {
  email: string;
  monthlySavingsUsd: number;
  annualSavingsUsd: number;
}

export async function sendConfirmationEmail(input: ConfirmationEmailInput): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "no-reply@aispendaudit.local";

  if (!resendApiKey) {
    return;
  }

  const subject = "Your AISpendAudit report is ready";
  const html = `
    <p>Thanks for using AISpendAudit.</p>
    <p>Estimated potential savings:</p>
    <ul>
      <li>Monthly: $${input.monthlySavingsUsd.toFixed(2)}</li>
      <li>Annual: $${input.annualSavingsUsd.toFixed(2)}</li>
    </ul>
    <p>If your savings are high, Credex may reach out with additional discount opportunities.</p>
  `;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject,
      html,
    }),
  });
}

