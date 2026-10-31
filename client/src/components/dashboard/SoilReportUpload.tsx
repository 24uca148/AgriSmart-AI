import { useRef, useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { useCurrentUser, useUploadSoilReport } from "@/hooks/use-auth";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024; // reject absurdly large source files outright
const MAX_DIMENSION = 1600; // downscale so the uploaded data URI stays well under the server's 8mb limit

// Reads an image file, downsizes it to at most MAX_DIMENSION on its longest
// side, and re-encodes as JPEG — keeps a phone photo (often several MB)
// down to a few hundred KB before it's sent as a base64 data URI.
function resizeImageToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read the image"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function SoilReportUpload() {
  const { data: currentUser } = useCurrentUser();
  const upload = useUploadSoilReport();
  const { t } = useLanguage();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);

  const existingImage = previewUrl ?? currentUser?.soilReportImage ?? null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: t("invalidImageFile"), variant: "destructive" });
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      toast({ title: t("imageTooLarge"), variant: "destructive" });
      return;
    }

    try {
      const dataUri = await resizeImageToDataUri(file);
      setPreviewUrl(dataUri);
      setJustUploaded(false);
      await upload.mutateAsync({ image: dataUri });
      setJustUploaded(true);
    } catch (err) {
      // useUploadSoilReport already toasts on server-side failure; this
      // catches local read/resize errors too.
      if (!(err instanceof Error && err.message.includes("upload"))) {
        toast({
          title: t("invalidImageFile"),
          description: err instanceof Error ? err.message : undefined,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-border/60 bg-background/40 p-4 space-y-3">
      <div className="flex items-center space-x-2 text-primary">
        <Camera className="w-5 h-5" />
        <h3 className="font-bold font-display text-sm text-foreground">{t("soilTestReport")}</h3>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-soil-report-file"
      />

      {existingImage ? (
        <div className="space-y-2">
          <img
            src={existingImage}
            alt={t("soilTestReport")}
            className="w-full max-h-48 object-contain rounded-lg border bg-white"
            data-testid="img-soil-report-preview"
          />
          <div className="flex items-center justify-between gap-2">
            {justUploaded && !upload.isPending && (
              <span className="text-xs text-primary flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("reportUploaded")}
              </span>
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={upload.isPending}
              className="ml-auto text-xs font-semibold text-primary hover:underline disabled:opacity-50"
              data-testid="button-change-soil-report"
            >
              {upload.isPending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("uploadingReport")}
                </span>
              ) : (
                t("changePhoto")
              )}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
          data-testid="button-upload-soil-report"
        >
          {upload.isPending ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">{t("uploadingReport")}</span>
            </>
          ) : (
            <>
              <Camera className="w-6 h-6" />
              <span className="text-sm font-medium">{t("uploadSoilReportPhoto")}</span>
            </>
          )}
        </button>
      )}

      <p className="text-xs text-muted-foreground text-center">{t("soilReportHint")}</p>
    </div>
  );
}
