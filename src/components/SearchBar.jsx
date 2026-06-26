import { useEffect, useState } from 'react'

export default function SearchBar({ onSearch, placeholder = '搜尋題目、答案、題號、章節...' }) {
  const [value, setValue] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value.trim())
    }, 250)
    return () => clearTimeout(timer)
  }, [value, onSearch])

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900"
    />
  )
}
