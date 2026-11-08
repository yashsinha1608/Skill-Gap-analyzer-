import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageChrome } from "@/components/PageChrome";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — SkillGap AI" },
      { name: "description", content: "Request a password reset link for your SkillGap AI account." },
      { property: "og:title", content: "Reset your password — SkillGap AI" },
      { property: "og:description", content: "Request a password reset link for your SkillGap AI account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent, check your email");
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto flex max-w-md flex-col px-6 pt-8 pb-24">
        <div className="card-soft p-8">
          {sent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="size-12 text-success" />
              <h1 className="font-display mt-4 text-2xl font-bold">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Reset link sent — check your email for a link to set a new password.
              </p>
              <Link to="/auth" search={{ mode: "login" }} className="mt-6 text-sm font-medium text-primary hover:underline">
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Reset your password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your account email and we'll send you a reset link.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/auth" search={{ mode: "login" }} className="font-medium text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
