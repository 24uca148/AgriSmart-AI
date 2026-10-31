import { useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n";

// Characters chosen to avoid ambiguous look-alikes (0/O/o, 1/I/l/i) —
// mixes both uppercase and lowercase letters so the code isn't all-caps.
const CAPTCHA_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";

function generateCaptchaCode(length = 5): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CAPTCHA_CHARS[Math.floor(Math.random() * CAPTCHA_CHARS.length)];
  }
  return code;
}

/**
 * NOTE: this is a client-side-only visual captcha (no backend verification —
 * there's no captcha service wired up). It stops casual bots/typos on the
 * form, not a determined attacker. The generated code never leaves the
 * browser, so there's nothing for the server to check it against.
 */
export function useCaptcha() {
  const [code, setCode] = useState(() => generateCaptchaCode());
  const [value, setValue] = useState("");

  const refresh = useCallback(() => {
    setCode(generateCaptchaCode());
    setValue("");
  }, []);

  // Case-sensitive, exact match: the code shown is exactly what must be
  // typed (e.g. code "FG1" rejects "fg1"). Only leading/trailing
  // whitespace is trimmed.
  const isValid = value.trim() === code;

  return { code, value, setValue, refresh, isValid };
}

export function CaptchaField({
  code,
  value,
  onChange,
  onRefresh,
  error,
}: {
  code: string;
  value: string;
  onChange: (value: string) => void;
  onRefresh: () => void;
  error?: string | null;
}) {
  const { t } = useLanguage();

  return (
    <div className="space-y-1.5">
      <Label htmlFor="captcha">{t("securityCode")}</Label>
      <div className="flex items-stretch gap-3 rounded-lg border bg-muted/40 p-2">
        <div className="flex items-center gap-2 rounded-md bg-white/70 border px-3 select-none shrink-0">
          <span
            aria-hidden
            className="font-mono text-lg font-bold text-foreground/80"
            style={{
              letterSpacing: "0.3em",
              textDecoration: "line-through",
              textDecorationColor: "rgba(0,0,0,0.25)",
              textDecorationThickness: "1.5px",
              fontStyle: "italic",
            }}
            data-testid="text-captcha-code"
          >
            {code}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="text-primary hover:text-primary/70 transition-colors"
            aria-label={t("refreshCode")}
            data-testid="button-refresh-captcha"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <Input
          id="captcha"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("enterCode")}
          autoComplete="off"
          required
          className="flex-1 bg-white"
          data-testid="input-captcha"
        />
      </div>
      <span className="sr-only" role="status">
        Security code is {code.split("").join(" ")}
      </span>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
