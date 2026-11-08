import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Github, Lock, Sparkles, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import {
  defaultAnalysis,
  type AnalysisData,
  type RadarPoint,
  type RoadmapWeek,
} from "@/lib/analysis-data";

// Sample plan, only used when an analysis has no roadmap of its own
// (for example older saved analyses).
export const roadmap: RoadmapWeek[] = [
  { week: "Week 1", title: "Statistics Foundations", focus: ["Statistics"], resources: ["Khan Academy Statistics", "StatQuest YouTube"] },
  { week: "Week 2", title: "Deep Learning Basics", focus: ["Deep Learning"], resources: ["fast.ai course", "3Blue1Brown Neural Networks"] },
  { week: "Week 3", title: "PyTorch Fundamentals", focus: ["PyTorch"], resources: ["PyTorch official tutorials", "freeCodeCamp PyTorch course"] },
  { week: "Week 4", title: "MLOps Intro", focus: ["MLOps"], resources: ["MLOps.community guide", "Made With ML"] },
  { week: "Week 5", title: "Docker Basics", focus: ["Docker"], resources: ["Docker official docs", "Docker for Beginners YouTube"] },
  { week: "Week 6", title: "Capstone Project", focus: ["Deep Learning", "MLOps"], resources: ["Build a small end-to-end ML project", "Push it to GitHub"] },
];

const projects = [
  { name: "resume-parser-app", language: "Python / FastAPI", stars: 12, description: "Parses resumes into structured JSON and scores them against a job description." },
  { name: "portfolio-site", language: "React / TypeScript", stars: 5, description: "Personal portfolio with project case studies and a blog." },
  { name: "ml-practice-notebooks", language: "Jupyter / Python", stars: 3, description: "Notebooks covering regression, clustering and model evaluation." },
];

function scoreColor(score: number) {
  if (score < 40) return "var(--color-destructive)";
  if (score <= 70) return "var(--color-warning)";
  return "var(--color-success)";
}

const priorityClass: Record<string, string> = {
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Medium: "bg-warning/15 text-warning border-warning/30",
  Low: "bg-success/15 text-success border-success/30",
};

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function useAnimatedNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      setValue(next);
      fromRef.current = next;
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function gaugeMessage(score: number) {
  if (score >= 90) return "You are interview ready for this role. Keep your projects fresh.";
  if (score > 70) return "You are in the green band. Finish the remaining weeks to stay ahead.";
  if (score >= 40) return "You are close. Completing more roadmap weeks would move you into the green band.";
  return "Big gaps right now. Start with week one and watch this score climb.";
}

function ReadinessGauge({ score }: { score: number }) {
  const animated = useAnimatedNumber(score);
  const color = scoreColor(score);
  return (
    <div className="card-soft flex flex-col items-center p-6">
      <h2 className="text-xl font-semibold">Job Readiness Score</h2>
      <div className="relative h-56 w-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="76%"
            outerRadius="100%"
            data={[{ name: "score", value: animated, fill: color }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "var(--color-muted)" }}
              dataKey="value"
              cornerRadius={999}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-display text-4xl font-bold transition-colors duration-500"
            style={{ color }}
          >
            {Math.round(animated)}%
          </span>
          <span className="text-xs text-muted-foreground">ready for this role</span>
        </div>
      </div>
      <p className="max-w-xs text-center text-sm text-muted-foreground">{gaugeMessage(score)}</p>
    </div>
  );
}

