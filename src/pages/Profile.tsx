import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, ShieldCheck } from "lucide-react";

const Profile = () => {
  const { user, role, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        setFullName(data?.full_name ?? "");
        setPhone(data?.phone ?? "");
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: fullName.trim().slice(0, 100),
      phone: phone.trim().slice(0, 20),
    }).eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  return (
    <AppShell title="Profile" back>
      <Card className="p-5 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
            {(fullName || user?.email || "U").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{fullName || "Unnamed"}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          {role === "admin" && (
            <span className="inline-flex items-center gap-1 mt-1 text-[11px] text-accent">
              <ShieldCheck className="h-3 w-3" /> Admin
            </span>
          )}
        </div>
      </Card>

      <div className="space-y-3 mt-5">
        <div className="space-y-1.5">
          <Label htmlFor="n">Full name</Label>
          <Input id="n" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p">Phone</Label>
          <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
        </div>
        <Button onClick={save} variant="hero" className="w-full" disabled={busy}>Save</Button>
        <Button onClick={signOut} variant="outline" className="w-full">
          <LogOut /> Sign out
        </Button>
      </div>
    </AppShell>
  );
};

export default Profile;
