import { Card } from "@/components/ui/card";

/** Shown on habit-scoped pages when the user has not started a habit yet. */
export function EmptyHabitCard({ eyebrow, description }: { eyebrow: string; description: string }) {
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-violet/70">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">No habit yet.</h1>
      <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
    </Card>
  );
}
