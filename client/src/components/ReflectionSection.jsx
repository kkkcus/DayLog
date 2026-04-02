import { useState, useEffect } from 'react'
import axios from 'axios'

const moodStages = [
  { level: 5, label: '최고', emoji: '😄', color: '#22c55e' },
  { level: 4, label: '좋음', emoji: '😊', color: '#84cc16' },
  { level: 3, label: '보통', emoji: '😐', color: '#eab308' },
  { level: 2, label: '별로', emoji: '😔', color: '#f97316' },
  { level: 1, label: '최악', emoji: '😫', color: '#ef4444' }
]

export default function ReflectionSection() {
  const [reflection, setReflection] = useState(null)
  const [completedTodos, setCompletedTodos] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [tempReflection, setTempReflection] = useState({
    done: '',
    feeling: '',
    mood: 3,
    tomorrow: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const today = new Date().toISOString().split('T')[0]
  const API_URL = '/api'

  // 회고 조회 및 완료한 할일 가져오기
  useEffect(() => {
    fetchReflection()
    fetchCompletedTodos()
  }, [])

  const fetchCompletedTodos = async () => {
    try {
      const response = await axios.get(`${API_URL}/todos?date=${today}`)
      const completed = response.data.filter(todo => todo.completed)
      setCompletedTodos(completed)
    } catch (err) {
      console.error('Error fetching completed todos:', err)
    }
  }

  const fetchReflection = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/reflections?date=${today}`)
      setReflection(response.data)
      setTempReflection({
        done: response.data.done || '',
        feeling: response.data.feeling || '',
        mood: response.data.mood || 3,
        tomorrow: response.data.tomorrow || ''
      })
    } catch (err) {
      // 404 에러면 회고가 없는 것 (정상)
      if (err.response?.status === 404) {
        setReflection(null)
      } else {
        setError('회고를 불러올 수 없습니다')
        console.error('Error fetching reflection:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    try {
      setError(null)
      if (reflection) {
        // 기존 회고 수정
        const response = await axios.patch(
          `${API_URL}/reflections/${reflection._id}`,
          tempReflection
        )
        setReflection(response.data)
        setIsEditing(false)
      } else {
        // 새 회고 작성
        const response = await axios.post(`${API_URL}/reflections`, {
          date: today,
          ...tempReflection
        })
        setReflection(response.data)
        setIsEditing(false)
      }
    } catch (err) {
      setError('회고 저장에 실패했습니다')
      console.error('Error saving reflection:', err)
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

  const handleChange = (field, value) => {
    setTempReflection({
      ...tempReflection,
      [field]: value
    })
  }

  const getMoodInfo = (mood) => {
    return moodStages.find(stage => stage.level === mood)
  }

  const currentMood = getMoodInfo(tempReflection.mood || 3)
  const reflectionMood = reflection ? getMoodInfo(reflection.mood || 3) : null

  return (
    <div className="panel">
      <h2 className="panel-title">💭 오늘의 회고</h2>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="reflection-date">
        📅 {today}
      </div>

      {loading ? (
        <p className="empty-state">로딩 중...</p>
      ) : isEditing ? (
        <>
          <div className="reflection-form">
            <div className="form-group">
              <label>오늘 기분은 어땠어요?</label>
              <div className="mood-selector">
                {moodStages.map(stage => (
                  <button
                    key={stage.level}
                    className={`mood-button ${tempReflection.mood === stage.level ? 'active' : ''}`}
                    onClick={() => handleChange('mood', stage.level)}
                    style={{
                      borderColor: stage.color,
                      backgroundColor: tempReflection.mood === stage.level ? stage.color : 'white',
                      color: tempReflection.mood === stage.level ? 'white' : stage.color
                    }}
                    title={stage.label}
                  >
                    <span className="mood-emoji">{stage.emoji}</span>
                    <span className="mood-label">{stage.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>오늘 뭘 했어요?</label>
              {completedTodos.length > 0 && (
                <div className="completed-todos-hint">
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    완료한 할일:
                  </p>
                  <ul style={{ fontSize: '0.85rem', paddingLeft: '1rem' }}>
                    {completedTodos.map(todo => (
                      <li key={todo._id}>{todo.title}</li>
                    ))}
                  </ul>
                </div>
              )}
              <textarea
                value={tempReflection.done}
                onChange={(e) => handleChange('done', e.target.value)}
                placeholder="오늘 성공한 일들을 기록해보세요..."
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>내일은 뭘 할래요?</label>
              <textarea
                value={tempReflection.tomorrow}
                onChange={(e) => handleChange('tomorrow', e.target.value)}
                placeholder="내일의 목표를 적어보세요..."
                rows={4}
              />
            </div>

            <div className="reflection-buttons">
              <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </button>
              <button onClick={handleCancel} className="btn btn-secondary" disabled={loading}>
                취소
              </button>
            </div>
          </div>
        </>
      ) : reflection ? (
        <>
          <div className="reflection-content">
            <div className="reflection-section">
              <h3>
                {reflectionMood?.emoji} 기분
              </h3>
              <div className="feeling-badge" style={{ backgroundColor: reflectionMood?.color }}>
                {reflectionMood?.label}
              </div>
            </div>

            <div className="reflection-section">
              <h3>✅ 완료한 일</h3>
              <div className="reflection-text">
                {reflection.done ? (
                  reflection.done.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>기록된 완료 내용이 없습니다</p>
                )}
              </div>
            </div>

            <div className="reflection-section">
              <h3>🎯 내일 목표</h3>
              <div className="reflection-text">
                {reflection.tomorrow ? (
                  reflection.tomorrow.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))
                ) : (
                  <p style={{ color: '#999', fontStyle: 'italic' }}>목표가 설정되지 않았습니다</p>
                )}
              </div>
            </div>
          </div>

          <button onClick={handleEdit} className="btn btn-primary">
            수정
          </button>
        </>
      ) : (
        <div className="empty-state">
          <p>오늘의 회고가 없습니다.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>새로운 회고를 작성해보세요!</p>
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
          >
            회고 작성
          </button>
        </div>
      )}
    </div>
  )
}
