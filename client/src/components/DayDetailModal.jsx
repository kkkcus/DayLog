import { useState, useEffect } from 'react'
import axios from 'axios'

const CATEGORY_COLORS = {
  work: '#667eea',
  study: '#f59e0b',
  health: '#22c55e',
  life: '#ec4899',
  etc: '#94a3b8',
  general: '#94a3b8'
}

const CATEGORY_LABELS = {
  work: '업무',
  study: '학습',
  health: '건강',
  life: '생활',
  etc: '기타',
  general: '일반'
}

const MOOD_STAGES = [
  { level: 5, label: '최고', emoji: '😄', color: '#22c55e' },
  { level: 4, label: '좋음', emoji: '😊', color: '#84cc16' },
  { level: 3, label: '보통', emoji: '😐', color: '#eab308' },
  { level: 2, label: '별로', emoji: '😔', color: '#f97316' },
  { level: 1, label: '최악', emoji: '😫', color: '#ef4444' }
]

const getMoodInfo = (level) => MOOD_STAGES.find(s => s.level === level)

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
}

export default function DayDetailModal({ date, onClose }) {
  const today = new Date().toISOString().split('T')[0]
  const isToday = date === today

  const [todos, setTodos] = useState([])
  const [reflection, setReflection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditingReflection, setIsEditingReflection] = useState(false)
  const [tempReflection, setTempReflection] = useState({ done: '', feeling: '', mood: 3, tomorrow: '' })
  const [newTodo, setNewTodo] = useState('')
  const [newTodoCategory, setNewTodoCategory] = useState('work')
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [date])

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [todosRes, reflectionRes] = await Promise.allSettled([
        axios.get(`/api/todos?date=${date}`),
        axios.get(`/api/reflections?date=${date}`)
      ])

      if (todosRes.status === 'fulfilled') {
        setTodos(todosRes.value.data)
      }

      if (reflectionRes.status === 'fulfilled') {
        const r = reflectionRes.value.data
        setReflection(r)
        setTempReflection({
          done: r.done || '',
          feeling: r.feeling || '',
          mood: r.mood || 3,
          tomorrow: r.tomorrow || ''
        })
      } else {
        setReflection(null)
      }
    } catch (err) {
      console.error('Error fetching day data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (id) => {
    if (!isToday) return
    try {
      const res = await axios.patch(`/api/todos/${id}`)
      setTodos(todos.map(t => t._id === id ? res.data : t))
    } catch (err) {
      console.error('Error toggling todo:', err)
    }
  }

  const handleDeleteTodo = async (id) => {
    if (!isToday) return
    try {
      await axios.delete(`/api/todos/${id}`)
      setTodos(todos.filter(t => t._id !== id))
    } catch (err) {
      console.error('Error deleting todo:', err)
    }
  }

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return
    try {
      const res = await axios.post('/api/todos', {
        title: newTodo,
        category: newTodoCategory,
        date
      })
      setTodos([res.data, ...todos])
      setNewTodo('')
    } catch (err) {
      console.error('Error adding todo:', err)
    }
  }

  const handleSaveReflection = async () => {
    try {
      setError(null)
      if (reflection) {
        const res = await axios.patch(`/api/reflections/${reflection._id}`, tempReflection)
        setReflection(res.data)
      } else {
        const res = await axios.post('/api/reflections', { date, ...tempReflection })
        setReflection(res.data)
      }
      setIsEditingReflection(false)
    } catch (err) {
      setError('저장에 실패했습니다')
    }
  }

  const groupedTodos = todos.reduce((acc, todo) => {
    const cat = todo.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(todo)
    return acc
  }, {})

  const totalTodos = todos.length
  const completedTodos = todos.filter(t => t.completed).length

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-date">{formatDate(date)}</h2>
            {isToday && <span className="modal-today-badge">오늘</span>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="modal-body">
            <p className="empty-state">로딩 중...</p>
          </div>
        ) : (
          <div className="modal-body">
            {error && <div className="error-message">⚠️ {error}</div>}

            {/* 할일 섹션 */}
            <div className="modal-section">
              <div className="modal-section-header">
                <h3>📋 할일</h3>
                {totalTodos > 0 && (
                  <span className="modal-stats">
                    {completedTodos}/{totalTodos} 완료
                  </span>
                )}
              </div>

              {isToday && (
                <div className="todo-input-group modal-todo-input">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={e => setNewTodo(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleAddTodo()}
                    placeholder="할일 추가..."
                    className="todo-input"
                  />
                  <select
                    value={newTodoCategory}
                    onChange={e => setNewTodoCategory(e.target.value)}
                    className="category-select"
                  >
                    <option value="work">업무</option>
                    <option value="study">학습</option>
                    <option value="health">건강</option>
                    <option value="life">생활</option>
                    <option value="etc">기타</option>
                  </select>
                  <button onClick={handleAddTodo} className="btn btn-primary">추가</button>
                </div>
              )}

              {todos.length === 0 ? (
                <p className="empty-state" style={{ padding: '1rem 0' }}>할일이 없습니다</p>
              ) : (
                <div className="modal-todo-list">
                  {Object.entries(groupedTodos).map(([cat, catTodos]) => {
                    const completed = catTodos.filter(t => t.completed).length
                    const color = CATEGORY_COLORS[cat] || '#94a3b8'
                    return (
                      <div key={cat} className="modal-category-group">
                        <div className="modal-category-label-row">
                          <span
                            className="category-label"
                            style={{ backgroundColor: color, color: 'white' }}
                          >
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          <span className="modal-cat-count">{completed}/{catTodos.length}</span>
                          <div className="completion-bar" style={{ flex: 1 }}>
                            <div
                              className="completion-fill"
                              style={{
                                width: `${(completed / catTodos.length) * 100}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                        {catTodos.map(todo => (
                          <div
                            key={todo._id}
                            className="todo-item"
                            style={{ borderLeftColor: color }}
                          >
                            <div className="todo-content">
                              <input
                                type="checkbox"
                                checked={todo.completed}
                                onChange={() => handleToggleTodo(todo._id)}
                                disabled={!isToday}
                                className="todo-checkbox"
                              />
                              <span className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                                {todo.title}
                              </span>
                            </div>
                            {isToday && (
                              <button
                                onClick={() => handleDeleteTodo(todo._id)}
                                className="btn btn-delete"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* 회고 섹션 */}
            <div className="modal-section">
              <div className="modal-section-header">
                <h3>💭 회고</h3>
              </div>

              {isEditingReflection ? (
                <div className="modal-reflection-form">
                  <div className="form-group">
                    <label>오늘 기분은 어땠어요?</label>
                    <div className="mood-selector">
                      {MOOD_STAGES.map(stage => (
                        <button
                          key={stage.level}
                          className={`mood-button ${tempReflection.mood === stage.level ? 'active' : ''}`}
                          onClick={() => setTempReflection(p => ({ ...p, mood: stage.level }))}
                          style={{
                            borderColor: stage.color,
                            backgroundColor: tempReflection.mood === stage.level ? stage.color : 'white',
                            color: tempReflection.mood === stage.level ? 'white' : stage.color
                          }}
                        >
                          <span className="mood-emoji">{stage.emoji}</span>
                          <span className="mood-label">{stage.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>오늘 뭘 했어요?</label>
                    <textarea
                      value={tempReflection.done}
                      onChange={e => setTempReflection(p => ({ ...p, done: e.target.value }))}
                      placeholder="오늘 성공한 일들을 기록해보세요..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>내일 목표</label>
                    <textarea
                      value={tempReflection.tomorrow}
                      onChange={e => setTempReflection(p => ({ ...p, tomorrow: e.target.value }))}
                      placeholder="내일의 목표를 적어보세요..."
                      rows={3}
                    />
                  </div>
                  <div className="reflection-buttons">
                    <button onClick={handleSaveReflection} className="btn btn-primary">저장</button>
                    <button onClick={() => setIsEditingReflection(false)} className="btn btn-secondary">취소</button>
                  </div>
                </div>
              ) : reflection ? (
                <div className="modal-reflection-view">
                  <div className="modal-mood-display">
                    <span
                      className="feeling-badge"
                      style={{ backgroundColor: getMoodInfo(reflection.mood)?.color }}
                    >
                      {getMoodInfo(reflection.mood)?.emoji} {getMoodInfo(reflection.mood)?.label}
                    </span>
                  </div>

                  {reflection.done && (
                    <div className="reflection-section" style={{ marginTop: '1rem' }}>
                      <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '0.95rem' }}>✅ 완료한 일</h4>
                      <div className="reflection-text">
                        {reflection.done.split('\n').map((line, i) =>
                          line.trim() && <p key={i}>{line}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {reflection.tomorrow && (
                    <div className="reflection-section" style={{ marginTop: '1rem' }}>
                      <h4 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '0.95rem' }}>🎯 내일 목표</h4>
                      <div className="reflection-text">
                        {reflection.tomorrow.split('\n').map((line, i) =>
                          line.trim() && <p key={i}>{line}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {isToday && (
                    <button
                      onClick={() => setIsEditingReflection(true)}
                      className="btn btn-primary"
                      style={{ marginTop: '1rem' }}
                    >
                      수정
                    </button>
                  )}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: '1rem 0' }}>
                  <p>회고가 없습니다</p>
                  {isToday && (
                    <button
                      onClick={() => setIsEditingReflection(true)}
                      className="btn btn-primary"
                      style={{ marginTop: '1rem' }}
                    >
                      회고 작성
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
