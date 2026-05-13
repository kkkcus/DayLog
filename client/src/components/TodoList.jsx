import { useState, useEffect, useRef } from 'react'
import api from '../api.js'

const COLOR_PALETTE = [
  '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
  '#6b7280', '#1f2937',
]

export default function TodoList({ date }) {
  const today = new Date().toISOString().split('T')[0]
  const targetDate = date || today

  const [todos, setTodos] = useState([])
  const [categories, setCategories] = useState([])
  const [newTodo, setNewTodo] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [frequentTodos, setFrequentTodos] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#7c3aed')

  // Photo
  const [uploadingId, setUploadingId] = useState(null)
  const [lightboxUrl, setLightboxUrl] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const fileInputRef = useRef(null)
  const activeTodoIdRef = useRef(null)

  // Share to crew
  const [crewRooms, setCrewRooms] = useState(null) // null = 미로딩
  const [shareTarget, setShareTarget] = useState(null)
  const [shareMsg, setShareMsg] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(null) // roomName

  useEffect(() => { fetchCategories() }, [])
  useEffect(() => { fetchTodos() }, [targetDate])
  useEffect(() => { fetchFrequentTodos() }, [])
  useEffect(() => {
    setExpandedCategories(prev => {
      const next = { ...prev }
      categories.forEach(c => { if (!(c.name in next)) next[c.name] = true })
      return next
    })
  }, [categories])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
      if (res.data.length > 0) setSelectedCategory(res.data[0].name)
    } catch (err) {
      console.error('카테고리 로딩 실패:', err)
    }
  }

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/todos?date=${targetDate}`)
      setTodos(res.data)
    } catch (err) {
      setError('할일을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const fetchFrequentTodos = async () => {
    try {
      const res = await api.get('/todos/frequent')
      setFrequentTodos(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  // ── Category CRUD ──
  const openAddCat = () => { setEditingCat(null); setCatName(''); setCatColor('#7c3aed'); setShowCatModal(true) }
  const openEditCat = (cat) => { setEditingCat(cat); setCatName(cat.name); setCatColor(cat.color); setShowCatModal(true) }
  const closeCatModal = () => { setShowCatModal(false); setEditingCat(null) }

  const handleSaveCat = async () => {
    if (!catName.trim()) return
    try {
      if (editingCat) {
        const res = await api.patch(`/categories/${editingCat._id}`, { name: catName, color: catColor })
        setCategories(prev => prev.map(c => c._id === editingCat._id ? res.data : c))
        if (selectedCategory === editingCat.name) setSelectedCategory(catName)
      } else {
        const res = await api.post('/categories', { name: catName, color: catColor })
        setCategories(prev => [...prev, res.data])
        setSelectedCategory(catName)
      }
      closeCatModal()
    } catch (err) {
      console.error('카테고리 저장 실패:', err)
    }
  }

  const handleDeleteCat = async () => {
    if (!editingCat) return
    try {
      await api.delete(`/categories/${editingCat._id}`)
      const remaining = categories.filter(c => c._id !== editingCat._id)
      setCategories(remaining)
      if (selectedCategory === editingCat.name) setSelectedCategory(remaining[0]?.name || '')
      closeCatModal()
    } catch (err) {
      console.error('카테고리 삭제 실패:', err)
    }
  }

  // ── Todo CRUD ──
  const handleAddTodo = async (titleOverride, categoryOverride) => {
    const title = titleOverride ?? newTodo
    const cat = categoryOverride ?? selectedCategory
    if (!title.trim()) return
    try {
      setError(null)
      const res = await api.post('/todos', { title, category: cat, date: targetDate })
      setTodos(prev => [...prev, res.data])
      if (!titleOverride) setNewTodo('')
    } catch (err) {
      setError('할일 추가에 실패했습니다')
    }
  }

  const toggleTodo = async (id) => {
    try {
      const res = await api.patch(`/todos/${id}`)
      setTodos(prev => prev.map(t => t._id === id ? res.data : t))
    } catch (err) {
      setError('할일 수정에 실패했습니다')
      fetchTodos()
    }
  }

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`)
      setTodos(prev => prev.filter(t => t._id !== id))
    } catch (err) {
      setError('할일 삭제에 실패했습니다')
    }
  }

  // ── Photo ──
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
      const uploadRes = await api.post('/upload', formData)
      const patchRes = await api.patch(`/todos/${todoId}/photo`, { photoUrl: uploadRes.data.url })
      setTodos(prev => prev.map(t => t._id === todoId ? patchRes.data : t))
    } catch (err) {
      console.error('사진 업로드 실패:', err)
      setPhotoError('사진 업로드에 실패했습니다. 다시 시도해주세요.')
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

  // ── Share to Crew ──
  const openShare = async (todo) => {
    setShareTarget(todo)
    setShareMsg('')
    if (!crewRooms) {
      try {
        const res = await api.get('/rooms')
        setCrewRooms(res.data)
      } catch (err) {
        console.error('크루 목록 로딩 실패:', err)
        setCrewRooms([])
      }
    }
  }

  const handleShare = async (room) => {
    if (!shareTarget || sharing) return
    setSharing(true)
    try {
      await api.post(`/rooms/${room._id}/messages`, {
        type: 'todo',
        content: shareMsg.trim(),
        todoData: {
          title: shareTarget.title,
          photoUrl: shareTarget.photoUrl || null,
          category: shareTarget.category,
          date: shareTarget.date,
        },
      })
      setShareSuccess(room.name)
      setShareTarget(null)
      setTimeout(() => setShareSuccess(null), 2500)
    } catch (err) {
      console.error('공유 실패:', err)
    } finally {
      setSharing(false)
    }
  }

  // ── Grouping ──
  const groupTodos = () => {
    const groups = {}
    categories.forEach(c => { groups[c.name] = [] })
    const unmatched = []
    todos.forEach(todo => {
      const catName = todo.category || ''
      if (catName in groups) groups[catName].push(todo)
      else unmatched.push(todo)
    })
    return { groups, unmatched }
  }

  const { groups, unmatched } = groupTodos()
  const totalTodos = todos.length
  const totalCompleted = todos.filter(t => t.completed).length

  const renderTodoCard = (todo, catColor = '#e5e7eb') => {
    const isPhotoCard = todo.completed && todo.photoUrl
    return (
      <div
        key={todo._id}
        className={`todo-card${isPhotoCard ? ' has-photo' : ''}`}
        style={!isPhotoCard ? { borderColor: catColor, background: catColor + '12' } : undefined}
      >
        {isPhotoCard && (
          <img src={todo.photoUrl} alt="" className="todo-card-bg-img" />
        )}
        <div className={`todo-card-top${isPhotoCard ? ' on-photo' : ''}`}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodo(todo._id)}
            className="todo-card-check"
          />
          <button className="todo-card-del" onClick={() => deleteTodo(todo._id)}>✕</button>
        </div>

        {isPhotoCard ? (
          <div className="todo-card-photo-overlay" onClick={() => setLightboxUrl(todo.photoUrl)}>
            <p className="todo-card-photo-title">{todo.title}</p>
            <div className="todo-card-photo-actions">
              <button
                className="todo-card-photo-camera"
                onClick={e => { e.stopPropagation(); triggerPhotoUpload(todo._id) }}
                title="사진 변경"
              >📷 변경</button>
              <button
                className="todo-card-photo-camera"
                onClick={e => { e.stopPropagation(); removePhoto(todo._id) }}
                title="사진 삭제"
              >✕ 삭제</button>
              <button
                className="todo-card-photo-camera"
                onClick={e => { e.stopPropagation(); openShare(todo) }}
                title="크루에 공유"
              >↗ 공유</button>
            </div>
          </div>
        ) : (
          <div className="todo-card-body">
            <p className={`todo-card-title${todo.completed ? ' done' : ''}`}>{todo.title}</p>
            {todo.completed && (
              <button
                className="todo-card-camera"
                onClick={() => triggerPhotoUpload(todo._id)}
                disabled={uploadingId === todo._id}
              >
                {uploadingId === todo._id ? '⏳ 업로드 중...' : '📷 인증 사진 추가'}
              </button>
            )}
            <button
              className="todo-card-share"
              onClick={e => { e.stopPropagation(); openShare(todo) }}
              title="크루에 공유"
            >↗ 공유</button>
          </div>
        )}
      </div>
    )
  }

  const renderCategorySection = (catObj, catTodos) => {
    const done = catTodos.filter(t => t.completed).length
    const rate = catTodos.length ? Math.round(done / catTodos.length * 100) : 0
    const isExpanded = expandedCategories[catObj.name] !== false
    return (
      <div key={catObj.name} className="category-section">
        <div className="category-header" style={{ borderLeftColor: catObj.color }} onClick={() => setExpandedCategories(prev => ({ ...prev, [catObj.name]: !isExpanded }))}>
          <div className="category-toggle">
            <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
            <span className="category-label" style={{ backgroundColor: catObj.color, color: 'white' }}>{catObj.name}</span>
            <span className="category-count">{done}/{catTodos.length}</span>
          </div>
          <div className="completion-bar">
            <div className="completion-fill" style={{ width: `${rate}%`, backgroundColor: catObj.color }} />
          </div>
          <span className="completion-percent">{rate}%</span>
          {catObj._id && (
            <button className="cat-edit-btn" onClick={e => { e.stopPropagation(); openEditCat(catObj) }}>⋯</button>
          )}
        </div>
        {isExpanded && (
          <div className="todo-grid">
            {catTodos.map(todo => renderTodoCard(todo, catObj.color))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="panel">
      <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

      {lightboxUrl && (
        <div className="lightbox-overlay" onClick={() => setLightboxUrl(null)}>
          <button className="lightbox-close" onClick={() => setLightboxUrl(null)}>✕</button>
          <img src={lightboxUrl} alt="인증 사진" className="lightbox-img" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* 공유 성공 토스트 */}
      {shareSuccess && (
        <div className="share-toast">✓ '{shareSuccess}'에 공유됐어요!</div>
      )}

      {/* 크루 공유 모달 */}
      {shareTarget && (
        <div className="modal-overlay" onClick={() => setShareTarget(null)}>
          <div className="crew-modal" onClick={e => e.stopPropagation()}>
            <h3 className="crew-modal-title">크루에 공유</h3>

            {/* 미리보기 */}
            <div className="share-preview">
              {shareTarget.photoUrl && (
                <img src={shareTarget.photoUrl} alt="" className="share-preview-img" />
              )}
              <div>
                <p className="share-preview-title">{shareTarget.title}</p>
                <p className="share-preview-cat">{shareTarget.category} · {shareTarget.date}</p>
              </div>
            </div>

            <input
              className="crew-modal-input"
              value={shareMsg}
              onChange={e => setShareMsg(e.target.value)}
              placeholder="한마디 추가 (선택)"
              maxLength={100}
            />

            {crewRooms === null ? (
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '0.5rem 0' }}>로딩 중...</p>
            ) : crewRooms.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', textAlign: 'center', padding: '0.5rem 0' }}>
                참여한 크루가 없어요. 크루 탭에서 만들거나 입장하세요!
              </p>
            ) : (
              <div className="share-room-list">
                {crewRooms.map(room => (
                  <button
                    key={room._id}
                    className="share-room-btn"
                    onClick={() => handleShare(room)}
                    disabled={sharing}
                  >
                    <span className="share-room-avatar">{room.name[0]}</span>
                    <span className="share-room-name">{room.name}</span>
                    <span className="share-room-count">멤버 {room.members?.length || 0}명</span>
                    <span className="share-room-arrow">→</span>
                  </button>
                ))}
              </div>
            )}

            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => setShareTarget(null)}>
              취소
            </button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-overlay" onClick={closeCatModal}>
          <div className="cat-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingCat ? '카테고리 수정' : '새 카테고리'}</h3>
              <button className="modal-close" onClick={closeCatModal}>✕</button>
            </div>
            <div className="cat-modal-body">
              <input
                className="cat-name-input"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                placeholder="카테고리 이름"
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && handleSaveCat()}
                autoFocus
              />
              <div>
                <p className="cat-modal-label">색상</p>
                <div className="color-palette">
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c}
                      className={`color-swatch${catColor === c ? ' selected' : ''}`}
                      style={{ background: c }}
                      onClick={() => setCatColor(c)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {editingCat && (
                <button className="btn btn-danger" onClick={handleDeleteCat}>삭제</button>
              )}
              <button className="btn btn-secondary" onClick={closeCatModal}>취소</button>
              <button className="btn btn-primary" onClick={handleSaveCat} disabled={!catName.trim()}>저장</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="cat-manager-row">
        <h2 className="panel-title" style={{ margin: 0, border: 'none', padding: 0 }}>📝 할일</h2>
        <button className="add-cat-btn" onClick={openAddCat}>+ 카테고리</button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}
      {photoError && (
        <div className="error-message" style={{ cursor: 'pointer' }} onClick={() => setPhotoError(null)}>
          ⚠️ {photoError}
        </div>
      )}

      {/* Frequent todos */}
      {frequentTodos.length > 0 && (
        <div className="frequent-todos">
          {frequentTodos.map((item, idx) => (
            <button
              key={idx}
              className="frequent-tag"
              onClick={() => handleAddTodo(item.title, selectedCategory)}
              disabled={loading || !categories.length}
              title={`${item.count}회 사용`}
            >
              {item.title}
            </button>
          ))}
        </div>
      )}

      {/* Input group */}
      <div className="todo-input-group">
        <input
          type="text"
          placeholder="새로운 할일을 입력하세요..."
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddTodo()}
          className="todo-input"
          disabled={loading || !categories.length}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="category-select"
          disabled={loading || !categories.length}
        >
          {categories.map(cat => (
            <option key={cat._id} value={cat.name}>{cat.name}</option>
          ))}
          {categories.length === 0 && <option value="">카테고리 없음</option>}
        </select>
        <button onClick={() => handleAddTodo()} className="btn btn-primary" disabled={loading || !categories.length}>
          {loading ? '추가중...' : '추가'}
        </button>
      </div>

      {/* Todo sections */}
      <div className="todo-list">
        {loading && todos.length === 0 ? (
          <p className="empty-state">로딩 중...</p>
        ) : categories.length === 0 ? (
          <div className="empty-state-cat">
            <p>카테고리를 먼저 추가해주세요</p>
            <button className="btn btn-primary" onClick={openAddCat} style={{ marginTop: '0.75rem', fontSize: '0.88rem' }}>+ 카테고리 추가</button>
          </div>
        ) : (
          <>
            {categories.map(cat => {
              const catTodos = groups[cat.name] || []
              if (catTodos.length === 0) return null
              return renderCategorySection(cat, catTodos)
            })}
            {unmatched.length > 0 && renderCategorySection({ name: '미분류', color: '#9ca3af' }, unmatched)}
            {totalTodos === 0 && (
              <p className="empty-state">할일이 없습니다. 새로운 할일을 추가해보세요!</p>
            )}
          </>
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
