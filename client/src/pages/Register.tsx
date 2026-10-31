import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Sprout, Loader2, Eye, EyeOff } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useRegister, useCurrentUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCaptcha, CaptchaField } from "@/components/Captcha";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Register() {
  const [, navigate] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const register = useRegister();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const captcha = useCaptcha();
  const { t } = useLanguage();

  const [form, setForm] = useState({
    fullname: "",
    username: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (currentUser) {
    // PHASE 2 TODO: redirect admins to /admin once that panel is rebuilt.
    navigate("/dashboard", { replace: true });
    return null;
  }

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
      await register.mutateAsync({ ...form, captcha: captcha.value });
      // Registration also starts a session on the server, so refresh the
      // current-user cache and go straight to the dashboard — no need to
      // log in again.
      await queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      toast({
        title: "Account created",
        description: `Welcome, ${form.fullname}!`,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("registrationFailed"));
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
            <Sprout className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground leading-tight">
              {t("appName")}
            </h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t("tagline")}
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-bold font-display text-foreground mb-1">
          {t("createAccountTitle")}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">{t("registerSubtitle")}</p>

        {error && (
          <div className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullname">{t("fullName")}</Label>
            <Input
              id="fullname"
              value={form.fullname}
              onChange={update("fullname")}
              required
              data-testid="input-fullname"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="username">{t("username")}</Label>
            <Input
              id="username"
              value={form.username}
              onChange={update("username")}
              autoComplete="username"
              required
              data-testid="input-username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={update("email")}
              autoComplete="email"
              required
              data-testid="input-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile">{t("mobileNumber")}</Label>
            <Input
              id="mobile"
              type="tel"
              value={form.mobile}
              onChange={update("mobile")}
              autoComplete="tel"
              required
              data-testid="input-mobile"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("password")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={update("password")}
                autoComplete="new-password"
                required
                minLength={5}
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
            <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
                autoComplete="new-password"
                required
                minLength={5}
                className="pr-10"
                data-testid="input-confirm-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                data-testid="button-toggle-confirm-password"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
            disabled={register.isPending}
            data-testid="button-register"
          >
            {register.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("createAccount")}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
