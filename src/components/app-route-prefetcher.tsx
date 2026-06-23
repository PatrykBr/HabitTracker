"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const appRoutes = ["/dashboard", "/calendar", "/stats", "/history", "/settings"];

export function AppRoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      appRoutes.forEach((route) => router.prefetch(route));
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [router]);

  return null;
}
