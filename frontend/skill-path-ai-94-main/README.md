# Skill Navigator

Build a web app called "SkillGap AI" - a tool where students upload their resume and a job description, and see their skill gaps and a learning plan.

TECH: React + TypeScript, Tailwind CSS, shadcn/ui, Recharts for charts. Connect Supabase for auth (email/password) and as the database.

GLOBAL DESIGN:

- Modern look: subtle shadows on cards, rounded corners, generous spacing, subtle gradient in hero backgrounds, font like Inter or Poppins, small hover effects on buttons/cards.

- Dark mode toggle (sun/moon icon) in the top-right of every page, switching the whole app's theme, including charts.

- Back button (left arrow) in the top-left of every page except Landing.

FLOW (no login required to try it):

1. Landing page: hero with title "SkillGap AI", tagline "Find your skill gaps and close them", "Get Started" button going straight to the Upload page (no login needed).

2. Upload page (open to guests and logged-in users): drag-and-drop box for resume (PDF/DOCX, shows filename once picked), a text area to paste a Job Description, and an "Analyze" button. On click, show a loading spinner then reveal the Results Dashboard using dummy data (below) - no real backend call yet.

3. Results Dashboard (shown after Analyze):

   a. Circular "Job Readiness Score" gauge, dummy value 62%, color red under 40 / yellow 40-70 / green above 70.

   b. Radar chart comparing "Your Skills" vs "Required Skills", dummy data: Python 90 vs 100, SQL 60 vs 90, Machine Learning 70 vs 100, Git 80 vs 70, Statistics 20 vs 90, Docker 10 vs 80.

   c. "Skill Gaps" list of cards with priority badges (High/Medium/Low, red/yellow/green), dummy data: Statistics (High), Deep Learning (High), PyTorch (Medium), MLOps (Medium), Docker (Low).

   d. "Learning Roadmap": horizontal scrollable timeline, 6 week-cards connected by a line, each showing week title, 1-2 focus skills, 2-3 text resource links, and a checkbox that visually toggles "Complete" (no save yet). Use: Week1 Statistics Foundations (Khan Academy Statistics, StatQuest YouTube), Week2 Deep Learning Basics (fast.ai course, 3Blue1Brown Neural Networks), Week3 PyTorch Fundamentals (PyTorch official tutorials, freeCodeCamp PyTorch course), Week4 MLOps Intro (MLOps.community guide, Made With ML), Week5 Docker Basics (Docker official docs, Docker for Beginners YouTube), Week6 Capstone Project (Build a small end-to-end ML project, Push it to GitHub).

   e. "Verified Projects" section: if logged in, show "Connect GitHub" button, and once toggled "connected" show 3 dummy project cards (name, language badge, star count, description) - use resume-parser-app (Python/FastAPI, 12 stars), portfolio-site (React/TypeScript, 5 stars), ml-practice-notebooks (Jupyter/Python, 3 stars). If guest, show this section blurred/locked with text "Sign up and connect GitHub to show verified project experience".

   f. If guest, show a card: "Want to save this result and track your progress? Sign up free" linking to signup.

4. Auth pages (login/signup) using Supabase.

5. Dashboard page (logged-in users only, not in guest navigation): shows past saved analyses.

DATABASE (Supabase tables):

- profiles: id, email, created_at

- analyses: id, user_id, resume_filename, jd_text, created_at

BEHAVIOR: If logged in, save each analysis to the "analyses" table. If guest, don't save - just show results on screen temporarily.

Keep it all using dummy/sample data for now - I'll connect the real AI backend later.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/24a6d207-8f89-4a54-b637-ef4cd15bd665).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
