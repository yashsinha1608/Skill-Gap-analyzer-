import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageChrome } from "@/components/PageChrome";
import { ResultsDashboard } from "@/components/ResultsDashboard";
import { useSession } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  analysisFromApi,
  defaultAnalysis,
  type AnalysisData,
  type ApiAnalysis,
} from "@/lib/analysis-data";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Analyze your resume — SkillGap AI" },
      {
        name: "description",
        content: "Upload a resume and paste a job description to reveal your skill gaps instantly.",
      },
      { property: "og:title", content: "Analyze your resume — SkillGap AI" },
      {
        property: "og:description",
        content: "Upload a resume and paste a job description to reveal your skill gaps instantly.",
      },
    ],
  }),
  component: UploadPage,
});

// Where the Python backend lives. Set VITE_API_URL in .env.local (see the guide).
const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
const API_URL = (env?.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const MAX_FILE_MB = 5;

function isAbort(err: unknown) {
  return err instanceof DOMException && err.name === "AbortError";
}

/** Sends the resume + job description to the backend and returns the dashboard data. */
async function requestAnalysis(file: File, jobDescription: string): Promise<AnalysisData> {
  const form = new FormData();
  form.append("resume", file);
  form.append("job_description", jobDescription);

  // Give up after 2.5 minutes instead of waiting forever
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 150_000);

  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      if (isAbort(err)) throw err;
      throw new Error("Can't reach the analysis server. Make sure the backend is running.");
    }

    if (!res.ok) {
      let message = `The analysis failed (error ${res.status}).`;
      try {
        const body = await res.json();
        if (typeof body?.detail === "string") message = body.detail;
      } catch {
        // keep the default message
      }
      throw new Error(message);
    }

    return analysisFromApi((await res.json()) as ApiAnalysis);
  } catch (err) {
    if (isAbort(err)) {
      throw new Error("The analysis took too long. Please try again in a minute.");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function UploadPage() {
  const { user } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    if (!f) return;
    const ok = /\.(pdf|docx)$/i.test(f.name);
    if (!ok) {
      toast.error("Please choose a PDF or DOCX file");
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`That file is too big. Maximum size is ${MAX_FILE_MB} MB`);
      return;
    }
    setFile(f);
  };

  const analyze = async () => {
    if (!file) {
      toast.error("Add your resume first");
      return;
    }
    if (!jd.trim()) {
      toast.error("Paste the job description");
      return;
    }
    setLoading(true);
    setShowResults(false);
    setSavedId(null);

    let analysis: AnalysisData;
    try {
      analysis = await requestAnalysis(file, jd);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message.length > 220 ? `${message.slice(0, 220)}…` : message);
      setLoading(false);
      return;
    }
    setResult(analysis);

    if (user) {
      const { data, error } = await supabase
        .from("analyses")
        .insert({
          user_id: user.id,
          resume_filename: file.name,
          jd_text: jd,
          base_score: analysis.score,
          completed_weeks: [],
        })
        .select("id")
        .maybeSingle();
      if (error) toast.error("Could not save this analysis");
      else {
        setSavedId(data?.id ?? null);
        toast.success("Analysis saved to your dashboard");
      }
    }

    setLoading(false);
    setShowResults(true);
  };

  return (
    <div className="hero-surface min-h-screen">
      <PageChrome />
      <main className="mx-auto max-w-6xl space-y-10 px-6 pb-24">
        <div>
          <h1 className="font-display text-3xl font-bold">Analyze a role</h1>
          <p className="mt-1 text-muted-foreground">
            Add your resume and the job description. {user ? "We'll save the result to your dashboard." : "No account needed."}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pick(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => inputRef.current?.click()}
            className={`card-soft flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 border-dashed p-8 text-center ${
              dragging ? "border-primary bg-primary/5" : ""
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => pick(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <>
                <FileText className="size-7 text-primary" />
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">Click to choose a different file</p>
              </>
            ) : (
              <>
                <UploadCloud className="size-7 text-primary" />
                <p className="font-medium">Drag and drop your resume</p>
                <p className="text-xs text-muted-foreground">PDF or DOCX, or click to browse</p>
              </>
            )}
          </div>

          <div className="card-soft p-6">
            <label htmlFor="jd" className="text-sm font-medium">
              Job description
            </label>
            <Textarea
              id="jd"
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the full job description here…"
              className="mt-3 min-h-44 resize-none rounded-xl"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="hero" size="lg" onClick={analyze} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Analyzing…
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm">Comparing your resume against the role…</p>
            <p className="text-xs">This can take up to a minute or two.</p>
          </div>
        ) : null}

        {showResults ? (
          <ResultsDashboard
            isGuest={!user}
            data={result ?? defaultAnalysis}
            onCompletedWeeksChange={(weeks) => {
              if (!savedId) return;
              void supabase
                .from("analyses")
                .update({ completed_weeks: weeks })
                .eq("id", savedId)
                .then(({ error }) => {
                  if (error) toast.error("Could not save your roadmap progress");
                });
            }}
          />
        ) : null}
      </main>
    </div>
  );
}