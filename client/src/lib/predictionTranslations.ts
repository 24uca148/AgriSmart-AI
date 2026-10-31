import type { Language } from "@/lib/i18n";

// These maps cover every value the ML service / fallback heuristic can
// currently produce (see server/ml_service.py and the heuristic fallback in
// server/routes.ts). Lookups are case-insensitive and fall back to the
// original English text for anything not yet mapped, so a new crop or
// message added to the backend later never breaks the UI - it just shows in
// English until a Tamil entry is added here.

const CROP_NAME_TA: Record<string, string> = {
  rice: "நெல்",
  maize: "மக்காச்சோளம்",
  wheat: "கோதுமை",
  cotton: "பருத்தி",
  soybean: "சோயாபீன்",
};

const PEST_RISK_TA: Record<string, string> = {
  low: "குறைவு",
  medium: "மிதமான",
  high: "அதிகம்",
};

const IRRIGATION_GUIDANCE_TA: Record<string, string> = {
  "no irrigation needed. high rainfall detected.":
    "நீர்ப்பாசனம் தேவையில்லை. அதிக மழைப்பொழிவு கண்டறியப்பட்டுள்ளது.",
  "minimal irrigation required.": "குறைந்தபட்ச நீர்ப்பாசனம் தேவை.",
  "heavy irrigation required. very dry conditions.":
    "அதிக நீர்ப்பாசனம் தேவை. மிகவும் வறண்ட காலநிலை.",
  "moderate irrigation recommended.": "மிதமான நீர்ப்பாசனம் பரிந்துரைக்கப்படுகிறது.",
};

function lookup(map: Record<string, string>, value: string): string | undefined {
  return map[value.trim().toLowerCase()];
}

/** Translates a crop name (e.g. "Rice") for display. Returns the original value in English, or if no Tamil translation exists yet. */
export function translateCropName(cropName: string, language: Language): string {
  if (language !== "ta") return cropName;
  return lookup(CROP_NAME_TA, cropName) ?? cropName;
}

/** Translates a pest risk level (e.g. "High") for display. */
export function translatePestRisk(pestRisk: string, language: Language): string {
  if (language !== "ta") return pestRisk;
  return lookup(PEST_RISK_TA, pestRisk) ?? pestRisk;
}

/** Translates an irrigation guidance message for display. */
export function translateIrrigationGuidance(guidance: string, language: Language): string {
  if (language !== "ta") return guidance;
  return lookup(IRRIGATION_GUIDANCE_TA, guidance) ?? guidance;
}
