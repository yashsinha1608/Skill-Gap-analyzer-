import streamlit as st
from dotenv import load_dotenv

load_dotenv()

from src.pdf_parser import extract_text_from_file
from src.embeddings import generate_embedding
from src.similarity import calculate_similarity
from src.gemini_analyzer import analyze_skill_gap


# ============================================================
# CONFIGURATION
# ============================================================


st.set_page_config(
    page_title="Resume Job Matcher",
    page_icon="📄",
    layout="wide"
)


# ============================================================
# PAGE HEADER
# ============================================================

st.title("📄 Resume–Job Matcher")

st.markdown(
    """
    ### AI-powered resume analysis

    Upload your resume and paste a job description to discover:

    - 📊 Semantic alignment between your resume and the job
    - ✅ Matched skills
    - 🟡 Partially matched skills
    - ❌ Skill gaps
    - 💡 Personalized recommendations
    """
)

st.divider()


# ============================================================
# SIDEBAR
# ============================================================

with st.sidebar:

    st.header("⚙️ How It Works")

    st.markdown(
        """
        **1. Upload Resume**

        PDF or image resumes are supported.

        **2. Extract Text**

        Text-based PDFs use PyMuPDF.

        Scanned PDFs and images use Tesseract OCR.

        **3. Generate Embeddings**

        A local Sentence Transformer converts the
        resume and job description into vectors.

        **4. Calculate Similarity**

        Cosine similarity measures semantic alignment.

        **5. Analyze Skills**

        Gemini identifies matched, partial and
        missing skills.

        **6. Generate Recommendations**

        The system provides actionable suggestions.
        """
    )

    st.divider()

    st.caption(
        "🔒 Resume processing is performed locally "
        "where possible. Gemini is used for AI analysis."
    )


# ============================================================
# STEP 1 — RESUME UPLOAD
# ============================================================

st.header("1. Upload Your Resume")

uploaded_file = st.file_uploader(
    "Choose your resume",
    type=["pdf", "png", "jpg", "jpeg"],
    help="Supported formats: PDF, PNG, JPG and JPEG"
)


# ============================================================
# STEP 2 — JOB DESCRIPTION
# ============================================================

st.header("2. Job Description")

job_description = st.text_area(
    "Paste the job description here",
    height=300,
    placeholder=(
        "Example:\n\n"
        "We are looking for a Software Engineer with "
        "experience in Python, SQL, REST APIs, Docker "
        "and cloud technologies..."
    )
)


# ============================================================
# ANALYSIS BUTTON
# ============================================================

analyze_button = st.button(
    "🚀 Analyze Resume",
    type="primary",
    use_container_width=True
)


# ============================================================
# MAIN ANALYSIS
# ============================================================

