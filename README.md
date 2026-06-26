# 職業衛生管理甲級技術士術科考古題刷題

線上練習網站：**https://hiact2000.github.io/oh-exam-practice/**

---

## 功能

- 依章節瀏覽並練習歷年術科考古題
- 標記錯題、收藏題目，下次重點複習
- 全文搜尋任意關鍵字
- 首頁顯示各主題出題率視覺化（橫向 bar chart）
- 進度自動存於瀏覽器（不需登入、無後端）

## 題庫來源

考古題彙整自 **Hsiao 的工安部屋家族**（Facebook 社團）公開分享之
《職業衛生管理甲級技術士術科考古題參考集錦》PDF（更新至 115/03/27 版）。

感謝 Hsiao 老師長期整理與無私分享，讓許多備考者受益。

## 本地開發

```bash
npm install
npm run dev
# 開啟 http://localhost:5173/
```

## 部署

推送至 `main` 分支後，GitHub Actions 會自動部署至 GitHub Pages（約 1～2 分鐘）。

```bash
git add .
git commit -m "說明"
git push
```

## 題庫更新（PDF 重新解析）

> Windows 請用 `py` 而非 `python`

```bash
py scripts/extract_pdf_text.py "<PDF路徑>"
py scripts/parse_exam_questions.py
py scripts/validate_questions.py          # 產生 data/parse_report.md，確認解析品質
# 確認無誤後，合併至正式題庫：
Copy-Item data\questions.draft.json src\data\questions.json -Force
git add src/data/questions.json
git commit -m "feat: 更新題庫"
git push
```

## 資料說明

| 路徑 | 說明 |
|------|------|
| `src/data/questions.json` | 網站使用的正式題庫 |
| `data/questions.draft.json` | PDF 解析草稿（含 `needs_review` 標記） |
| `data/parse_report.md` | 解析品質報告 |

## localStorage

| 鍵 | 說明 |
|----|------|
| `oh_exam_wrong_questions` | 錯題 id 清單 |
| `oh_exam_favorites` | 我的最愛 id 清單 |

清除瀏覽器 localStorage 可重置所有進度。
