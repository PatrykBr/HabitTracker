import { AuthForm } from "@/components/auth-form";
import { AuthPageCard } from "@/components/auth-page-card";

export default function SignUpPage() {
  return (
    <AuthPageCard
      eyebrow="Start private"
      title="Make the first mark."
      description="Create an account, set the habit you are quitting, and record resets without judgement."
    >
      <AuthForm mode="sign-up" />
    </AuthPageCard>
  );
}
