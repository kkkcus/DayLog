import { useState, useEffect } from 'react'
import './App.css'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import CalendarView from './components/CalendarView'

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api'

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

  useEffect(() => {
    fetchStreak()
  }, [])

  const fetchStreak = async () => {
    try {
      const response = await fetch(`${API_URL}/reflections?start=2020-01-01&end=2030-12-31`)
      const reflections = await response.json()
      if (Array.isArray(reflections) && reflections.length > 0) {
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
    setActiveTab('todo')
  }

  const isViewingToday = selectedDate === today

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1 className="logo">DayLog</h1>
          {streak.current > 0 && (
            <div className="streak-display">
              🔥 {streak.current}일 연속
              <span className="streak-best">최고 {streak.best}일</span>
            </div>
          )}
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
    </div>
  )
}

export default App
