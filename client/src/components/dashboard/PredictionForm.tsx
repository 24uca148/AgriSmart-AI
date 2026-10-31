import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPredictionSchema } from "@shared/schema";
import { z } from "zod";
import { FlaskConical, ThermometerSun, Droplets, CloudRain, Bug, Loader2 } from "lucide-react";
import { useCreatePrediction } from "@/hooks/use-predictions";
import { useLanguage } from "@/lib/i18n";
import { SoilReportUpload } from "./SoilReportUpload";

// Extend schema to coerce string inputs to numbers
const formSchema = insertPredictionSchema.extend({
  n: z.coerce.number().min(0, "Invalid value"),
  p: z.coerce.number().min(0, "Invalid value"),
  k: z.coerce.number().min(0, "Invalid value"),
  ph: z.coerce.number().min(0, "Min 0").max(14, "Max 14"),
  temperature: z.coerce.number(),
  humidity: z.coerce.number().min(0, "Min 0").max(100, "Max 100"),
  rainfall: z.coerce.number().min(0, "Invalid value"),
  historicalPests: z.coerce.number().min(0).max(10, "Scale 0-10"),
});

type FormValues = z.infer<typeof formSchema>;

// Display-only mapping from the numeric Historical Pests value (0-10, unchanged
// for the ML model) to a human-readable severity label.
//   0      -> None
//   1-3    -> Low
//   4-6    -> Medium
//   7-10   -> High
function getPestSeverityLabelKey(value: number): "pestLevelNone" | "pestLevelLow" | "pestLevelMedium" | "pestLevelHigh" {
  if (value <= 0) return "pestLevelNone";
  if (value <= 3) return "pestLevelLow";
  if (value <= 6) return "pestLevelMedium";
  return "pestLevelHigh";
}

export function PredictionForm() {
  const createPrediction = useCreatePrediction();
  const { t } = useLanguage();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      n: 90,
      p: 42,
      k: 43,
      ph: 6.5,
      temperature: 24.5,
      humidity: 65,
      rainfall: 140,
      historicalPests: 2,
    }
  });

  const historicalPestsValue = Number(watch("historicalPests"));
  const pestSeverityLabel = t(getPestSeverityLabelKey(historicalPestsValue));

  const onSubmit = (data: FormValues) => {
    createPrediction.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      {/* Soil Nutrients Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-primary">
          <FlaskConical className="w-5 h-5" />
          <h3 className="font-bold font-display text-lg">{t("soilProfile")}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("nitrogen")}</label>
            <input 
              {...register("n")} 
              type="number" step="any"
              className="w-full bg-background/50 border-2 border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="mg/kg"
            />
            {errors.n && <p className="text-xs text-destructive">{errors.n.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("phosphorus")}</label>
            <input 
              {...register("p")} 
              type="number" step="any"
              className="w-full bg-background/50 border-2 border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {errors.p && <p className="text-xs text-destructive">{errors.p.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("potassium")}</label>
            <input 
              {...register("k")} 
              type="number" step="any"
              className="w-full bg-background/50 border-2 border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {errors.k && <p className="text-xs text-destructive">{errors.k.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("phLevel")}</label>
            <input 
              {...register("ph")} 
              type="number" step="0.1"
              className="w-full bg-background/50 border-2 border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
            {errors.ph && <p className="text-xs text-destructive">{errors.ph.message}</p>}
          </div>
        </div>
      </div>

      <SoilReportUpload />

      <hr className="border-border/50" />

      {/* Environment Section */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-amber-500">
          <ThermometerSun className="w-5 h-5" />
          <h3 className="font-bold font-display text-lg text-foreground">{t("climateData")}</h3>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("temperature")}</label>
            <div className="relative">
              <ThermometerSun className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                {...register("temperature")} 
                type="number" step="any"
                className="w-full bg-background/50 border-2 border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all"
              />
            </div>
            {errors.temperature && <p className="text-xs text-destructive">{errors.temperature.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("humidity")}</label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  {...register("humidity")} 
                  type="number" step="any"
                  className="w-full bg-background/50 border-2 border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all"
                />
              </div>
              {errors.humidity && <p className="text-xs text-destructive">{errors.humidity.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("rainfall")}</label>
              <div className="relative">
                <CloudRain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  {...register("rainfall")} 
                  type="number" step="any"
                  className="w-full bg-background/50 border-2 border-border/50 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
              {errors.rainfall && <p className="text-xs text-destructive">{errors.rainfall.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* Pest Data */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-rose-500">
          <Bug className="w-5 h-5" />
          <h3 className="font-bold font-display text-lg text-foreground">{t("historicalPests")}</h3>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("pestSeverity")}</label>
            <span className="text-xs font-bold text-rose-500">
              {pestSeverityLabel} ({historicalPestsValue})
            </span>
          </div>
          <input 
            {...register("historicalPests")} 
            type="range" min="0" max="10" step="1"
            className="w-full accent-rose-500"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-medium">
            <span>{t("none0")}</span>
            <span>{t("severe10")}</span>
          </div>
          {errors.historicalPests && <p className="text-xs text-destructive">{errors.historicalPests.message}</p>}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={createPrediction.isPending}
        className="w-full flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-primary to-green-600 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
      >
        {createPrediction.isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t("analyzingData")}</span>
          </>
        ) : (
          <span>{t("runAiAnalysis")}</span>
        )}
      </button>

    </form>
  );
}
