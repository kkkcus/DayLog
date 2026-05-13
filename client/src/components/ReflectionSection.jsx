import { useState, useEffect } from 'react'
import api from '../api.js'

const moodStages = [
  { level: 5, label: '최고', emoji: '😄', color: '#22c55e' },
  { level: 4, label: '좋음', emoji: '😊', color: '#84cc16' },
  { level: 3, label: '보통', emoji: '😐', color: '#eab308' },
  { level: 2, label: '별로', emoji: '😔', color: '#f97316' },
  { level: 1, label: '최악', emoji: '😫', color: '#ef4444' }
]

const CATEGORY_LABELS = { work: '업무', study: '학습', health: '건강', life: '생활', hobby: '취미', etc: '기타' }
const CATEGORY_COLORS = {
  work: '#3b82f6',
  study: '#8b5cf6',
  health: '#10b981',
  life: '#f59e0b',
  hobby: '#ec4899',
  etc: '#6b7280'
}

export default function ReflectionSection({ date, onReflectionUpdate }) {
  const today = new Date().toISOString().split('T')[0]
  const targetDate = date || today
  const isReadOnly = false
  const isFuture = targetDate > today

  const tomorrowDate = (() => {
    const d = new Date(today)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  })()

  const [reflection, setReflection] = useState(null)
  const [completedTodos, setCompletedTodos] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [tempReflection, setTempReflection] = useState({ done: '', feeling: '', mood: 3, tomorrow: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // 내일 할일 (편집 모드와 무관하게 항상 독립적으로 동작)
  const [tomorrowTodos, setTomorrowTodos] = useState([])
  const [newTomorrowTodo, setNewTomorrowTodo] = useState('')
  const [tomorrowCategory, setTomorrowCategory] = useState('work')
  const [tomorrowLoading, setTomorrowLoading] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => {
    fetchReflection()
    if (!isReadOnly) {
      fetchCompletedTodos()
      fetchTomorrowTodos()
    }
    setIsEditing(false)
  }, [targetDate])

  const fetchCompletedTodos = async () => {
    try {
      const response = await api.get(`/todos?date=${targetDate}`)
      setCompletedTodos(response.data.filter(todo => todo.completed))
    } catch (err) {
      console.error('Error fetching completed todos:', err)
    }
  }

  const fetchReflection = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/reflections?date=${targetDate}`)
      setReflection(response.data)
      setTempReflection({
        done: response.data.done || '',
        feeling: response.data.feeling || '',
        mood: response.data.mood || 3,
        tomorrow: response.data.tomorrow || ''
      })
    } catch (err) {
      if (err.response?.status === 404) {
        setReflection(null)
      } else {
        setError('회고를 불러올 수 없습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchTomorrowTodos = async () => {
    try {
      const response = await api.get(`/todos?date=${tomorrowDate}`)
      setTomorrowTodos(response.data)
    } catch (err) {
      console.error('Error fetching tomorrow todos:', err)
    }
  }

  const handleAddTomorrowTodo = async () => {
    if (!newTomorrowTodo.trim()) return
    try {
      setTomorrowLoading(true)
      const response = await api.post('/todos', {
        title: newTomorrowTodo,
        category: tomorrowCategory,
        date: tomorrowDate
      })
      setTomorrowTodos(prev => [...prev, response.data])
      setNewTomorrowTodo('')
    } catch (err) {
      setError('내일 할일 추가에 실패했습니다')
    } finally {
      setTomorrowLoading(false)
    }
  }

  const handleDeleteTomorrowTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`)
      setTomorrowTodos(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      setError('할일 삭제에 실패했습니다')
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      if (reflection) {
        const response = await api.patch(`/reflections/${reflection._id}`, tempReflection)
        setReflection(response.data)
      } else {
        const response = await api.post('/reflections', { date: targetDate, ...tempReflection })
        setReflection(response.data)
      }
      setIsEditing(false)
    } catch (err) {
      setError('회고 저장에 실패했습니다')
    } finally {
      if (onReflectionUpdate) onReflectionUpdate()
    }
  }

  const handleCancel = () => {
    if (reflection) {
      setTempReflection({
        done: reflection.done || '',
        feeling: reflection.feeling || '',
        mood: reflection.mood || 3,
        tomorrow: reflection.tomorrow || ''
      })
    }
    setIsEditing(false)
  }

  const getMoodInfo = (mood) => moodStages.find(s => s.level === mood)
  const reflectionMood = reflection ? getMoodInfo(reflection.mood || 3) : null

  return (
    <div className="panel">
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
          <img src={lightboxUrl} alt="인증 사진" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <h2 className="panel-title">💭 {isFuture ? '회고' : isReadOnly ? '회고' : '오늘의 회고'}</h2>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="reflection-date">📅 {targetDate}</div>

      {/* ── 회고 본문 영역 ── */}
      {isFuture ? (
        <div className="empty-state" style={{ padding: '2rem 0' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔮</p>
          <p>아직 지나지 않은 날입니다</p>
          <p style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.4rem' }}>회고는 해당 날짜가 되면 작성할 수 있어요</p>
        </div>
      ) : loading ? (
        <p className="empty-state">로딩 중...</p>
      ) : isEditing ? (
        <div className="reflection-form">
          <div className="form-group">
            <label>오늘 기분은 어땠어요?</label>
            <div className="mood-selector">
              {moodStages.map(stage => (
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
            {completedTodos.some(t => t.photoUrl) && (
              <div className="reflection-photo-strip">
                {completedTodos.filter(t => t.photoUrl).map(todo => (
                  <div key={todo._id} className="reflection-photo-item" onClick={() => setLightboxUrl(todo.photoUrl)}>
                    <img src={todo.photoUrl} alt={todo.title} className="reflection-photo-thumb" />
                    <p className="reflection-photo-label">{todo.title}</p>
                  </div>
                ))}
              </div>
            )}
            {completedTodos.length > 0 && (
              <div className="completed-todos-hint">
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>완료한 할일:</p>
                <ul style={{ fontSize: '0.85rem', paddingLeft: '1rem' }}>
                  {completedTodos.map(todo => <li key={todo._id}>{todo.title}</li>)}
                </ul>
              </div>
            )}
            <textarea
              value={tempReflection.done}
              onChange={e => setTempReflection(p => ({ ...p, done: e.target.value }))}
              placeholder="오늘 성공한 일들을 기록해보세요..."
              rows={4}
            />
          </div>

          <div className="form-group">
            <label>🎯 내일 목표</label>
            <textarea
              value={tempReflection.tomorrow}
              onChange={e => setTempReflection(p => ({ ...p, tomorrow: e.target.value }))}
              placeholder="내일의 목표를 자유롭게 적어보세요..."
              rows={3}
            />
          </div>

          <div className="reflection-buttons">
            <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </button>
            <button onClick={handleCancel} className="btn btn-secondary" disabled={loading}>취소</button>
          </div>
        </div>
      ) : reflection ? (
        <div className="reflection-content">
          <div className="reflection-section">
            <h3>{reflectionMood?.emoji} 기분</h3>
            <div className="feeling-badge" style={{ backgroundColor: reflectionMood?.color }}>
              {reflectionMood?.label}
            </div>
          </div>

          <div className="reflection-section">
            <h3>✅ 완료한 일</h3>
            {completedTodos.some(t => t.photoUrl) && (
              <div className="reflection-photo-strip">
                {completedTodos.filter(t => t.photoUrl).map(todo => (
                  <div key={todo._id} className="reflection-photo-item" onClick={() => setLightboxUrl(todo.photoUrl)}>
                    <img src={todo.photoUrl} alt={todo.title} className="reflection-photo-thumb" />
                    <p className="reflection-photo-label">{todo.title}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="reflection-text">
              {reflection.done
                ? reflection.done.split('\n').map((line, i) => line.trim() && <p key={i}>{line}</p>)
                : <p style={{ color: '#999', fontStyle: 'italic' }}>기록된 내용이 없습니다</p>
              }
            </div>
          </div>

          <div className="reflection-section">
            <h3>🎯 내일 목표</h3>
            <div className="reflection-text">
              {reflection.tomorrow
                ? reflection.tomorrow.split('\n').map((line, i) => line.trim() && <p key={i}>{line}</p>)
                : <p style={{ color: '#999', fontStyle: 'italic' }}>목표가 설정되지 않았습니다</p>
              }
            </div>
          </div>

          {!isReadOnly && (
            <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              수정
            </button>
          )}
        </div>
      ) : (
        <div className="empty-state">
          {isReadOnly ? (
            <p>이 날의 회고가 없습니다</p>
          ) : (
            <>
              <p>오늘의 회고가 없습니다.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>새로운 회고를 작성해보세요!</p>
              <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ marginTop: '1rem' }}>
                회고 작성
              </button>
            </>
          )}
        </div>
      )}

      {/* ── 내일 할일 추가 (오늘일 때만, 편집 모드와 무관하게 항상 표시) ── */}
      {targetDate === today && (
        <div className="tomorrow-todo-section">
          <h3 className="tomorrow-todo-title">📋 내일 할일</h3>

          {/* 입력창 고정 */}
          <div className="todo-input-group tomorrow-todo-input">
            <input
              type="text"
              value={newTomorrowTodo}
              onChange={e => setNewTomorrowTodo(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddTomorrowTodo()}
              placeholder="내일 할일을 입력하세요..."
              className="todo-input"
              disabled={tomorrowLoading}
            />
            <select
              value={tomorrowCategory}
              onChange={e => setTomorrowCategory(e.target.value)}
              className="category-select"
              disabled={tomorrowLoading}
            >
              {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleAddTomorrowTodo}
              className="btn btn-primary"
              disabled={tomorrowLoading}
            >
              {tomorrowLoading ? '추가중...' : '추가'}
            </button>
          </div>

          {/* 목록만 스크롤 */}
          <div className="tomorrow-todo-scroll">
            {tomorrowTodos.length === 0 ? (
              <p className="tomorrow-todo-empty">아직 내일 할일이 없습니다</p>
            ) : (
              <ul className="tomorrow-todo-list">
                {tomorrowTodos.map(todo => (
                  <li key={todo._id} className="tomorrow-todo-item">
                    <span
                      className="tomorrow-todo-badge"
                      style={{ backgroundColor: CATEGORY_COLORS[todo.category] || '#94a3b8' }}
                    >
                      {CATEGORY_LABELS[todo.category] || todo.category}
                    </span>
                    <span className="tomorrow-todo-text">{todo.title}</span>
                    <button
                      onClick={() => handleDeleteTomorrowTodo(todo._id)}
                      className="tomorrow-todo-delete"
                      title="삭제"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
