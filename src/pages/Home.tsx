import { Link } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AlertTriangle, Siren, ListChecks, CloudSun, Phone, ShieldHalf } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const tiles = [
  { to: "/alerts/yellow", label: "Yellow Alert", desc: "Public service issues", icon: AlertTriangle, cls: "gradient-warning text-warning-foreground" },
  { to: "/alerts/red", label: "Red Alert", desc: "Crisis & disasters", icon: Siren, cls: "gradient-danger text-destructive-foreground" },
  { to: "/response", label: "Response", desc: "Check status", icon: ListChecks, cls: "gradient-accent text-accent-foreground" },
  { to: "/weather", label: "Weather", desc: "NDMA alerts", icon: CloudSun, cls: "gradient-primary text-primary-foreground" },
  { to: "/emergency-calls", label: "Emergency", desc: "Quick dial", icon: Phone, cls: "bg-success text-success-foreground" },
  { to: "/alerts/women", label: "Women SOS", desc: "Live location", icon: ShieldHalf, cls: "gradient-safety text-safety-foreground" },
];

const Home = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [pending, setPending] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setName(data?.full_name?.split(" ")[0] ?? ""));
    supabase.from("alerts").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).eq("status", "pending")
      .then(({ count }) => setPending(count ?? 0));
  }, [user]);

  return (
    <AppShell title="Home">
      <section className="mb-5">
        <h1 className="text-2xl font-bold">Hello{name ? `, ${name}` : ""} 👋</h1>
        <p className="text-sm text-muted-foreground">
          {pending > 0 ? `${pending} report${pending > 1 ? "s" : ""} pending review` : "Stay alert, stay safe."}
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.to} to={t.to} className="block">
            <Card className={`relative overflow-hidden p-4 h-32 flex flex-col justify-between border-0 ${t.cls} shadow-card transition-transform active:scale-[0.98]`}>
              <t.icon className="h-7 w-7 opacity-90" />
              <div>
                <p className="font-semibold leading-tight">{t.label}</p>
                <p className="text-[11px] opacity-80">{t.desc}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </AppShell>
  );
};

export default Home;
