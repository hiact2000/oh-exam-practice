"""Parse data/raw_text_by_page.json into data/questions.draft.json.

Pure regex / state-machine logic. No LLM calls anywhere in this script.

Usage:
    py scripts/parse_exam_questions.py [raw_text_path] [out_dir]
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TITLE_LINE = "職業衛生管理甲級技術士術科考古題參考集錦"
RE_BYLINE = re.compile(r"^ehic_Hsiao\s*$")
RE_DATE = re.compile(r"^114/11/11\s*$")
RE_PAGENUM_TILDE = re.compile(r"^~\s*\d+\s*~\s*$")
RE_PAGENUM_OF = re.compile(r"^\d+\s+of\s+247\s*$")
RE_FACEBOOK = re.compile(r"facebook\.com", re.IGNORECASE)

RE_TOC_LINE = re.compile(r"^(?P<name>.+?)\.{5,}\s*(?P<page>\d+)\s*$")
RE_TOP_CHAPTER_PREFIX = re.compile(r"^[一二三四五六七八九十]+、")
KNOWN_UNPREFIXED_CHAPTERS = {"解釋名詞"}

RE_BRACKET = re.compile(r"【([^】]+)】")
RE_ANSWER_MARKER = re.compile(r"^答[：:]\s*$")
RE_POINTS = re.compile(r"(\d+)\s*分")
RE_GLOSSARY_TERM = re.compile(r"^(\d{1,2})[.、]\s*(.+)$")
GLOSSARY_SPLIT_THRESHOLD_CHARS = 1500  # answers longer than this in 解釋名詞 get re-split
NEEDS_REVIEW_UNUSUAL_DENSITY_THRESHOLD = 0.03

NEW_LAWS_GLOSSARY_MARKER = "【新修法令-解釋名詞】"


def is_candidate_source(bracket_content):
    """Digit-shape gate (the main exam-code shape) or a narrow legal-citation
    allow-list (anything containing '§'). Filters out in-answer annotation
    brackets like 【略】/【辨識評估】/【WBGT=...】 which match neither."""
    content = bracket_content.strip()
    if re.match(r"^\d{2,3}[A-Za-z]?(-|$)", content):
        return True, "numeric"
    if "§" in content:
        return True, "legal"
    return False, None


RE_CITATION_PREFIX = re.compile(r"略\s*$")


def is_citation_reference(line_text, bracket_start):
    """True if the text right before this bracket ends in '略' (e.g. '熱適應：
    略【084-02-01】') -- a cross-reference to a previously-answered question,
    not this question's own exam source."""
    return bool(RE_CITATION_PREFIX.search(line_text[:bracket_start]))


def strip_boilerplate_lines(text):
    lines = text.split("\n")
    kept = []
    for line in lines:
        stripped = line.strip()
        if stripped == TITLE_LINE:
            continue
        if RE_BYLINE.match(stripped):
            continue
        if RE_DATE.match(stripped):
            continue
        if RE_PAGENUM_TILDE.match(stripped):
            continue
        if RE_PAGENUM_OF.match(stripped):
            continue
        if RE_FACEBOOK.search(stripped):
            continue
        kept.append(line)
    return kept


def load_lines_with_pages(raw_pages):
    """Returns a flat list of (page_number, line_text) across the whole doc,
    boilerplate stripped, blank lines preserved (load-bearing for splitting)."""
    out = []
    for page in raw_pages:
        for line in strip_boilerplate_lines(page["text"]):
            out.append((page["page"], line))
    return out


def unusual_codepoint_density(text):
    if not text:
        return 0.0
    unusual = 0
    for ch in text:
        code = ord(ch)
        if ch.isspace():
            continue
        if 0x4E00 <= code <= 0x9FFF:  # CJK unified ideographs
            continue
        if 0x3000 <= code <= 0x303F or 0xFF00 <= code <= 0xFFEF:  # CJK punctuation
            continue
        if code < 0x2000 and (ch.isalnum() or unicodedata.category(ch).startswith("P")):
            continue
        unusual += 1
    return unusual / max(len(text), 1)


# ---------------------------------------------------------------------------
# Pass 1: TOC parsing -> chapters/subchapters + page anchors
# ---------------------------------------------------------------------------


def parse_toc(lines_with_pages):
    toc_lines = [(page, line) for page, line in lines_with_pages if page in (1, 2)]
    chapters = []
    current = None

    for _page, raw_line in toc_lines:
        line = raw_line.strip()
        if not line:
            continue
        match = RE_TOC_LINE.match(line)
        if not match:
            continue
        name = match.group("name").strip()
        toc_page = int(match.group("page"))

        if RE_TOP_CHAPTER_PREFIX.match(name) or name in KNOWN_UNPREFIXED_CHAPTERS:
            clean_name = RE_TOP_CHAPTER_PREFIX.sub("", name)
            current = {"name": clean_name, "start_page": toc_page, "subchapters": []}
            chapters.append(current)
        elif current is not None:
            current["subchapters"].append({"name": name, "start_page": toc_page})

    return {"chapters": chapters}


def build_heading_index(toc):
    heading_to_category = {}
    page_range_fallback = []

    for chapter in toc["chapters"]:
        heading_to_category[chapter["name"]] = (chapter["name"], None)
        page_range_fallback.append((chapter["start_page"], chapter["name"], None))
        for sub in chapter["subchapters"]:
            heading_to_category[sub["name"]] = (chapter["name"], sub["name"])
            page_range_fallback.append((sub["start_page"], chapter["name"], sub["name"]))

    # Undocumented sub-heading found inside 解釋名詞 (not present in the TOC).
    heading_to_category[NEW_LAWS_GLOSSARY_MARKER] = ("解釋名詞", "新修法令-解釋名詞")

    page_range_fallback.sort(key=lambda t: t[0])
    return heading_to_category, page_range_fallback


def category_for_page(page_range_fallback, page):
    chapter, subchapter = None, None
    for start_page, c, s in page_range_fallback:
        if start_page <= page:
            chapter, subchapter = c, s
        else:
            break
    return chapter, subchapter


# ---------------------------------------------------------------------------
# Pass 2: boundary detection (confirmed 【code】 ... 答： pairs)
# ---------------------------------------------------------------------------


def find_boundaries(lines_with_pages):
    boundaries = []
    recent_codes = []  # list of (raw_bracket_text, line_idx, kind)

    for idx, (_page, line) in enumerate(lines_with_pages):
        stripped = line.strip()
        for match in RE_BRACKET.finditer(stripped):
            ok, kind = is_candidate_source(match.group(1))
            if ok and not is_citation_reference(stripped, match.start()):
                recent_codes.append((match.group(0), idx, kind))
        if RE_ANSWER_MARKER.match(stripped):
            boundaries.append(
                {
                    "answer_idx": idx,
                    "codes": [c for c, _, _ in recent_codes],
                    "code_idxs": [i for _, i, _ in recent_codes],
                    "kinds": [k for _, _, k in recent_codes],
                }
            )
            recent_codes = []

    return boundaries


# ---------------------------------------------------------------------------
# Pass 3: zone splitting + record assembly
# ---------------------------------------------------------------------------


def join_lines(lines_with_pages, start, end):
    return "\n".join(line for _page, line in lines_with_pages[start:end]).strip()


def derive_question_id(codes, page, seen_ids):
    if not codes:
        base = f"noid-{page}"
    else:
        parts = []
        for code in codes:
            content = code.strip("【】")
            content = re.sub(r"[、，,\s]", "_", content)
            content = re.sub(r"[^0-9A-Za-z一-鿿_-]", "", content)
            parts.append(content)
        base = "_".join(parts)

    if base not in seen_ids:
        seen_ids.add(base)
        return base, False

    suffix_codes = "bcdefghijklmnopqrstuvwxyz"
    for suffix in suffix_codes:
        candidate = f"{base}-{suffix}"
        if candidate not in seen_ids:
            seen_ids.add(candidate)
            return candidate, True
    # Extremely unlikely fallback.
    candidate = f"{base}-{len(seen_ids)}"
    seen_ids.add(candidate)
    return candidate, True


def strip_source_codes(text):
    return RE_BRACKET.sub(lambda m: "" if is_candidate_source(m.group(1))[0] else m.group(0), text).strip()


def extract_points(question_text):
    matches = RE_POINTS.findall(question_text)
    if not matches:
        return None, []
    raw = [f"{m}分" for m in matches]
    return sum(int(m) for m in matches), raw


def parse_glossary_fallback(answer_text, page, start_n):
    """Split an over-long 解釋名詞 answer blob into individual numbered terms."""
    lines = answer_text.split("\n")
    records = []
    current_term, current_lines, current_n = None, [], None

    def flush():
        if current_term is not None:
            records.append(
                {
                    "id": f"glossary-{page}-{current_n}",
                    "category": "解釋名詞",
                    "subcategory": None,
                    "question": current_term,
                    "answer": "\n".join(current_lines).strip(),
                    "points": None,
                    "points_raw": [],
                    "source": "",
                    "page": page,
                    "needs_review": True,
                    "needs_review_reasons": ["glossary_fallback_no_source"],
                }
            )

    for line in lines:
        match = RE_GLOSSARY_TERM.match(line.strip())
        if match:
            flush()
            current_n = match.group(1)
            current_term = match.group(2)
            current_lines = []
        elif current_term is not None:
            current_lines.append(line)
    flush()
    return records if len(records) > 1 else []


def parse_body(lines_with_pages, heading_to_category, page_range_fallback):
    boundaries = find_boundaries(lines_with_pages)
    if not boundaries:
        return []

    seen_ids = set()
    records = []

    first_page = lines_with_pages[0][0] if lines_with_pages else 1
    state_chapter, state_subchapter = category_for_page(page_range_fallback, first_page)

    prev_split_end = 0  # index where the previous zone's question-lead text started
    pending_reasons = []  # needs_review reasons deferred from the previous zone's split

    for j, boundary in enumerate(boundaries):
        question_page = lines_with_pages[boundary["code_idxs"][0]][0] if boundary["codes"] else lines_with_pages[boundary["answer_idx"]][0]

        question_raw = join_lines(lines_with_pages, prev_split_end, boundary["answer_idx"])
        question_text = strip_source_codes(question_raw)

        reasons = pending_reasons
        pending_reasons = []
        if not boundary["codes"]:
            reasons.append("no_source_code_for_boundary")
        if any(k == "legal" for k in boundary["kinds"]):
            reasons.append("nonstandard_source_code")

        # Determine where this question's answer ends, processing the zone up to
        # the next boundary (or end of document for the final boundary).
        if j + 1 < len(boundaries):
            next_boundary = boundaries[j + 1]
            zone_start = boundary["answer_idx"] + 1
            zone_end = next_boundary["code_idxs"][0] if next_boundary["codes"] else next_boundary["answer_idx"]

            # Heading detection inside the zone: update state, exclude those lines.
            zone_indices = list(range(zone_start, zone_end))
            heading_positions = []
            for i in zone_indices:
                line_text = lines_with_pages[i][1].strip()
                if line_text in heading_to_category:
                    heading_positions.append((i, heading_to_category[line_text]))

            content_indices = [i for i in zone_indices if i not in {p for p, _ in heading_positions}]

            # Last blank line among the non-heading zone lines.
            split_rel = None
            for rel_pos, i in enumerate(content_indices):
                if lines_with_pages[i][1].strip() == "":
                    split_rel = rel_pos

            if split_rel is not None and content_indices:
                split_idx = content_indices[split_rel]
                answer_end = split_idx
                prev_split_end = split_idx + 1
            else:
                answer_end = zone_start
                prev_split_end = zone_start
                reasons.append("ambiguous_zone_no_blank_line")
                pending_reasons.append("ambiguous_zone_no_blank_line")

            answer_raw = join_lines(lines_with_pages, zone_start, answer_end)
            # Apply chapter/subchapter heading transitions discovered in this zone
            # for the UPCOMING question (boundary j+1) before moving on.
            for _pos, (chap, sub) in heading_positions:
                state_chapter, state_subchapter = chap, sub
        else:
            answer_raw = join_lines(lines_with_pages, boundary["answer_idx"] + 1, len(lines_with_pages))

        answer_text = answer_raw.strip()

        if not question_text:
            reasons.append("empty_question")
        if not answer_text:
            reasons.append("empty_answer")

        density = max(unusual_codepoint_density(question_text), unusual_codepoint_density(answer_text))
        if density > NEEDS_REVIEW_UNUSUAL_DENSITY_THRESHOLD:
            reasons.append("high_unusual_codepoint_density")

        if state_chapter == "解釋名詞" and len(answer_text) > GLOSSARY_SPLIT_THRESHOLD_CHARS:
            sub_records = parse_glossary_fallback(answer_text, question_page, j)
            if sub_records:
                for rec in sub_records:
                    rec_id, collided = derive_question_id([], rec["page"], seen_ids)
                    rec["id"] = rec_id
                    if collided:
                        rec["needs_review_reasons"].append("id_collision_resolved")
                    records.append(rec)
                continue

        rec_id, collided = derive_question_id(boundary["codes"], question_page, seen_ids)
        if collided:
            reasons.append("id_collision_resolved")

        points, points_raw = extract_points(question_text)

        records.append(
            {
                "id": rec_id,
                "category": state_chapter,
                "subcategory": state_subchapter,
                "question": question_text,
                "answer": answer_text,
                "points": points,
                "points_raw": points_raw,
                "source": "".join(boundary["codes"]),
                "page": question_page,
                "needs_review": bool(reasons),
                "needs_review_reasons": reasons,
            }
        )

    return records


def main():
    raw_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "raw_text_by_page.json"
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data"
    out_dir.mkdir(parents=True, exist_ok=True)

    with open(raw_path, "r", encoding="utf-8") as f:
        raw_pages = json.load(f)

    lines_with_pages = load_lines_with_pages(raw_pages)

    toc = parse_toc(lines_with_pages)
    with open(out_dir / "toc.json", "w", encoding="utf-8") as f:
        json.dump(toc, f, ensure_ascii=False, indent=2)

    heading_to_category, page_range_fallback = build_heading_index(toc)

    # Body starts after the TOC pages (1-2).
    body_start = next(i for i, (page, _line) in enumerate(lines_with_pages) if page >= 3)
    body_lines = lines_with_pages[body_start:]

    records = parse_body(body_lines, heading_to_category, page_range_fallback)

    with open(out_dir / "questions.draft.json", "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    needs_review_count = sum(1 for r in records if r["needs_review"])
    print(f"Parsed {len(records)} questions ({needs_review_count} flagged needs_review)")
    print(f"Wrote {out_dir / 'questions.draft.json'}")


if __name__ == "__main__":
    main()