function SkillRadar({ radarData }: { radarData: RadarPoint[] }) {
  return (
    <div className="card-soft p-6">
      <h2 className="text-xl font-semibold">Your Skills vs Required Skills</h2>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="72%">
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                color: "var(--color-popover-foreground)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Radar name="Your Skills" dataKey="you" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.35} />
            <Radar name="Required Skills" dataKey="required" stroke="var(--color-warning)" fill="var(--color-warning)" fillOpacity={0.18} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Roadmap({
  weeks,
  done,
  onToggle,
}: {
  weeks: RoadmapWeek[];
  done: Record<string, boolean>;
  onToggle: (week: string, value: boolean) => void;
}) {
  const completed = weeks.filter((r) => done[r.week]).length;
  return (
    <Section
      title="Learning Roadmap"
      subtitle={`${weeks.length} focused weeks to close your biggest gaps. ${completed} of ${weeks.length} complete.`}
    >
      <div className="relative overflow-x-auto pb-4 no-scrollbar">
        <div className="absolute top-24 right-6 left-6 hidden h-px bg-border md:block" />
        <div className="relative flex min-w-max gap-5">
          {weeks.map((item) => {
            const complete = !!done[item.week];
            return (
              <div
                key={item.week}
                className={`card-soft w-72 shrink-0 p-5 ${complete ? "border-success/50" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="rounded-full">{item.week}</Badge>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                    <Checkbox
                      checked={complete}
                      onCheckedChange={(v) => onToggle(item.week, !!v)}
                    />
                    {complete ? <span className="text-success">Complete</span> : "Mark done"}
                  </label>
                </div>
                <h3 className={`mt-3 text-base font-semibold ${complete ? "text-muted-foreground line-through" : ""}`}>
                  {item.title}
                </h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.focus.map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-full text-xs">{f}</Badge>
                  ))}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {item.resources.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span className="transition-colors hover:text-primary">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function ProjectCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {projects.map((p) => (
        <div key={p.name} className="card-soft p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{p.name}</h3>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="size-4" /> {p.stars}
            </span>
          </div>
          <Badge variant="secondary" className="mt-2 rounded-full">{p.language}</Badge>
          <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
        </div>
      ))}
    </div>
  );
}

function VerifiedProjects({ isGuest }: { isGuest: boolean }) {
  const [connected, setConnected] = useState(false);

  if (isGuest) {
    return (
      <Section title="Verified Projects">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <div className="pointer-events-none blur-sm select-none">
            <div className="p-2">
              <ProjectCards />
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 p-6 text-center backdrop-blur-[2px]">
            <Lock className="size-5 text-muted-foreground" />
            <p className="max-w-sm text-sm font-medium">
              Sign up and connect GitHub to show verified project experience
            </p>
            <Button asChild variant="hero" size="sm">
              <Link to="/auth" search={{ mode: "signup" }}>Sign up free</Link>
            </Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section title="Verified Projects" subtitle="Real repositories that back up your claimed skills.">
      {connected ? (
        <ProjectCards />
      ) : (
        <div className="card-soft flex flex-col items-center gap-3 p-8 text-center">
          <Github className="size-6" />
          <p className="text-sm text-muted-foreground">
            Connect GitHub to verify your project experience.
          </p>
          <Button onClick={() => setConnected(true)} variant="hero">
            <Github className="size-4" /> Connect GitHub
          </Button>
        </div>
      )}
    </Section>
  );
}

export function ResultsDashboard({
  isGuest,
  data = defaultAnalysis,
  completedWeeks,
  onCompletedWeeksChange,
}: {
  isGuest: boolean;
  data?: AnalysisData;
  completedWeeks?: string[];
  onCompletedWeeksChange?: (weeks: string[]) => void;
}) {
  // The plan that belongs to THIS analysis (falls back to the sample plan for old data)
  const weeks = data.roadmap ?? roadmap;

  const [done, setDone] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((completedWeeks ?? []).map((w) => [w, true])),
  );

  useEffect(() => {
    if (!completedWeeks) return;
    setDone(Object.fromEntries(completedWeeks.map((w) => [w, true])));
  }, [completedWeeks?.join("|")]);

  const toggleWeek = (week: string, value: boolean) => {
    const next = { ...done, [week]: value };
    setDone(next);
    onCompletedWeeksChange?.(weeks.filter((r) => next[r.week]).map((r) => r.week));
  };

  const baseScore = data.score;
  const completedCount = weeks.filter((r) => done[r.week]).length;
  const score =
    weeks.length === 0
      ? baseScore
      : Math.min(
          100,
          Math.round(baseScore + completedCount * ((100 - baseScore) / weeks.length)),
        );

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-2">
        <ReadinessGauge score={score} />
        <SkillRadar radarData={data.radar} />
      </div>

      {data.summary ? (
        <Section title="AI Assessment" subtitle="How your resume lines up with this job.">
          <div className="card-soft space-y-4 p-6">
            <p className="text-sm text-muted-foreground">{data.summary}</p>
            {data.recommendations && data.recommendations.length > 0 ? (
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {data.recommendations.map((r, i) => (
                  <li key={`${i}-${r}`} className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </Section>
      ) : null}

      <Section title="Skill Gaps" subtitle="Ranked by impact on your readiness score.">
        {data.gaps.length === 0 ? (
          <div className="card-soft p-6 text-sm text-muted-foreground">
            No major skill gaps found for this job. Nice work.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.gaps.map((g) => (
              <div key={g.skill} className="card-soft p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold">{g.skill}</h3>
                  <Badge variant="outline" className={`rounded-full ${priorityClass[g.priority]}`}>
                    {g.priority}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{g.note}</p>
              </div>
            ))}
          </div>
        )}
      </Section>

      {weeks.length > 0 ? <Roadmap weeks={weeks} done={done} onToggle={toggleWeek} /> : null}

      <VerifiedProjects isGuest={isGuest} />

      {isGuest ? (
        <div className="card-soft hero-surface flex flex-col items-center gap-3 p-8 text-center">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-xl font-semibold">Want to save this result and track your progress?</h2>
          <p className="text-sm text-muted-foreground">
            Create a free account to keep every analysis and check off your roadmap.
          </p>
          <Button asChild variant="hero">
            <Link to="/auth" search={{ mode: "signup" }}>Sign up free</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}