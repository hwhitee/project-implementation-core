import { NavLink } from "react-router-dom";
import { Home, ListChecks, CloudSun, Phone, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const userTabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/response", label: "Response", icon: ListChecks },
  { to: "/weather", label: "Weather", icon: CloudSun },
  { to: "/emergency-calls", label: "Calls", icon: Phone },
];

const adminTabs = [
  { to: "/admin", label: "Home", icon: Home },
  { to: "/admin/yellow", label: "Yellow", icon: Shield },
  { to: "/admin/red", label: "Red", icon: Shield },
];

export const BottomNav = () => {
  const { role } = useAuth();
  const tabs = role === "admin" ? adminTabs : userTabs;
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 glass safe-bottom border-t border-border">
      <ul className="grid grid-cols-4 max-w-md mx-auto">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};
