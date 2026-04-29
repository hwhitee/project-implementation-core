import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Phone, Shield, Ambulance, Flame, HeartPulse, Baby } from "lucide-react";

const calls = [
  { name: "Disaster Management", number: "112", icon: Shield, cls: "text-primary" },
  { name: "Police", number: "100", icon: Shield, cls: "text-primary" },
  { name: "Ambulance", number: "108", icon: Ambulance, cls: "text-success" },
  { name: "Medical (alt)", number: "102", icon: HeartPulse, cls: "text-success" },
  { name: "Fire", number: "101", icon: Flame, cls: "text-destructive" },
  { name: "Women Helpline", number: "1091", icon: Shield, cls: "text-safety" },
  { name: "Women (alt)", number: "181", icon: Shield, cls: "text-safety" },
  { name: "Child Helpline", number: "1098", icon: Baby, cls: "text-warning" },
];

const EmergencyCalls = () => (
  <AppShell title="Emergency Calls" back>
    <p className="text-sm text-muted-foreground mb-4">Tap any number to dial.</p>
    <div className="space-y-2">
      {calls.map((c) => (
        <a key={c.number + c.name} href={`tel:${c.number}`} className="block">
          <Card className="p-4 flex items-center gap-4 active:scale-[0.99] transition-transform">
            <div className="h-11 w-11 rounded-xl bg-secondary grid place-items-center">
              <c.icon className={`h-5 w-5 ${c.cls}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">India · 24/7</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-lg">{c.number}</span>
              <Phone className="h-4 w-4 text-success" />
            </div>
          </Card>
        </a>
      ))}
    </div>
  </AppShell>
);

export default EmergencyCalls;
