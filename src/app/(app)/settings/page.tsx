import { HabitForm } from "@/components/habit-form";
import { SignOutButton } from "@/components/sign-out-button";
import { Card } from "@/components/ui/card";
import { getActiveHabitWithResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();
  const { habit } = await getActiveHabitWithResetEvents(user.id);
  const formHabit = habit
    ? {
        id: habit.id,
        name: habit.name,
        quitStartedAt: habit.quitStartedAt.toISOString(),
        motivation: habit.motivation,
        targetDays: habit.targetDays,
      }
    : null;

  return (
    <div className="space-y-6">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Settings</p>
          <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.06em]">Keep the record accurate.</h1>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
          <Card>
            <h2 className="mb-5 text-xl font-black">Habit details</h2>
            <HabitForm habit={formHabit} />
          </Card>
          <Card>
            <h2 className="text-xl font-black">Account</h2>
            <p className="mt-2 text-sm leading-6 text-ink/55">Signed in as {user.email}. Your habits and reset history are scoped to this account.</p>
            <div className="mt-5"><SignOutButton /></div>
          </Card>
        </section>
    </div>
  );
}
