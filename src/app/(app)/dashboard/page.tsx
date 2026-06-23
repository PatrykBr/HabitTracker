import { format } from "date-fns";
import { Flame, Sparkles, Target } from "lucide-react";

import { HabitForm } from "@/components/habit-form";
import { ResetForm } from "@/components/reset-form";
import { Card } from "@/components/ui/card";
import { calculateStats, getActiveHabitWithResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ habit?: string }> }) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const { habit, events } = await getActiveHabitWithResetEvents(user.id, params.habit);

  if (!habit) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">First entry</p>
          <h1 className="mt-3 font-display text-5xl font-black tracking-[-0.06em]">What are you done with?</h1>
        </div>
        <Card>
          <HabitForm />
        </Card>
      </div>
    );
  }

  const stats = calculateStats(habit, events);
  const lastReset = events[0];

  return (
    <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Today</p>
            <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.06em] sm:text-6xl">{habit.name}</h1>
          </div>
          <p className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink/60 ring-1 ring-ink/10">
            Started {format(habit.quitStartedAt, "MMM d, yyyy")}
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="relative overflow-hidden bg-ink p-6 text-paper sm:p-8">
            <div className="absolute -right-12 -top-12 size-48 rounded-full bg-mint/15 blur-3xl" />
            <p className="text-sm font-semibold text-paper/55">Clean since last reset</p>
            <div className="mt-6 flex items-end gap-4">
              <p className="font-display text-[7rem] font-black leading-[0.75] tracking-[-0.1em] sm:text-[10rem]">{stats.currentDays}</p>
              <div className="pb-2">
                <p className="text-2xl font-black">days</p>
                <p className="text-sm text-paper/50">{stats.currentHours} hours total</p>
              </div>
            </div>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-paper/10">
              <div className="h-full rounded-full bg-mint" style={{ width: `${stats.milestoneProgress}%` }} />
            </div>
            <p className="mt-3 text-sm text-paper/55">{stats.milestoneProgress}% of the way to {stats.nextMilestoneDays} days.</p>
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-mint/45"><Sparkles aria-hidden className="size-5" /></span>
              <div>
                <p className="font-bold">Reason</p>
                <p className="text-sm text-ink/55">Keep this visible when cravings spike.</p>
              </div>
            </div>
            <blockquote className="rounded-[1.5rem] bg-paper p-4 text-lg font-semibold leading-8">“{habit.motivation || "I am choosing the next clean day."}”</blockquote>
            <div className="grid grid-cols-2 gap-3">
              <MiniStat icon={Flame} label="Longest" value={`${stats.longestDays}d`} />
              <MiniStat icon={Target} label="Reset-free" value={`${stats.resetFreeRate}%`} />
            </div>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="mb-4">
              <h2 className="text-xl font-black">Record a reset</h2>
              <p className="mt-1 text-sm leading-6 text-ink/55">Use the date field to backdate it if the slip happened earlier.</p>
            </div>
            <ResetForm habitId={habit.id} />
          </Card>

          <Card>
            <h2 className="text-xl font-black">Latest reset</h2>
            {lastReset ? (
              <div className="mt-4 rounded-[1.5rem] bg-paper p-4">
                <p className="font-semibold">{format(lastReset.occurredAt, "EEEE, MMM d 'at' h:mm a")}</p>
                <p className="mt-2 text-sm text-ink/60">{lastReset.trigger ? `Trigger: ${lastReset.trigger}` : "No trigger logged."}</p>
                {lastReset.note ? <p className="mt-3 text-sm leading-6 text-ink/70">{lastReset.note}</p> : null}
              </div>
            ) : (
              <p className="mt-4 rounded-[1.5rem] bg-mint/35 p-4 text-sm leading-6 text-ink/70">No resets yet. Your current streak is measured from your clean-since date.</p>
            )}
          </Card>
        </section>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-paper p-4">
      <Icon aria-hidden className="size-4 text-violet" />
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
    </div>
  );
}
