import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Practice from './pages/Practice.jsx'
import WrongQuestions from './pages/WrongQuestions.jsx'
import Favorites from './pages/Favorites.jsx'
import Search from './pages/Search.jsx'
import ErrorReports from './pages/ErrorReports.jsx'

const navLinkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'
  }`

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-2 flex flex-wrap gap-1 items-center">
            <span className="font-bold text-indigo-700 mr-2">職衛刷題</span>
            <NavLink to="/" className={navLinkClass} end>
              首頁
            </NavLink>
            <NavLink to="/practice" className={navLinkClass}>
              章節刷題
            </NavLink>
            <NavLink to="/wrong" className={navLinkClass}>
              錯題本
            </NavLink>
            <NavLink to="/favorites" className={navLinkClass}>
              我的最愛
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              搜尋
            </NavLink>
            <NavLink to="/reports" className={navLinkClass}>
              錯誤回報
            </NavLink>
          </div>
        </nav>
        <main className="max-w-3xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/wrong" element={<WrongQuestions />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/search" element={<Search />} />
            <Route path="/reports" element={<ErrorReports />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
