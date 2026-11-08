import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageChrome } from "@/components/PageChrome";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { analysisFromId } from "@/lib/analysis-data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/analyses/$id")({
  head: () => ({
    meta: [
      { title: "Saved analysis — SkillGap AI" },
      { name: "description", content: "Review the skill gaps and learning plan from a saved SkillGap AI analysis." },
      { property: "og:title", content: "Saved analysis — SkillGap AI" },
      { property: "og:description", content: "Review the skill gaps and learning plan from a saved SkillGap AI analysis." },
    ],
  }),
  component: SavedAnalysis,
});

function SavedAnalysis() {
  const { id } = useParams({ from: "/_authenticated/analyses/$id" });

  const { data, isLoading } = useQuery({
    queryKey: ["analysis", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select("id, resume_filename, jd_text, created_at, base_score, completed_weeks")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const generated = analysisFromId(id);
  const result = { ...generated, score: data?.base_score ?? generated.score };
  const completedWeeks = Array.isArray(data?.completed_weeks)
    ? (data.completed_weeks as unknown[]).filter((w): w is string => typeof w === "string")
    : [];

  const saveWeeks = async (weeks: string[]) => {
    const { error } = await supabase
      .from("analyses")
      .update({ completed_weeks: weeks, base_score: result.score })
      .eq("id", id);
    if (error) toast.error("Could not save your roadmap progress");
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto max-w-6xl space-y-8 px-6 pb-24">
        <Button asChild variant="ghost" size="sm" className="gap-2 rounded-full">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" /> Back to my analyses
          </Link>
        </Button>

        <div>
          <h1 className="font-display flex items-center gap-2 text-3xl font-bold">
            <FileText className="size-6 text-primary" />
            {isLoading ? "Loading…" : (data?.resume_filename ?? "Saved analysis")}
          </h1>
          {data ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Analysed {new Date(data.created_at).toLocaleString()}
            </p>
          ) : null}
          {data?.jd_text ? (
            <p className="mt-3 line-clamp-4 max-w-3xl text-sm text-muted-foreground">{data.jd_text}</p>
          ) : null}
        </div>

        {!isLoading && !data ? (
          <div className="card-soft p-10 text-center">
            <p className="font-medium">This analysis is no longer available</p>
          </div>
        ) : (
          <ResultsDashboard
            isGuest={false}
            data={result}
            completedWeeks={completedWeeks}
            onCompletedWeeksChange={saveWeeks}
          />
        )}
      </main>
    </div>
  );
}
