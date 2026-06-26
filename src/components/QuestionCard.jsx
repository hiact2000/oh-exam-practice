import { useEffect, useState } from 'react'

// Detect Symbol-font characters mapped into PUA by broken PDF extraction
function hasPUA(text) {
  for (let i = 0; i < (text || '').length; i++) {
    const c = text.charCodeAt(i)
    if (c >= 0xF000 && c <= 0xF8FF) return true
  }
  return false
}

const TABLE_REF_RE = /[下前附上][表列]|表[一二三四五六七八九十1-9]/
const MONO_RE = /[ \t]{3,}|[×÷²³√＝≒μα]|mg\/m|ppm|Q\s*[=＝]|TWA|STEL|10[-−]\d/

function needsPageImage(q) {
  const text = (q.question || '') + (q.answer || '')
  return hasPUA(text) || TABLE_REF_RE.test(text)
}

// Renders question/answer text with monospace for formula content
function ContentBlock({ text }) {
  if (!text) return null
  const mono = MONO_RE.test(text)
  return (
    <div className={mono ? 'overflow-x-auto' : ''}>
      <p className={
        mono
          ? 'whitespace-pre font-mono text-sm leading-relaxed text-gray-900'
          : 'whitespace-pre-wrap leading-relaxed text-gray-900'
      }>
        {text}
      </p>
    </div>
  )
}

// Shows the original PDF page for tables / formulas
function PageImage({ pageNum }) {
  const [hidden, setHidden] = useState(false)
  if (hidden || !pageNum) return null
  const src = `${import.meta.env.BASE_URL}pdf-pages/page-${pageNum}.jpg`
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-3 space-y-2">
      <p className="text-xs text-indigo-500 font-medium">原始試題頁面（第 {pageNum} 頁）</p>
      <div className="overflow-x-auto">
        <img
          src={src}
          alt={`試題第 ${pageNum} 頁`}
          className="max-w-none w-full rounded border border-gray-200 shadow-sm"
          style={{ minWidth: 320 }}
          onError={() => setHidden(true)}
          loading="lazy"
        />
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

  useEffect(() => {
    setShowAnswer(false)
    setMyAnswer('')
  }, [question?.id])

  if (!question) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-500">
        找不到題目。
      </div>
    )
  }

  const showImage = needsPageImage(question)

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

      {/* question text */}
      <ContentBlock text={question.question} />

      {/* PDF page screenshot — shown when tables or formulas are missing */}
      {showImage && <PageImage pageNum={question.page} />}

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
      </div>

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
