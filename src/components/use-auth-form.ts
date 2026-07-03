"use client";

import { useState, useTransition } from "react";

import type { FormMessage } from "@/components/ui/form-feedback";

type AuthAction = () => Promise<{ error: { message?: string | null } | null }>;

type SubmitOptions = {
  errorFallback: string;
  successMessage?: string;
  onSuccess?: () => void;
};

/**
 * Shared state machine for better-auth client forms: tracks pending state and a
 * status message, and normalizes the run/error/success flow so each form only
 * has to describe its action and outcome.
 */
export function useAuthForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<FormMessage | null>(null);

  function submit(action: AuthAction, options: SubmitOptions) {
    setMessage(null);
    startTransition(async () => {
      const { error } = await action();

      if (error) {
        setMessage({ text: error.message ?? options.errorFallback, tone: "error" });
        return;
      }

      if (options.successMessage) {
        setMessage({ text: options.successMessage, tone: "success" });
      }

      options.onSuccess?.();
    });
  }

  return { isPending, message, submit };
}
