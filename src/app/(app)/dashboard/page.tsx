import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { CalendarDays, Sparkles } from "lucide-react";
import Link from "next/link";

import { HabitForm } from "@/components/habit-form";
import { ResetForm } from "@/components/reset-form";
import { Card } from "@/components/ui/card";
import { calculateStats, getActiveHabitEventHistory } from "@/lib/habits";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ habit?: string }> }) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const { habit, events } = await getActiveHabitEventHistory(user.id, params.habit);

  if (!habit) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">First entry</p>
          <h1 className="mt-3 font-display text-5xl font-black tracking-[-0.06em]">What do you want to track?</h1>
        </div>
        <Card>
          <HabitForm />
        </Card>
      </div>
    );
  }

  const stats = calculateStats(habit, events);
  const lastReset = events[0];
  const today = new Date();
  const lastSevenDays = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const resetsByDay = new Map<string, typeof events>();

  for (const event of events) {
    const key = format(event.occurredAt, "yyyy-MM-dd");
    const dayEvents = resetsByDay.get(key) ?? [];

    dayEvents.push(event);
    resetsByDay.set(key, dayEvents);
  }

  const sevenDayResetCount = lastSevenDays.reduce(
    (count, day) => count + (resetsByDay.get(format(day, "yyyy-MM-dd"))?.length ?? 0),
    0,
  );
  const sevenDayCopy = sevenDayResetCount === 0
    ? "No resets logged in the last 7 days."
    : `${sevenDayResetCount} reset${sevenDayResetCount === 1 ? "" : "s"} logged across the last seven days.`;
  const daysUntilCopy = stats.daysUntilNextMilestone === 0
    ? "This marker has been reached."
    : `${stats.daysUntilNextMilestone} more day${stats.daysUntilNextMilestone === 1 ? "" : "s"} to reach ${stats.nextMilestoneDays} days.`;
  const trendCopy = stats.weeklyResetTrend === 0
    ? "Same as the previous seven days."
    : stats.weeklyResetTrend < 0
      ? `${Math.abs(stats.weeklyResetTrend)} fewer resets than the previous seven days.`
      : `${stats.weeklyResetTrend} more resets than the previous seven days.`;

  return (
    <div className="space-y-5">
        <section>
          <Card className="relative overflow-hidden bg-ink p-5 text-paper sm:p-8">
            <div className="absolute -right-16 -top-16 size-56 rounded-full bg-mint/15 blur-3xl" />
            <div className="relative space-y-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-paper/45">Current streak</p>
                  <h1 className="mt-2 font-display text-3xl font-black leading-none tracking-[-0.05em] sm:text-5xl">{habit.name}</h1>
                </div>
                <p className="w-fit rounded-full bg-paper/10 px-4 py-2 text-sm font-semibold text-paper/60 ring-1 ring-paper/10">
                  Started {format(habit.quitStartedAt, "MMM d, yyyy")}
                </p>
              </div>

              <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
                <p className="font-display text-[5rem] font-black leading-[0.78] tracking-[-0.09em] sm:text-[9rem]">{stats.currentDays}</p>
                <div className="pb-2">
                  <p className="text-3xl font-black tracking-[-0.04em]">days without reset</p>
                  <p className="mt-1 text-sm text-paper/55">{stats.currentHours} hours since the streak started.</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-paper/10 p-4 ring-1 ring-paper/10">
                <div className="flex items-center justify-between gap-3 text-sm font-semibold text-paper/70">
                  <span>Next marker: {stats.nextMilestoneDays} days</span>
                  <span>{stats.milestoneProgress}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-paper/10">
                  <div className="h-full rounded-full bg-mint" style={{ width: `${stats.milestoneProgress}%` }} />
                </div>
                <p className="mt-3 text-sm leading-6 text-paper/60">{daysUntilCopy}</p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Card className="overflow-hidden p-0">
            <div className="border-b border-ink/10 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-violet/70">
                    <CalendarDays aria-hidden className="size-4" />
                    Last 7 days
                  </div>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.04em] sm:text-2xl">{sevenDayCopy}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-mint/35 px-3 py-1 font-black text-ink ring-1 ring-mint/50">{stats.cleanDaysThisWeek}/7 clean</span>
                  <span className="rounded-full bg-paper px-3 py-1 font-semibold text-ink/60 ring-1 ring-ink/10">{trendCopy}</span>
                  <Link href="/calendar" className="font-black text-violet underline decoration-violet/25 underline-offset-4 hover:text-ink">
                    Calendar
                  </Link>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {lastSevenDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayEvents = resetsByDay.get(key) ?? [];
                  const resetCount = dayEvents.length;
                  const hasReset = resetCount > 0;

                  return (
                    <div key={key} className="min-w-0">
                      <div
                        className={cn(
                          "flex h-20 flex-col items-center justify-between rounded-2xl border p-2 text-center transition sm:h-24",
                          hasReset ? "border-ember/35 bg-ember/10" : "border-mint/50 bg-mint/30",
                          isSameDay(day, today) ? "ring-2 ring-violet/50" : "",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[0.6rem] font-black uppercase tracking-[0.12em] text-ink/45 sm:text-xs">{format(day, "EEE")}</p>
                          <p className="text-base font-black leading-none sm:text-xl">{format(day, "d")}</p>
                        </div>
                        <p className={cn("rounded-full px-2 py-1 text-[0.6rem] font-black sm:text-xs", hasReset ? "bg-ember/12 text-ember" : "bg-white/45 text-ink/50")}>
                          {hasReset ? resetCount : "✓"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Card className="border-ember/20 bg-white/90 p-5 shadow-[0_24px_80px_rgba(184,75,59,0.12)] sm:p-6">
            <div className="mb-5">
              <p className="text-sm font-bold text-ember/75">Log an entry</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Record a reset</h2>
              <p className="mt-2 text-sm leading-6 text-ink/65">Add the time, trigger, and a short note. This updates the streak and weekly readout.</p>
            </div>
            <ResetForm habitId={habit.id} />
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusTile label="Longest streak" value={`${stats.longestDays}d`} detail="Best run" />
            <StatusTile label="Reset-free rate" value={`${stats.resetFreeRate}%`} detail="All tracked days" />
            <StatusTile label="This week" value={`${stats.cleanDaysThisWeek}/7`} detail="Days without reset" />
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <Card className="p-5 sm:p-6">
              <p className="text-sm font-bold text-ink/55">Most recent reset</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Latest reset</h2>
              {lastReset ? (
                <div className="mt-4 rounded-[1.5rem] bg-paper p-4">
                  <p className="font-semibold">{format(lastReset.occurredAt, "EEEE, MMM d 'at' h:mm a")}</p>
                  <p className="mt-2 text-sm text-ink/60">{lastReset.trigger ? `Trigger: ${lastReset.trigger}` : "No trigger logged."}</p>
                  {lastReset.note ? <p className="mt-3 text-sm leading-6 text-ink/70">{lastReset.note}</p> : null}
                </div>
              ) : (
                <p className="mt-4 rounded-[1.5rem] bg-mint/35 p-4 text-sm leading-6 text-ink/70">No resets yet. Your current streak is measured from the tracking start date.</p>
              )}
            </Card>

            <Card className="space-y-4 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-mint/45"><Sparkles aria-hidden className="size-5" /></span>
                <div>
                  <p className="font-bold">Motivation note</p>
                  <p className="text-sm text-ink/55">Saved with this tracker.</p>
                </div>
              </div>
              <blockquote className="rounded-[1.5rem] bg-paper p-4 text-lg font-semibold leading-8 text-ink/85">“{habit.motivation || "No motivation note added yet."}”</blockquote>
            </Card>
          </div>
        </section>
    </div>
  );
}

function StatusTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-2xl bg-white/65 p-4 ring-1 ring-ink/10">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">{label}</p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-ink/50">{detail}</p>
    </div>
  );
}
