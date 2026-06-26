import { useState } from 'react'
import { getErrorReports, updateErrorReport, deleteErrorReport } from '../utils/storage.js'

function formatDate(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function downloadJSON(reports) {
  const blob = new Blob([JSON.stringify(reports, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `error-reports-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ErrorReports() {
  const [reports, setReports] = useState(() => getErrorReports().slice().reverse())
  const [editingId, setEditingId] = useState(null)
  const [editNote, setEditNote] = useState('')

  function startEdit(report) {
    setEditingId(report.id)
    setEditNote(report.note)
  }

  function saveEdit(id) {
    const next = updateErrorReport(id, editNote.trim())
    setReports(next.slice().reverse())
    setEditingId(null)
  }

  function remove(id) {
    const next = deleteErrorReport(id)
    setReports(next.slice().reverse())
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">錯誤回報</h1>
        <div className="flex gap-2">
          <span className="text-sm text-gray-500 self-center">{reports.length} 筆</span>
          {reports.length > 0 && (
            <button
              type="button"
              onClick={() => downloadJSON(reports)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              匯出 JSON
            </button>
          )}
        </div>
      </div>

      {reports.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-400">
          尚無錯誤回報。刷題時點「回報錯誤」即可新增。
        </div>
      )}

      <ul className="space-y-3">
        {reports.map((r) => (
          <li key={r.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-2 shadow-sm">
            {/* header */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span className="rounded bg-indigo-50 px-2 py-1 text-indigo-700">{r.category}</span>
              <span className="rounded bg-gray-100 px-2 py-1">第 {r.page} 頁</span>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono">{r.questionId}</span>
              <span className="ml-auto">{formatDate(r.createdAt)}</span>
            </div>

            {/* question preview */}
            {r.questionText && (
              <p className="text-xs text-gray-500 line-clamp-2">{r.questionText}</p>
            )}

            {/* note — edit or display */}
            {editingId === r.id ? (
              <div className="space-y-2">
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={3}
                  className="w-full rounded border border-gray-300 p-2 text-sm text-gray-900"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(r.id)}
                    disabled={!editNote.trim()}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                  >
                    儲存
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1">{r.note}</p>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                  >
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    刪除
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
