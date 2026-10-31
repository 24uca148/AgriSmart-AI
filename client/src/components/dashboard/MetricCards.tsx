import { Sprout, TrendingUp, Bug, Droplets } from "lucide-react";
import type { PredictionResponse } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { translateCropName, translatePestRisk, translateIrrigationGuidance } from "@/lib/predictionTranslations";

interface MetricCardsProps {
  prediction: PredictionResponse;
}

export function MetricCards({ prediction }: MetricCardsProps) {
  const { t, language } = useLanguage();
  // Color logic stays keyed off the raw (English) backend value so it keeps
  // working regardless of display language.
  const pestRiskColor = 
    prediction.pestRisk.toLowerCase() === 'high' ? 'from-red-500 to-rose-600' :
    prediction.pestRisk.toLowerCase() === 'medium' ? 'from-amber-400 to-orange-500' :
    'from-emerald-400 to-green-600';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Crop Recommendation */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-green-800 p-6 text-white shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 group">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
          <Sprout className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-white/80 mb-4">
            <Sprout className="w-5 h-5" />
            <h3 className="font-medium tracking-wide text-sm uppercase">{t("recommendedCrop")}</h3>
          </div>
          <p className="text-3xl font-bold font-display capitalize">
            {translateCropName(prediction.cropRecommendation, language)}
          </p>
        </div>
      </div>

      {/* Yield Prediction */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 p-6 text-white shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/30 group">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
          <TrendingUp className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-white/80 mb-4">
            <TrendingUp className="w-5 h-5" />
            <h3 className="font-medium tracking-wide text-sm uppercase">{t("estYield")}</h3>
          </div>
          <p className="text-3xl font-bold font-display">
            {prediction.yieldPrediction.toFixed(2)} <span className="text-lg text-white/70 font-sans font-normal">{t("unitTonsPerHectare")}</span>
          </p>
        </div>
      </div>

      {/* Pest Risk */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${pestRiskColor} p-6 text-white shadow-xl shadow-black/10 transition-all hover:-translate-y-1 hover:shadow-2xl group`}>
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
          <Bug className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-white/80 mb-4">
            <Bug className="w-5 h-5" />
            <h3 className="font-medium tracking-wide text-sm uppercase">{t("pestRiskLevel")}</h3>
          </div>
          <p className="text-3xl font-bold font-display capitalize">
            {translatePestRisk(prediction.pestRisk, language)}
          </p>
        </div>
      </div>

      {/* Irrigation Guidance */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-600 p-6 text-white shadow-xl shadow-cyan-500/20 transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/30 group">
        <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12">
          <Droplets className="w-32 h-32" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-white/80 mb-4">
            <Droplets className="w-5 h-5" />
            <h3 className="font-medium tracking-wide text-sm uppercase">{t("irrigation")}</h3>
          </div>
          <p className="text-xl font-bold font-display leading-tight">
            {translateIrrigationGuidance(prediction.irrigationGuidance, language)}
          </p>
        </div>
      </div>
    </div>
  );
}
