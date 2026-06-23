import Link from "next/link";
import { CalendarDays, ChartNoAxesColumnIncreasing, History, Home, Settings } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Today", icon: Home },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: ChartNoAxesColumnIncreasing },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r border-ink/10 px-5 py-6 lg:block">
          <div className="sticky top-6 space-y-8">
            <Link href="/dashboard" className="block">
              <p className="font-display text-3xl font-black leading-none tracking-[-0.04em]">Relapse<br />Ledger</p>
              <p className="mt-3 text-sm text-ink/55">A private record for getting free.</p>
            </Link>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-ink/65 transition hover:bg-white hover:text-ink">
                  <item.icon aria-hidden className="size-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <SignOutButton />
          </div>
        </aside>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">{children}</main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-40 rounded-[1.6rem] border border-ink/10 bg-white/90 p-2 shadow-[0_18px_70px_rgba(25,31,45,0.2)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-semibold text-ink/60 hover:bg-paper hover:text-ink")}>
              <item.icon aria-hidden className="size-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
