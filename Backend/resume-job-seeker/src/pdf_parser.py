import io

import fitz  # PyMuPDF
from PIL import Image

from src.ocr import extract_text_from_image


PDF_TYPES = ["application/pdf"]
IMAGE_TYPES = ["image/png", "image/jpeg"]
DOCX_TYPES = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]


# ------------------------------------------------------------
# PDF
# ------------------------------------------------------------

def extract_text_from_pdf_bytes(data):

    document = fitz.open(stream=data, filetype="pdf")

    extracted_text = ""

    # First attempt: normal PDF text extraction
    for page in document:
        extracted_text += page.get_text() + "\n"

    if extracted_text.strip():
        document.close()
        return extracted_text.strip(), "PDF Text Extraction"

    # Scanned PDF -> OCR fallback
    ocr_text = ""

    for page in document:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        image = Image.open(io.BytesIO(pixmap.tobytes("png")))
        ocr_text += extract_text_from_image(image) + "\n"

    document.close()

    return ocr_text.strip(), "Tesseract OCR"


# ------------------------------------------------------------
# Images (PNG / JPG)
# ------------------------------------------------------------

def extract_text_from_image_bytes(data):

    image = Image.open(io.BytesIO(data))

    return extract_text_from_image(image), "Tesseract OCR"


# ------------------------------------------------------------
# Word documents (DOCX)  -- NEW, because the website accepts DOCX
# ------------------------------------------------------------

def extract_text_from_docx_bytes(data):

    from docx import Document

    document = Document(io.BytesIO(data))

    lines = [p.text for p in document.paragraphs if p.text.strip()]

    # Resumes often keep skills inside tables
    for table in document.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    lines.append(cell.text.strip())

    return "\n".join(lines).strip(), "DOCX Text Extraction"


# ------------------------------------------------------------
# One function that picks the right method (used by the API)
# ------------------------------------------------------------

def extract_text_from_bytes(data, content_type, filename=""):

    name = (filename or "").lower()

    if content_type in PDF_TYPES or name.endswith(".pdf"):
        return extract_text_from_pdf_bytes(data)

    if content_type in IMAGE_TYPES or name.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image_bytes(data)

    if content_type in DOCX_TYPES or name.endswith(".docx"):
        return extract_text_from_docx_bytes(data)

    raise ValueError("Unsupported file type. Please upload a PDF, DOCX, PNG or JPG.")


# ------------------------------------------------------------
# Old Streamlit-style function (kept so app.py still works)
# ------------------------------------------------------------

def extract_text_from_file(uploaded_file):

    return extract_text_from_bytes(
        uploaded_file.read(),
        uploaded_file.type,
        getattr(uploaded_file, "name", ""),
    )
