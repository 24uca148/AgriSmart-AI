import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { PredictionResponse, PredictionsListResponse } from "@shared/schema";
import type { Language } from "@/lib/i18n";
import {
  pdfMetricLabels,
  pdfCrop,
  pdfPestRisk,
  pdfIrrigation,
  pdfYieldUnit,
} from "@/lib/pdfReportTranslations";

export interface GenerateFieldReportOptions {
  /** The latest prediction currently shown in the Field Intelligence Overview section. */
  prediction: PredictionResponse;
  /** Full prediction history, used only to confirm the charts being captured are populated. */
  predictions: PredictionsListResponse;
  /** Optional farmer name to personalize the report header. */
  farmerName?: string;
  /** Display language for the metric labels/values in the PDF. Defaults to English. */
  language?: Language;
}

// DOM ids applied to the two chart containers rendered inside
// PredictionCharts.tsx. Kept in one place so the button/report stay in sync
// with the dashboard markup.
const YIELD_CHART_ID = "report-yield-trend-chart";
const PEST_CHART_ID = "report-pest-risk-chart";

const BRAND = {
  primary: [21, 87, 52] as [number, number, number], // AgriSmart AI green
  primaryLight: [236, 245, 238] as [number, number, number],
  text: [31, 31, 31] as [number, number, number],
  muted: [110, 118, 112] as [number, number, number],
  border: [225, 230, 224] as [number, number, number],
};

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Captures a live DOM chart node (rendered by Recharts) into a PNG data URL
 * so the report always reflects whatever the dashboard is currently
 * displaying, rather than any hardcoded figure.
 */
async function captureChart(elementId: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  const el = document.getElementById(elementId);
  if (!el) return null;

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
  });

  return {
    dataUrl: canvas.toDataURL("image/png"),
    width: canvas.width,
    height: canvas.height,
  };
}

/**
 * jsPDF's built-in fonts have no Tamil glyphs and jsPDF cannot shape Tamil
 * (vowel-sign reordering, conjuncts). So for Tamil we let the browser shape
 * the text on a canvas and place the result in the PDF as a crisp image.
 */
const TAMIL_FONT_STACK = '"Noto Sans Tamil", "Nirmala UI", "Latha", "Tamil Sangam MN", "Noto Sans", sans-serif';
const TEXT_IMG_SCALE = 4; // canvas pixels per PDF point

function drawTamilText(
  doc: jsPDF,
  text: string,
  x: number,
  baselineY: number,
  opts: { fontSize: number; bold?: boolean; color: [number, number, number]; maxWidth: number; maxLines?: number },
) {
  const S = TEXT_IMG_SCALE;
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) return;
  const font = `${opts.bold ? "700" : "400"} ${opts.fontSize * S}px ${TAMIL_FONT_STACK}`;
  measure.font = font;

  // Word-wrap to maxWidth
  const maxPx = opts.maxWidth * S;
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(/\s+/)) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure.measureText(candidate).width > maxPx) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  const shown = lines.slice(0, opts.maxLines ?? 2);

  const lineHeightPt = opts.fontSize * 1.5;
  const ascentPt = opts.fontSize * 1.1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(maxPx);
  canvas.height = Math.ceil(shown.length * lineHeightPt * S);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.font = font;
  ctx.fillStyle = `rgb(${opts.color.join(",")})`;
  ctx.textBaseline = "alphabetic";
  shown.forEach((line, i) => ctx.fillText(line, 0, (i * lineHeightPt + ascentPt) * S));

  doc.addImage(
    canvas.toDataURL("image/png"),
    "PNG",
    x,
    baselineY - ascentPt,
    canvas.width / S,
    canvas.height / S,
  );
}

async function ensureTamilFontReady(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load(`400 12px ${TAMIL_FONT_STACK}`, "தமிழ்"),
      document.fonts.load(`700 12px ${TAMIL_FONT_STACK}`, "தமிழ்"),
    ]);
  } catch {
    // Fall back to whatever system font is available.
  }
}

function drawHeader(doc: jsPDF, prediction: PredictionResponse, farmerName?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 78, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("AgriSmart AI", 40, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Field Intelligence Report", 40, 52);

  doc.setFontSize(8.5);
  const rightX = pageWidth - 40;
  doc.text(`Analysis Date: ${formatDateTime(prediction.createdAt)}`, rightX, 30, { align: "right" });
  doc.text(`Generated: ${formatDateTime(new Date())}`, rightX, 42, { align: "right" });
  if (farmerName) {
    doc.text(`Farmer: ${farmerName}`, rightX, 54, { align: "right" });
  }

  doc.setTextColor(...BRAND.text);
}

function drawFooter(doc: jsPDF, pageNumber: number, pageCount: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...BRAND.border);
  doc.line(40, pageHeight - 34, pageWidth - 40, pageHeight - 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text("AgriSmart AI \u2014 Farmer Advisory System", 40, pageHeight - 20);
  doc.text(`Page ${pageNumber} of ${pageCount}`, pageWidth - 40, pageHeight - 20, { align: "right" });
  doc.setTextColor(...BRAND.text);
}

function drawSectionTitle(doc: jsPDF, title: string, x: number, y: number, width: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...BRAND.text);
  doc.text(title, x, y);
  doc.setDrawColor(...BRAND.border);
  doc.line(x, y + 8, x + width, y + 8);
}

