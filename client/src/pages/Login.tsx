import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Sprout, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useLogin, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCaptcha, CaptchaField } from "@/components/Captcha";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Login({ adminMode: initialAdminMode = false }: { adminMode?: boolean }) {
  const [, navigate] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const login = useLogin();
  const captcha = useCaptcha();
  const { t } = useLanguage();

  const [adminMode, setAdminMode] = useState(initialAdminMode);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (currentUser) {
    navigate(currentUser.isAdmin ? "/admin" : "/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaptchaError(null);

    if (!captcha.isValid) {
      setCaptchaError(t("captchaMismatch"));
      captcha.refresh();
      return;
    }

    try {
      await login.mutateAsync({ identifier, password, captcha: captcha.value, adminMode });
      navigate(adminMode ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginFailed"));
      captcha.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md glass-panel border border-white/20 rounded-2xl p-8 relative z-10 bg-white/60 backdrop-blur-sm shadow-lg">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-primary/5 p-2 rounded-xl flex items-center justify-center">
            {adminMode ? (
              <ShieldCheck className="w-7 h-7 text-primary" />
            ) : (
              <Sprout className="w-7 h-7 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground leading-tight">
              {t("appName")}
            </h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {adminMode ? t("adminSignInLabel") : t("tagline")}
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-display text-foreground mb-1">
          {adminMode ? t("adminSignInTitle") : t("welcomeBack")}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          {adminMode ? t("adminSignInSubtitle") : t("loginSubtitle")}
        </p>

        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="identifier">{t("usernameOrEmail")}</Label>
            <Input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              required
              data-testid="input-identifier"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="pr-10"
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <CaptchaField
            code={captcha.code}
            value={captcha.value}
            onChange={captcha.setValue}
            onRefresh={captcha.refresh}
            error={captchaError}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={login.isPending}
            data-testid="button-login"
          >
            {login.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : adminMode ? (
              t("signInAsAdmin")
            ) : (
              t("signIn")
            )}
          </Button>
        </form>

        <div className="text-sm text-muted-foreground mt-6 text-center space-y-2">
          {!adminMode && (
            <p>
              {t("dontHaveAccount")}{" "}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                {t("registerLink")}
              </Link>
            </p>
          )}
          <p>
            <button
              type="button"
              onClick={() => {
                setAdminMode((m) => !m);
                setError(null);
              }}
              className="text-primary font-semibold hover:underline"
              data-testid="button-toggle-admin-mode"
            >
              {adminMode ? t("farmerSignInHere") : t("adminSignInHere")}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
