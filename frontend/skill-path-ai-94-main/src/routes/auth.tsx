import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageChrome } from "@/components/PageChrome";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/auth";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).catch("login"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or sign up — SkillGap AI" },
      { name: "description", content: "Create a free SkillGap AI account to save analyses and track progress." },
      { property: "og:title", content: "Log in or sign up — SkillGap AI" },
      { property: "og:description", content: "Create a free SkillGap AI account to save analyses and track progress." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      if (!data.session) {
        toast.success("Check your email to confirm your account");
        return;
      }
      toast.success("Welcome to SkillGap AI");
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto flex max-w-md flex-col px-6 pt-8 pb-24">
        <div className="card-soft p-8">
          <h1 className="font-display text-2xl font-bold">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? "Save your analyses and track your roadmap." : "Log in to see your saved analyses."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {!isSignup && (
                <div className="text-right">
                  <Link
                    to="/reset-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : isSignup ? "Sign up free" : "Log in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "New here? "}
            <Link
              to="/auth"
              search={{ mode: isSignup ? "login" : "signup" }}
              className="font-medium text-primary hover:underline"
            >
              {isSignup ? "Log in" : "Sign up free"}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
