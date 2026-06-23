import { ForgotPasswordForm } from "@/components/password-reset-forms";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Account recovery</p>
          <h1 className="font-display text-4xl font-black tracking-[-0.05em]">Reset your password.</h1>
          <p className="text-sm leading-6 text-ink/60">Enter your email and we will send a secure reset link if the account exists.</p>
        </div>
        <ForgotPasswordForm />
      </Card>
    </main>
  );
}
