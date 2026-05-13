import { useState, useEffect } from 'react'
import './App.css'
import api from './api.js'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import CalendarView from './components/CalendarView'
import LoginPage from './components/LoginPage'
import FortuneCard from './components/FortuneCard'
import WeatherCard from './components/WeatherCard'
import StatsView from './components/StatsView'
import AiCoach from './components/AiCoach'
import ProfilePage from './components/ProfilePage'
import CrewView from './components/CrewView'

const TABS = [
  { id: 'calendar', label: '캘린더' },
  { id: 'todo', label: '할일' },
  { id: 'reflection', label: '회고' },
  { id: 'stats', label: '통계' },
  { id: 'crew', label: '크루' },
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
  const [showProfile, setShowProfile] = useState(false)
  const [pendingJoinCode, setPendingJoinCode] = useState(null)

  // OAuth 콜백 토큰 처리 + 기존 토큰 검증
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const error = params.get('error')
    const join = params.get('join')

    if (token) localStorage.setItem('daylog_token', token)
    if (join) localStorage.setItem('daylog_pending_join', join.toUpperCase())
    if (token || join) window.history.replaceState({}, '', '/')

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
      const pending = localStorage.getItem('daylog_pending_join')
      if (pending) {
        setPendingJoinCode(pending)
        localStorage.removeItem('daylog_pending_join')
      }
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

  const handleProfileSave = (updatedUser) => {
    setUser(updatedUser)
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

  if (showProfile) {
    return (
      <ProfilePage
        user={user}
        onBack={() => setShowProfile(false)}
        onSave={handleProfileSave}
        onLogout={handleLogout}
      />
    )
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
              <button
                className="profile-avatar-btn"
                onClick={() => setShowProfile(true)}
                title="프로필 설정"
              >
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.name}
                    className="profile-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="profile-avatar-fallback">{user.name[0]}</div>
                )}
              </button>
              <span className="profile-name">{user.name.split(' ')[0]}</span>
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
          <CalendarView
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
          <div className="calendar-widgets">
            <FortuneCard user={user} onSetZodiac={() => setShowProfile(true)} />
            <WeatherCard />
          </div>
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

        {activeTab === 'stats' && (
          <StatsView streak={streak} />
        )}

        {activeTab === 'crew' && (
          <CrewView
            user={user}
            autoJoinCode={pendingJoinCode}
            onJoinHandled={() => setPendingJoinCode(null)}
          />
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

      <AiCoach />
    </div>
  )
}

export default App
