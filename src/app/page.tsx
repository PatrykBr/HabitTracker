import Link from "next/link";
import { ArrowRight, CalendarDays, RotateCcw, ShieldCheck } from "lucide-react";

import { buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();

  return (
    <main className="min-h-screen px-5 py-6 text-ink sm:px-8 lg:px-12">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl content-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="space-y-7">
          <div className="inline-flex rounded-full border border-ink/10 bg-white/70 px-4 py-2 text-sm font-semibold text-ink/65 shadow-sm">
            Private reset and streak tracker
          </div>
          <div className="space-y-5">
            <h1 className="font-display text-6xl font-black leading-[0.9] tracking-[-0.06em] sm:text-7xl lg:text-8xl">
              Track resets without the noise.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-ink/65">
              Log resets, see streaks, and review patterns over time.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={session?.user ? "/dashboard" : "/sign-up"} className={buttonClassName({ size: "lg", className: "w-full sm:w-auto" })}>
              {session?.user ? "Open dashboard" : "Start tracking"}
              <ArrowRight aria-hidden className="size-4" />
            </Link>
            <Link href="/sign-in" className={buttonClassName({ variant: "quiet", size: "lg", className: "w-full sm:w-auto" })}>
              Sign in
            </Link>
          </div>
        </section>

        <Card className="relative overflow-hidden p-0">
          <div className="absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#a9d8c8,#f2eee3,#b84b3b)]" />
          <div className="space-y-6 p-6 sm:p-8">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-violet/70">Today</p>
            <div className="rounded-[2rem] bg-ink p-6 text-paper">
              <p className="text-sm text-paper/55">Stopped smoking since</p>
              <p className="mt-2 font-display text-7xl font-black leading-none tracking-[-0.08em]">4</p>
              <p className="mt-1 text-lg font-semibold">days</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { icon: RotateCcw, title: "Backdate resets", body: "Log the actual time when needed." },
                { icon: CalendarDays, title: "Calendar view", body: "Review resets by day and month." },
                { icon: ShieldCheck, title: "Progress stats", body: "Spot triggers and longest streaks." },
              ].map((item) => (
                <div key={item.title} className="rounded-3xl bg-paper p-4">
                  <item.icon aria-hidden className="size-5 text-ember" />
                  <p className="mt-3 text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-ink/55">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
