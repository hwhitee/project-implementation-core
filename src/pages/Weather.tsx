import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { CloudRain, Wind, Waves, Mountain, Flame } from "lucide-react";

const mockAlerts = [
  { region: "Kerala", type: "Heavy rainfall", level: "Orange", icon: CloudRain },
  { region: "Odisha coast", type: "Cyclone watch", level: "Yellow", icon: Wind },
  { region: "Assam", type: "Flood warning", level: "Red", icon: Waves },
  { region: "Uttarakhand", type: "Landslide risk", level: "Orange", icon: Mountain },
  { region: "MP forests", type: "Heat & fire", level: "Yellow", icon: Flame },
];

const dos = ["Stock 3 days of food & water", "Charge phones & power banks", "Identify nearest shelter", "Keep important documents in waterproof bag"];
const donts = ["Don't drive through flooded roads", "Don't shelter under trees in storms", "Don't ignore evacuation orders", "Don't spread unverified news"];

const levelColor = (l: string) => l === "Red" ? "text-destructive" : l === "Orange" ? "text-warning" : "text-primary";

const Weather = () => (
  <AppShell title="Weather & Alerts">
    <p className="text-sm text-muted-foreground mb-4">
      Live disaster alerts inspired by NDMA Sachet portal.
    </p>

    <section className="space-y-2 mb-6">
      <h2 className="font-semibold text-sm">Active alerts</h2>
      {mockAlerts.map((a, i) => (
        <Card key={i} className="p-3 flex items-center gap-3">
          <a.icon className={`h-6 w-6 ${levelColor(a.level)}`} />
          <div className="flex-1">
            <p className="text-sm font-medium">{a.type}</p>
            <p className="text-xs text-muted-foreground">{a.region}</p>
          </div>
          <span className={`text-xs font-semibold ${levelColor(a.level)}`}>{a.level}</span>
        </Card>
      ))}
    </section>

    <section className="grid grid-cols-2 gap-3 mb-6">
      <Card className="p-3">
        <h3 className="font-semibold text-sm text-success mb-2">Do's</h3>
        <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
          {dos.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </Card>
      <Card className="p-3">
        <h3 className="font-semibold text-sm text-destructive mb-2">Don'ts</h3>
        <ul className="space-y-1 text-xs text-muted-foreground list-disc pl-4">
          {donts.map((d) => <li key={d}>{d}</li>)}
        </ul>
      </Card>
    </section>

    <section>
      <h2 className="font-semibold text-sm mb-2">NDMA Sachet</h2>
      <Card className="overflow-hidden">
        <iframe
          src="https://sachet.ndma.gov.in/"
          title="NDMA Sachet"
          className="w-full h-80 bg-background"
          loading="lazy"
        />
      </Card>
      <p className="text-[11px] text-muted-foreground mt-2">If the embed is blocked by NDMA, use the alerts above.</p>
    </section>
  </AppShell>
);

export default Weather;
