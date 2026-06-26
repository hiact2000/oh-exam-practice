import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import { getWrongQuestions, getFavorites } from '../utils/storage.js'

const CAT_META = {
  '專業課程':             { hex: '#6366f1', dot: 'bg-indigo-500',  text: 'text-indigo-600'  },
  '職業安全衛生相關法規':  { hex: '#10b981', dot: 'bg-emerald-500', text: 'text-emerald-600' },
  '解釋名詞':             { hex: '#f59e0b', dot: 'bg-amber-500',   text: 'text-amber-600'   },
  '職業安全衛生計畫及管理':{ hex: '#f43f5e', dot: 'bg-rose-500',   text: 'text-rose-600'    },
}
const FALLBACK = { hex: '#9ca3af', dot: 'bg-gray-400', text: 'text-gray-500' }
const cm = (cat) => CAT_META[cat] ?? FALLBACK

// SVG donut chart — pure stroke-dasharray, no library
function DonutChart({ categories, total, animated }) {
  const SIZE = 160
  const SW = 20
  const r = (SIZE - SW) / 2          // 70
  const C = 2 * Math.PI * r          // ~439.82
  const GAP = 3                      // px gap between segments

  let angle = -90
  const arcs = categories.map(({ cat, count }, i) => {
    const dash = Math.max(0, (count / total) * C - GAP)
    const start = angle
    angle += (count / total) * 360
    return { color: cm(cat).hex, dash, start, delay: i * 110 }
  })

  return (
    <svg
      width={SIZE} height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      className="drop-shadow-sm"
    >
      {/* track */}
      <circle cx={SIZE/2} cy={SIZE/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
      {/* segments */}
      {arcs.map(({ color, dash, start, delay }, i) => (
        <g key={i} transform={`rotate(${start} ${SIZE/2} ${SIZE/2})`}>
          <circle
            cx={SIZE/2} cy={SIZE/2} r={r}
            fill="none"
            stroke={color}
            strokeWidth={SW - 4}
            strokeDasharray={animated ? `${dash} ${C}` : `0 ${C}`}
            style={{ transition: `stroke-dasharray 0.65s ease-out ${delay}ms` }}
          />
        </g>
      ))}
      {/* centre */}
      <text x={SIZE/2} y={SIZE/2 - 5} textAnchor="middle" fontSize="22" fontWeight="700" fill="#111827">
        {total}
      </text>
      <text x={SIZE/2} y={SIZE/2 + 13} textAnchor="middle" fontSize="11" fill="#9ca3af" letterSpacing="0.5">
        總題數
      </text>
    </svg>
  )
}

export default function Home() {
  const [wrongCount]    = useState(() => getWrongQuestions().length)
  const [favoriteCount] = useState(() => getFavorites().length)
  const [showAll, setShowAll]   = useState(false)
  const [animated, setAnimated] = useState(false)

  // trigger bar + donut animations after first paint
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const total = questions.length

  const categories = useMemo(() => {
    const m = new Map()
    for (const q of questions) m.set(q.category, (m.get(q.category) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([cat, count]) => ({ cat, count }))
  }, [])

  const subcategories = useMemo(() => {
    const m = new Map()
    for (const q of questions) {
      // treat '.' (parse artifact) as null
      const sub = q.subcategory && q.subcategory !== '.' ? q.subcategory : null
      const key = `${q.category}||${sub ?? ''}`
      const prev = m.get(key)
      m.set(key, { cat: q.category, sub, count: (prev?.count ?? 0) + 1 })
    }
    return [...m.values()].sort((a, b) => b.count - a.count)
  }, [])

  const visible = showAll ? subcategories : subcategories.slice(0, 10)

  return (
    <div className="space-y-6">

      {/* ── header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          職業衛生管理甲級技術士術科考古題刷題
        </h1>
        <p className="mt-1 text-gray-500">
          依章節練習歷年考古題，標記錯題與最愛，隨時複習。
        </p>
      </div>

      {/* ── stat chips ── */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-indigo-600">{total}</p>
          <p className="text-xs text-gray-500 mt-0.5">總題數</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-red-500">{wrongCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">錯題數</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-2xl font-bold text-amber-500">{favoriteCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">我的最愛</p>
        </div>
      </div>

      {/* ── quick actions ── */}
      <div className="flex flex-wrap gap-2">
        <Link to="/practice"  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
          開始刷題
        </Link>
        <Link to="/wrong"     className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          錯題本
        </Link>
        <Link to="/favorites" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          我的最愛
        </Link>
        <Link to="/search"    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          搜尋題目
        </Link>
      </div>

      {/* ════ 出題率分析 ════ */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">出題率分析</h2>

        {/* donut + category bars */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">

            {/* donut */}
            <div className="shrink-0">
              <DonutChart categories={categories} total={total} animated={animated} />
            </div>

            {/* per-category bar legend */}
            <div className="flex-1 w-full space-y-4">
              {categories.map(({ cat, count }) => {
                const pct = (count / total * 100)
                const { hex, dot, text } = cm(cat)
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        <span className="text-sm text-gray-700 truncate">{cat}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 shrink-0 pl-2">
                        <span className="text-sm font-semibold tabular-nums text-gray-900">
                          {pct.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-400">{count} 題</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{ width: animated ? `${pct}%` : '0%', backgroundColor: hex }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* subcategory ranking list */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">子分類排行</h3>
            <span className="text-xs text-gray-400">{subcategories.length} 個主題</span>
          </div>

          <ul className="divide-y divide-gray-50">
            {visible.map(({ cat, sub, count }, idx) => {
              const pct = count / total * 100
              const { hex, text } = cm(cat)
              const label = sub ?? cat   // use category name when no subcategory
              return (
                <li key={`${cat}||${sub}`} className="flex items-center gap-3 px-4 py-3">
                  {/* rank */}
                  <span className="w-5 shrink-0 text-right text-xs font-mono tabular-nums text-gray-300">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    {/* name + count */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm leading-tight text-gray-800">{label}</span>
                      <span className="text-xs tabular-nums text-gray-400 whitespace-nowrap shrink-0 pt-px">
                        {count} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    {/* bar + category badge */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: animated ? `${pct}%` : '0%',
                            backgroundColor: hex,
                            transition: `width ${0.5 + idx * 0.035}s ease-out`,
                          }}
                        />
                      </div>
                      <span className={`text-xs shrink-0 ${text}`}>{cat}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          {subcategories.length > 10 && (
            <div className="border-t border-gray-100">
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full py-3 text-sm text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                {showAll ? '▲ 收起' : `▼ 顯示全部 ${subcategories.length} 個子分類`}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── chapter list ── */}
      <div>
        <h2 className="mb-2 text-base font-semibold text-gray-900">章節列表</h2>
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
          {categories.map(({ cat, count }) => (
            <li key={cat} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm text-gray-800">{cat}</span>
              <span className="text-xs text-gray-400 tabular-nums">{count} 題</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
