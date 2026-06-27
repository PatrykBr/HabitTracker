"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { CalendarDays, ChartNoAxesColumnIncreasing, History, Home, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

import { AppRoutePrefetcher } from "@/components/app-route-prefetcher";
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
  const pathname = usePathname();
  const activeIndex = Math.max(
    0,
    navItems.findIndex((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
  const activeNavStyle = { "--active-index": activeIndex } as CSSProperties;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <AppRoutePrefetcher />
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r border-ink/10 px-5 py-6 lg:block">
          <div className="sticky top-6 space-y-8">
            <Link href="/dashboard" className="block">
              <p className="font-display text-3xl font-black leading-none tracking-[-0.04em]">Reset<br />Tracker</p>
              <p className="mt-3 text-sm text-ink/55">Private streak and reset logging.</p>
            </Link>
            <nav
              className="liquid-nav liquid-nav-vertical relative space-y-2 rounded-[1.75rem] border border-white/65 bg-white/55 p-2 shadow-[0_22px_70px_rgba(25,31,45,0.10)] backdrop-blur-2xl"
              style={activeNavStyle}
            >
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "liquid-nav-item group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-ink/65 transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/50",
                      isActive ? "text-ink shadow-[0_14px_34px_rgba(25,31,45,0.10)]" : "",
                    )}
                  >
                    <span className="liquid-nav-icon grid size-7 place-items-center rounded-full bg-white/35 text-ink/70 shadow-inner shadow-white/50 transition group-hover:text-ink">
                      <item.icon aria-hidden className="size-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <SignOutButton />
          </div>
        </aside>

        <nav
          className="liquid-nav liquid-nav-horizontal fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-[1.6rem] border border-white/65 bg-white/60 p-2 shadow-[0_18px_70px_rgba(25,31,45,0.16)] backdrop-blur-2xl lg:hidden"
          style={activeNavStyle}
        >
          <div className="grid grid-cols-5 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "liquid-nav-item group flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.68rem] font-semibold text-ink/60 transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/50",
                    isActive ? "text-ink shadow-[0_10px_28px_rgba(25,31,45,0.16)]" : "",
                  )}
                >
                  <span className="liquid-nav-icon grid size-6 place-items-center rounded-full bg-white/35 text-ink/70 shadow-inner shadow-white/50 transition group-hover:text-ink">
                    <item.icon aria-hidden className="size-5" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}
