import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Siren, ShieldHalf } from "lucide-react";

const AdminHome = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const types = ["yellow", "red", "women"] as const;
      const out: Record<string, number> = {};
      for (const t of types) {
        const { count } = await supabase
          .from("alerts")
          .select("id", { count: "exact", head: true })
          .eq("type", t)
          .eq("status", "pending");
        out[t] = count ?? 0;
      }
      setCounts(out);
    })();
  }, []);

  const sections = [
    { to: "/admin/yellow", title: "Yellow Alerts", desc: "Public services", icon: AlertTriangle, cls: "gradient-warning text-warning-foreground", count: counts.yellow ?? 0 },
    { to: "/admin/red", title: "Red Alerts", desc: "Crisis & disasters", icon: Siren, cls: "gradient-danger text-destructive-foreground", count: counts.red ?? 0 },
    { to: "/admin/women", title: "Women SOS", desc: "Safety alerts", icon: ShieldHalf, cls: "gradient-safety text-safety-foreground", count: counts.women ?? 0 },
  ];

  return (
    <AppShell title="Admin Dashboard">
      <h1 className="text-xl font-bold mb-1">Reviews queue</h1>
      <p className="text-sm text-muted-foreground mb-5">Review reports and publish solutions.</p>
      <div className="space-y-3">
        {sections.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className={`p-4 border-0 ${s.cls} flex items-center gap-3`}>
              <s.icon className="h-7 w-7" />
              <div className="flex-1">
                <p className="font-semibold">{s.title}</p>
                <p className="text-xs opacity-80">{s.desc}</p>
              </div>
              <Badge className="bg-background/30 text-current border-0">{s.count} pending</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
};

export default AdminHome;
