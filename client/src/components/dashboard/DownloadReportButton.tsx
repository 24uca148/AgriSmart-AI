import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/lib/i18n";
import { useCurrentUser } from "@/hooks/use-auth";
import type { PredictionResponse, PredictionsListResponse } from "@shared/schema";
import { generateFieldIntelligenceReport } from "@/lib/fieldReportPdf";

interface DownloadReportButtonProps {
  /** The current (latest) analysis shown in the Field Intelligence Overview section. */
  prediction: PredictionResponse;
  /** Full analysis history for this user, used to keep the report's chart data in sync. */
  predictions: PredictionsListResponse;
}

/**
 * "Download Report" action for the Field Intelligence Overview section.
 * Renders a PDF export of whatever analysis is currently on screen for the
 * signed-in user - no hardcoded values, no dependency on any other section
 * of the dashboard.
 */
export function DownloadReportButton({ prediction, predictions }: DownloadReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { data: currentUser } = useCurrentUser();

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      await generateFieldIntelligenceReport({
        prediction,
        predictions,
        farmerName: currentUser?.fullname,
        language,
      });
      toast({
        title: t("reportDownloaded"),
        description: t("reportDownloadedDesc"),
      });
    } catch (error) {
      console.error("Failed to generate field intelligence report:", error);
      toast({
        title: t("reportDownloadFailed"),
        description: t("reportDownloadFailedDesc"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      data-testid="button-download-report"
      className="w-full sm:w-auto shrink-0 gap-2 shadow-md shadow-primary/20"
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{isGenerating ? t("generatingReport") : t("downloadReport")}</span>
    </Button>
  );
}
