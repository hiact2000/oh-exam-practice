import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import { getWrongQuestions, getFavorites } from '../utils/storage.js'

const CATEGORY_COLORS = {
  '專業課程': 'bg-indigo-500',
  '職業安全衛生相關法規': 'bg-emerald-500',
  '解釋名詞': 'bg-amber-500',
  '職業安全衛生計畫及管理': 'bg-rose-500',
}
const CATEGORY_TEXT_COLORS = {
  '專業課程': 'text-indigo-700',
  '職業安全衛生相關法規': 'text-emerald-700',
  '解釋名詞': 'text-amber-700',
  '職業安全衛生計畫及管理': 'text-rose-700',
}
const CATEGORY_BG_LIGHT = {
  '專業課程': 'bg-indigo-50',
  '職業安全衛生相關法規': 'bg-emerald-50',
  '解釋名詞': 'bg-amber-50',
  '職業安全衛生計畫及管理': 'bg-rose-50',
}

function BarRow({ label, count, total, colorClass, sublabel }) {
  const pct = (count / total) * 100
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm text-gray-800 leading-snug flex-1 min-w-0 truncate" title={label}>
          {label}
        </span>
        <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
          {count} 題 ({pct.toFixed(1)}%)
        </span>
      </div>
      {sublabel && <div className="text-xs">{sublabel}</div>}
      <div className="h-2.5 w-full rounded-full bg-gray-100">
        <div
          className={`h-2.5 rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const [wrongCount] = useState(() => getWrongQuestions().length)
  const [favoriteCount] = useState(() => getFavorites().length)
  const [showAllSubcats, setShowAllSubcats] = useState(false)

  const total = questions.length

  const categories = useMemo(() => {
    const counts = new Map()
    for (const q of questions) {
      counts.set(q.category, (counts.get(q.category) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const subcategories = useMemo(() => {
    const counts = new Map()
    for (const q of questions) {
      const key = `${q.category}||${q.subcategory || '(無子分類)'}`
      const prev = counts.get(key)
      counts.set(key, {
        cat: q.category,
        subcat: q.subcategory || '(無子分類)',
        count: (prev?.count ?? 0) + 1,
      })
    }
    return [...counts.values()].sort((a, b) => b.count - a.count)
  }, [])

  const displayedSubcats = showAllSubcats ? subcategories : subcategories.slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          職業衛生管理甲級技術士術科考古題刷題
        </h1>
        <p className="mt-1 text-gray-500">依章節練習歷年考古題，標記錯題與最愛，隨時複習。</p>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-indigo-700">{total}</p>
          <p className="text-sm text-gray-500">總題數</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-red-600">{wrongCount}</p>
          <p className="text-sm text-gray-500">錯題數</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-2xl font-bold text-amber-600">{favoriteCount}</p>
          <p className="text-sm text-gray-500">我的最愛</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/practice"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
        >
          開始刷題
        </Link>
        <Link
          to="/wrong"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          錯題本
        </Link>
        <Link
          to="/favorites"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          我的最愛
        </Link>
        <Link
          to="/search"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
        >
          搜尋題目
        </Link>
      </div>

      {/* 出題率分析 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">出題率分析</h2>

        {/* 大分類 */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">大分類</h3>
          {categories.map(([cat, count]) => (
            <BarRow
              key={cat}
              label={cat}
              count={count}
              total={total}
              colorClass={CATEGORY_COLORS[cat] ?? 'bg-gray-400'}
            />
          ))}
        </div>

        {/* 子分類 */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            子分類（由高到低）
          </h3>
          {displayedSubcats.map(({ cat, subcat, count }) => (
            <div
              key={`${cat}||${subcat}`}
              className={`rounded-md px-3 py-2 ${CATEGORY_BG_LIGHT[cat] ?? 'bg-gray-50'}`}
            >
              <BarRow
                label={subcat === '(無子分類)' ? `${cat}（解釋名詞）` : subcat}
                count={count}
                total={total}
                colorClass={CATEGORY_COLORS[cat] ?? 'bg-gray-400'}
                sublabel={
                  subcat !== '(無子分類)' ? (
                    <span className={CATEGORY_TEXT_COLORS[cat] ?? 'text-gray-600'}>
                      {cat}
                    </span>
                  ) : null
                }
              />
            </div>
          ))}
          {subcategories.length > 10 && (
            <button
              onClick={() => setShowAllSubcats(v => !v)}
              className="w-full text-sm text-indigo-600 hover:text-indigo-800 py-1"
            >
              {showAllSubcats
                ? '▲ 收起'
                : `▼ 顯示全部 ${subcategories.length} 個子分類`}
            </button>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">章節列表</h2>
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {categories.map(([category, count]) => (
            <li key={category} className="flex items-center justify-between px-4 py-2">
              <span className="text-gray-900">{category}</span>
              <span className="text-sm text-gray-500">{count} 題</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
