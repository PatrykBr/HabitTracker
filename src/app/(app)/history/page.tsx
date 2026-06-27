import { format } from "date-fns";
import { CalendarDays, Clock, NotebookText, Trash2 } from "lucide-react";

import { deleteResetAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveHabitWithResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";

export default async function HistoryPage() {
  const user = await requireUser();
  const { habit, events } = await getActiveHabitWithResetEvents(user.id);

  if (!habit) {
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet/70">History</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">No habit yet.</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">Start one from Today, then resets will appear here in order.</p>
      </Card>
    );
  }

  const latestReset = events[0];
  const oldestReset = events.at(-1);
  const resetsWithTriggers = events.filter((event) => event.trigger).length;
  const resetsWithNotes = events.filter((event) => event.note).length;
  const groupedEvents = events.reduce<Array<{ key: string; label: string; events: typeof events }>>((groups, event) => {
    const key = format(event.occurredAt, "yyyy-MM");
    const currentGroup = groups.at(-1);

    if (currentGroup?.key === key) {
      currentGroup.events.push(event);
    } else {
      groups.push({ key, label: format(event.occurredAt, "MMMM yyyy"), events: [event] });
    }

    return groups;
  }, []);

  return (
    <div className="space-y-6">
        <header className="rounded-[2rem] border border-ink/10 bg-white/70 p-4 shadow-[0_18px_60px_rgba(25,31,45,0.06)] sm:p-5">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-violet/70">History</p>
          <div className="mt-1 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="font-display text-3xl font-black leading-none tracking-[-0.05em] sm:text-5xl">Reset history</h1>
              <p className="mt-2 text-sm leading-6 text-ink/65">Newest first, grouped by month.</p>
            </div>
            <p className="w-fit rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink/65 ring-1 ring-ink/10">
              {habit.name}
            </p>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <HistoryStat icon={CalendarDays} label="Logged resets" value={String(events.length)} detail={oldestReset ? `Since ${format(oldestReset.occurredAt, "MMM d, yyyy")}` : "No resets logged yet."} />
          <HistoryStat icon={Clock} label="Latest reset" value={latestReset ? format(latestReset.occurredAt, "MMM d") : "None"} detail={latestReset ? format(latestReset.occurredAt, "h:mm a, yyyy") : "Your streak has no reset entries."} />
          <HistoryStat icon={NotebookText} label="Context added" value={`${resetsWithTriggers}/${events.length}`} detail={`${resetsWithNotes} reset${resetsWithNotes === 1 ? "" : "s"} include notes.`} />
        </section>

        <Card className="overflow-hidden p-0">
          <div className="flex flex-col gap-2 border-b border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="text-2xl font-black tracking-[-0.04em]">Reset log</h2>
              <p className="mt-1 text-sm leading-6 text-ink/60">Review patterns or delete a mistaken reset.</p>
            </div>
            <p className="w-fit rounded-full bg-paper px-3 py-1 text-xs font-black text-ink/50 ring-1 ring-ink/10">
              {events.length} total
            </p>
          </div>

          {events.length ? (
            <div className="divide-y divide-ink/10">
              {groupedEvents.map((group) => (
                <section key={group.key} className="p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-violet/70">{group.label}</h3>
                    <p className="rounded-full bg-paper px-3 py-1 text-xs font-black text-ink/50 ring-1 ring-ink/10">
                      {group.events.length} reset{group.events.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="divide-y divide-ink/10 overflow-hidden rounded-[1.25rem] bg-paper/65 ring-1 ring-ink/10">
                    {group.events.map((event) => (
                      <article key={event.id} className="grid gap-3 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
                        <time dateTime={event.occurredAt.toISOString()} className="flex items-center gap-2 text-sm sm:block">
                          <p className="font-black text-ink">{format(event.occurredAt, "MMM d")}</p>
                          <p className="text-xs font-semibold text-ink/45 sm:mt-1">{format(event.occurredAt, "EEE, h:mm a")}</p>
                        </time>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-ink/55 ring-1 ring-ink/10">
                              {event.trigger || "No trigger logged"}
                            </span>
                          </div>
                          {event.note ? (
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">{event.note}</p>
                          ) : null}
                        </div>

                        <form action={deleteResetAction}>
                          <input type="hidden" name="resetId" value={event.id} />
                          <Button type="submit" variant="ghost" size="sm" className="w-full text-ember hover:bg-ember/10 hover:text-ember sm:w-auto">
                            <Trash2 aria-hidden className="size-4" />
                            Delete
                          </Button>
                        </form>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="p-5 sm:p-6">
              <p className="rounded-[1.5rem] bg-mint/35 p-5 text-sm leading-6 text-ink/70">No resets logged yet. When you record one, it will appear here with its date, trigger, and note.</p>
            </div>
          )}
        </Card>
    </div>
  );
}

function HistoryStat({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: string; detail: string }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-paper ring-1 ring-ink/10">
        <Icon aria-hidden className="size-5 text-violet" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">{label}</p>
        <p className="mt-1 text-2xl font-black tracking-[-0.05em]">{value}</p>
        <p className="truncate text-sm text-ink/55">{detail}</p>
      </div>
    </Card>
  );
}
