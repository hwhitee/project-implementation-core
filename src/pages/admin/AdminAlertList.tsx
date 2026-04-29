import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  type: "yellow" | "red" | "women";
  title: string;
}

interface Alert {
  id: string;
  user_id: string;
  caption: string | null;
  image_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "pending" | "confirmed" | "received";
  ai_verified: boolean | null;
  ai_category: string | null;
  ai_description: string | null;
  created_at: string;
}

export const AdminAlertList = ({ type, title }: Props) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase
      .from("alerts")
      .select("*")
      .eq("type", type)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAlerts((data as any) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [type]);

  return (
    <AppShell title={title}>
      <h1 className="text-xl font-bold mb-1">{title}</h1>
      <p className="text-sm text-muted-foreground mb-4">Newest first</p>

      {loading ? (
        <div className="text-center text-muted-foreground py-10"><Loader2 className="animate-spin mx-auto" /></div>
      ) : alerts.length === 0 ? (
        <p className="text-center text-muted-foreground py-10 text-sm">No reports yet.</p>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Card key={a.id} className="p-3 space-y-2">
              <div className="flex gap-3">
                {a.image_url ? (
                  <img src={a.image_url} alt="" className="h-20 w-20 rounded-md object-cover" />
                ) : (
                  <div className="h-20 w-20 rounded-md bg-secondary grid place-items-center text-xs">No img</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="capitalize">{a.status}</Badge>
                    {a.ai_verified === false && (
                      <Badge variant="outline" className="border-destructive/40 text-destructive">AI flagged</Badge>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{a.caption}</p>
                  {a.address && <p className="text-xs text-muted-foreground">📍 {a.address}</p>}
                  {a.latitude && (
                    <p className="text-xs text-muted-foreground">
                      📍 {a.latitude.toFixed(4)}, {a.longitude?.toFixed(4)}
                    </p>
                  )}
                  {a.ai_description && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">AI: {a.ai_description}</p>
                  )}
                </div>
              </div>
              <SolutionDialog alert={a} adminId={user!.id} onDone={load} />
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
};

const SolutionDialog = ({ alert, adminId, onDone }: { alert: Alert; adminId: string; onDone: () => void }) => {
  const [open, setOpen] = useState(false);
  const [solution, setSolution] = useState("");
  const [safety, setSafety] = useState("");
  const [status, setStatus] = useState<Alert["status"]>(alert.status);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!solution.trim()) return toast.error("Please add a solution");
    setBusy(true);
    const { error: solErr } = await supabase.from("alert_solutions").insert({
      alert_id: alert.id,
      admin_id: adminId,
      solution: solution.trim().slice(0, 2000),
      safety_measure: safety.trim().slice(0, 2000) || null,
    });
    if (solErr) { toast.error(solErr.message); setBusy(false); return; }

    const { error: upErr } = await supabase.from("alerts").update({ status }).eq("id", alert.id);
    if (upErr) { toast.error(upErr.message); setBusy(false); return; }

    await supabase.from("notifications").insert({
      user_id: alert.user_id,
      title: "Update on your report",
      message: solution.slice(0, 200),
      type: "solution",
      alert_id: alert.id,
    });
    setBusy(false);
    setOpen(false);
    toast.success("Solution published");
    onDone();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="hero" size="sm" className="w-full">Add solution / update status</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Respond to report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Solution</Label>
            <Textarea value={solution} onChange={(e) => setSolution(e.target.value)} rows={3} maxLength={2000} placeholder="What's being done…" />
          </div>
          <div className="space-y-1.5">
            <Label>Safety measure (optional)</Label>
            <Textarea value={safety} onChange={(e) => setSafety(e.target.value)} rows={2} maxLength={2000} placeholder="Advise the reporter…" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Alert["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="received">Received (resolved)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={submit} variant="hero" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />} Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAlertList;
