import { useState, useEffect } from 'react'
import './App.css'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import CalendarView from './components/CalendarView'

function App() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [streak, setStreak] = useState({ current: 0, best: 0 })

  useEffect(() => {
    fetchStreak()
  }, [])

  const fetchStreak = async () => {
    try {
      const response = await fetch('/api/reflections?start=2020-01-01&end=2030-12-31')
      const reflections = await response.json()
      if (reflections.length > 0) {
        const latest = reflections[0]
        setStreak({
          current: latest.currentStreak || 0,
          best: latest.bestStreak || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch streak:', error)
    }
  }

  const handleDateClick = (date) => {
    setSelectedDate(date)
    // 상단으로 부드럽게 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isViewingOther = selectedDate !== today
  const isViewingFuture = selectedDate > today

  const formatSelectedDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📓 DayLog</h1>
        <p className="subtitle">당신의 하루를 기록하세요</p>
        {streak.current > 0 && (
          <div className="streak-display">
            🔥 {streak.current}일 연속 (최고: {streak.best}일)
          </div>
        )}
      </header>

      <main className="main">
        {isViewingOther && (
          <div className="date-nav-bar">
            <span className="date-nav-label">
              {isViewingFuture ? '📅' : '🔍'} {formatSelectedDate(selectedDate)} 보는 중
              {' • '}{isViewingFuture ? '할일 미리 추가 가능' : '읽기 전용'}
            </span>
            <button
              className="btn-back-today"
              onClick={() => setSelectedDate(today)}
            >
              오늘로 돌아가기 →
            </button>
          </div>
        )}

        <div className="dashboard-container">
          <div className="left-panel">
            <TodoList date={selectedDate} />
          </div>
          <div className="right-panel">
            <ReflectionSection date={selectedDate} onReflectionUpdate={fetchStreak} />
          </div>
        </div>

        <div className="calendar-section">
          <CalendarView
            onDateClick={handleDateClick}
            selectedDate={selectedDate}
          />
        </div>
      </main>
    </div>
  )
}

export default App