if analyze_button:

    # --------------------------------------------------------
    # Validate inputs
    # --------------------------------------------------------

    if uploaded_file is None:

        st.error(
            "Please upload your resume before analyzing."
        )

        st.stop()

    if not job_description.strip():

        st.error(
            "Please enter a job description before analyzing."
        )

        st.stop()

    # --------------------------------------------------------
    # STEP 3 — EXTRACT RESUME TEXT
    # --------------------------------------------------------

    st.header("3. Resume Processing")

    try:

        with st.spinner(
            "Extracting text from your resume..."
        ):

            resume_text, extraction_method = (
                extract_text_from_file(
                    uploaded_file
                )
            )

    except Exception as e:

        st.error(
            f"Unable to process the resume: {e}"
        )

        st.stop()

    # --------------------------------------------------------
    # Check extracted text
    # --------------------------------------------------------

    if not resume_text.strip():

        st.error(
            "No readable text could be extracted "
            "from the uploaded resume."
        )

        st.stop()

    # --------------------------------------------------------
    # Extraction status
    # --------------------------------------------------------

    col1, col2 = st.columns(2)

    with col1:

        st.success(
            "✅ Resume processed successfully"
        )

    with col2:

        st.info(
            f"📄 Extraction: {extraction_method}"
        )

    # --------------------------------------------------------
    # Show extracted text
    # --------------------------------------------------------

    with st.expander(
        "🔍 View extracted resume text"
    ):

        st.text_area(
            "Resume Text",
            resume_text,
            height=350
        )

    # ========================================================
    # STEP 4 — SEMANTIC EMBEDDINGS
    # ========================================================

    st.header("4. Semantic Matching")

    try:

        with st.spinner(
            "Generating semantic embeddings..."
        ):

            resume_embedding = generate_embedding(
                resume_text
            )

            job_embedding = generate_embedding(
                job_description
            )

    except Exception as e:

        st.error(
            f"Unable to generate embeddings: {e}"
        )

        st.stop()

    # ========================================================
    # STEP 5 — COSINE SIMILARITY
    # ========================================================

    try:

        similarity_score = calculate_similarity(
            resume_embedding,
            job_embedding
        )

        similarity_percentage = (
            similarity_score * 100
        )

    except Exception as e:

        st.error(
            f"Unable to calculate similarity: {e}"
        )

        st.stop()

    # --------------------------------------------------------
    # Display similarity score
    # --------------------------------------------------------

    st.subheader(
        "📊 Semantic Alignment Score"
    )

    score_col1, score_col2, score_col3 = st.columns(
        [1, 2, 1]
    )

    with score_col2:

        st.metric(
            "Resume–Job Similarity",
            f"{similarity_percentage:.2f}%"
        )

        st.progress(
            min(
                max(similarity_score, 0.0),
                1.0
            )
        )

    # --------------------------------------------------------
    # Score interpretation
    # --------------------------------------------------------

    if similarity_percentage >= 80:

        st.success(
            "🟢 Strong semantic alignment with the job description."
        )

    elif similarity_percentage >= 60:

        st.warning(
            "🟡 Moderate semantic alignment. "
            "There may be some skill gaps."
        )

    else:

        st.error(
            "🔴 Low semantic alignment. "
            "The resume differs significantly from the job requirements."
        )

    # ========================================================
    # STEP 6 — GEMINI SKILL ANALYSIS
    # ========================================================

    st.header("5. AI Skill Gap Analysis")

    try:

        with st.spinner(
            "Gemini is analyzing your skills against the job..."
        ):

            analysis = analyze_skill_gap(
                resume_text,
                job_description
            )

    except Exception as e:

        st.error(
            f"Gemini analysis failed: {e}"
        )

        st.stop()

    # ========================================================
    # OVERALL SUMMARY
    # ========================================================

    st.subheader(
        "🎯 Overall Assessment"
    )

    st.info(
        analysis.get(
            "overall_summary",
            "No overall assessment was generated."
        )
    )

    # ========================================================
    # SKILL COUNTS
    # ========================================================

    matched_skills = analysis.get(
        "matched_skills",
        []
    )

    partial_skills = analysis.get(
        "partial_skills",
        []
    )

    missing_skills = analysis.get(
        "missing_skills",
        []
    )

    count_col1, count_col2, count_col3 = st.columns(3)

    with count_col1:

        st.metric(
            "✅ Matched",
            len(matched_skills)
        )

    with count_col2:

        st.metric(
            "🟡 Partial",
            len(partial_skills)
        )

    with count_col3:

        st.metric(
            "❌ Missing",
            len(missing_skills)
        )

    st.divider()

    # ========================================================
    # MATCHED SKILLS
    # ========================================================

    st.subheader(
        "✅ Matched Skills"
    )

    if matched_skills:

        for skill in matched_skills:

            st.success(
                f"✓ {skill}"
            )

    else:

        st.info(
            "No strong skill matches were identified."
        )

    # ========================================================
    # PARTIAL SKILLS
    # ========================================================

    st.subheader(
        "🟡 Partial Matches"
    )

    if partial_skills:

        for skill in partial_skills:

            st.warning(
                f"~ {skill}"
            )

    else:

        st.info(
            "No partial skill matches were identified."
        )

    # ========================================================
    # MISSING SKILLS
    # ========================================================

    st.subheader(
        "❌ Skill Gaps"
    )

    if missing_skills:

        for skill in missing_skills:

            st.error(
                f"✗ {skill}"
            )

    else:

        st.success(
            "🎉 No significant skill gaps were identified."
        )

    # ========================================================
    # SKILL EVIDENCE
    # ========================================================

    required_skills = analysis.get(
        "required_skills",
        []
    )

    if required_skills:

        st.subheader(
            "🔎 Skill Evidence"
        )

        for item in required_skills:

            skill = item.get(
                "skill",
                "Unknown Skill"
            )

            status = item.get(
                "status",
                "UNKNOWN"
            )

            evidence = item.get(
                "evidence",
                "No evidence provided."
            )

            with st.expander(
                f"{skill} — {status}"
            ):

                st.write(
                    evidence
                )

    # ========================================================
    # RECOMMENDATIONS
    # ========================================================

    recommendations = analysis.get(
        "recommendations",
        []
    )

    st.subheader(
        "💡 Recommendations"
    )

    if recommendations:

        for recommendation in recommendations:

            st.markdown(
                f"• {recommendation}"
            )

    else:

        st.info(
            "No specific recommendations were generated."
        )

    # ========================================================
    # FINAL SUMMARY
    # ========================================================

    st.divider()

    st.header(
        "📋 Analysis Summary"
    )

    summary_col1, summary_col2 = st.columns(2)

    with summary_col1:

        st.metric(
            "Semantic Similarity",
            f"{similarity_percentage:.2f}%"
        )

    with summary_col2:

        total_skills = (
            len(matched_skills)
            + len(partial_skills)
            + len(missing_skills)
        )

        if total_skills > 0:

            skill_coverage = (
                (
                    len(matched_skills)
                    + 0.5 * len(partial_skills)
                )
                / total_skills
            ) * 100

        else:

            skill_coverage = 0

        st.metric(
            "Skill Coverage",
            f"{skill_coverage:.2f}%"
        )

    st.caption(
        "Semantic similarity measures overall contextual "
        "alignment, while skill coverage estimates how many "
        "identified job requirements are demonstrated by "
        "the resume."
    )

    # ========================================================
    # DISCLAIMER
    # ========================================================

    st.divider()

    st.caption(
        "⚠️ This tool provides AI-assisted resume analysis. "
        "It should be used as guidance rather than a definitive "
        "assessment of job eligibility."
    )