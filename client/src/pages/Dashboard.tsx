import { Sprout, Activity, Loader2, LogOut, ShieldCheck } from "lucide-react";
import { useLocation, Link } from "wouter";
import { usePredictions, } from "@/hooks/use-predictions";
import { useCurrentUser, useLogout } from "@/hooks/use-auth";
import { PredictionForm } from "@/components/dashboard/PredictionForm";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { PredictionCharts } from "@/components/dashboard/PredictionCharts";
import { DownloadReportButton } from "@/components/dashboard/DownloadReportButton";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n";

export default function Dashboard() {
  const { data: predictions, isLoading } = usePredictions();
  const { data: currentUser } = useCurrentUser();
  const logout = useLogout();
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout.mutateAsync();
    navigate("/login");
  };

  const latestPrediction = predictions && predictions.length > 0
    ? predictions[predictions.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/20 border-t-0 border-x-0 rounded-none px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/5 p-1 rounded-xl flex items-center justify-center">
            
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground leading-tight">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("tagline")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="mr-1" />
          

          {currentUser && (
            <>
              <span className="text-sm text-muted-foreground hidden md:inline ml-2">
                {t("hi")} <strong>{currentUser.fullname}</strong>
              </span>
              {currentUser.isAdmin && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="button-admin-panel">
                    <ShieldCheck className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">{t("adminPanelNav")}</span>
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{t("logOut")}</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        {/* Sidebar Form */}
        <aside className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0 border-r border-border/50 bg-white/40 backdrop-blur-sm z-10 md:overflow-y-auto">
          <div className="p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-display text-foreground">{t("newAnalysis")}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{t("newAnalysisSubtitle")}</p>
            </div>
            <PredictionForm />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* Header section for content */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold font-display text-foreground flex items-center gap-3">
                  {t("fieldIntelligenceOverview")}
                  {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </h2>
                <p className="text-muted-foreground mt-2">{t("fieldOverviewSubtitle")}</p>
              </div>

              {latestPrediction && (
                <div className="sm:flex-shrink-0">
                  <DownloadReportButton prediction={latestPrediction} predictions={predictions || []} />
                </div>
              )}
            </div>

            {/* Content States */}
            {isLoading ? (
              <div className="h-64 flex items-center justify-center glass-panel rounded-2xl">
                <div className="flex flex-col items-center text-muted-foreground space-y-4">
                  <Activity className="w-12 h-12 animate-pulse text-primary" />
                  <p className="font-medium font-display text-lg">{t("loadingAdvisory")}</p>
                </div>
              </div>
            ) : !latestPrediction ? (
              <div className="h-64 flex flex-col items-center justify-center glass-panel rounded-2xl border-dashed border-2">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
                  <Sprout className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold font-display text-foreground">{t("noAnalysesYet")}</h3>
                <p className="text-muted-foreground max-w-sm text-center mt-2">
                  {t("noAnalysesDesc")}
                </p>
              </div>
            ) : (
              <>
                <MetricCards prediction={latestPrediction} />
                <PredictionCharts predictions={predictions || []} />
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
