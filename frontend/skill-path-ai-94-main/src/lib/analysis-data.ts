export type RadarPoint = { skill: string; you: number; required: number };
export type Gap = { skill: string; priority: "High" | "Medium" | "Low"; note: string };
export type RoadmapWeek = { week: string; title: string; focus: string[]; resources: string[] };

export type AnalysisData = {
  score: number;
  radar: RadarPoint[];
  gaps: Gap[];
  /** The 6-week plan from the AI backend. When missing, the dashboard shows its sample plan. */
  roadmap?: RoadmapWeek[];
  /** Short AI summary of how well the resume fits the job. */
  summary?: string;
  recommendations?: string[];
};

export const defaultAnalysis: AnalysisData = {
  score: 62,
  radar: [
    { skill: "Python", you: 90, required: 100 },
    { skill: "SQL", you: 60, required: 90 },
    { skill: "Machine Learning", you: 70, required: 100 },
    { skill: "Git", you: 80, required: 70 },
    { skill: "Statistics", you: 20, required: 90 },
    { skill: "Docker", you: 10, required: 80 },
  ],
  gaps: [
    { skill: "Statistics", priority: "High", note: "Core inference and probability are barely covered in your resume." },
    { skill: "Deep Learning", priority: "High", note: "The role expects hands-on neural network experience." },
    { skill: "PyTorch", priority: "Medium", note: "Named explicitly in the job description." },
    { skill: "MLOps", priority: "Medium", note: "Model deployment and monitoring workflows are missing." },
    { skill: "Docker", priority: "Low", note: "Basic containerisation would round out your profile." },
  ],
};

function hash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic saved-looking result for a stored analysis id. */
export function analysisFromId(id: string): AnalysisData {
  const h = hash(id);
  const radar = defaultAnalysis.radar.map((p, i) => {
    const delta = ((h >> (i * 3)) % 31) - 15;
    return { ...p, you: Math.min(100, Math.max(5, p.you + delta)) };
  });
  const avg = radar.reduce((s, p) => s + Math.min(1, p.you / p.required), 0) / radar.length;
  const score = Math.round(avg * 100);
  const gaps = [...defaultAnalysis.gaps].sort((a, b) => {
    const rank = { High: 0, Medium: 1, Low: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });
  return { score, radar, gaps };
}

// ---------------------------------------------------------------------------
// Real results from the Python backend (POST /analyze)
// ---------------------------------------------------------------------------

/** The fields of the backend's answer that the website uses. */
export type ApiAnalysis = {
  readiness_score: number;
  overall_summary?: string;
  radar?: { skill: string; yours: number; required: number }[];
  gaps?: { skill: string; priority: string; why?: string }[];
  roadmap?: { week: number; title: string; skills?: string[]; resources?: string[] }[];
  recommendations?: string[];
};

const PRIORITIES: readonly string[] = ["High", "Medium", "Low"];

function clamp100(n: unknown) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 0;
}

/** Turns the backend's answer into the shape the dashboard components already use. */
export function analysisFromApi(api: ApiAnalysis): AnalysisData {
  return {
    score: clamp100(api.readiness_score),
    summary: api.overall_summary || undefined,
    // backend says "yours", the dashboard says "you"
    radar: (api.radar ?? []).map((p) => ({
      skill: p.skill,
      you: clamp100(p.yours),
      required: clamp100(p.required),
    })),
    // backend says "why", the dashboard says "note"
    gaps: (api.gaps ?? []).map((g) => ({
      skill: g.skill,
      priority: PRIORITIES.includes(g.priority) ? (g.priority as Gap["priority"]) : "Medium",
      note: g.why ?? "",
    })),
    // labels are always "Week 1", "Week 2", ... so saved progress keeps working
    roadmap: (api.roadmap ?? []).map((w, i) => ({
      week: `Week ${i + 1}`,
      title: w.title,
      focus: w.skills ?? [],
      resources: w.resources ?? [],
    })),
    recommendations: api.recommendations ?? [],
  };
}