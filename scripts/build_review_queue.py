"""Build data/needs_review_queue.json: per-record prompts for a human or a
low-cost model (e.g. Haiku) to inspect needs_review records from the draft.

This script makes NO LLM API calls. It only prepares prompts; actually
running them through a model is a separate, manual step the user does
outside this pipeline.

Usage:
    py scripts/build_review_queue.py [draft_path] [out_path]
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

PROMPT_TEMPLATE = """以下是從PDF擷取的職業衛生管理甲級技術士術科考古題内容，文字可能因PDF解析而有缺漏或亂碼。
請僅根據提供的文字判斷並修正明顯的擷取錯誤或排版問題（例如多餘的換行、PDF擷取產生的亂碼字元、
題目與答案的分界），不要憑空補充你自己的專業知識或答案內容。若無法確定，請保留原文並標註
'無法確定'。

類別：{category} / {subcategory}
原始題目：
{question}

原始答案：
{answer}

請輸出修正後的題目與答案（若不需修正則原樣輸出），格式為 JSON：
{{"question": "...", "answer": "...", "needs_review": true 或 false}}"""


def build_prompt(record):
    return PROMPT_TEMPLATE.format(
        category=record.get("category") or "",
        subcategory=record.get("subcategory") or "",
        question=record.get("question") or "",
        answer=record.get("answer") or "",
    )


def main():
    draft_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "data" / "questions.draft.json"
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "data" / "needs_review_queue.json"

    with open(draft_path, "r", encoding="utf-8") as f:
        records = json.load(f)

    queue = []
    for record in records:
        if not record.get("needs_review"):
            continue
        queue.append(
            {
                "id": record["id"],
                "category": record.get("category"),
                "subcategory": record.get("subcategory"),
                "page": record.get("page"),
                "reasons": record.get("needs_review_reasons", []),
                "prompt": build_prompt(record),
            }
        )

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(queue, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(queue)} review prompts to {out_path}")
    print("No LLM calls were made -- run these prompts manually (or via Haiku) when ready.")


if __name__ == "__main__":
    main()
