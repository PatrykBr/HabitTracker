import { AuthForm } from "@/components/auth-form";
import { AuthPageCard } from "@/components/auth-page-card";

export default function SignInPage() {
  return (
    <AuthPageCard eyebrow="Reset Tracker" title="Welcome back." description="Sign in to view your tracker.">
      <AuthForm mode="sign-in" />
    </AuthPageCard>
  );
}
