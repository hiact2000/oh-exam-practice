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
