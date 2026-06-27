import { format } from "date-fns";

import { Card } from "@/components/ui/card";
import { calculateStats, getActiveHabitWithResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";
import { cn } from "@/lib/utils";

const weekdayOrder = [
  { index: 1, label: "Mon" },
  { index: 2, label: "Tue" },
  { index: 3, label: "Wed" },
  { index: 4, label: "Thu" },
  { index: 5, label: "Fri" },
  { index: 6, label: "Sat" },
  { index: 0, label: "Sun" },
];

const timeBuckets = [
  { label: "Late night", range: "12–5 AM", start: 0, end: 5 },
  { label: "Morning", range: "6–11 AM", start: 6, end: 11 },
  { label: "Afternoon", range: "12–5 PM", start: 12, end: 17 },
  { label: "Evening", range: "6–11 PM", start: 18, end: 23 },
];

export default async function StatsPage() {
  const user = await requireUser();
  const { habit, events } = await getActiveHabitWithResetEvents(user.id);

  if (!habit) {
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet/70">Stats</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">No habit yet.</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">Start one from Today to see streak, trend, and reset patterns.</p>
      </Card>
    );
  }

  const stats = calculateStats(habit, events);
  const now = new Date();
  const currentYear = now.getFullYear();
  const oldestReset = events.at(-1);
  const resetsThisYear = events.filter((event) => event.occurredAt.getFullYear() === currentYear).length;
  const maxStreak = Math.max(stats.currentDays, stats.longestDays, stats.averageStreakDays, 1);
  const maxTriggerCount = Math.max(...stats.commonTriggers.map((trigger) => trigger.count), 1);

  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  const hourCounts = Array.from({ length: 24 }, () => 0);
  const monthCounts = Array.from({ length: 12 }, () => 0);

  for (const event of events) {
    weekdayCounts[event.occurredAt.getDay()] += 1;
    hourCounts[event.occurredAt.getHours()] += 1;
    monthCounts[event.occurredAt.getMonth()] += 1;
  }

  const weekdayStats = weekdayOrder.map((day) => ({
    label: day.label,
    count: weekdayCounts[day.index],
  }));
  const bucketStats = timeBuckets.map((bucket) => ({
    ...bucket,
    count: hourCounts.slice(bucket.start, bucket.end + 1).reduce((sum, count) => sum + count, 0),
  }));
  const monthStats = monthCounts.map((count, index) => ({
    label: format(new Date(currentYear, index, 1), "MMM"),
    count,
  }));

  const topWeekday = getTopItem(weekdayStats);
  const topTimeBucket = getTopItem(bucketStats);
  const peakHour = hourCounts.reduce((bestHour, count, hour) => (count > hourCounts[bestHour] ? hour : bestHour), 0);
  const topTrigger = stats.commonTriggers[0];
  const maxWeekdayCount = Math.max(...weekdayStats.map((day) => day.count), 1);
  const maxBucketCount = Math.max(...bucketStats.map((bucket) => bucket.count), 1);
  const maxMonthCount = Math.max(...monthStats.map((month) => month.count), 1);
  const patternSummary = events.length === 0
    ? "Log resets with times and triggers to build a useful pattern map."
    : `${topWeekday.label}s and ${topTimeBucket.label.toLowerCase()} are your highest-risk windows.`;

  return (
    <div className="space-y-6">
        <header className="rounded-[2rem] border border-ink/10 bg-white/70 p-5 shadow-[0_18px_60px_rgba(25,31,45,0.06)] sm:p-6">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet/70">Stats</p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">Pattern board</h1>
              <p className="mt-3 text-base leading-7 text-ink/65">Streaks, reset volume, and the days or times that deserve extra planning.</p>
            </div>
            <p className="w-fit rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink/65 ring-1 ring-ink/10">
              {habit.name}
            </p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <HeroMetric label="Current streak" value={`${stats.currentDays}`} unit="days" detail={`${stats.currentHours} hours since the streak started.`} tone="ink" />
          <HeroMetric label="Longest ever" value={`${stats.longestDays}`} unit="days" detail="Your best clean run, including this streak if it is the record." tone="mint" />
          <HeroMetric label="Average streak" value={`${stats.averageStreakDays}`} unit="days" detail="Average completed streak between reset entries." tone="paper" />
          <HeroMetric label="Total resets" value={`${stats.totalResets}`} unit="logs" detail={oldestReset ? `Since ${format(oldestReset.occurredAt, "MMM d, yyyy")}.` : "No resets logged yet."} tone="paper" />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ink/55">Streak graph</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Current, longest, average</h2>
              </div>
              <p className="w-fit rounded-full bg-mint/35 px-3 py-1 text-xs font-black text-ink ring-1 ring-mint/50">
                {stats.milestoneProgress}% to {stats.nextMilestoneDays}d
              </p>
            </div>
            <div className="mt-6 space-y-5">
              <ComparisonBar label="Current" value={stats.currentDays} max={maxStreak} tone="mint" />
              <ComparisonBar label="Longest ever" value={stats.longestDays} max={maxStreak} tone="violet" />
              <ComparisonBar label="Average" value={stats.averageStreakDays} max={maxStreak} tone="fog" />
            </div>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-ink/10 p-5 sm:p-6">
              <p className="text-sm font-bold text-ink/55">Reset volume</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Week, month, year</h2>
              <p className="mt-2 text-sm leading-6 text-ink/60">Quick totals for how active the reset pattern is right now.</p>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
              <Readout label="This week" value={String(stats.resetsThisWeek)} detail="Last 7 days." />
              <Readout label="This month" value={String(stats.resetsThisMonth)} detail="Since the month began." />
              <Readout label="This year" value={String(resetsThisYear)} detail={`${currentYear} reset total.`} />
            </div>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink/55">Most common reset days</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{events.length ? `${topWeekday.label} is the highest-risk day` : "No weekday pattern yet"}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">{patternSummary}</p>
            <div className="mt-6 grid grid-cols-7 items-end gap-2 rounded-[1.5rem] bg-paper p-4 ring-1 ring-ink/10">
              {weekdayStats.map((day) => (
                <div key={day.label} className="flex flex-col justify-end gap-2">
                  <div className="flex h-36 items-end sm:h-44">
                    <div
                      className={cn(
                        "w-full rounded-t-2xl transition",
                        day.count === topWeekday.count && day.count > 0 ? "bg-ember" : "bg-mint",
                      )}
                      style={{ height: `${day.count === 0 ? 8 : Math.max(18, (day.count / maxWeekdayCount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-center text-xs font-black text-ink/45">{day.label}</p>
                  <p className="text-center text-sm font-black">{day.count}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink/55">Most common reset times</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{events.length ? `${topTimeBucket.label} stands out` : "No time pattern yet"}</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              {events.length ? `Peak logged hour: ${formatHour(peakHour)}.` : "Reset entries include a time, so this will fill in automatically."}
            </p>
            <div className="mt-6 space-y-3">
              {bucketStats.map((bucket) => (
                <PatternBar key={bucket.label} label={bucket.label} value={bucket.count} max={maxBucketCount} detail={bucket.range} highlight={bucket.count === topTimeBucket.count && bucket.count > 0} />
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink/55">Month graph</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Resets by calendar month</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">Totals combine every year of reset history, so each month reflects its all-time pattern.</p>
            <div className="mt-6 grid grid-cols-12 items-end gap-1.5 rounded-[1.5rem] bg-paper p-4 ring-1 ring-ink/10 sm:gap-2">
              {monthStats.map((month) => (
                <div key={month.label} className="flex flex-col justify-end gap-2">
                  <div className="flex h-28 items-end sm:h-36">
                    <div
                      className="w-full rounded-t-xl bg-violet"
                      style={{ height: `${month.count === 0 ? 6 : Math.max(16, (month.count / maxMonthCount) * 100)}%` }}
                    />
                  </div>
                  <p className="truncate text-center text-[0.6rem] font-black text-ink/40 sm:text-xs">{month.label}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <p className="text-sm font-bold text-ink/55">Trigger graph</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">Common triggers</h2>
            <p className="mt-2 text-sm leading-6 text-ink/60">
              {topTrigger ? `${topTrigger.trigger} appears most often. Plan around it first.` : "Add triggers when recording resets to see the reason behind the pattern."}
            </p>
            <div className="mt-6 space-y-4">
              {stats.commonTriggers.length ? stats.commonTriggers.map((trigger, index) => (
                <PatternBar key={trigger.trigger} label={trigger.trigger} value={trigger.count} max={maxTriggerCount} detail={`#${index + 1} trigger`} highlight={index === 0} />
              )) : <p className="rounded-[1.5rem] bg-paper p-4 text-sm text-ink/60">No triggers logged yet.</p>}
            </div>
          </Card>
        </section>
    </div>
  );
}

function getTopItem<T extends { count: number }>(items: T[]) {
  return items.reduce((best, item) => (item.count > best.count ? item : best), items[0]);
}

function formatHour(hour: number) {
  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function HeroMetric({ label, value, unit, detail, tone }: { label: string; value: string; unit: string; detail: string; tone: "ink" | "mint" | "paper" }) {
  return (
    <Card className={cn(
      "overflow-hidden p-5 sm:p-6",
      tone === "ink" ? "bg-ink text-paper" : tone === "mint" ? "bg-mint/40" : "bg-white/70",
    )}>
      <p className={cn("text-xs font-black uppercase tracking-[0.18em]", tone === "ink" ? "text-paper/45" : "text-ink/40")}>{label}</p>
      <div className="mt-4 flex items-end gap-3">
        <p className="font-display text-6xl font-black leading-[0.8] tracking-[-0.08em]">{value}</p>
        <p className={cn("pb-1 text-lg font-black", tone === "ink" ? "text-paper/70" : "text-ink/60")}>{unit}</p>
      </div>
      <p className={cn("mt-4 text-sm leading-6", tone === "ink" ? "text-paper/55" : "text-ink/60")}>{detail}</p>
    </Card>
  );
}

function Readout({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.5rem] bg-paper p-4 ring-1 ring-ink/10">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-ink/40">{label}</p>
      <p className="mt-2 text-4xl font-black tracking-[-0.06em]">{value}</p>
      <p className="mt-1 text-sm leading-6 text-ink/55">{detail}</p>
    </div>
  );
}

function PatternBar({ label, value, max, detail, highlight = false }: { label: string; value: number; max: number; detail: string; highlight?: boolean }) {
  return (
    <div className="rounded-[1.25rem] bg-paper p-4 ring-1 ring-ink/10">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black">{label}</p>
          <p className="text-xs font-semibold text-ink/45">{detail}</p>
        </div>
        <p className={cn("text-lg font-black", highlight ? "text-ember" : "text-ink")}>{value}</p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white ring-1 ring-ink/10">
        <div className={cn("h-full rounded-full", highlight ? "bg-ember" : "bg-mint")} style={{ width: `${value === 0 ? 0 : Math.max(8, (value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function ComparisonBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "mint" | "violet" | "fog" }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span>{label}</span>
        <span>{value} days</span>
      </div>
      <div className="mt-2 h-5 overflow-hidden rounded-full bg-paper ring-1 ring-ink/10">
        <div
          className={cn(
            "h-full rounded-full",
            tone === "mint" ? "bg-mint" : tone === "violet" ? "bg-violet" : "bg-fog",
          )}
          style={{ width: `${Math.max(6, (value / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
