import { useEffect, useState } from 'react'

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

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">
          {question.category}
        </span>
        {question.subcategory && (
          <span className="rounded bg-gray-100 px-2 py-1">{question.subcategory}</span>
        )}
        {question.source && <span className="rounded bg-gray-100 px-2 py-1">{question.source}</span>}
        {question.points != null && (
          <span className="rounded bg-amber-50 px-2 py-1 text-amber-700">{question.points} 分</span>
        )}
        <span className="rounded bg-gray-100 px-2 py-1">第 {question.page} 頁</span>
        {question.needs_review && (
          <span className="rounded bg-red-50 px-2 py-1 text-red-600">待人工複核</span>
        )}
      </div>

      <p className="whitespace-pre-wrap text-gray-900">{question.question}</p>

      <label className="block">
        <span className="mb-1 block text-sm text-gray-600">你的答案：</span>
        <textarea
          value={myAnswer}
          onChange={(event) => setMyAnswer(event.target.value)}
          rows={4}
          placeholder="先自己作答，再點顯示答案核對..."
          className="w-full rounded-md border border-gray-300 p-2 text-gray-900"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAnswer((value) => !value)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showAnswer ? '隱藏答案' : '顯示答案'}
        </button>
        <button
          type="button"
          onClick={() => onToggleWrong?.(question.id)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium border ${
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
          className={`rounded-md px-3 py-1.5 text-sm font-medium border ${
            isFavorite
              ? 'border-amber-500 bg-amber-50 text-amber-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isFavorite ? '移除最愛' : '加入我的最愛'}
        </button>
      </div>

      {showAnswer && (
        <div className="whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-gray-800">
          {question.answer}
        </div>
      )}
    </div>
  )
}
