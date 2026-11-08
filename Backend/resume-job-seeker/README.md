# SkillGap AI - Backend API

## Run it (Windows, inside your venv)

1. Activate:            venv\Scripts\activate
2. Install packages:    pip install -r requirements.txt
3. Check .env has:      GEMINI_API_KEY=your_key_here
4. Start the API:       uvicorn api:app --reload
5. Open the test page:  http://localhost:8000/docs
   -> click POST /analyze -> "Try it out" -> upload a resume + paste a job description -> Execute.

## Run the tests
    pip install pytest httpx
    python -m pytest tests -q

## Folder map
    api.py                  <- the front door the website calls
    src/pdf_parser.py       <- reads PDF / DOCX / images
    src/ocr.py              <- Tesseract (reads scanned pages)
    src/embeddings.py       <- turns text into numbers (Gemini)
    src/similarity.py       <- how similar are two texts
    src/gemini_analyzer.py  <- finds matched / partial / missing skills, roadmap
    src/scoring.py          <- final readiness score
    app.py                  <- your old Streamlit page (still works, optional)

## What /analyze returns (JSON)
    readiness_score, skill_coverage, similarity_score, extraction_method,
    overall_summary, matched_skills, partial_skills, missing_skills,
    required_skills[], radar[], gaps[], roadmap[], recommendations[]
