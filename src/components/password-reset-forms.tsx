"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type FormMessage = { text: string; tone: "error" | "success" };

function StatusMessage({ message }: { message: FormMessage }) {
  return (
    <p className={cn(
      "rounded-2xl px-4 py-3 text-sm",
      message.tone === "error" ? "bg-ember/10 text-ember" : "bg-mint/35 text-ink/70",
    )}>
      {message.text}
    </p>
  );
}

export function ForgotPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<FormMessage | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");

    setMessage(null);
    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (result.error) {
        setMessage({ text: result.error.message ?? "Could not request a reset link. Try again.", tone: "error" });
        return;
      }

      setMessage({ text: "If that email exists, a reset link has been sent.", tone: "success" });
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Field id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>

      {message ? <StatusMessage message={message} /> : null}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-ink/55">
        <Link className="font-semibold text-ink underline decoration-mint decoration-2 underline-offset-4" href="/sign-in">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<FormMessage | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newPassword = String(formData.get("password") ?? "");

    setMessage(null);
    startTransition(async () => {
      const result = await authClient.resetPassword({ newPassword, token });

      if (result.error) {
        setMessage({
          text: result.error.message ?? "Could not reset your password. Request a new link and try again.",
          tone: "error",
        });
        return;
      }

      setMessage({ text: "Password reset. Redirecting to sign in…", tone: "success" });
      router.push("/sign-in");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Field
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder="At least 8 characters"
          required
        />
      </div>

      {message ? <StatusMessage message={message} /> : null}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
