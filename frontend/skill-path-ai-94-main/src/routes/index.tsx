import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Compass, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageChrome } from "@/components/PageChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillGap AI — Find your skill gaps and close them" },
      {
        name: "description",
        content:
          "Upload your resume and a job description to see your skill gaps, job readiness score and a six-week learning plan.",
      },
      { property: "og:title", content: "SkillGap AI — Find your skill gaps and close them" },
      {
        property: "og:description",
        content:
          "Upload your resume and a job description to see your skill gaps, job readiness score and a six-week learning plan.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Target, title: "Readiness score", text: "See how close you are to the role in one number." },
  { icon: BarChart3, title: "Skill radar", text: "Compare your skills against what the job actually asks for." },
  { icon: Compass, title: "Learning roadmap", text: "A six-week plan with resources for each gap." },
];

function Landing() {
  return (
    <div className="hero-surface min-h-screen">
      <PageChrome showBack={false} />
      <main className="mx-auto max-w-4xl px-6 pt-16 pb-24 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
          No login needed to try it
        </span>
        <h1 className="mt-6 font-display text-5xl font-bold sm:text-6xl">
          <span className="text-gradient-brand">SkillGap AI</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          Find your skill gaps and close them
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Button asChild variant="hero" size="lg">
            <Link to="/upload">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="transition-transform hover:-translate-y-0.5">
            <Link to="/auth" search={{ mode: "login" }}>Log in</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-5 text-left sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="card-soft p-6">
              <f.icon className="size-5 text-primary" />
              <h2 className="mt-3 text-base font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
