import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { calculateStats, getActiveHabit, getResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";

export default async function StatsPage() {
  const user = await requireUser();
  const habit = await getActiveHabit(user.id);

  if (!habit) {
    return <AppShell><Card>No habit yet. Start one from Today.</Card></AppShell>;
  }

  const events = await getResetEvents(user.id, habit.id);
  const stats = calculateStats(habit, events);
  const statCards = [
    ["Current streak", `${stats.currentDays} days`, "The streak after your latest reset."],
    ["Longest streak", `${stats.longestDays} days`, "Your best clean run so far."],
    ["Average streak", `${stats.averageStreakDays} days`, "Average between completed resets."],
    ["Total resets", String(stats.totalResets), "Every reset you have logged."],
    ["This week", String(stats.resetsThisWeek), "Resets in the last seven days."],
    ["This month", String(stats.resetsThisMonth), "Resets since this month began."],
    ["Avoided days", `${stats.avoidedDays} days`, "Started days minus reset days."],
    ["Reset-free rate", `${stats.resetFreeRate}%`, "How often days stayed clean."],
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Stats</p>
          <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.06em]">Patterns, not shame.</h1>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([label, value, description]) => (
            <Card key={label} className="p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/40">{label}</p>
              <p className="mt-4 text-3xl font-black tracking-[-0.04em]">{value}</p>
              <p className="mt-2 text-sm leading-6 text-ink/55">{description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <h2 className="text-xl font-black">Trigger map</h2>
            <div className="mt-5 space-y-3">
              {stats.commonTriggers.length ? stats.commonTriggers.map((trigger) => (
                <div key={trigger.trigger}>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>{trigger.trigger}</span>
                    <span>{trigger.count}</span>
                  </div>
                  <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper">
                    <div className="h-full rounded-full bg-ember" style={{ width: `${Math.max(12, (trigger.count / stats.totalResets) * 100)}%` }} />
                  </div>
                </div>
              )) : <p className="rounded-[1.5rem] bg-paper p-4 text-sm text-ink/60">Add triggers when recording resets to see patterns here.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Next milestone</h2>
            <p className="mt-4 font-display text-6xl font-black tracking-[-0.08em]">{stats.nextMilestoneDays}</p>
            <p className="mt-2 text-sm text-ink/55">days is the next marker. You are {stats.milestoneProgress}% of the way there.</p>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-paper">
              <div className="h-full rounded-full bg-mint" style={{ width: `${stats.milestoneProgress}%` }} />
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
