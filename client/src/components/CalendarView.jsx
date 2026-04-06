import { useState, useEffect } from 'react'
import axios from 'axios'

const CATEGORY_COLORS = {
  work: '#3b82f6',
  study: '#8b5cf6',
  health: '#10b981',
  life: '#f59e0b',
  hobby: '#ec4899',
  etc: '#6b7280',
  general: '#94a3b8'
}

const CATEGORY_LABEL_MAP = {
  work: '업무',
  study: '학습',
  health: '건강',
  life: '생활',
  hobby: '취미',
  etc: '기타',
  general: '일반'
}

const MOOD_EMOJIS = { 1: '😫', 2: '😔', 3: '😐', 4: '😊', 5: '😄' }
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarView({ onDateClick, selectedDate }) {
  const today = new Date().toISOString().split('T')[0]
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todosByDate, setTodosByDate] = useState({})
  const [reflectionsByDate, setReflectionsByDate] = useState({})
  const [loading, setLoading] = useState(false)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  useEffect(() => {
    fetchMonthData()
  }, [year, month])

  const fetchMonthData = async () => {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    try {
      const [todosRes, reflectionsRes] = await Promise.allSettled([
        axios.get(`/api/todos?start=${startDate}&end=${endDate}`),
        axios.get(`/api/reflections?start=${startDate}&end=${endDate}`)
      ])

      if (todosRes.status === 'fulfilled') {
        const byDate = {}
        todosRes.value.data.forEach(todo => {
          if (!byDate[todo.date]) byDate[todo.date] = []
          byDate[todo.date].push(todo)
        })
        setTodosByDate(byDate)
      }

      if (reflectionsRes.status === 'fulfilled') {
        const reflByDate = {}
        const reflections = Array.isArray(reflectionsRes.value.data)
          ? reflectionsRes.value.data
          : [reflectionsRes.value.data]
        reflections.forEach(r => {
          if (r && r.date) reflByDate[r.date] = r
        })
        setReflectionsByDate(reflByDate)
      }
    } catch (err) {
      console.error('Error fetching month data:', err)
    } finally {
      setLoading(false)
    }
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const calendarCells = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const getCategoryStats = (dateStr) => {
    const todos = todosByDate[dateStr] || []
    if (todos.length === 0) return null
    const stats = {}
    todos.forEach(todo => {
      const cat = todo.category || 'general'
      if (!stats[cat]) stats[cat] = { total: 0, completed: 0 }
      stats[cat].total++
      if (todo.completed) stats[cat].completed++
    })
    return stats
  }

  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

  return (
    <div className="calendar-view">
      <div className="calendar-view-header">
        <div className="calendar-nav-group">
          <button onClick={prevMonth} className="calendar-nav">◀</button>
          <h2 className="calendar-view-title">{year}년 {month + 1}월</h2>
          <button onClick={nextMonth} className="calendar-nav">▶</button>
        </div>
        {!isCurrentMonth && (
          <button onClick={goToToday} className="calendar-today-btn">오늘</button>
        )}
      </div>

      <div className="calendar-weekdays">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`weekday ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</div>
        ))}
      </div>

      {loading ? (
        <p className="empty-state" style={{ padding: '3rem' }}>로딩 중...</p>
      ) : (
        <div className="calendar-grid-full">
          {calendarCells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="calendar-day-full empty" />

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isToday = dateStr === today
            const isSelected = dateStr === selectedDate && dateStr !== today
            const isFuture = dateStr > today
            const isSunday = (idx % 7) === 0
            const isSaturday = (idx % 7) === 6
            const categoryStats = getCategoryStats(dateStr)
            const reflection = reflectionsByDate[dateStr]

            return (
              <div
                key={dateStr}
                className={`calendar-day-full${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isFuture ? ' future' : ''}${categoryStats ? ' has-data' : ''}`}
                onClick={() => onDateClick(dateStr)}
                title={dateStr}
              >
                <div className="day-top">
                  <span className={`day-num${isSunday ? ' sun' : isSaturday ? ' sat' : ''}`}>{day}</span>
                  {reflection && (
                    <span className="day-mood-icon">{MOOD_EMOJIS[reflection.mood] || '😐'}</span>
                  )}
                </div>

                {categoryStats && (
                  <div className="day-bars">
                    {Object.entries(categoryStats).map(([cat, stats]) => {
                      const pct = isFuture ? 100 : Math.round((stats.completed / stats.total) * 100)
                      const barColor = isFuture ? '#d1d5db' : (CATEGORY_COLORS[cat] || '#94a3b8')
                      return (
                        <div
                          key={cat}
                          className="mini-bar-track"
                          title={isFuture
                            ? `${CATEGORY_LABEL_MAP[cat] || cat}: ${stats.total}개 예정`
                            : `${CATEGORY_LABEL_MAP[cat] || cat}: ${stats.completed}/${stats.total} (${pct}%)`}
                        >
                          <div
                            className="mini-bar-fill"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: barColor
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="calendar-view-legend">
        {Object.entries(CATEGORY_LABEL_MAP).filter(([k]) => k !== 'general').map(([cat, label]) => (
          <div key={cat} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
