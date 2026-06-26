"""Extract per-page text from the exam-archive PDF using PyMuPDF, with a
pdfplumber fallback and an OCR-needed flag for pages with too little text.

Usage (Windows: use `py`, not `python` -- see README):
    py scripts/extract_pdf_text.py "<path-to-pdf>" [output_path]

No LLM calls. No question/answer logic -- that belongs in
parse_exam_questions.py.
"""

import json
import sys
from pathlib import Path

import fitz  # PyMuPDF

MIN_CHARS_THRESHOLD = 50


def extract_page_text_pymupdf(doc, page_index):
    page = doc[page_index]
    return page.get_text("text")


def extract_page_text_pdfplumber(pdf, page_index):
    page = pdf.pages[page_index]
    return page.extract_text() or ""


def is_text_quality_sufficient(text, char_count_threshold=MIN_CHARS_THRESHOLD):
    return len(text.strip()) >= char_count_threshold


def extract_all_pages(pdf_path):
    pages = []
    doc = fitz.open(pdf_path)
    page_count = len(doc)

    plumber_pdf = None  # opened lazily only if a fallback is actually needed
    try:
        for page_index in range(page_count):
            text = extract_page_text_pymupdf(doc, page_index)
            needs_ocr = False

            if not is_text_quality_sufficient(text):
                if plumber_pdf is None:
                    import pdfplumber

                    plumber_pdf = pdfplumber.open(pdf_path)
                fallback_text = extract_page_text_pdfplumber(plumber_pdf, page_index)
                if len(fallback_text.strip()) > len(text.strip()):
                    text = fallback_text
                if not is_text_quality_sufficient(text):
                    needs_ocr = True

            pages.append(
                {
                    "page": page_index + 1,
                    "text": text,
                    "char_count": len(text),
                    "needs_ocr": needs_ocr,
                }
            )
            print(f"page {page_index + 1}/{page_count}: {len(text)} chars, needs_ocr={needs_ocr}")
    finally:
        doc.close()
        if plumber_pdf is not None:
            plumber_pdf.close()

    return pages


def main():
    if len(sys.argv) < 2:
        print('Usage: py scripts/extract_pdf_text.py "<path-to-pdf>" [output_path]')
        sys.exit(1)

    pdf_path = sys.argv[1]
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).resolve().parent.parent / "data" / "raw_text_by_page.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    pages = extract_all_pages(pdf_path)

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=2)

    needs_ocr_count = sum(1 for p in pages if p["needs_ocr"])
    print(f"\nWrote {len(pages)} pages to {out_path}")
    print(f"Pages flagged needs_ocr: {needs_ocr_count}")


if __name__ == "__main__":
    main()
