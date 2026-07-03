import type { ActionState } from "@/app/actions";
import { cn } from "@/lib/utils";

export type FormMessage = { text: string; tone: "error" | "success" };

export const initialActionState: ActionState = { ok: false, message: "" };

/** Boxed status message for client-side auth flows (sign-in, password reset). */
export function StatusMessage({ message }: { message: FormMessage }) {
  return (
    <p className={cn(
      "rounded-2xl px-4 py-3 text-sm",
      message.tone === "error" ? "bg-ember/10 text-ember" : "bg-mint/35 text-ink/70",
    )}>
      {message.text}
    </p>
  );
}

/** Inline status text for server-action forms (habit, reset). */
export function ActionStatus({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p className={cn("text-sm font-medium", state.ok ? "text-ink" : "text-ember")}>
      {state.message}
    </p>
  );
}
