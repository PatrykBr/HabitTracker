import { AuthForm } from "@/components/auth-form";
import { Card } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Start private</p>
          <h1 className="font-display text-4xl font-black tracking-[-0.05em]">Make the first mark.</h1>
          <p className="text-sm leading-6 text-ink/60">Create an account, set the habit you are quitting, and record resets without judgement.</p>
        </div>
        <AuthForm mode="sign-up" />
      </Card>
    </main>
  );
}
