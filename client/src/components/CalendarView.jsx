import { useState, useEffect } from 'react'
import api from '../api.js'

const MOOD_EMOJIS = { 1: '😫', 2: '😔', 3: '😐', 4: '😊', 5: '😄' }
const MOOD_BG = {
  5: '#dcfce7',
  4: '#ecfccb',
  3: '#fef9c3',
  2: '#ffedd5',
  1: '#fee2e2',
}
const MOOD_BORDER = {
  5: '#86efac',
  4: '#bef264',
  3: '#fde047',
  2: '#fdba74',
  1: '#fca5a5',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

const getWeekStart = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

export default function CalendarView({ onDateClick, selectedDate }) {
  const today = new Date().toISOString().split('T')[0]
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [todosByDate, setTodosByDate] = useState({})
  const [reflectionsByDate, setReflectionsByDate] = useState({})
  const [loading, setLoading] = useState(false)
  const [catColorMap, setCatColorMap] = useState({})
  const [catList, setCatList] = useState([])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const weekStartDate = getWeekStart(currentDate)
  const weekStartStr = weekStartDate.toISOString().split('T')[0]
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStartDate)
    d.setDate(weekStartDate.getDate() + i)
    return d.toISOString().split('T')[0]
  })
  const weekEndStr = weekDays[6]

  useEffect(() => {
    api.get('/categories').then(res => {
      const map = {}
      res.data.forEach(c => { map[c.name] = c.color })
      setCatColorMap(map)
      setCatList(res.data)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let startDate, endDate
    if (viewMode === 'month') {
      startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    } else {
      startDate = weekStartStr
      endDate = weekEndStr
    }
    fetchVisibleData(startDate, endDate)
  }, [year, month, viewMode, weekStartStr])

  const fetchVisibleData = async (startDate, endDate) => {
    setLoading(true)
    try {
      const [todosRes, reflectionsRes] = await Promise.allSettled([
        api.get(`/todos?start=${startDate}&end=${endDate}`),
        api.get(`/reflections?start=${startDate}&end=${endDate}`)
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
      console.error('Error fetching calendar data:', err)
    } finally {
      setLoading(false)
    }
  }

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1))
    } else {
      setCurrentDate(prev => {
        const d = new Date(prev)
        d.setDate(d.getDate() - 7)
        return d
      })
    }
  }

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1))
    } else {
      setCurrentDate(prev => {
        const d = new Date(prev)
        d.setDate(d.getDate() + 7)
        return d
      })
    }
  }

  const goToToday = () => setCurrentDate(new Date())

  const periodLabel = () => {
    if (viewMode === 'month') return `${year}년 ${month + 1}월`
    const fmt = (str) => {
      const d = new Date(str + 'T00:00:00')
      return `${d.getMonth() + 1}월 ${d.getDate()}일`
    }
    return `${fmt(weekStartStr)} – ${fmt(weekEndStr)}`
  }

  const isCurrentPeriod = viewMode === 'month'
    ? (year === new Date().getFullYear() && month === new Date().getMonth())
    : weekDays.includes(today)

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

  // Month grid
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarCells = []
  for (let i = 0; i < firstDayOfMonth; i++) calendarCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d)

  const renderDayBars = (dateStr, isFuture) => {
    const categoryStats = getCategoryStats(dateStr)
    if (!categoryStats) return null
    return (
      <div className="day-bars">
        {Object.entries(categoryStats).map(([cat, stats]) => {
          const pct = isFuture ? 100 : Math.round((stats.completed / stats.total) * 100)
          const barColor = isFuture ? '#d1d5db' : (catColorMap[cat] || '#94a3b8')
          return (
            <div
              key={cat}
              className="mini-bar-track"
              title={isFuture
                ? `${CATEGORY_LABEL_MAP[cat] || cat}: ${stats.total}개 예정`
                : `${CATEGORY_LABEL_MAP[cat] || cat}: ${stats.completed}/${stats.total} (${pct}%)`}
            >
              <div className="mini-bar-fill" style={{ width: `${pct}%`, backgroundColor: barColor }} />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="calendar-section">
      <div className="calendar-view">
        {/* Header */}
        <div className="calendar-view-header">
          <div className="calendar-nav-group">
            <button onClick={prevPeriod} className="calendar-nav">◀</button>
            <h2 className="calendar-view-title">{periodLabel()}</h2>
            <button onClick={nextPeriod} className="calendar-nav">▶</button>
          </div>
          <div className="calendar-controls">
            {!isCurrentPeriod && (
              <button onClick={goToToday} className="calendar-today-btn">오늘</button>
            )}
            <div className="view-toggle">
              <button
                className={`view-toggle-btn${viewMode === 'month' ? ' active' : ''}`}
                onClick={() => setViewMode('month')}
              >월별</button>
              <button
                className={`view-toggle-btn${viewMode === 'week' ? ' active' : ''}`}
                onClick={() => setViewMode('week')}
              >주별</button>
            </div>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="calendar-weekdays">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`weekday${i === 0 ? ' sun' : i === 6 ? ' sat' : ''}`}>{d}</div>
          ))}
        </div>

        {loading ? (
          <p className="empty-state" style={{ padding: '3rem' }}>로딩 중...</p>
        ) : viewMode === 'month' ? (
          /* ── Month View ── */
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
              const moodBg = (!isFuture && reflection?.mood) ? MOOD_BG[reflection.mood] : null
              const moodBorder = (!isFuture && reflection?.mood) ? MOOD_BORDER[reflection.mood] : null

              const classes = [
                'calendar-day-full',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isFuture ? 'future' : '',
                categoryStats ? 'has-data' : '',
              ].filter(Boolean).join(' ')

              const cellStyle = moodBg && !isToday && !isSelected
                ? { backgroundColor: moodBg, borderColor: moodBorder }
                : undefined

              return (
                <div key={dateStr} className={classes} style={cellStyle} onClick={() => onDateClick(dateStr)} title={dateStr}>
                  <div className="day-top">
                    <span className={`day-num${isSunday ? ' sun' : isSaturday ? ' sat' : ''}`}>{day}</span>
                    {reflection && <span className="day-mood-icon">{MOOD_EMOJIS[reflection.mood] || '😐'}</span>}
                  </div>
                  {renderDayBars(dateStr, isFuture)}
                </div>
              )
            })}
          </div>
        ) : (
          /* ── Week View ── */
          <div className="calendar-week-grid">
            {weekDays.map((dateStr, idx) => {
              const day = parseInt(dateStr.split('-')[2])
              const isToday = dateStr === today
              const isSelected = dateStr === selectedDate && dateStr !== today
              const isFuture = dateStr > today
              const isSunday = idx === 0
              const isSaturday = idx === 6
              const categoryStats = getCategoryStats(dateStr)
              const reflection = reflectionsByDate[dateStr]
              const dayTodos = todosByDate[dateStr] || []
              const moodBg = (!isFuture && reflection?.mood) ? MOOD_BG[reflection.mood] : null
              const moodBorder = (!isFuture && reflection?.mood) ? MOOD_BORDER[reflection.mood] : null

              const classes = [
                'calendar-week-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isFuture ? 'future' : '',
                categoryStats ? 'has-data' : '',
              ].filter(Boolean).join(' ')

              const cellStyle = moodBg && !isToday && !isSelected
                ? { backgroundColor: moodBg, borderColor: moodBorder }
                : undefined

              return (
                <div key={dateStr} className={classes} style={cellStyle} onClick={() => onDateClick(dateStr)}>
                  <div className="week-day-header">
                    <span className={`week-day-name${isSunday ? ' sun' : isSaturday ? ' sat' : ''}`}>
                      {WEEKDAYS[idx]}
                    </span>
                    <span className={`week-day-num${isSunday ? ' sun' : isSaturday ? ' sat' : ''}`}>
                      {day}
                    </span>
                  </div>

                  {dayTodos.length > 0 ? (
                    <div className="week-day-todos">
                      {dayTodos.slice(0, 3).map(todo => (
                        <div
                          key={todo._id}
                          className={`week-todo-title${todo.completed ? ' completed' : ''}`}
                          style={{ borderLeftColor: catColorMap[todo.category] || '#94a3b8' }}
                        >
                          {todo.title}
                        </div>
                      ))}
                      {dayTodos.length > 3 && (
                        <div className="week-todo-more">+{dayTodos.length - 3}개 더</div>
                      )}
                    </div>
                  ) : (
                    <div className="week-day-empty">일정 없음</div>
                  )}

                  {reflection && (
                    <div className="week-day-mood">{MOOD_EMOJIS[reflection.mood] || '😐'}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Legend */}
        {catList.length > 0 && (
          <div className="calendar-view-legend">
            {catList.map(cat => (
              <div key={cat._id} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
