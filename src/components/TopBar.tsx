import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, Phone, User as UserIcon, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const TopBar = ({ title, back = false }: { title?: string; back?: boolean }) => {
  const [unread, setUnread] = useState(0);
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [user, loc.pathname]);

  return (
    <header className="sticky top-0 z-30 glass safe-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          {back && (
            <Button size="icon" variant="ghost" onClick={() => nav(-1)} aria-label="Back">
              <ArrowLeft />
            </Button>
          )}
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="h-9 w-9 rounded-lg gradient-primary grid place-items-center font-bold text-primary-foreground">H</div>
            <div className="truncate">
              <div className="text-sm font-semibold truncate">{title ?? "Crisis Response"}</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Hyper-local · Live</div>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/notifications" className="relative">
            <Button size="icon" variant="ghost" aria-label="Notifications">
              <Bell />
            </Button>
            {unread > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            )}
          </Link>
          <Link to="/emergency-calls">
            <Button size="icon" variant="ghost" aria-label="Emergency calls">
              <Phone className="text-success" />
            </Button>
          </Link>
          <Link to="/profile">
            <Button size="icon" variant="ghost" aria-label="Profile">
              <UserIcon />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
