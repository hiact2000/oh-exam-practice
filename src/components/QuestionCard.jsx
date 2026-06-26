import { useEffect, useState } from 'react'
import { addErrorReport } from '../utils/storage.js'

// Symbol-font chars mapped into Unicode Private Use Area by broken PDF extraction
// e.g.  (Symbol 'K'),  (Symbol '+'),  (Symbol '×')
const PUA_RE = /[-]/

// Content that benefits from monospace + no-wrap: formulas, unit notation, aligned columns
const MONO_RE = /[ \t]{3,}|[×÷²³√＝≒μα]|mg\/m|ppm|Q\s*[=＝]|TWA|STEL|10[-−]\d/

// Reference to a table that exists in the original PDF but wasn't captured in text extraction
const TABLE_REF_RE = /[下前附上][表列]|表[一二三四五六七八九十1-9]/

function hasTableRef(text) {
  return Boolean(text && TABLE_REF_RE.test(text))
}

function Banner({ variant, children }) {
  const cls = variant === 'warn'
    ? 'border-amber-200 bg-amber-50 text-amber-700'
    : 'border-blue-100 bg-blue-50 text-blue-600'
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${cls}`}>
      <span className="shrink-0 font-bold leading-relaxed">{variant === 'warn' ? '!' : 'i'}</span>
      <span>{children}</span>
    </div>
  )
}

function ContentBlock({ text }) {
  if (!text) return null
  const garbled = PUA_RE.test(text)
  const mono    = MONO_RE.test(text)

  return (
    <div className="space-y-2">
      {garbled && (
        <Banner variant="warn">
          此題含有數學公式，因 PDF 字型編碼限制部分符號無法正確顯示，建議對照原始試題。
        </Banner>
      )}
      <div className={mono ? 'overflow-x-auto' : ''}>
        <p className={
          mono
            ? 'whitespace-pre font-mono text-sm leading-relaxed text-gray-900'
            : 'whitespace-pre-wrap leading-relaxed text-gray-900'
        }>
          {text}
        </p>
      </div>
    </div>
  )
}

export default function QuestionCard({
  question,
  isWrong,
  isFavorite,
  onToggleWrong,
  onToggleFavorite,
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [myAnswer, setMyAnswer] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [reportNote, setReportNote] = useState('')
  const [reportSent, setReportSent] = useState(false)

  useEffect(() => {
    setShowAnswer(false)
    setMyAnswer('')
    setReportOpen(false)
    setReportNote('')
    setReportSent(false)
  }, [question?.id])

  if (!question) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
        找不到題目。
      </div>
    )
  }

  const tableRef = hasTableRef(question.question) || hasTableRef(question.answer)

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">

      {/* meta chips */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">{question.category}</span>
        {question.subcategory && (
          <span className="rounded bg-gray-100 px-2 py-1">{question.subcategory}</span>
        )}
        {question.source && (
          <span className="rounded bg-gray-100 px-2 py-1">{question.source}</span>
        )}
        {question.points != null && (
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{question.points} 分</span>
        )}
        <span className="rounded bg-gray-100 px-2 py-1">第 {question.page} 頁</span>
        {question.needs_review && (
          <span className="rounded bg-red-50 px-2 py-1 text-red-600">待人工複核</span>
        )}
      </div>

      {/* table-reference notice */}
      {tableRef && (
        <Banner variant="info">
          此題引用了表格，PDF 解析僅能保留純文字，建議搭配原始試題（Hsiao 的工安部屋家族）閱讀。
        </Banner>
      )}

      {/* question text */}
      <ContentBlock text={question.question} />

      {/* self-answer */}
      <label className="block">
        <span className="mb-1 block text-sm text-gray-600">你的答案：</span>
        <textarea
          value={myAnswer}
          onChange={(e) => setMyAnswer(e.target.value)}
          rows={4}
          placeholder="先自己作答，再點顯示答案核對..."
          className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900"
        />
      </label>

      {/* action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAnswer(v => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showAnswer ? '隱藏答案' : '顯示答案'}
        </button>
        <button
          type="button"
          onClick={() => onToggleWrong?.(question.id)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            isWrong
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isWrong ? '移除錯題' : '加入錯題'}
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite?.(question.id)}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
            isFavorite
              ? 'border-amber-500 bg-amber-50 text-amber-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isFavorite ? '移除最愛' : '加入我的最愛'}
        </button>
        <button
          type="button"
          onClick={() => { setReportOpen(v => !v); setReportSent(false) }}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
        >
          回報錯誤
        </button>
      </div>

      {/* error report form */}
      {reportOpen && (
        <div className="rounded-md border border-orange-200 bg-orange-50 p-3 space-y-2">
          {reportSent ? (
            <p className="text-sm text-orange-700">已記錄，可至「錯誤回報」頁面查看與修改。</p>
          ) : (
            <>
              <p className="text-xs font-medium text-orange-700">回報這題的錯誤（題目有誤、答案有誤、缺少表格…）</p>
              <textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                rows={3}
                placeholder="說明問題，例如：答案有誤，應為…"
                className="w-full rounded border border-orange-200 bg-white p-2 text-sm text-gray-900"
              />
              <button
                type="button"
                disabled={!reportNote.trim()}
                onClick={() => {
                  addErrorReport({
                    questionId: question.id,
                    questionText: question.question,
                    category: question.category,
                    page: question.page,
                    note: reportNote.trim(),
                  })
                  setReportSent(true)
                  setReportNote('')
                }}
                className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-40"
              >
                送出回報
              </button>
            </>
          )}
        </div>
      )}

      {/* answer */}
      {showAnswer && (
        <div className="rounded-md bg-gray-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500">參考答案</p>
          <ContentBlock text={question.answer} />
        </div>
      )}

    </div>
  )
}
