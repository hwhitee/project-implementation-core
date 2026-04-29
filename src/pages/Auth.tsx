import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  fullName: z.string().min(1).max(100).optional(),
});

const Auth = () => {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;
  if (user) return <Navigate to="/" replace />;

  const fail = (msg: string) => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
    toast.error(msg);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const parse = schema.safeParse({ email, password, fullName: tab === "signup" ? fullName : undefined });
      if (!parse.success) {
        fail(parse.error.issues[0].message);
        return;
      }
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName },
          },
        });
        if (error) {
          fail(error.message);
          return;
        }
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          fail(error.message);
          return;
        }
        nav("/", { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (r.error) fail(r.error.message ?? "Google sign-in failed");
      // If redirected, browser navigates away
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center p-6 gradient-surface">
      <div className="w-full max-w-sm space-y-6 animate-fade-up">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl gradient-primary items-center justify-center glow-primary">
            <ShieldAlert className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Crisis Response</h1>
          <p className="text-sm text-muted-foreground">Hyper-local reporting & coordination</p>
        </div>

        <Card className={`p-5 ${shake ? "animate-shake" : ""}`}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <form onSubmit={onSubmit} className="space-y-3 mt-4">
              <TabsContent value="signup" className="space-y-3 mt-0">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} />
                </div>
              </TabsContent>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {tab === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>
          </Tabs>

          <div className="relative my-4 text-center">
            <span className="bg-card relative px-2 text-xs text-muted-foreground">or</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-border -z-0" />
          </div>

          <Button type="button" variant="outline" size="lg" className="w-full" onClick={google} disabled={busy}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.8-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.6 2.4 12 2.4 6.9 2.4 2.7 6.5 2.7 11.6S6.9 20.9 12 20.9c6.9 0 9.4-4.8 9.4-7.3 0-.5-.1-.9-.1-1.3H12z"/>
            </svg>
            Continue with Google
          </Button>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing you agree to receive emergency-related notifications.
        </p>
      </div>
    </div>
  );
};

export default Auth;
