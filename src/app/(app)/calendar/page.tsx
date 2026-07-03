import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isValid, startOfMonth, startOfWeek, subMonths } from "date-fns";
import Link from "next/link";

import { ResetForm } from "@/components/reset-form";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyHabitCard } from "@/components/ui/empty-habit-card";
import { getActiveHabit, getMonthResetMap, getResetEventsForHabit } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/session";

const weekdayLabels = [
  ["M", "Mon"],
  ["T", "Tue"],
  ["W", "Wed"],
  ["T", "Thu"],
  ["F", "Fri"],
  ["S", "Sat"],
  ["S", "Sun"],
] as const;

function parseMonthParam(month?: string) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return new Date();
  }

  const date = new Date(`${month}-01T00:00:00`);

  return isValid(date) ? date : new Date();
}

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const monthDate = parseMonthParam(params.month);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const habit = await getActiveHabit(user.id);

  if (!habit) {
    return <EmptyHabitCard eyebrow="Calendar" description="Start one from Today to review resets by day and month." />;
  }

  const events = await getResetEventsForHabit(user.id, habit.id, { start: monthStart, end: monthEnd });
  const resetMap = getMonthResetMap(events, monthDate);
  const gridDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });
  const previous = format(subMonths(monthDate, 1), "yyyy-MM");
  const next = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Calendar</p>
            <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.06em]">{format(monthDate, "MMMM yyyy")}</h1>
          </div>
          <div className="flex gap-2">
            <Link className={buttonClassName({ variant: "quiet" })} href={`/calendar?month=${previous}`}>Previous</Link>
            <Link className={buttonClassName({ variant: "quiet" })} href={`/calendar?month=${next}`}>Next</Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <Card className="p-3 sm:p-5">
            <div className="grid grid-cols-7 gap-1.5 text-center text-[0.62rem] font-black uppercase tracking-[0.12em] text-ink/40 sm:gap-2 sm:text-xs sm:tracking-[0.16em]">
              {weekdayLabels.map(([shortDay, day]) => (
                <span key={day}>
                  <span className="sm:hidden">{shortDay}</span>
                  <span className="hidden sm:inline">{day}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1.5 sm:mt-3 sm:gap-2">
              {gridDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = resetMap.get(key) ?? [];
                const hasReset = dayEvents.length > 0;

                return (
                  <div
                    key={key}
                    className={cn(
                      "aspect-square rounded-2xl border p-1.5 sm:aspect-auto sm:min-h-24 sm:p-2",
                      isSameMonth(day, monthDate) ? "border-ink/10 bg-paper" : "border-transparent bg-transparent text-ink/25",
                      hasReset ? "border-ember/40 bg-ember/10" : "",
                    )}
                  >
                    <div className="flex items-start justify-between gap-0.5 sm:gap-1">
                      <span className="text-sm font-black">{format(day, "d")}</span>
                      {hasReset ? <span className="min-w-4 rounded-full bg-ember px-1 py-0.5 text-center text-[0.58rem] font-black leading-none text-white sm:min-w-0 sm:px-2 sm:text-[0.65rem] sm:leading-normal">{dayEvents.length}</span> : null}
                    </div>
                    {hasReset ? (
                      <div className="mt-3 hidden space-y-1 sm:block">
                        {dayEvents.slice(0, 2).map((event) => (
                          <p key={event.id} className="truncate text-[0.68rem] font-semibold text-ember">{event.trigger || "Reset"}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Backdate a reset</h2>
            <p className="mt-1 text-sm leading-6 text-ink/55">If you forgot to log it in the moment, record it with the real date and stats will recalculate.</p>
            <div className="mt-5">
              <ResetForm habitId={habit.id} compact />
            </div>
          </Card>
        </section>
    </div>
  );
}
