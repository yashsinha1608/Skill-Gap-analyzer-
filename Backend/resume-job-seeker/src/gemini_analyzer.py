import os
import json
import time

from google import genai
from google.genai import types


# The main model, and a backup that is used automatically when the main one
# is overloaded (error 503) or fails. Both are real, stable Google model names.
# You can change them without touching code by setting GEMINI_MODEL and
# GEMINI_FALLBACK_MODEL in your .env file.
MODELS = [
    os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
    os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.6-flash"),
]

# Never keep the person waiting longer than this (in seconds) in total
MAX_TOTAL_SECONDS = 120

PRIORITIES = ["High", "Medium", "Low"]


def build_prompt(resume_text, job_description):

    return f"""
You are an expert technical recruiter and resume analyst.

Compare the candidate's resume with the job description.

================ RESUME ================
{resume_text}

================ JOB DESCRIPTION ================
{job_description}

Identify the important technical and professional skills required by
the job and compare them with the resume.

Classify each important skill as:
MATCHED: clearly demonstrated in the resume.
PARTIAL: related evidence exists, but the match is incomplete.
MISSING: no reasonable evidence exists in the resume.

Rules:
1. Do not invent candidate experience.
2. Do not assume a skill exists because it is common.
3. Treat obvious synonyms as equivalent.
4. Focus on job-relevant skills; keep skill names short (1-3 words).
5. Use evidence from the resume.
6. Return ONLY valid JSON, no Markdown fences.

RADAR RULES:
- Pick the 6 most important skills for this job.
- "required" = how strong the job needs this skill, 0-100.
- "yours" = how strong the resume proves it, 0-100.
  MISSING skills must be under 25. MATCHED skills should be 60 or more.

GAP RULES:
- One entry for every PARTIAL or MISSING skill.
- priority is exactly "High", "Medium" or "Low". Most urgent first.
- "why" is ONE short sentence on why it matters for this job.

ROADMAP RULES:
- Exactly 6 weeks, biggest gaps first, week 6 is a small capstone project.
- Each week: a short title, 1-2 skills, and 2-3 resources.
- Resources must be real, well-known FREE courses/docs/channels by name
  (for example "freeCodeCamp Python course"). Never invent links.

Return exactly this JSON shape:

{{
  "overall_summary": "Short summary of the candidate's alignment.",
  "required_skills": [
    {{"skill": "Python", "status": "MATCHED", "evidence": "Python used in the resume parser project."}}
  ],
  "matched_skills": ["Python"],
  "partial_skills": ["REST APIs"],
  "missing_skills": ["Docker"],
  "radar": [
    {{"skill": "Python", "yours": 85, "required": 90}}
  ],
  "gaps": [
    {{"skill": "Docker", "priority": "High", "why": "The job needs container deployment experience."}}
  ],
  "roadmap": [
    {{"week": 1, "title": "Docker Basics", "skills": ["Docker"], "resources": ["Docker official docs", "TechWorld with Nana Docker tutorial"]}}
  ],
  "recommendations": ["Add a project that uses Docker."]
}}
"""


def _clean_json_text(text):

    text = text.strip()

    if text.startswith("```json"):
        text = text[len("```json"):]
    elif text.startswith("```"):
        text = text[len("```"):]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def _to_int(value, default=0):
    try:
        return max(0, min(100, int(round(float(value)))))
    except (TypeError, ValueError):
        return default


def normalize_analysis(raw):
    """
    Gemini is usually right but not always. This makes sure the website
    ALWAYS receives the same clean shape, even if a field is missing.
    """

    required_skills = [
        {
            "skill": str(item.get("skill", "Unknown")),
            "status": str(item.get("status", "UNKNOWN")).upper(),
            "evidence": str(item.get("evidence", "")),
        }
        for item in raw.get("required_skills", [])
        if isinstance(item, dict)
    ]

    def skills_with_status(status):
        return [s["skill"] for s in required_skills if s["status"] == status]

    matched = raw.get("matched_skills") or skills_with_status("MATCHED")
    partial = raw.get("partial_skills") or skills_with_status("PARTIAL")
    missing = raw.get("missing_skills") or skills_with_status("MISSING")

    radar = [
        {
            "skill": str(item.get("skill", "")),
            "yours": _to_int(item.get("yours")),
            "required": _to_int(item.get("required")),
        }
        for item in raw.get("radar", [])
        if isinstance(item, dict) and item.get("skill")
    ][:6]

    gaps = []
    for item in raw.get("gaps", []):
        if not isinstance(item, dict) or not item.get("skill"):
            continue
        priority = str(item.get("priority", "Medium")).capitalize()
        if priority not in PRIORITIES:
            priority = "Medium"
        gaps.append(
            {
                "skill": str(item["skill"]),
                "priority": priority,
                "why": str(item.get("why", "")),
            }
        )
    gaps.sort(key=lambda g: PRIORITIES.index(g["priority"]))

    roadmap = []
    for index, item in enumerate(raw.get("roadmap", [])[:6], start=1):
        if not isinstance(item, dict):
            continue
        roadmap.append(
            {
                "week": index,
                "title": str(item.get("title", f"Week {index}")),
                "skills": [str(s) for s in item.get("skills", [])][:2],
                "resources": [str(r) for r in item.get("resources", [])][:3],
            }
        )

    return {
        "overall_summary": str(raw.get("overall_summary", "")),
        "required_skills": required_skills,
        "matched_skills": [str(s) for s in matched],
        "partial_skills": [str(s) for s in partial],
        "missing_skills": [str(s) for s in missing],
        "radar": radar,
        "gaps": gaps,
        "roadmap": roadmap,
        "recommendations": [str(r) for r in raw.get("recommendations", [])],
    }


def analyze_skill_gap(resume_text, job_description):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY was not found. Check your .env file.")

    # timeout is in milliseconds: give up after 60 seconds instead of hanging forever
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(timeout=60_000),
    )

    prompt = build_prompt(resume_text, job_description)

    # Asking Gemini for "application/json" makes it return clean JSON
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
    )

    errors = []
    deadline = time.time() + MAX_TOTAL_SECONDS

    for model in MODELS:

        # Each model gets 2 tries (the 2nd only for "busy / slow" problems)
        for attempt in range(2):

            if time.time() > deadline:
                errors.append(f"[{model}] skipped: took longer than {MAX_TOTAL_SECONDS}s in total")
                break

            try:
                print(f"[gemini] asking {model} (attempt {attempt + 1})...")

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )

                text = response.text

                if not text:
                    raise ValueError("Gemini returned an empty answer")

                raw = json.loads(_clean_json_text(text))

                print(f"[gemini] {model} answered OK")

                return normalize_analysis(raw)

            except Exception as e:

                error_text = f"{type(e).__name__}: {e}"

                print(f"[gemini] {model} attempt {attempt + 1} failed -> {error_text[:200]}")

                busy = any(
                    word in error_text
                    for word in ("503", "UNAVAILABLE", "500", "INTERNAL", "imeout", "DEADLINE")
                )

                if busy and attempt == 0:
                    time.sleep(2)
                    continue  # one more try with the same model

                errors.append(f"[{model}] {error_text[:300]}")
                break  # move on to the backup model

    raise RuntimeError("Gemini analysis failed. " + " | ".join(errors))