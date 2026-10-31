import type { Language } from "@/lib/i18n";

// Tamil wording for the PDF report. Lookups are case-insensitive and fall
// back to the original English value for anything not mapped, so a new
// crop/message added to the backend never breaks PDF generation.

const LABELS_TA = {
  crop: "பயிர் பரிந்துரை",
  yield: "மதிப்பிடப்பட்ட மகசூல்",
  pestRisk: "பூச்சி அபாய நிலை",
  irrigation: "பாசன நிலை",
};

const LABELS_EN = {
  crop: "Recommended Crop",
  yield: "Estimated Yield",
  pestRisk: "Pest Risk Level",
  irrigation: "Irrigation Status",
};

const CROP_TA: Record<string, string> = {
  rice: "நெல்",
  maize: "மக்காச்சோளம்",
  wheat: "கோதுமை",
  cotton: "பருத்தி",
  soybean: "சோயாபீன்",
};

const PEST_RISK_TA: Record<string, string> = {
  low: "குறைவு",
  medium: "நடுத்தரம்",
  high: "அதிகம்",
};

const IRRIGATION_TA: Record<string, string> = {
  "no irrigation needed. high rainfall detected.":
    "பாசனம் தேவையில்லை. அதிக மழைப்பொழிவு கண்டறியப்பட்டுள்ளது.",
  "minimal irrigation required.": "குறைந்தபட்ச பாசனம் தேவை.",
  "heavy irrigation required. very dry conditions.": "அதிக பாசனம் தேவை. மிகவும் வறண்ட நிலை.",
  "moderate irrigation recommended.": "மிதமான பாசனம் பரிந்துரைக்கப்படுகிறது.",
};

const YIELD_UNIT = { en: "t/ha", ta: "டன்/ஹெக்டேர்" };

function lookup(map: Record<string, string>, value: string, language: Language): string {
  if (language !== "ta") return value;
  return map[value.trim().toLowerCase()] ?? value;
}

export const pdfMetricLabels = (language: Language) => (language === "ta" ? LABELS_TA : LABELS_EN);
export const pdfCrop = (v: string, l: Language) => lookup(CROP_TA, v, l);
export const pdfPestRisk = (v: string, l: Language) => lookup(PEST_RISK_TA, v, l);
export const pdfIrrigation = (v: string, l: Language) => lookup(IRRIGATION_TA, v, l);
export const pdfYieldUnit = (l: Language) => (l === "ta" ? YIELD_UNIT.ta : YIELD_UNIT.en);
