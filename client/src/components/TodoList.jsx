import { useState, useEffect, useRef } from 'react'
import api from '../api.js'

export default function TodoList({ date }) {
  const today = new Date().toISOString().split('T')[0]
  const targetDate = date || today

  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [category, setCategory] = useState('work')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [frequentTodos, setFrequentTodos] = useState([])
  const [uploadingId, setUploadingId] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const fileInputRef = useRef(null)
  const activeTodoIdRef = useRef(null)
  const [expandedCategories, setExpandedCategories] = useState({
    work: true,
    study: true,
    health: true,
    life: true,
    etc: true
  })

  const categoryInfo = {
    work: { label: '업무', color: '#3b82f6', bgColor: '#dbeafe' },
    study: { label: '학습', color: '#8b5cf6', bgColor: '#ede9fe' },
    health: { label: '건강', color: '#10b981', bgColor: '#d1fae5' },
    life: { label: '생활', color: '#f59e0b', bgColor: '#fef3c7' },
    hobby: { label: '취미', color: '#ec4899', bgColor: '#fce7f3' },
    etc: { label: '기타', color: '#6b7280', bgColor: '#f3f4f6' }
  }

  useEffect(() => {
    fetchTodos()
  }, [targetDate])

  useEffect(() => {
    fetchFrequentTodos()
  }, [])

  const fetchFrequentTodos = async () => {
    try {
      const response = await api.get('/todos/frequent')
      setFrequentTodos(response.data)
    } catch (err) {
      console.error('Error fetching frequent todos:', err)
    }
  }

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/todos?date=${targetDate}`)
      setTodos(response.data)
    } catch (err) {
      setError('할일을 불러올 수 없습니다')
      console.error('Error fetching todos:', err)
    } finally {
      setLoading(false)
    }
  }

  const groupTodosByCategory = () => {
    const grouped = { work: [], study: [], health: [], life: [], hobby: [], etc: [] }
    todos.forEach(todo => {
      const cat = todo.category || 'etc'
      if (grouped[cat]) grouped[cat].push(todo)
      else grouped.etc.push(todo)
    })
    return grouped
  }

  const getCompletionRate = (categoryTodos) => {
    if (categoryTodos.length === 0) return 0
    const completed = categoryTodos.filter(t => t.completed).length
    return Math.round((completed / categoryTodos.length) * 100)
  }

  const toggleCategory = (cat) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const handleAddTodo = async (titleOverride, categoryOverride) => {
    const title = titleOverride ?? newTodo
    const cat = categoryOverride ?? category
    if (!title.trim()) return
    try {
      setError(null)
      const response = await api.post('/todos', {
        title,
        category: cat,
        date: targetDate,
      })
      setTodos([...todos, response.data])
      if (!titleOverride) {
        setNewTodo('')
      }
    } catch (err) {
      setError('할일 추가에 실패했습니다')
      console.error('Error adding todo:', err)
    }
  }

  const toggleTodo = async (id) => {
    try {
      setError(null)
      const response = await api.patch(`/todos/${id}`)
      setTodos(todos.map(todo => todo._id === id ? response.data : todo))
    } catch (err) {
      setError('할일 수정에 실패했습니다')
      console.error('Error toggling todo:', err)
      fetchTodos()
    }
  }

  const triggerPhotoUpload = (todoId) => {
    activeTodoIdRef.current = todoId
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const todoId = activeTodoIdRef.current
    setUploadingId(todoId)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const patchRes = await api.patch(`/todos/${todoId}/photo`, { photoUrl: uploadRes.data.url })
      setTodos(prev => prev.map(t => t._id === todoId ? patchRes.data : t))
    } catch (err) {
      console.error('사진 업로드 실패:', err)
    } finally {
      setUploadingId(null)
    }
  }

  const removePhoto = async (todoId) => {
    try {
      const res = await api.patch(`/todos/${todoId}/photo`, { photoUrl: null })
      setTodos(prev => prev.map(t => t._id === todoId ? res.data : t))
    } catch (err) {
      console.error('사진 삭제 실패:', err)
    }
  }

  const deleteTodo = async (id) => {
    try {
      setError(null)
      await api.delete(`/todos/${id}`)
      setTodos(todos.filter(todo => todo._id !== id))
    } catch (err) {
      setError('할일 삭제에 실패했습니다')
      console.error('Error deleting todo:', err)
      fetchTodos()
    }
  }

  const groupedTodos = groupTodosByCategory()
  const totalTodos = todos.length
  const totalCompleted = todos.filter(t => t.completed).length

  return (
    <div className="panel">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
          <img src={lightboxUrl} alt="인증 사진" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}
      <h2 className="panel-title">📝 할일</h2>

      {error && <div className="error-message">⚠️ {error}</div>}

      {frequentTodos.length > 0 && (
        <div className="frequent-todos">
          {frequentTodos.map((item, idx) => (
            <button
              key={idx}
              className="frequent-tag"
              style={{ borderColor: categoryInfo[item.category]?.color || '#6b7280', color: categoryInfo[item.category]?.color || '#6b7280' }}
              onClick={() => handleAddTodo(item.title, item.category)}
              disabled={loading}
              title={`${categoryInfo[item.category]?.label || item.category} · ${item.count}회 사용`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      <div className="todo-input-group">
        <input
          type="text"
          placeholder="새로운 할일을 입력하세요..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          className="todo-input"
          disabled={loading}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="category-select"
          disabled={loading}
        >
          <option value="work">업무</option>
          <option value="study">학습</option>
          <option value="health">건강</option>
          <option value="life">생활</option>
          <option value="hobby">취미</option>
          <option value="etc">기타</option>
        </select>
        <button
          onClick={() => handleAddTodo()}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? '추가중...' : '추가'}
        </button>
      </div>

      <div className="todo-list">
        {loading && todos.length === 0 ? (
          <p className="empty-state">로딩 중...</p>
        ) : totalTodos === 0 ? (
          <p className="empty-state">할일이 없습니다. 새로운 할일을 추가해보세요!</p>
        ) : (
          Object.entries(groupedTodos).map(([cat, categoryTodos]) => {
            if (categoryTodos.length === 0) return null

            const completion = getCompletionRate(categoryTodos)
            const info = categoryInfo[cat]
            const isExpanded = expandedCategories[cat]

            return (
              <div key={cat} className="category-section">
                <button
                  className="category-header"
                  onClick={() => toggleCategory(cat)}
                  style={{ borderLeftColor: info.color }}
                >
                  <div className="category-toggle">
                    <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                    <span
                      className="category-label"
                      style={{ backgroundColor: info.color, color: 'white' }}
                    >
                      {info.label}
                    </span>
                    <span className="category-count">
                      {categoryTodos.filter(t => t.completed).length}/{categoryTodos.length}
                    </span>
                  </div>
                  <div className="completion-bar">
                    <div
                      className="completion-fill"
                      style={{ width: `${completion}%`, backgroundColor: info.color }}
                    />
                  </div>
                  <span className="completion-percent">{completion}%</span>
                </button>

                {isExpanded && (
                  <div className="category-todos">
                    {categoryTodos.map(todo => (
                      <div key={todo._id} className={`todo-item${todo.completed && todo.photoUrl ? ' has-photo' : ''}`}>
                        <div className="todo-content">
                          <input
                            type="checkbox"
                            checked={todo.completed}
                            onChange={() => toggleTodo(todo._id)}
                            className="todo-checkbox"
                            disabled={loading}
                          />
                          <div className="todo-text">
                            <span className={`todo-title ${todo.completed ? 'completed' : ''}`}>
                              {todo.title}
                            </span>
                            {todo.completed && todo.photoUrl && (
                              <div className="todo-photo-wrap">
                                <img
                                  src={todo.photoUrl}
                                  alt="인증 사진"
                                  className="todo-photo-thumb"
                                  onClick={() => setLightboxUrl(todo.photoUrl)}
                                />
                                <button
                                  className="photo-delete-btn"
                                  onClick={() => removePhoto(todo._id)}
                                  title="사진 삭제"
                                >✕</button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="todo-actions">
                          {todo.completed && (
                            <button
                              className="photo-upload-btn"
                              onClick={() => triggerPhotoUpload(todo._id)}
                              disabled={uploadingId === todo._id}
                              title={todo.photoUrl ? '사진 변경' : '인증 사진 추가'}
                            >
                              {uploadingId === todo._id ? '⏳' : '📷'}
                            </button>
                          )}
                          <button
                            onClick={() => deleteTodo(todo._id)}
                            className="btn btn-delete"
                            disabled={loading}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <div className="todo-stats">
        <span>총 {totalTodos}개</span>
        <span>완료 {totalCompleted}개</span>
        <span>진행률 {totalTodos > 0 ? Math.round((totalCompleted / totalTodos) * 100) : 0}%</span>
      </div>
    </div>
  )
}
