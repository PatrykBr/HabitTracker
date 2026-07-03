"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, Label } from "@/components/ui/card";
import { StatusMessage } from "@/components/ui/form-feedback";
import { useAuthForm } from "@/components/use-auth-form";
import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { isPending, message, submit } = useAuthForm();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "");
    const callbackURL = `${window.location.origin}/dashboard`;

    submit(
      () =>
        mode === "sign-up"
          ? authClient.signUp.email({ email, password, name, callbackURL })
          : authClient.signIn.email({ email, password, callbackURL }),
      {
        errorFallback: "That did not work. Check your details and try again.",
        successMessage:
          mode === "sign-up" ? "Check your email to verify your account before signing in." : undefined,
        onSuccess:
          mode === "sign-in"
            ? () => {
                router.push("/dashboard");
                router.refresh();
              }
            : undefined,
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "sign-up" ? (
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Field id="name" name="name" autoComplete="name" placeholder="Pat" required />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Field id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Field
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          minLength={8}
          placeholder="At least 8 characters"
          required
        />
      </div>

      {message ? <StatusMessage message={message} /> : null}

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Working…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink/55">
        {mode === "sign-up" ? "Already have an account? " : "New here? "}
        <Link className="font-semibold text-ink underline decoration-mint decoration-2 underline-offset-4" href={mode === "sign-up" ? "/sign-in" : "/sign-up"}>
          {mode === "sign-up" ? "Sign in" : "Create one"}
        </Link>
      </p>

      {mode === "sign-in" ? (
        <p className="text-center text-sm text-ink/55">
          <Link className="font-semibold text-ink underline decoration-mint decoration-2 underline-offset-4" href="/forgot-password">
            Forgot your password?
          </Link>
        </p>
      ) : null}
    </form>
  );
}
