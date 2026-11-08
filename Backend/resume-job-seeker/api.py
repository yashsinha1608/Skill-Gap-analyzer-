"""
SkillGap AI - API (the "front door" for the website).

Run it with:   uvicorn api:app --reload
Then open:     http://localhost:8000/docs
"""

import os
import time

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.pdf_parser import extract_text_from_bytes
from src.embeddings import generate_embedding
from src.similarity import calculate_similarity
from src.gemini_analyzer import analyze_skill_gap
from src.scoring import compute_readiness


MAX_FILE_BYTES = 5 * 1024 * 1024      # 5 MB
MAX_TEXT_CHARS = 20000                # keeps AI requests a safe size

app = FastAPI(title="SkillGap AI API")

# Which websites may call this API. "*" = everyone (fine while building).
# Later, set CORS_ORIGINS=https://your-site.lovable.app in .env to lock it down.
origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "SkillGap AI API is running!"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
):
    started = time.time()
    print(f"[api] new request: {resume.filename}")

    # ---------- 1. Check the inputs ----------
    if len(job_description.strip()) < 30:
        raise HTTPException(400, "Please paste a longer job description.")

    data = resume.file.read()

    if not data:
        raise HTTPException(400, "The uploaded file is empty.")

    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(413, "File is too large. Maximum size is 5 MB.")

    # ---------- 2. Read the resume ----------
    try:
        resume_text, method = extract_text_from_bytes(
            data, resume.content_type, resume.filename
        )
    except ValueError as e:
        raise HTTPException(415, str(e))
    except Exception as e:
        raise HTTPException(422, f"Could not read the resume: {e}")

    if not resume_text.strip():
        raise HTTPException(422, "No readable text was found in the resume.")

    print(f"[api] resume read ({method}, {len(resume_text)} characters) - {time.time() - started:.1f}s")

    resume_text = resume_text[:MAX_TEXT_CHARS]
    job_text = job_description.strip()[:MAX_TEXT_CHARS]

    # ---------- 3. Similarity (if this fails we still continue) ----------
    similarity = None
    try:
        similarity = float(
            calculate_similarity(
                generate_embedding(resume_text),
                generate_embedding(job_text),
            )
        )
    except Exception as e:
        print(f"[api] similarity skipped: {type(e).__name__}: {e}")

    print(f"[api] similarity done - {time.time() - started:.1f}s")

    # ---------- 4. Gemini skill analysis ----------
    try:
        analysis = analyze_skill_gap(resume_text, job_text)
    except Exception as e:
        raise HTTPException(502, f"AI analysis failed: {e}")

    print(f"[api] analysis done - {time.time() - started:.1f}s")

    # ---------- 5. Score ----------
    score = compute_readiness(
        similarity,
        len(analysis["matched_skills"]),
        len(analysis["partial_skills"]),
        len(analysis["missing_skills"]),
    )

    return {
        **score,
        "similarity_score": None if similarity is None else round(similarity * 100, 1),
        "extraction_method": method,
        **analysis,
    }
