# 職衛甲級術科考古題刷題 — Claude 開發指引

## 專案概述

純前端刷題網站（React + Vite + Tailwind CSS），無後端、無登入。
題庫存放於 `src/data/questions.json`，進度存於 localStorage。

## 部署資訊

- **GitHub repo**：https://github.com/hiact2000/oh-exam-practice
- **線上網址**：https://hiact2000.github.io/oh-exam-practice/
- **自動部署**：push 到 `main` branch 後，GitHub Actions（`.github/workflows/deploy.yml`）自動 build 並部署，約 1～2 分鐘生效

## 更新流程

```bash
# 修改程式碼後
git add <修改的檔案>
git commit -m "說明這次改了什麼"
git push
# → GitHub Actions 自動重新部署
```

## 本地開發

```bash
npm install   # 首次或 package.json 變更後
npm run dev   # http://localhost:5173/
```

> 注意：本地 dev server 使用預設 base（`/`），線上版使用 `/oh-exam-practice/`，
> 兩者路由行為相同，不需要另外設定。

## 重要檔案

| 路徑 | 說明 |
|------|------|
| `src/data/questions.json` | 正式題庫，網站直接 import |
| `src/pages/Home.jsx` | 首頁，含出題率視覺化（大分類 + 子分類 bar chart）|
| `src/pages/Practice.jsx` | 章節刷題頁 |
| `src/components/QuestionCard.jsx` | 題目卡片（顯示題目、答案、錯題/最愛標記）|
| `src/utils/storage.js` | localStorage 管理（錯題、最愛）|
| `vite.config.js` | `base: '/oh-exam-practice/'`，不可移除，否則 GitHub Pages 資源路徑會失效 |
| `.github/workflows/deploy.yml` | GitHub Actions 自動部署設定 |

## 題庫更新流程（PDF 重新解析）

```bash
py scripts/extract_pdf_text.py "<PDF路徑>"
py scripts/parse_exam_questions.py
py scripts/validate_questions.py        # 看 data/parse_report.md
# 確認無誤後：
Copy-Item data\questions.draft.json src\data\questions.json -Force
git add src/data/questions.json
git commit -m "feat: 更新題庫"
git push
```

## 注意事項

- Windows 上請用 `py` 而非 `python`（後者被 Microsoft Store 替身攔截）
- `data/` 下的 JSON 是中間產物，`src/data/questions.json` 才是網站使用的正式來源
- `vite.config.js` 的 `base` 設定必須與 repo 名稱一致
