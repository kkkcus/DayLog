import { useState } from 'react'
import './App.css'
import TodoList from './components/TodoList'
import ReflectionSection from './components/ReflectionSection'
import MoodCalendar from './components/MoodCalendar'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app">
      <header className="header">
        <h1>📓 DayLog</h1>
        <p className="subtitle">당신의 하루를 기록하세요</p>
      </header>

      <main className="main">
        <div className="dashboard-container">
          <div className="left-panel">
            <TodoList />
          </div>
          <div className="right-panel">
            <ReflectionSection />
          </div>
        </div>

        <div className="calendar-section">
          <MoodCalendar />
        </div>
      </main>
    </div>
  )
}

export default App
