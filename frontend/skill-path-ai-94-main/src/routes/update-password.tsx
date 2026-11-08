import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageChrome } from "@/components/PageChrome";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/update-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — SkillGap AI" },
      { name: "description", content: "Choose a new password for your SkillGap AI account." },
      { property: "og:title", content: "Set a new password — SkillGap AI" },
      { property: "og:description", content: "Choose a new password for your SkillGap AI account." },
    ],
  }),
  component: UpdatePasswordPage,
});

function UpdatePasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);

  // The emailed link carries a recovery token; Supabase turns it into a session.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    const timer = setTimeout(() => {
      setReady((r) => {
        if (!r) setLinkInvalid(true);
        return r;
      });
    }, 5000);
    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    toast.success("Password updated successfully");
    setTimeout(() => navigate({ to: "/dashboard" }), 1500);
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto flex max-w-md flex-col px-6 pt-8 pb-24">
        <div className="card-soft p-8">
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="size-12 text-success" />
              <h1 className="font-display mt-4 text-2xl font-bold">Password updated</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Password updated successfully — taking you to your dashboard…
              </p>
            </div>
          ) : linkInvalid && !ready ? (
            <div className="flex flex-col items-center py-4 text-center">
              <h1 className="font-display text-2xl font-bold">Link expired</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This reset link is invalid or has expired. Request a new one.
              </p>
              <Link to="/reset-password" className="mt-6 text-sm font-medium text-primary hover:underline">
                Send a new reset link
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Set a new password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose a new password for your account.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <PasswordInput
                    id="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading || !ready}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
