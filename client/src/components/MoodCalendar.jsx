import { useState, useEffect } from 'react'
import axios from 'axios'

const moodColors = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#22c55e'
}

export default function MoodCalendar() {
  const [reflections, setReflections] = useState({})
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)

  const API_URL = '/api'

  useEffect(() => {
    fetchMonthReflections()
  }, [currentMonth])

  const fetchMonthReflections = async () => {
    try {
      setLoading(true)
      const year = currentMonth.getFullYear()
      const month = String(currentMonth.getMonth() + 1).padStart(2, '0')

      const startDate = `${year}-${month}-01`
      const lastDay = new Date(year, currentMonth.getMonth() + 1, 0).getDate()
      const endDate = `${year}-${month}-${lastDay}`

      const response = await axios.get(
        `${API_URL}/reflections?start=${startDate}&end=${endDate}`
      )

      const reflectionMap = {}
      response.data.forEach(reflection => {
        reflectionMap[reflection.date] = reflection
      })
      setReflections(reflectionMap)
    } catch (err) {
      console.error('Error fetching reflections:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  }

  const days = []
  const firstDay = getFirstDayOfMonth()
  const daysInMonth = getDaysInMonth()

  // 빈 칸 추가
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // 날짜 추가
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const monthName = currentMonth.toLocaleString('ko-KR', { month: 'long', year: 'numeric' })
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="mood-calendar">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav">
          ◀
        </button>
        <h3>{monthName}</h3>
        <button onClick={handleNextMonth} className="calendar-nav">
          ▶
        </button>
      </div>

      <div className="calendar-weekdays">
        <div className="weekday">일</div>
        <div className="weekday">월</div>
        <div className="weekday">화</div>
        <div className="weekday">수</div>
        <div className="weekday">목</div>
        <div className="weekday">금</div>
        <div className="weekday">토</div>
      </div>

      <div className="calendar-grid">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="calendar-day empty" />
          }

          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const reflection = reflections[dateStr]
          const isToday = dateStr === today
          const moodColor = reflection ? moodColors[reflection.mood] : null

          return (
            <div
              key={day}
              className={`calendar-day ${isToday ? 'today' : ''}`}
              style={{
                backgroundColor: moodColor || 'transparent'
              }}
            >
              <div className="day-number">{day}</div>
              {reflection && (
                <div className="day-mood-emoji">
                  {reflection.mood === 1 && '😫'}
                  {reflection.mood === 2 && '😔'}
                  {reflection.mood === 3 && '😐'}
                  {reflection.mood === 4 && '😊'}
                  {reflection.mood === 5 && '😄'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mood-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#22c55e' }} />
          <span>최고</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#84cc16' }} />
          <span>좋음</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#eab308' }} />
          <span>보통</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#f97316' }} />
          <span>별로</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ef4444' }} />
          <span>최악</span>
        </div>
      </div>
    </div>
  )
}