/**
 * Generates and downloads a branded "Field Intelligence Report" PDF built
 * entirely from the prediction currently shown on the dashboard (no
 * hardcoded values), including live snapshots of the Yield Prediction Trend
 * and Pest Risk Distribution charts.
 */
export async function generateFieldIntelligenceReport(options: GenerateFieldReportOptions): Promise<void> {
  const { prediction, farmerName, language = "en" } = options;
  const isTamil = language === "ta";
  if (isTamil) await ensureTamilFontReady();

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  drawHeader(doc, prediction, farmerName);

  let y = 108;

  // --- Key Metrics -----------------------------------------------------
  drawSectionTitle(doc, "Key Metrics", margin, y, contentWidth);
  y += 26;

  const labels = pdfMetricLabels(language);
  const metrics: Array<{ label: string; value: string }> = isTamil
    ? [
        { label: labels.crop, value: pdfCrop(prediction.cropRecommendation, language) },
        { label: labels.yield, value: `${prediction.yieldPrediction.toFixed(2)} ${pdfYieldUnit(language)}` },
        { label: labels.pestRisk, value: pdfPestRisk(prediction.pestRisk, language) },
        { label: labels.irrigation, value: pdfIrrigation(prediction.irrigationGuidance, language) },
      ]
    : [
        { label: "Recommended Crop", value: capitalize(prediction.cropRecommendation) },
        { label: "Estimated Yield", value: `${prediction.yieldPrediction.toFixed(2)} t/ha` },
        { label: "Pest Risk Level", value: capitalize(prediction.pestRisk) },
        { label: "Irrigation Status", value: prediction.irrigationGuidance },
      ];

  const gap = 16;
  const colWidth = (contentWidth - gap) / 2;
  const rowHeight = 56;

  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (colWidth + gap);
    const boxY = y + row * (rowHeight + 14);

    doc.setFillColor(...BRAND.primaryLight);
    doc.roundedRect(x, boxY, colWidth, rowHeight, 8, 8, "F");

    if (isTamil) {
      drawTamilText(doc, metric.label, x + 14, boxY + 20, {
        fontSize: 8.5,
        color: BRAND.muted,
        maxWidth: colWidth - 28,
        maxLines: 1,
      });
      drawTamilText(doc, metric.value, x + 14, boxY + 38, {
        fontSize: 13,
        bold: true,
        color: BRAND.text,
        maxWidth: colWidth - 28,
        maxLines: 2,
      });
      return;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...BRAND.muted);
    doc.text(metric.label.toUpperCase(), x + 14, boxY + 20);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND.text);
    const valueLines = doc.splitTextToSize(metric.value, colWidth - 28);
    doc.text(valueLines.slice(0, 2), x + 14, boxY + 38);
  });

  y += 2 * (rowHeight + 14) + 12;

  // --- Charts ------------------------------------------------------------
  const chartSpecs: Array<{ id: string; title: string }> = [
    { id: YIELD_CHART_ID, title: "Yield Prediction Trend" },
    { id: PEST_CHART_ID, title: "Pest Risk Distribution" },
  ];

  let pageNumber = 1;
  const pageStack: number[] = [pageNumber];

  for (const spec of chartSpecs) {
    let captured;
    try {
      captured = await captureChart(spec.id);
    } catch (err) {
      captured = null;
    }

    // Reserve space for the section title plus a reasonable chart height.
    const titleBlock = 26;
    const maxImgWidth = contentWidth;
    const estimatedImgHeight = captured
      ? Math.min((captured.height / captured.width) * maxImgWidth, 260)
      : 0;
    const neededHeight = titleBlock + (captured ? estimatedImgHeight : 60) + 16;

    if (y + neededHeight > pageHeight - 50) {
      doc.addPage();
      pageNumber += 1;
      pageStack.push(pageNumber);
      y = 50;
    }

    drawSectionTitle(doc, spec.title, margin, y, contentWidth);
    y += titleBlock;

    if (captured) {
      const imgWidth = maxImgWidth;
      const imgHeight = Math.min((captured.height / captured.width) * imgWidth, 260);
      const drawWidth = imgHeight === 260 ? (captured.width / captured.height) * imgHeight : imgWidth;
      const drawX = margin + (maxImgWidth - drawWidth) / 2;
      doc.addImage(captured.dataUrl, "PNG", drawX, y, drawWidth, imgHeight);
      y += imgHeight + 20;
    } else {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.muted);
      doc.text("Chart data was not available at the time of export.", margin, y + 16);
      doc.setTextColor(...BRAND.text);
      y += 40;
    }
  }

  // Draw footers on every page now that the final page count is known.
  const totalPages = pageStack.length;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages);
  }

  const stamp = new Date(prediction.createdAt).toISOString().replace(/[:.]/g, "-");
  doc.save(`AgriSmart-Field-Intelligence-Report-${stamp}.pdf`);
}
