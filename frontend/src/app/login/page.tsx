import { LoginForm } from "@/components/dashboard/login-form";
import { Icons } from "@/components/icons";

export default function LoginPage() {
  return (
    <main className="auth-bg flex flex-col items-center justify-center px-4 py-20 pt-24">
      <div className="w-full max-w-md">
        <div className="auth-card p-8 sm:p-10">

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Icons.logo className="h-16 w-16 mb-4 rounded-xl" />
            <h1 className="text-2xl font-bold text-foreground mb-1">
              Login to{' '}
              <span className="gradient-text notranslate">Sahayak</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-7 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.35), transparent)' }} />

          <LoginForm />
        </div>
      </div>
    </main>
  );
}
