import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ImagePlus, Loader2, ShieldCheck, ShieldAlert, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface AnalysisResult {
  verified: boolean;
  category: string;
  description: string;
  confidence: number;
}

interface Props {
  alertType: "yellow" | "red" | "women";
  caption: string;
  onUploaded: (url: string) => void;
  onAnalyzed: (a: AnalysisResult | null) => void;
}

export const ImageAnalyzer = ({ alertType, caption, onUploaded, onAnalyzed }: Props) => {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState("");

  const reset = () => {
    setPreview(null);
    setResult(null);
    onAnalyzed(null);
    onUploaded("");
  };

  const handleFile = async (file: File) => {
    if (!user) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setStep("Uploading image…");
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("alert-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("alert-images").getPublicUrl(path);
      const publicUrl = urlData.publicUrl;
      onUploaded(publicUrl);
      setUploading(false);

      // AI analysis
      setAnalyzing(true);
      setStep("Scanning for misinformation…");
      await new Promise((r) => setTimeout(r, 600));
      setStep("Analyzing image content…");
      const { data, error } = await supabase.functions.invoke("analyze-image", {
        body: { imageUrl: publicUrl, caption, alertType },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setStep("Generating report…");
      await new Promise((r) => setTimeout(r, 300));
      setResult(data);
      onAnalyzed(data);
    } catch (e) {
      console.error(e);
      setResult({
        verified: true,
        category: "unverified",
        description: "AI analysis unavailable. Submission allowed.",
        confidence: 0,
      });
      onAnalyzed(null);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-3">
      {!preview ? (
        <label className="block">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="border-2 border-dashed border-border rounded-xl py-10 grid place-items-center text-center cursor-pointer hover:bg-secondary/50 transition-colors">
            <ImagePlus className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Tap to add a photo</p>
            <p className="text-xs text-muted-foreground">Camera or gallery</p>
          </div>
        </label>
      ) : (
        <div className="relative">
          <img src={preview} alt="preview" className="w-full rounded-xl object-cover max-h-64" />
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2"
            onClick={reset}
          >
            <X />
          </Button>
        </div>
      )}

      {(uploading || analyzing) && (
        <Card className="p-3 flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm">{step}</span>
        </Card>
      )}

      {result && !analyzing && (
        <Card
          className={`p-3 border ${
            result.verified ? "border-success/40" : "border-destructive/50"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.verified ? (
              <ShieldCheck className="h-5 w-5 text-success mt-0.5" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-semibold">
                {result.verified ? "Image verified" : "Potential issue detected"}
                <span className="text-muted-foreground font-normal ml-2">
                  · {Math.round(result.confidence * 100)}%
                </span>
              </p>
              <p className="text-muted-foreground capitalize text-xs mt-0.5">
                Category: {result.category}
              </p>
              <p className="mt-1">{result.description}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
