const WRONG_KEY = 'oh_exam_wrong_questions'
const FAV_KEY = 'oh_exam_favorites'

function readIdList(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeIdList(key, ids) {
  localStorage.setItem(key, JSON.stringify(ids))
}

function toggleIdInList(key, id) {
  const current = readIdList(key)
  const next = current.includes(id)
    ? current.filter((existingId) => existingId !== id)
    : [...current, id]
  writeIdList(key, next)
  return next
}

export function getWrongQuestions() {
  return readIdList(WRONG_KEY)
}

export function toggleWrongQuestion(id) {
  return toggleIdInList(WRONG_KEY, id)
}

export function isWrongQuestion(id) {
  return getWrongQuestions().includes(id)
}

export function getFavorites() {
  return readIdList(FAV_KEY)
}

export function toggleFavorite(id) {
  return toggleIdInList(FAV_KEY, id)
}

export function isFavorite(id) {
  return getFavorites().includes(id)
}

// ── Error reports ─────────────────────────────────────────────────────────────

const REPORTS_KEY = 'oh_exam_error_reports'

export function getErrorReports() {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveReports(reports) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
}

export function addErrorReport({ questionId, questionText, category, page, note }) {
  const reports = getErrorReports()
  const entry = {
    id: Date.now().toString(),
    questionId,
    questionText: (questionText || '').slice(0, 120),
    category,
    page,
    note,
    createdAt: new Date().toISOString(),
  }
  saveReports([...reports, entry])
  return entry
}

export function updateErrorReport(id, note) {
  const reports = getErrorReports().map((r) => (r.id === id ? { ...r, note } : r))
  saveReports(reports)
  return reports
}

export function deleteErrorReport(id) {
  const reports = getErrorReports().filter((r) => r.id !== id)
  saveReports(reports)
  return reports
}
