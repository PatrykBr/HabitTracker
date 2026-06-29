import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/lib/session";

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  await requireUser();

  return <AppShell>{children}</AppShell>;
}
