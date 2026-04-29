import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck } from "lucide-react";

interface Alert {
  id: string;
  type: "yellow" | "red" | "women";
  caption: string | null;
  image_url: string | null;
  status: "pending" | "confirmed" | "received";
  address: string | null;
  created_at: string;
  alert_solutions?: { solution: string; safety_measure: string | null; created_at: string }[];
}

interface SafetyMeasure { id: string; title: string; content: string; category: string | null }

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/15 text-warning border-warning/30",
    confirmed: "bg-primary/15 text-primary border-primary/30",
    received: "bg-success/15 text-success border-success/30",
  };
  return map[s];
};

const Response = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [safety, setSafety] = useState<SafetyMeasure[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("alerts")
      .select("*, alert_solutions(solution, safety_measure, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAlerts((data as any) ?? []));
    supabase.from("safety_measures").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setSafety(data ?? []));
  }, [user]);

  const filtered = (s: string) => alerts.filter((a) => a.status === s);

  const renderList = (s: "pending" | "confirmed" | "received") => {
    const list = filtered(s);
    if (!list.length)
      return <p className="text-sm text-muted-foreground py-8 text-center">No {s} reports.</p>;
    return (
      <div className="space-y-3">
        {list.map((a) => (
          <Card key={a.id} className="p-3 flex gap-3">
            {a.image_url ? (
              <img src={a.image_url} alt="" className="h-16 w-16 rounded-md object-cover" />
            ) : (
              <div className="h-16 w-16 rounded-md bg-secondary grid place-items-center text-xs text-muted-foreground">No img</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={`capitalize ${statusBadge(a.status)}`}>
                  {a.type}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm mt-1 line-clamp-2">{a.caption}</p>
              {a.address && <p className="text-xs text-muted-foreground mt-0.5 truncate">📍 {a.address}</p>}
              {a.alert_solutions?.[0] && (
                <Card className="mt-2 p-2 bg-success/10 border-success/30">
                  <p className="text-xs font-medium text-success">Admin solution</p>
                  <p className="text-xs">{a.alert_solutions[0].solution}</p>
                </Card>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AppShell title="Response">
      <Tabs defaultValue="pending">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">{renderList("pending")}</TabsContent>
        <TabsContent value="confirmed" className="mt-4">{renderList("confirmed")}</TabsContent>
        <TabsContent value="received" className="mt-4">{renderList("received")}</TabsContent>
      </Tabs>

      <section className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4 w-4 text-accent" />
          <h2 className="font-semibold">Safety Measures</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {safety.map((s) => (
            <AccordionItem key={s.id} value={s.id} className="border rounded-lg px-3">
              <AccordionTrigger className="text-sm">{s.title}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{s.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </AppShell>
  );
};

export default Response;
