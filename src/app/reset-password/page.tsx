import Link from "next/link";

import { AuthPageCard } from "@/components/auth-page-card";
import { ResetPasswordForm } from "@/components/password-reset-forms";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <AuthPageCard
      eyebrow="Account recovery"
      title="Choose a new password."
      description="Use the reset link from your email to set a new password."
    >
      {token ? <ResetPasswordForm token={token} /> : (
        <div className="space-y-4">
          <p className="rounded-2xl bg-ember/10 px-4 py-3 text-sm text-ember">
            {error === "INVALID_TOKEN" ? "That reset link is invalid or expired." : "This reset link is missing a token."}
          </p>
          <Link className="font-semibold text-ink underline decoration-mint decoration-2 underline-offset-4" href="/forgot-password">
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthPageCard>
  );
}
