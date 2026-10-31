import { Languages } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// Compact English/Tamil toggle. English is the default; switching to Tamil
// (and back) is remembered per-browser via localStorage (see lib/i18n.tsx).
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border bg-white/70 p-1 text-xs font-semibold ${className}`}
      role="group"
      aria-label={t("language")}
    >
      <Languages className="w-3.5 h-3.5 text-muted-foreground ml-1" aria-hidden />
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === "en"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={language === "en"}
        data-testid="button-language-en"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("ta")}
        className={`px-2 py-1 rounded-md transition-colors ${
          language === "ta"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        }`}
        aria-pressed={language === "ta"}
        data-testid="button-language-ta"
      >
        தமிழ்
      </button>
    </div>
  );
}
