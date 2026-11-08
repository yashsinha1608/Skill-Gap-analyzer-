def compute_readiness(similarity, matched, partial, missing):
    """
    Turns everything we know into ONE number from 0 to 100.

    - skill coverage: matched skills count fully, partial skills count half.
    - similarity: how close the resume and job description are in meaning.

    Final score = 70% skill coverage + 30% similarity.
    If similarity is not available, we use skill coverage alone.
    """

    total = matched + partial + missing

    coverage = ((matched + 0.5 * partial) / total * 100) if total else 0.0

    if similarity is None:
        score = coverage
    else:
        similarity_pct = max(0.0, min(1.0, float(similarity))) * 100
        score = 0.7 * coverage + 0.3 * similarity_pct

    return {
        "readiness_score": int(round(max(0, min(100, score)))),
        "skill_coverage": round(coverage, 1),
    }
