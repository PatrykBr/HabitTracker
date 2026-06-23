import Link from "next/link";

import { ResetPasswordForm } from "@/components/password-reset-forms";
import { Card } from "@/components/ui/card";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Account recovery</p>
          <h1 className="font-display text-4xl font-black tracking-[-0.05em]">Choose a new password.</h1>
          <p className="text-sm leading-6 text-ink/60">Use the reset link from your email to set a new password.</p>
        </div>

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
      </Card>
    </main>
  );
}
