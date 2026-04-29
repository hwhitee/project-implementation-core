import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Bell } from "lucide-react";

interface Notif {
  id: string;
  title: string;
  message: string | null;
  type: string | null;
  read: boolean;
  created_at: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems(data ?? []));
    supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false).then(() => {});
  }, [user]);

  return (
    <AppShell title="Notifications" back>
      {items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No notifications yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card key={n.id} className="p-3">
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && <p className="text-xs text-muted-foreground mt-1">{n.message}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Notifications;
