import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import QuestionCard from '../components/QuestionCard.jsx'
import {
  getWrongQuestions,
  toggleWrongQuestion,
  getFavorites,
  toggleFavorite,
} from '../utils/storage.js'

export default function Favorites() {
  const [wrongIds, setWrongIds] = useState(() => getWrongQuestions())
  const [favoriteIds, setFavoriteIds] = useState(() => getFavorites())

  const favoriteQuestions = useMemo(
    () => questions.filter((q) => favoriteIds.includes(q.id)),
    [favoriteIds],
  )

  const handleToggleWrong = (id) => setWrongIds(toggleWrongQuestion(id))
  const handleToggleFavorite = (id) => setFavoriteIds(toggleFavorite(id))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">我的最愛</h1>
      <p className="text-sm text-gray-500">共 {favoriteQuestions.length} 題</p>

      {favoriteQuestions.length === 0 && (
        <p className="text-gray-500">
          目前沒有收藏題目，去
          <Link to="/practice" className="text-indigo-600 underline mx-1">
            章節刷題
          </Link>
          挑幾題吧。
        </p>
      )}

      <div className="space-y-4">
        {favoriteQuestions.map((question) => (
          <div key={question.id} className="space-y-2">
            <QuestionCard
              question={question}
              isWrong={wrongIds.includes(question.id)}
              isFavorite={favoriteIds.includes(question.id)}
              onToggleWrong={handleToggleWrong}
              onToggleFavorite={handleToggleFavorite}
            />
            <Link
              to={`/practice?id=${question.id}`}
              className="inline-block text-sm text-indigo-600 underline"
            >
              在章節刷題中繼續作答 →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
