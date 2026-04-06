import { useState, useEffect } from 'react'
import './App.css'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import CalendarView from './components/CalendarView'
import DayDetailModal from './components/DayDetailModal'

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api'

const TABS = [
  { id: 'calendar', label: '캘린더' },
  { id: 'todo', label: '할일' },
  { id: 'reflection', label: '회고' },
]

function App() {
  const today = new Date().toISOString().split('T')[0]
  const [activeTab, setActiveTab] = useState('calendar')
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [modalDate, setModalDate] = useState(null)

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
        {/* 캘린더는 항상 마운트 유지 (월 데이터 상태 보존) */}
        <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
          <CalendarView
            onDateClick={setModalDate}
            selectedDate={modalDate}
          />
        </div>

        {activeTab === 'todo' && (
          <div className="panel-wrap">
            <TodoList date={today} />
          </div>
        )}

        {activeTab === 'reflection' && (
          <div className="panel-wrap">
            <ReflectionSection date={today} onReflectionUpdate={fetchStreak} />
          </div>
        )}
      </main>

      {modalDate && (
        <DayDetailModal
          date={modalDate}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  )
}

export default App
