import { useState, useEffect } from 'react'
import './App.css'
import api from './api.js'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import CalendarView from './components/CalendarView'
import LoginPage from './components/LoginPage'
import FortuneCard from './components/FortuneCard'
import ZodiacModal from './components/ZodiacModal'

const TABS = [
  { id: 'calendar', label: '캘린더' },
  { id: 'todo', label: '할일' },
  { id: 'reflection', label: '회고' },
]

const formatDate = (dateStr) => {
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
}

function App() {
  const today = new Date().toISOString().split('T')[0]
  const [activeTab, setActiveTab] = useState('calendar')
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [selectedDate, setSelectedDate] = useState(today)
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState(false)
  const [showZodiacModal, setShowZodiacModal] = useState(false)

  // OAuth 콜백 토큰 처리 + 기존 토큰 검증
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      localStorage.setItem('daylog_token', token)
      window.history.replaceState({}, '', '/')
    }

    if (error) {
      setAuthError(true)
      setAuthLoading(false)
      return
    }

    verifyToken()
  }, [])

  const verifyToken = async () => {
    const token = localStorage.getItem('daylog_token')
    if (!token) {
      setAuthLoading(false)
      return
    }
    try {
      const res = await api.get('/auth/me')
      setUser(res.data)
    } catch {
      localStorage.removeItem('daylog_token')
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchStreak()
  }, [user])

  const fetchStreak = async () => {
    try {
      const res = await api.get('/reflections?start=2020-01-01&end=2030-12-31')
      const reflections = res.data
      if (Array.isArray(reflections) && reflections.length > 0) {
        const latest = reflections[0]
        setStreak({ current: latest.currentStreak || 0, best: latest.bestStreak || 0 })
      }
    } catch (error) {
      console.error('Failed to fetch streak:', error)
    }
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    setActiveTab('todo')
  }

  const handleLogout = () => {
    localStorage.removeItem('daylog_token')
    setUser(null)
    setStreak({ current: 0, best: 0 })
  }

  const handleZodiacSave = (updatedUser) => {
    setUser(updatedUser)
    setShowZodiacModal(false)
  }

  const isViewingToday = selectedDate === today

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage error={authError} />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">DayLog</h1>
          <div className="header-right">
            {streak.current > 0 && (
              <div className="streak-display">
                🔥 {streak.current}일 연속
                <span className="streak-best">최고 {streak.best}일</span>
              </div>
            )}
            <div className="user-profile">
              {user.profileImage && (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="profile-avatar"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="profile-name">{user.name.split(' ')[0]}</span>
              <button
                className="zodiac-setting-btn"
                onClick={() => setShowZodiacModal(true)}
                title="별자리 설정"
              >
                {user.zodiacSign ? { '양자리': '♈', '황소자리': '♉', '쌍둥이자리': '♊', '게자리': '♋', '사자자리': '♌', '처녀자리': '♍', '천칭자리': '♎', '전갈자리': '♏', '사수자리': '♐', '염소자리': '♑', '물병자리': '♒', '물고기자리': '♓' }[user.zodiacSign] : '🔮'}
              </button>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          </div>
        </div>
        <nav className="tab-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
          <div className="panel-wrap">
            <FortuneCard user={user} onSetZodiac={() => setShowZodiacModal(true)} />
          </div>
          <CalendarView
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        </div>

        {activeTab === 'todo' && (
          <div className="panel-wrap">
            <div className="date-header">
              <span className="date-header-label">
                {isViewingToday ? '오늘의 기록' : `${formatDate(selectedDate)}의 기록`}
              </span>
              {!isViewingToday && (
                <button
                  className="today-return-btn"
                  onClick={() => setSelectedDate(today)}
                >
                  오늘로 돌아가기
                </button>
              )}
            </div>
            <TodoList date={selectedDate} />
          </div>
        )}

        {activeTab === 'reflection' && (
          <div className="panel-wrap">
            <div className="date-header">
              <span className="date-header-label">
                {isViewingToday ? '오늘의 기록' : `${formatDate(selectedDate)}의 기록`}
              </span>
              {!isViewingToday && (
                <button
                  className="today-return-btn"
                  onClick={() => setSelectedDate(today)}
                >
                  오늘로 돌아가기
                </button>
              )}
            </div>
            <ReflectionSection date={selectedDate} onReflectionUpdate={fetchStreak} />
          </div>
        )}
      </main>

      {showZodiacModal && (
        <ZodiacModal
          currentZodiac={user.zodiacSign}
          onSave={handleZodiacSave}
          onClose={() => setShowZodiacModal(false)}
        />
      )}
    </div>
  )
}

export default App
