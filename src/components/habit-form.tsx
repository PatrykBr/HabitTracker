"use client";

import { format } from "date-fns";
import { useActionState } from "react";

import { saveHabitAction, type ActionState } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Label, TextArea } from "@/components/ui/card";
import { updateFormTimezoneOffset } from "@/lib/utils";

const initialState: ActionState = { ok: false, message: "" };

type HabitFormValue = {
  id: string;
  name: string;
  quitStartedAt: string;
  motivation: string;
  targetDays: number;
};

export function HabitForm({ habit }: { habit?: HabitFormValue | null }) {
  const [state, formAction, isPending] = useActionState(saveHabitAction, initialState);
  const quitStartedAt = habit ? new Date(habit.quitStartedAt) : new Date();

  return (
    <form action={formAction} onSubmit={(event) => updateFormTimezoneOffset(event.currentTarget, "quitStartedAt")} className="space-y-4">
      {habit ? <input type="hidden" name="habitId" value={habit.id} /> : null}
      <input type="hidden" name="timezoneOffset" value={new Date(quitStartedAt).getTimezoneOffset()} />

      <div className="space-y-2">
        <Label htmlFor="name">What are you tracking?</Label>
        <Field id="name" name="name" defaultValue={habit?.name ?? "Smoking"} required />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quitStartedAt">Tracking since</Label>
          <Field
            id="quitStartedAt"
            name="quitStartedAt"
            type="datetime-local"
            defaultValue={format(quitStartedAt, "yyyy-MM-dd'T'HH:mm")}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetDays">First target</Label>
          <Field id="targetDays" name="targetDays" type="number" min={1} max={3650} defaultValue={habit?.targetDays ?? 30} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="motivation">Motivation note</Label>
        <TextArea
          id="motivation"
          name="motivation"
          defaultValue={habit?.motivation ?? ""}
          maxLength={280}
        />
      </div>

      {state.message ? (
        <p className={state.ok ? "text-sm font-medium text-ink" : "text-sm font-medium text-ember"}>{state.message}</p>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? "Saving…" : habit ? "Save habit" : "Start tracking"}
      </Button>
    </form>
  );
}
