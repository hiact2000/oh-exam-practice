"""Validate data/questions.draft.json and write data/parse_report.md.

Usage:
    py scripts/validate_questions.py [draft_path] [out_path]
"""

import json
import sys
import collections
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_questions(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def check_duplicate_ids(questions):
    counts = collections.Counter(q["id"] for q in questions)
    return [qid for qid, count in counts.items() if count > 1]


def check_empty_fields(questions):
    flagged = []
    for q in questions:
        missing = []
        if not q.get("question", "").strip():
            missing.append("question")
        if not q.get("answer", "").strip():
            missing.append("answer")
        if missing:
            flagged.append({"id": q["id"], "page": q["page"], "missing": missing})
    return flagged


def count_by_chapter(questions):
    counts = collections.Counter(q["category"] for q in questions)
    return dict(sorted(counts.items(), key=lambda kv: -kv[1]))


def count_by_subchapter(questions):
    counts = collections.Counter((q["category"], q["subcategory"]) for q in questions)
    return dict(sorted(counts.items(), key=lambda kv: (kv[0][0], -kv[1])))


def collect_needs_review(questions):
    reason_counts = collections.Counter()
    flagged = []
    for q in questions:
        reasons = q.get("needs_review_reasons", [])
        if q.get("needs_review"):
            flagged.append(q)
            for r in reasons:
                reason_counts[r] += 1
    return flagged, reason_counts


def generate_report(questions, out_path):
    total = len(questions)
    dup_ids = check_duplicate_ids(questions)
    empty_fields = check_empty_fields(questions)
    by_chapter = count_by_chapter(questions)
    by_subchapter = count_by_subchapter(questions)
    flagged, reason_counts = collect_needs_review(questions)

    lines = []
    lines.append("# Parse Report\n")
    lines.append("## Totals\n")
    lines.append(f"- Total questions: {total}")
    pct = (len(flagged) / total * 100) if total else 0
    lines.append(f"- needs_review: {len(flagged)} ({pct:.1f}%)")
    lines.append("- by needs_review reason:")
    for reason, count in reason_counts.most_common():
        lines.append(f"  - {reason}: {count}")
    lines.append("")

    lines.append("## By Chapter\n")
    lines.append("| Chapter | Count |")
    lines.append("|---|---|")
    for chapter, count in by_chapter.items():
        lines.append(f"| {chapter} | {count} |")
    lines.append("")

    lines.append("## By Chapter > Subchapter\n")
    lines.append("| Chapter | Subchapter | Count |")
    lines.append("|---|---|---|")
    for (chapter, subchapter), count in by_subchapter.items():
        lines.append(f"| {chapter} | {subchapter or '(none)'} | {count} |")
    lines.append("")

    lines.append("## Duplicate IDs\n")
    if dup_ids:
        for qid in dup_ids:
            lines.append(f"- {qid}")
    else:
        lines.append("none found")
    lines.append("")

    lines.append("## Empty Question/Answer Records\n")
    if empty_fields:
        lines.append("| id | page | missing |")
        lines.append("|---|---|---|")
        for item in empty_fields:
            lines.append(f"| {item['id']} | {item['page']} | {', '.join(item['missing'])} |")
    else:
        lines.append("none found")
    lines.append("")

    lines.append("## Needs-Review Queue (full list)\n")
    if flagged:
        lines.append("| id | page | reasons | preview |")
        lines.append("|---|---|---|---|")
        for q in flagged:
            preview = q["question"].replace("\n", " ")[:80].replace("|", "/")
            reasons = ", ".join(q.get("needs_review_reasons", []))
            lines.append(f"| {q['id']} | {q['page']} | {reasons} | {preview} |")
    else:
        lines.append("none found")
    lines.append("")

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return {
        "total": total,
        "needs_review": len(flagged),
        "duplicate_ids": dup_ids,
        "empty_fields": empty_fields,
    }


def main():
    draft_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "questions.draft.json"
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / "parse_report.md"

    questions = load_questions(draft_path)
    summary = generate_report(questions, out_path)

    print(f"Total: {summary['total']}, needs_review: {summary['needs_review']}")
    print(f"Duplicate ids: {len(summary['duplicate_ids'])}")
    print(f"Empty fields: {len(summary['empty_fields'])}")
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
