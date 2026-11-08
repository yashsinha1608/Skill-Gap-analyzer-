import pytesseract
from PIL import Image


pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


image_path = "test_resume.png"

image = Image.open(image_path)

text = pytesseract.image_to_string(image)

print("\n========== EXTRACTED TEXT ==========\n")
print(text)
print("\n=====================================\n")