import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, isValid, startOfMonth, startOfWeek, subMonths } from "date-fns";
import Link from "next/link";

import { ResetForm } from "@/components/reset-form";
import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveHabitWithResetEvents, getMonthResetMap } from "@/lib/habits";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/session";

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
  const { habit, events } = await getActiveHabitWithResetEvents(user.id);

  if (!habit) {
    return <Card>No habit yet. Start one from Today.</Card>;
  }

  const resetMap = getMonthResetMap(events, monthDate);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
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
          <Card>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase tracking-[0.16em] text-ink/40">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day) => <span key={day}>{day}</span>)}
            </div>
            <div className="mt-3 grid grid-cols-7 gap-2">
              {gridDays.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = resetMap.get(key) ?? [];
                const hasReset = dayEvents.length > 0;

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-20 rounded-2xl border p-2 sm:min-h-24",
                      isSameMonth(day, monthDate) ? "border-ink/10 bg-paper" : "border-transparent bg-transparent text-ink/25",
                      hasReset ? "border-ember/40 bg-ember/10" : "",
                    )}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm font-black">{format(day, "d")}</span>
                      {hasReset ? <span className="rounded-full bg-ember px-2 py-0.5 text-[0.65rem] font-black text-white">{dayEvents.length}</span> : null}
                    </div>
                    {hasReset ? (
                      <div className="mt-3 space-y-1">
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
