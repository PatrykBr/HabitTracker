import { AuthPageCard } from "@/components/auth-page-card";
import { ForgotPasswordForm } from "@/components/password-reset-forms";

export default function ForgotPasswordPage() {
  return (
    <AuthPageCard
      eyebrow="Account recovery"
      title="Reset your password."
      description="Enter your email and we will send a secure reset link if the account exists."
    >
      <ForgotPasswordForm />
    </AuthPageCard>
  );
}
