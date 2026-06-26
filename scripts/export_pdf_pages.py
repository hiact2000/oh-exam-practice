"""
Export PDF pages as JPEG images for questions that have missing tables or garbled formulas.
Output: public/pdf-pages/page-{N}.jpg
Usage: py scripts/export_pdf_pages.py
"""
import json
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF

PDF_PATH = Path(r"C:\Users\hicat\Downloads\職業衛生管理甲級技術士考古題集錦-1150327.pdf")
QUESTIONS_JSON = Path("src/data/questions.json")
OUT_DIR = Path("public/pdf-pages")

TABLE_REF_RE = re.compile(r"[下前附上][表列]|表[一二三四五六七八九十1-9]")


def has_pua(text: str) -> bool:
    return any(0xF000 <= ord(c) <= 0xF8FF for c in (text or ""))


def needs_screenshot(q: dict) -> bool:
    text = (q.get("question") or "") + (q.get("answer") or "")
    return has_pua(text) or bool(TABLE_REF_RE.search(text))


def main():
    if not PDF_PATH.exists():
        print(f"PDF not found: {PDF_PATH}", file=sys.stderr)
        sys.exit(1)

    questions = json.loads(QUESTIONS_JSON.read_text(encoding="utf-8"))
    target_pages = sorted({
        q["page"] for q in questions
        if q.get("page") and needs_screenshot(q)
    })
    print(f"Pages to export: {len(target_pages)} — {target_pages}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF_PATH)
    total_pages = len(doc)

    zoom = 1.5  # 108 DPI — readable on mobile, ~100-200 KB/page
    mat = fitz.Matrix(zoom, zoom)
    exported = 0
    skipped = 0

    for page_num in target_pages:
        idx = page_num - 1  # PyMuPDF is 0-based
        if idx < 0 or idx >= total_pages:
            print(f"  skip page {page_num}: out of range (PDF has {total_pages} pages)")
            skipped += 1
            continue
        out_path = OUT_DIR / f"page-{page_num}.jpg"
        page = doc[idx]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        pix.save(str(out_path), jpg_quality=78)
        kb = out_path.stat().st_size // 1024
        print(f"  page {page_num:3d} → {out_path.name}  ({kb} KB)")
        exported += 1

    doc.close()
    total_kb = sum(f.stat().st_size for f in OUT_DIR.glob("*.jpg")) // 1024
    print(f"\nDone: {exported} pages exported, {skipped} skipped")
    print(f"Total size: {total_kb} KB ({total_kb/1024:.1f} MB)")


if __name__ == "__main__":
    main()
