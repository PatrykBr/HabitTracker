import { format } from "date-fns";
import { Trash2 } from "lucide-react";

import { deleteResetAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getActiveHabit, getResetEvents } from "@/lib/habits";
import { requireUser } from "@/lib/session";

export default async function HistoryPage() {
  const user = await requireUser();
  const habit = await getActiveHabit(user.id);

  if (!habit) {
    return <AppShell><Card>No habit yet. Start one from Today.</Card></AppShell>;
  }

  const events = await getResetEvents(user.id, habit.id);

  return (
    <AppShell>
      <div className="space-y-6">
        <header>
          <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">History</p>
          <h1 className="mt-2 font-display text-5xl font-black tracking-[-0.06em]">Every reset recorded.</h1>
        </header>

        <Card>
          {events.length ? (
            <div className="divide-y divide-ink/10">
              {events.map((event) => (
                <article key={event.id} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black">{format(event.occurredAt, "EEEE, MMM d, yyyy")}</p>
                    <p className="mt-1 text-sm text-ink/55">{format(event.occurredAt, "h:mm a")}{event.trigger ? ` · ${event.trigger}` : ""}</p>
                    {event.note ? <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">{event.note}</p> : null}
                  </div>
                  <form action={deleteResetAction}>
                    <input type="hidden" name="resetId" value={event.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      <Trash2 aria-hidden className="size-4" />
                      Delete
                    </Button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-[1.5rem] bg-mint/35 p-4 text-sm text-ink/65">No resets logged yet.</p>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
