import os
import platform

import pytesseract


def _configure_tesseract():
    """
    Tesseract is the program that reads text out of images.
    - On your Windows laptop it lives in "C:\\Program Files\\Tesseract-OCR".
    - On a Linux server (deployment) it is found automatically on PATH.
    You can also force a location with the TESSERACT_CMD setting in .env.
    """
    custom_path = os.getenv("TESSERACT_CMD")

    if custom_path:
        pytesseract.pytesseract.tesseract_cmd = custom_path
        return

    if platform.system() == "Windows":
        windows_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(windows_path):
            pytesseract.pytesseract.tesseract_cmd = windows_path


_configure_tesseract()


def extract_text_from_image(image):

    text = pytesseract.image_to_string(image)

    return text.strip()
