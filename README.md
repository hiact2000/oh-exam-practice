# 職業衛生管理甲級技術士術科考古題刷題

把「職業衛生管理甲級技術士術科考古題參考集錦」PDF 轉成的簡易刷題網站。不使用後端、不使用登入，
PDF 文字抽取與題庫解析全部使用 Python/regex（不呼叫大型模型），網站用 React + Vite + Tailwind，
答題進度（錯題、最愛）存在瀏覽器 localStorage。

## 安裝與啟動網站

```bash
npm install
npm run dev
```

開啟瀏覽器到 `http://localhost:5173/`。

## 資料來源說明（重要）

- `data/questions.draft.json`：PDF 解析腳本的**草稿輸出**，包含每題的 `needs_review` 標記，
  尚未經過人工檢查，**網站不會直接讀取這個檔案**。
- `src/data/questions.json`：網站**正式使用**的題庫，React 直接用
  `import questions from '../data/questions.json'` 載入。第一版只用這一份資料，不再額外使用
  `public/questions.json`，避免兩份資料不同步。
- 從草稿轉成正式題庫的方式（人工檢查 `data/parse_report.md` 之後）：

  ```bash
  cp data/questions.draft.json src/data/questions.json
  ```

  （Windows PowerShell：`Copy-Item data\questions.draft.json src\data\questions.json -Force`）

  `needs_review` 欄位會原樣保留到 `src/data/questions.json`，網站會顯示一個小標籤提示「待人工複核」，
  但不會影響刷題、搜尋、錯題、最愛等任何功能。

## PDF 解析流程（依序執行）

> Windows 注意：本機 `python` 指令被導向一個無法使用的 Microsoft Store 替身，請一律使用 `py`。

1. 安裝 Python 套件：

   ```bash
   py -m pip install -r requirements.txt
   ```

2. 抽取 PDF 文字（PyMuPDF 優先，必要時用 pdfplumber 補強，純文字抽取不呼叫任何模型）：

   ```bash
   py scripts/extract_pdf_text.py "<PDF路徑>"
   ```

   輸出：`data/raw_text_by_page.json`（每頁文字、字數、是否需要 OCR）。

3. 解析題庫（純 regex/狀態機，不呼叫任何模型）：

   ```bash
   py scripts/parse_exam_questions.py
   ```

   輸出：`data/toc.json`（解析出的章節目錄）、`data/questions.draft.json`（題庫草稿）。

4. 驗證並產生報告：

   ```bash
   py scripts/validate_questions.py
   ```

   輸出：`data/parse_report.md` — 包含總題數、各章節題數、重複 id、缺題目/答案、以及完整的
   `needs_review` 清單（含原因與題目預覽）。**請先看過這份報告**，再決定是否要 promote 到網站。

5.（可選）建立待人工 / Haiku 複核的提示清單：

   ```bash
   py scripts/build_review_queue.py
   ```

   輸出：`data/needs_review_queue.json`。**這個腳本不會呼叫任何 LLM API**，只是把
   `needs_review` 的題目整理成提示文字。要不要真的拿去問 Haiku（或自己人工修），是後續手動的步驟，
   不在這個 pipeline 裡自動發生。

6. 確認 `parse_report.md` 的 needs_review 比例可以接受後，promote 到正式題庫：

   ```bash
   cp data/questions.draft.json src/data/questions.json
   ```

## 如何修改題庫

直接編輯 `src/data/questions.json`（陣列，每一項是一題）：

```json
{
  "id": "100-03-04",
  "category": "職業安全衛生相關法規",
  "subcategory": "勞動法簡介（含勞動檢查法規）",
  "question": "題目文字",
  "answer": "參考答案文字",
  "points": 4,
  "points_raw": ["4分"],
  "source": "【100-03-04】",
  "page": 3,
  "needs_review": false
}
```

`id` 必須唯一；`subcategory`/`points` 可以是 `null`。

## 部署

```bash
npm run build
```

產生的 `dist/` 可以直接部署到 GitHub Pages 或 Vercel（純靜態網站，不需要任何後端設定）。

## localStorage

- `oh_exam_wrong_questions`：錯題 id 陣列。
- `oh_exam_favorites`：我的最愛 id 陣列。

兩者都由 `src/utils/storage.js` 管理，重新整理瀏覽器後資料仍會保留。
