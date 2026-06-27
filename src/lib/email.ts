type AuthEmailInput = {
  to: string;
  url: string;
};

async function sendAuthEmail({
  to,
  subject,
  text,
  developmentMessage,
}: {
  to: string;
  subject: string;
  text: string;
  developmentMessage: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!resendApiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY and EMAIL_FROM are required to send auth emails.");
    }

    console.info(`${developmentMessage} Configure RESEND_API_KEY and EMAIL_FROM to send emails.`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to send auth email.");
  }
}

export async function sendPasswordResetEmail({ to, url }: AuthEmailInput) {
  await sendAuthEmail({
    to,
    subject: "Reset your Reset Tracker password",
    text: `Open this link to reset your Reset Tracker password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
    developmentMessage: `Password reset requested for ${to}. Development reset link: ${url}`,
  });
}

export async function sendVerificationEmail({ to, url }: AuthEmailInput) {
  await sendAuthEmail({
    to,
    subject: "Verify your Reset Tracker email",
    text: `Open this link to verify your Reset Tracker email address:\n\n${url}\n\nIf you did not create this account, you can ignore this email.`,
    developmentMessage: `Email verification requested for ${to}. Development verification link: ${url}`,
  });
}
