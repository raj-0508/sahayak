import { SignupForm } from "@/components/dashboard/signup-form";
import { Icons } from "@/components/icons";

export default function SignupPage() {
  return (
    <main className="auth-bg flex flex-col items-center justify-center px-4 py-12 pt-24">
      <div className="w-full max-w-md">
        <div className="auth-card p-8 sm:p-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Icons.logo className="h-16 w-16 mb-4 rounded-xl" />
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Create an{' '}
              <span className="gradient-text">Account</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Join <span className="notranslate">Sahayak</span> today to get started.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-7 h-px"
               style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), transparent)' }} />

          <SignupForm />
        </div>
      </div>
    </main>
  );
}
