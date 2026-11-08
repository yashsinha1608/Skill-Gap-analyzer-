import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageChrome } from "@/components/PageChrome";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your analyses — SkillGap AI" },
      { name: "description", content: "Every resume and job description you have analysed with SkillGap AI." },
      { property: "og:title", content: "Your analyses — SkillGap AI" },
      { property: "og:description", content: "Every resume and job description you have analysed with SkillGap AI." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, resume_filename, jd_text, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("analyses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<typeof data>(["analyses"], (prev) =>
        prev ? prev.filter((a) => a.id !== id) : prev,
      );
      setPendingDelete(null);
      toast.success("Analysis deleted");
    },
    onError: () => {
      setPendingDelete(null);
      toast.error("Could not delete this analysis");
    },
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto max-w-5xl space-y-8 px-6 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Your analyses</h1>
            <p className="mt-1 text-muted-foreground">Everything you have run, newest first.</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="hero">
              <Link to="/upload">
                <Plus className="size-4" /> New analysis
              </Link>
            </Button>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <div className="card-soft p-10 text-center">
            <p className="font-medium">No analyses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first one and it will show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.map((a) => (
              <div key={a.id} className="relative">
                <Link
                  to="/analyses/$id"
                  params={{ id: a.id }}
                  className="card-soft block p-5 pr-14 transition-transform hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-primary" />
                    <h2 className="font-semibold">{a.resume_filename ?? "Resume"}</h2>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{a.jd_text}</p>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete analysis"
                  onClick={() => setPendingDelete(a.id)}
                  className="absolute top-3 right-3 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
            <AlertDialogDescription>This can&apos;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) deleteMutation.mutate(pendingDelete);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
