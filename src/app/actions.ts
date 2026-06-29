"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createHabit,
  createResetEvent,
  deleteResetEvent,
  updateHabit,
} from "@/lib/habits";
import { requireUser } from "@/lib/session";

const datetimeLocalPattern = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/;

function parseDateTimeLocal(value: unknown, timezoneOffset: unknown) {
  if (typeof value !== "string" || value === "") {
    return value;
  }

  const offset = typeof timezoneOffset === "string" ? Number(timezoneOffset) : NaN;
  const match = datetimeLocalPattern.exec(value);

  if (!Number.isFinite(offset) || !match) {
    return new Date(value);
  }

  const [, year, month, day, hour, minute, second = "0"] = match;

  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ) + offset * 60 * 1000,
  );
}

const habitSchema = z.object({
  habitId: z.string().optional(),
  name: z.string().trim().min(2, "Name the habit you are leaving behind."),
  quitStartedAt: z.date().refine((date) => date <= new Date(), "Use a clean-since date in the past or now."),
  motivation: z.string().trim().max(280).default(""),
  targetDays: z.coerce.number().int().min(1).max(3650).default(30),
});

const resetSchema = z.object({
  habitId: z.string().min(1),
  occurredAt: z.date().refine((date) => date <= new Date(), "Use a reset date in the past or now."),
  note: z.string().trim().max(360).optional(),
  trigger: z.string().trim().max(80).optional(),
});

export type ActionState = {
  ok: boolean;
  message: string;
};

const appPaths = ["/dashboard", "/calendar", "/history", "/stats", "/settings"];

function refreshApp() {
  for (const path of appPaths) {
    revalidatePath(path);
  }
}

export async function saveHabitAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = habitSchema.safeParse({
    ...raw,
    quitStartedAt: parseDateTimeLocal(raw.quitStartedAt, raw.timezoneOffset),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the habit details." };
  }

  const { habitId, ...habit } = parsed.data;

  try {
    if (habitId) {
      await updateHabit({ userId: user.id, habitId, ...habit });
    } else {
      await createHabit({ userId: user.id, ...habit });
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not save the habit." };
  }

  refreshApp();

  return { ok: true, message: habitId ? "Habit updated." : "Habit created." };
}

export async function resetHabitAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = resetSchema.safeParse({
    ...raw,
    occurredAt: raw.occurredAt ? parseDateTimeLocal(raw.occurredAt, raw.timezoneOffset) : new Date(),
    note: raw.note || undefined,
    trigger: raw.trigger || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the reset details." };
  }

  try {
    await createResetEvent({ userId: user.id, ...parsed.data });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Could not record the reset." };
  }

  refreshApp();

  return { ok: true, message: "Reset recorded. The streak has been recalculated." };
}

export async function deleteResetAction(formData: FormData) {
  const user = await requireUser();
  const resetId = z.string().min(1).parse(formData.get("resetId"));

  await deleteResetEvent({ userId: user.id, resetId });
  refreshApp();
}
