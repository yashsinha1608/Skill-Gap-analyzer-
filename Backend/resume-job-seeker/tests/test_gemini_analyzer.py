import json

import pytest

from src import gemini_analyzer as ga

GOOD = {
    "required_skills": [{"skill": "Python", "status": "MATCHED", "evidence": "x"}],
    "radar": [{"skill": "Python", "yours": 80, "required": 90}],
    "gaps": [], "roadmap": [], "recommendations": [],
}


class FakeResponse:
    def __init__(self, text): self.text = text


def make_client(behaviours):
    """behaviours: list of values/exceptions returned one per call."""
    calls = {"n": 0}

    class FakeModels:
        def generate_content(self, model, contents, config):
            b = behaviours[min(calls["n"], len(behaviours) - 1)]
            calls["n"] += 1
            if isinstance(b, Exception):
                raise b
            return FakeResponse(b)

    class FakeClient:
        def __init__(self, api_key, **kwargs): self.models = FakeModels()

    return FakeClient, calls


@pytest.fixture(autouse=True)
def setup(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test")
    monkeypatch.setattr(ga.time, "sleep", lambda s: None)


def test_success(monkeypatch):
    Client, _ = make_client([json.dumps(GOOD)])
    monkeypatch.setattr(ga.genai, "Client", Client)
    out = ga.analyze_skill_gap("resume", "jd")
    assert out["matched_skills"] == ["Python"]


def test_json_in_code_fence_is_ok(monkeypatch):
    Client, _ = make_client(["```json\n" + json.dumps(GOOD) + "\n```"])
    monkeypatch.setattr(ga.genai, "Client", Client)
    assert ga.analyze_skill_gap("r", "j")["matched_skills"] == ["Python"]


def test_503_is_retried(monkeypatch):
    Client, calls = make_client([Exception("503 UNAVAILABLE"), json.dumps(GOOD)])
    monkeypatch.setattr(ga.genai, "Client", Client)
    assert ga.analyze_skill_gap("r", "j")["matched_skills"] == ["Python"]
    assert calls["n"] == 2


def test_real_error_is_visible(monkeypatch):
    Client, _ = make_client([Exception("429 RESOURCE_EXHAUSTED quota")])
    monkeypatch.setattr(ga.genai, "Client", Client)
    with pytest.raises(RuntimeError) as e:
        ga.analyze_skill_gap("r", "j")
    assert "429 RESOURCE_EXHAUSTED" in str(e.value)
    assert "gemini-3.8-flash" in str(e.value)


def test_empty_and_bad_json_reported(monkeypatch):
    for bad in ["", "not json"]:
        Client, _ = make_client([bad])
        monkeypatch.setattr(ga.genai, "Client", Client)
        with pytest.raises(RuntimeError):
            ga.analyze_skill_gap("r", "j")


def test_missing_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY")
    with pytest.raises(ValueError):
        ga.analyze_skill_gap("r", "j")
