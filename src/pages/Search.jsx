import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import SearchBar from '../components/SearchBar.jsx'

function matches(question, query) {
  const haystacks = [
    question.question,
    question.answer,
    question.source,
    question.category,
    question.subcategory ?? '',
  ]
  return haystacks.some((text) => text.toLowerCase().includes(query))
}

export default function Search() {
  const [results, setResults] = useState([])
  const [hasQuery, setHasQuery] = useState(false)

  const handleSearch = useCallback((rawQuery) => {
    const query = rawQuery.toLowerCase()
    if (!query) {
      setResults([])
      setHasQuery(false)
      return
    }
    setHasQuery(true)
    setResults(questions.filter((q) => matches(q, query)).slice(0, 50))
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">搜尋題目</h1>
      <SearchBar onSearch={handleSearch} />

      {hasQuery && (
        <p className="text-sm text-gray-500">
          找到 {results.length} 題{results.length === 50 ? '（僅顯示前 50 筆）' : ''}
        </p>
      )}

      <ul className="space-y-2">
        {results.map((question) => (
          <li key={question.id}>
            <Link
              to={`/practice?id=${question.id}`}
              className="block rounded-md border border-gray-200 bg-white p-3 hover:border-indigo-400"
            >
              <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                <span>{question.source}</span>
                <span>{question.category}</span>
                {question.subcategory && <span>{question.subcategory}</span>}
              </div>
              <p className="mt-1 text-gray-900">
                {question.question.slice(0, 100)}
                {question.question.length > 100 ? '...' : ''}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
