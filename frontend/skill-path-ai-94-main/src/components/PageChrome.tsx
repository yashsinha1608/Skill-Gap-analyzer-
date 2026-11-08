import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={toggle}
      className="rounded-full shadow-sm transition-transform hover:scale-105"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export function BackButton() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.history.back()}
      className="gap-2 rounded-full transition-transform hover:-translate-x-0.5"
    >
      <ArrowLeft className="size-4" />
      Back
    </Button>
  );
}

export function PageChrome({ showBack = true }: { showBack?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-3">
        {showBack ? <BackButton /> : null}
        <Link to="/" className="text-lg font-semibold tracking-tight">
          SkillGap<span className="text-primary"> AI</span>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  );
}
