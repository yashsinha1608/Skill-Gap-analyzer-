import io

import fitz
import pytest
from docx import Document
from fastapi.testclient import TestClient

import api

client = TestClient(api.app)

JD = "We need a data scientist with Python, SQL, Docker and statistics experience."

FAKE_RAW = {
    "overall_summary": "Good Python base, missing Docker.",
    "required_skills": [
        {"skill": "Python", "status": "MATCHED", "evidence": "Used in projects."},
        {"skill": "REST APIs", "status": "PARTIAL", "evidence": "Built one API."},
        {"skill": "Docker", "status": "MISSING", "evidence": "Not found."},
    ],
    "radar": [{"skill": "Python", "yours": 90, "required": 100}],
    "gaps": [
        {"skill": "REST APIs", "priority": "low", "why": "Nice to have."},
        {"skill": "Docker", "priority": "HIGH", "why": "Needed for deployment."},
    ],
    "roadmap": [{"week": 9, "title": "Docker Basics", "skills": ["Docker"], "resources": ["Docker docs"]}],
    "recommendations": ["Learn Docker."],
}


def make_pdf(text):
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    return doc.tobytes()


def make_docx(text):
    buf = io.BytesIO()
    d = Document()
    d.add_paragraph(text)
    d.save(buf)
    return buf.getvalue()


@pytest.fixture(autouse=True)
def fake_ai(monkeypatch):
    from src.gemini_analyzer import normalize_analysis
    monkeypatch.setattr(api, "generate_embedding", lambda t: [1.0, 0.0, 0.5])
    monkeypatch.setattr(api, "analyze_skill_gap", lambda r, j: normalize_analysis(FAKE_RAW))


def post(filename, data, ctype, jd=JD):
    return client.post("/analyze", files={"resume": (filename, data, ctype)}, data={"job_description": jd})


def test_pdf_happy_path():
    r = post("cv.pdf", make_pdf("Python developer. Built REST API."), "application/pdf")
    assert r.status_code == 200
    body = r.json()
    assert body["extraction_method"] == "PDF Text Extraction"
    assert 0 <= body["readiness_score"] <= 100
    assert body["matched_skills"] == ["Python"]
    # gaps sorted High first, priorities cleaned
    assert [g["priority"] for g in body["gaps"]] == ["High", "Low"]
    # roadmap week numbers are fixed to 1..n
    assert body["roadmap"][0]["week"] == 1
    for key in ["radar", "gaps", "roadmap", "recommendations", "similarity_score", "skill_coverage"]:
        assert key in body


def test_docx_works():
    r = post("cv.docx", make_docx("Python and SQL experience"),
             "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    assert r.status_code == 200
    assert r.json()["extraction_method"] == "DOCX Text Extraction"


def test_bad_file_type():
    r = post("notes.txt", b"hello", "text/plain")
    assert r.status_code == 415


def test_short_job_description():
    r = post("cv.pdf", make_pdf("Python"), "application/pdf", jd="short")
    assert r.status_code == 400


def test_empty_file():
    r = post("cv.pdf", b"", "application/pdf")
    assert r.status_code == 400


def test_too_large():
    r = post("cv.pdf", b"0" * (6 * 1024 * 1024), "application/pdf")
    assert r.status_code == 413


def test_corrupt_pdf():
    r = post("cv.pdf", b"not really a pdf", "application/pdf")
    assert r.status_code == 422


def test_embedding_failure_does_not_break(monkeypatch):
    def boom(t): raise RuntimeError("embedding down")
    monkeypatch.setattr(api, "generate_embedding", boom)
    r = post("cv.pdf", make_pdf("Python developer"), "application/pdf")
    assert r.status_code == 200
    assert r.json()["similarity_score"] is None


def test_gemini_failure_gives_clear_error(monkeypatch):
    def boom(r, j): raise RuntimeError("quota")
    monkeypatch.setattr(api, "analyze_skill_gap", boom)
    r = post("cv.pdf", make_pdf("Python developer"), "application/pdf")
    assert r.status_code == 502


def test_health_and_cors():
    assert client.get("/health").json() == {"status": "ok"}
    r = client.options("/analyze", headers={"Origin": "https://x.lovable.app", "Access-Control-Request-Method": "POST"})
    assert r.headers.get("access-control-allow-origin") == "*"
