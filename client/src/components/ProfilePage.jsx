import { useState, useRef, useEffect } from 'react'
import api from '../api.js'

const ZODIAC_SIGNS = [
  { sign: '양자리', emoji: '♈' },
  { sign: '황소자리', emoji: '♉' },
  { sign: '쌍둥이자리', emoji: '♊' },
  { sign: '게자리', emoji: '♋' },
  { sign: '사자자리', emoji: '♌' },
  { sign: '처녀자리', emoji: '♍' },
  { sign: '천칭자리', emoji: '♎' },
  { sign: '전갈자리', emoji: '♏' },
  { sign: '사수자리', emoji: '♐' },
  { sign: '염소자리', emoji: '♑' },
  { sign: '물병자리', emoji: '♒' },
  { sign: '물고기자리', emoji: '♓' },
]

const COLOR_PALETTE = [
  '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#8b5cf6',
  '#6b7280', '#1f2937',
]

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function ProfilePage({ user, onBack, onSave }) {
  // ── 프로필 state ──
  const [zodiacSign, setZodiacSign] = useState(user.zodiacSign || '')
  const [birthday, setBirthday] = useState(user.birthday || '')
  const [bio, setBio] = useState(user.bio || '')
  const [profileImage, setProfileImage] = useState(user.profileImage || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

  // ── 카테고리 state ──
  const [categories, setCategories] = useState([])
  const [allTodos, setAllTodos] = useState([])
  const [catHistoryName, setCatHistoryName] = useState(null)
  const [catForm, setCatForm] = useState(null) // null | { mode: 'add'|'edit', cat?: {} }
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState('#7c3aed')
  const [catSaving, setCatSaving] = useState(false)

  useEffect(() => {
    api.get('/categories').then(res => setCategories(res.data)).catch(() => {})
    api.get('/todos?start=2020-01-01&end=2030-12-31').then(res => setAllTodos(res.data)).catch(() => {})
  }, [])

  const getCatCount = (name) => allTodos.filter(t => t.category === name).length

  const getHistoryGroups = (name) => {
    const byDate = {}
    allTodos.filter(t => t.category === name).forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = []
      byDate[t.date].push(t)
    })
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a))
  }

  // ── 카테고리 CRUD ──
  const openAddForm = () => {
    setCatName('')
    setCatColor('#7c3aed')
    setCatForm({ mode: 'add' })
  }

  const openEditForm = (cat, e) => {
    e.stopPropagation()
    setCatName(cat.name)
    setCatColor(cat.color)
    setCatForm({ mode: 'edit', cat })
  }

  const closeForm = () => setCatForm(null)

  const handleSaveCat = async () => {
    if (!catName.trim()) return
    setCatSaving(true)
    try {
      if (catForm.mode === 'edit') {
        const res = await api.patch(`/categories/${catForm.cat._id}`, { name: catName, color: catColor })
        setCategories(prev => prev.map(c => c._id === catForm.cat._id ? res.data : c))
        if (catName !== catForm.cat.name) {
          setAllTodos(prev => prev.map(t => t.category === catForm.cat.name ? { ...t, category: catName } : t))
          if (catHistoryName === catForm.cat.name) setCatHistoryName(catName)
        }
      } else {
        const res = await api.post('/categories', { name: catName, color: catColor })
        setCategories(prev => [...prev, res.data])
      }
      closeForm()
    } catch (err) {
      console.error('카테고리 저장 실패:', err)
    } finally {
      setCatSaving(false)
    }
  }

  const handleDeleteCat = async (cat, e) => {
    e.stopPropagation()
    try {
      await api.delete(`/categories/${cat._id}`)
      setCategories(prev => prev.filter(c => c._id !== cat._id))
      if (catHistoryName === cat.name) setCatHistoryName(null)
    } catch (err) {
      console.error('카테고리 삭제 실패:', err)
    }
  }

  // ── 프로필 저장 ──
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/upload', formData)
      setProfileImage(res.data.url)
    } catch (err) {
      console.error('사진 업로드 실패:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.patch('/users/profile', {
        zodiacSign: zodiacSign || null,
        birthday,
        bio,
        profileImage,
      })
      onSave(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('프로필 저장 실패:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── 카테고리 히스토리 뷰 ──
  const renderHistory = () => {
    const cat = categories.find(c => c.name === catHistoryName)
    const groups = getHistoryGroups(catHistoryName)
    const total = allTodos.filter(t => t.category === catHistoryName).length
    const done = allTodos.filter(t => t.category === catHistoryName && t.completed).length

    return (
      <div className="cat-history">
        <div className="cat-history-header">
          <button className="cat-history-back" onClick={() => setCatHistoryName(null)}>← 목록으로</button>
          <div className="cat-history-title-row">
            <span className="cat-history-dot" style={{ backgroundColor: cat?.color || '#94a3b8' }} />
            <span className="cat-history-name">{catHistoryName}</span>
            <span className="cat-history-stat">{done}/{total} 완료</span>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="cat-history-empty">아직 할일이 없어요</p>
        ) : (
          <div className="cat-history-list">
            {groups.map(([date, todos]) => (
              <div key={date} className="cat-history-group">
                <p className="cat-history-date">{formatDate(date)}</p>
                {todos.map(todo => (
                  <div key={todo._id} className={`cat-history-item${todo.completed ? ' done' : ''}`}>
                    <span className="cat-history-check">{todo.completed ? '✓' : '○'}</span>
                    <span className="cat-history-text">{todo.title}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 카테고리 목록 뷰 ──
  const renderCatList = () => (
    <div className="profile-cat-section">
      <div className="profile-cat-top">
        <span className="profile-section-title">카테고리 관리</span>
        <button className="profile-cat-add-btn" onClick={openAddForm}>+ 새 카테고리</button>
      </div>

      {catForm && (
        <div className="profile-cat-form">
          <input
            className="profile-input"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            placeholder="카테고리 이름"
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && handleSaveCat()}
            autoFocus
          />
          <div className="profile-cat-palette">
            {COLOR_PALETTE.map(c => (
              <button
                key={c}
                className={`profile-color-swatch${catColor === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setCatColor(c)}
              />
            ))}
          </div>
          <div className="profile-cat-form-btns">
            <button className="btn btn-secondary" onClick={closeForm}>취소</button>
            <button
              className="btn btn-primary"
              onClick={handleSaveCat}
              disabled={!catName.trim() || catSaving}
            >
              {catSaving ? '저장 중...' : catForm.mode === 'edit' ? '수정 완료' : '추가'}
            </button>
          </div>
        </div>
      )}

      {categories.length === 0 ? (
        <p className="profile-cat-empty">카테고리가 없어요. 추가해보세요!</p>
      ) : (
        <div className="profile-cat-list">
          {categories.map(cat => (
            <div
              key={cat._id}
              className="profile-cat-item"
              onClick={() => { closeForm(); setCatHistoryName(cat.name) }}
            >
              <span className="profile-cat-dot" style={{ backgroundColor: cat.color }} />
              <span className="profile-cat-name">{cat.name}</span>
              <span className="profile-cat-count">{getCatCount(cat.name)}개</span>
              <button
                className="profile-cat-icon-btn"
                onClick={e => openEditForm(cat, e)}
                title="수정"
              >✎</button>
              <button
                className="profile-cat-icon-btn delete"
                onClick={e => handleDeleteCat(cat, e)}
                title="삭제"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <button className="profile-back-btn" onClick={onBack}>← 뒤로가기</button>
        <h2 className="profile-page-title">프로필 설정</h2>
        <div style={{ width: 80 }} />
      </div>

      <div className="profile-page-content">
        <div className="profile-photo-section">
          <div className="profile-photo-wrap">
            {profileImage ? (
              <img
                src={profileImage}
                alt={user.name}
                className="profile-photo-large"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="profile-photo-placeholder">{user.name[0]}</div>
            )}
          </div>
          <button
            className="profile-photo-change-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '업로드 중...' : '사진 변경'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handlePhotoChange}
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">이름</label>
          <input className="profile-input profile-readonly" value={user.name} readOnly />
        </div>

        <div className="profile-field">
          <label className="profile-label">이메일</label>
          <input className="profile-input profile-readonly" value={user.email} readOnly />
        </div>

        <div className="profile-field">
          <label className="profile-label">별자리</label>
          <select
            className="profile-select"
            value={zodiacSign}
            onChange={e => setZodiacSign(e.target.value)}
          >
            <option value="">선택 안 함</option>
            {ZODIAC_SIGNS.map(({ sign, emoji }) => (
              <option key={sign} value={sign}>{emoji} {sign}</option>
            ))}
          </select>
        </div>

        <div className="profile-field">
          <label className="profile-label">생일</label>
          <input
            type="date"
            className="profile-input"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
          />
        </div>

        <div className="profile-field">
          <label className="profile-label">자기소개</label>
          <input
            type="text"
            className="profile-input"
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="한 줄 자기소개를 입력하세요"
            maxLength={100}
          />
        </div>

        <button
          className="profile-save-btn"
          onClick={handleSave}
          disabled={saving || uploading}
        >
          {saving ? '저장 중...' : saved ? '✓ 저장됨!' : '저장'}
        </button>

        <div className="profile-divider" />

        {catHistoryName ? renderHistory() : renderCatList()}
      </div>
    </div>
  )
}
