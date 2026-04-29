import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageAnalyzer, AnalysisResult } from "@/components/ImageAnalyzer";
import { LocationPicker } from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

interface Props {
  type: "yellow" | "red" | "women";
}

const meta = {
  yellow: {
    title: "Yellow Alert",
    sub: "Report public-service issues (potholes, garbage, outages)",
    btnVariant: "warning" as const,
    btnLabel: "Submit Report",
    useMap: true,
    useAddress: false,
    liveTrack: false,
  },
  red: {
    title: "Red Alert",
    sub: "Crisis & disasters — high priority",
    btnVariant: "danger" as const,
    btnLabel: "Send Red Alert",
    useMap: false,
    useAddress: true,
    liveTrack: false,
  },
  women: {
    title: "Women Safety SOS",
    sub: "Live-tracked panic alert",
    btnVariant: "safety" as const,
    btnLabel: "Send SOS",
    useMap: true,
    useAddress: false,
    liveTrack: true,
  },
};

export const AlertForm = ({ type }: Props) => {
  const m = meta[type];
  const { user } = useAuth();
  const nav = useNavigate();
  const [caption, setCaption] = useState("");
  const [address, setAddress] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!caption.trim()) return toast.error("Please add a caption");
    if (m.useAddress && !address.trim()) return toast.error("Please add an address");
    if (m.useMap && !coords) return toast.error("Please pick a location");

    setBusy(true);
    const { error } = await supabase.from("alerts").insert({
      user_id: user.id,
      type,
      caption: caption.trim().slice(0, 1000),
      image_url: imageUrl || null,
      address: m.useAddress ? address.trim().slice(0, 300) : null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      ai_verified: analysis?.verified ?? null,
      ai_category: analysis?.category ?? null,
      ai_description: analysis?.description ?? null,
      ai_confidence: analysis?.confidence ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report submitted. Stay safe.");
    nav("/response");
  };

  return (
    <AppShell title={m.title} back>
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-muted-foreground">{m.sub}</p>

        <div className="space-y-2">
          <Label>Photo</Label>
          <ImageAnalyzer
            alertType={type}
            caption={caption}
            onUploaded={setImageUrl}
            onAnalyzed={setAnalysis}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="caption">Caption</Label>
          <Textarea
            id="caption"
            placeholder="Describe what you see…"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={1000}
            rows={4}
            required
          />
        </div>

        {m.useAddress && (
          <div className="space-y-2">
            <Label htmlFor="addr">Address</Label>
            <Input
              id="addr"
              placeholder="Street, area, landmark…"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={300}
              required
            />
          </div>
        )}

        {m.useMap && (
          <div className="space-y-2">
            <Label>{m.liveTrack ? "Live location" : "Location"}</Label>
            <LocationPicker value={coords} onChange={setCoords} liveTrack={m.liveTrack} />
          </div>
        )}

        <Button type="submit" variant={m.btnVariant} size="xl" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Send />}
          {m.btnLabel}
        </Button>
      </form>
    </AppShell>
  );
};

export default AlertForm;
