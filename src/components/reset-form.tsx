"use client";

import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import { useActionState } from "react";

import { resetHabitAction, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Label, TextArea } from "@/components/ui/card";

const initialState: ActionState = { ok: false, message: "" };

export function ResetForm({ habitId, compact = false }: { habitId: string; compact?: boolean }) {
  const [state, formAction, isPending] = useActionState(resetHabitAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="habitId" value={habitId} />

      <div className={compact ? "grid gap-3" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor="occurredAt">When did it happen?</Label>
          <Field id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="trigger">Trigger</Label>
          <Field id="trigger" name="trigger" placeholder="Stress, party, boredom…" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <TextArea id="note" name="note" placeholder="What happened right before it?" maxLength={360} />
      </div>

      {state.message ? (
        <p className={state.ok ? "text-sm font-medium text-ink" : "text-sm font-medium text-ember"}>{state.message}</p>
      ) : null}

      <Button type="submit" variant="ember" size={compact ? "md" : "lg"} disabled={isPending} className="w-full">
        <RotateCcw aria-hidden className="size-4" />
        {isPending ? "Recording…" : "Record a reset"}
      </Button>
    </form>
  );
}
