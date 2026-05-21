import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import ReactSignatureCanvas from "react-signature-canvas";
import { Check, Eraser, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SignatureCanvasProps = {
  label: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  className?: string;
};

const resizeSignatureImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Impossible de lire l'image."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Image de signature invalide."));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 900;
        const maxHeight = 320;
        const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));

        canvas.width = maxWidth;
        canvas.height = maxHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas indisponible."));
          return;
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, (maxWidth - width) / 2, (maxHeight - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const SignatureCanvas = ({ label, value, onChange, className }: SignatureCanvasProps) => {
  const signatureRef = useRef<ReactSignatureCanvas | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });

  useEffect(() => {
    setPreview(value ?? null);
  }, [value]);

  const syncCanvasSize = useCallback(() => {
    const shell = canvasShellRef.current;
    const pad = signatureRef.current;
    if (!shell || !pad) return;

    const canvas = pad.getCanvas();
    const width = Math.max(1, Math.round(shell.offsetWidth));
    const height = Math.max(1, Math.round(shell.offsetHeight));
    const previousSignature = pad.isEmpty() ? null : canvas.toDataURL("image/png");

    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    setCanvasSize({ width, height });
    pad.clear();

    if (previousSignature) {
      pad.fromDataURL(previousSignature, { width, height });
    }
  }, []);

  useEffect(() => {
    syncCanvasSize();

    const shell = canvasShellRef.current;
    if (!shell) return undefined;

    const resizeObserver = new ResizeObserver(() => {
      window.requestAnimationFrame(syncCanvasSize);
    });
    resizeObserver.observe(shell);
    window.addEventListener("orientationchange", syncCanvasSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("orientationchange", syncCanvasSize);
    };
  }, [syncCanvasSize]);

  const handleClear = () => {
    signatureRef.current?.clear();
    setPreview(null);
    onChange(null);
  };

  const handleSave = () => {
    const pad = signatureRef.current;
    if (!pad || pad.isEmpty()) {
      return;
    }

    syncCanvasSize();
    const dataUrl = pad.getCanvas().toDataURL("image/png");
    setPreview(dataUrl);
    onChange(dataUrl);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      onChange(preview);
      return;
    }

    resizeSignatureImage(file)
      .then((dataUrl) => {
        setPreview(dataUrl);
        onChange(dataUrl);
        signatureRef.current?.clear();
      })
      .catch(() => onChange(preview));
  };

  return (
    <div className={cn("space-y-3 rounded-2xl border border-border/80 bg-card p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">Signez directement ici ou téléversez une image.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleClear} className="rounded-full">
            <Eraser className="mr-2 h-3.5 w-3.5" /> Effacer
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <label>
              <ImagePlus className="mr-2 h-3.5 w-3.5" /> Image
              <input type="file" accept="image/png,image/jpeg" className="sr-only" onChange={handleUpload} />
            </label>
          </Button>
          <Button size="sm" onClick={handleSave} className="rounded-full">
            <Check className="mr-2 h-3.5 w-3.5" /> Sauvegarder
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border border-border/70 bg-white p-2 shadow-inner">
        <div ref={canvasShellRef} className="mx-auto h-48 w-full max-w-[920px] overflow-hidden rounded-xl bg-white sm:h-52">
          <ReactSignatureCanvas
            ref={signatureRef}
            clearOnResize={false}
            backgroundColor="rgb(255,255,255)"
            penColor="rgb(15, 23, 42)"
            minWidth={1.2}
            maxWidth={2.8}
            canvasProps={{
              width: canvasSize.width,
              height: canvasSize.height,
              className: "block touch-none select-none bg-white",
              style: {
                width: `${canvasSize.width}px`,
                height: `${canvasSize.height}px`,
                maxWidth: "100%",
                transform: "none",
              },
              "aria-label": `${label} zone de signature`,
            }}
            onEnd={handleSave}
          />
        </div>
      </div>
      {preview && (
        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Aperçu sauvegardé</p>
          <img src={preview} alt={`${label} sauvegardée`} className="h-20 max-w-full object-contain" />
        </div>
      )}
    </div>
  );
};
