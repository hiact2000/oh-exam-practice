import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import questions from '../data/questions.json'
import ChapterSelector from '../components/ChapterSelector.jsx'
import QuestionCard from '../components/QuestionCard.jsx'
import {
  getWrongQuestions,
  toggleWrongQuestion,
  getFavorites,
  toggleFavorite,
} from '../utils/storage.js'

const categories = [...new Set(questions.map((q) => q.category))]

export default function Practice() {
  const [searchParams, setSearchParams] = useSearchParams()
  const idParam = searchParams.get('id')

  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [wrongIds, setWrongIds] = useState(() => getWrongQuestions())
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites())

  // When the URL carries ?id=, jump category/subcategory to match that question.
  useEffect(() => {
    if (!idParam) return
    const target = questions.find((q) => q.id === idParam)
    if (!target) return
    setSelectedCategory(target.category)
    setSelectedSubcategory(target.subcategory)
  }, [idParam])

  const subcategories = useMemo(() => {
    if (!selectedCategory) return []
    return [
      ...new Set(
        questions
          .filter((q) => q.category === selectedCategory)
          .map((q) => q.subcategory)
          .filter(Boolean),
      ),
    ]
  }, [selectedCategory])

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (selectedCategory && q.category !== selectedCategory) return false
      if (selectedSubcategory && q.subcategory !== selectedSubcategory) return false
      return true
    })
  }, [selectedCategory, selectedSubcategory])

  // Once filteredQuestions reflects the id-driven category, snap the index to that question.
  useEffect(() => {
    if (!idParam) return
    const idx = filteredQuestions.findIndex((q) => q.id === idParam)
    if (idx >= 0) setCurrentIndex(idx)
  }, [idParam, filteredQuestions])

  const clampedIndex = filteredQuestions.length
    ? Math.min(currentIndex, filteredQuestions.length - 1)
    : 0
  const currentQuestion = filteredQuestions[clampedIndex]

  // Keep the URL's ?id= in sync with whichever question is currently shown.
  useEffect(() => {
    if (!currentQuestion) return
    if (searchParams.get('id') === currentQuestion.id) return
    setSearchParams({ id: currentQuestion.id }, { replace: true })
  }, [currentQuestion, searchParams, setSearchParams])

  const handleCategoryChange = useCallback((category) => {
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setCurrentIndex(0)
  }, [])

  const handleSubcategoryChange = useCallback((subcategory) => {
    setSelectedSubcategory(subcategory)
    setCurrentIndex(0)
  }, [])

  const goPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const goNext = () =>
    setCurrentIndex((i) => Math.min(filteredQuestions.length - 1, i + 1))

  const handleToggleWrong = (id) => setWrongIds(toggleWrongQuestion(id))
  const handleToggleFavorite = (id) => setFavoriteIds(toggleFavorite(id))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">章節刷題</h1>
      <ChapterSelector
        categories={categories}
        subcategories={subcategories}
        selectedCategory={selectedCategory}
        selectedSubcategory={selectedSubcategory}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
      />

      <p className="text-sm text-gray-500">
        共 {filteredQuestions.length} 題，目前第 {filteredQuestions.length ? clampedIndex + 1 : 0} 題
      </p>

      <QuestionCard
        question={currentQuestion}
        isWrong={currentQuestion ? wrongIds.includes(currentQuestion.id) : false}
        isFavorite={currentQuestion ? favoriteIds.includes(currentQuestion.id) : false}
        onToggleWrong={handleToggleWrong}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={goPrev}
          disabled={clampedIndex === 0}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          上一題
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={clampedIndex >= filteredQuestions.length - 1}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-40"
        >
          下一題
        </button>
      </div>
    </div>
  )
}
