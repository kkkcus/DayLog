import { useState, useEffect } from 'react'
import api from '../api.js'

const ZODIAC_EMOJIS = {
  '양자리': '♈', '황소자리': '♉', '쌍둥이자리': '♊', '게자리': '♋',
  '사자자리': '♌', '처녀자리': '♍', '천칭자리': '♎', '전갈자리': '♏',
  '사수자리': '♐', '염소자리': '♑', '물병자리': '♒', '물고기자리': '♓',
}

const CATEGORY_ICONS = {
  '전체운': '🌟', '연애운': '💕', '금전운': '💰', '건강운': '💪',
}

export default function FortuneCard({ user, onSetZodiac }) {
  const today = new Date().toISOString().split('T')[0]
  const storageKey = `daylog_fortune_revealed_${today}`

  const [fortune, setFortune] = useState(null)
  const [revealed, setRevealed] = useState(() => localStorage.getItem(storageKey) === 'true')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.zodiacSign) fetchFortune()
  }, [user?.zodiacSign])

  const fetchFortune = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/fortune?zodiac=${encodeURIComponent(user.zodiacSign)}`)
      setFortune(res.data)
    } catch (err) {
      console.error('Fortune fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReveal = () => {
    setRevealed(true)
    localStorage.setItem(storageKey, 'true')
  }

  if (!user?.zodiacSign) {
    return (
      <div className="fortune-card fortune-no-zodiac">
        <div className="fortune-card-header">
          <span className="fortune-title">🔮 오늘의 운세</span>
        </div>
        <div className="fortune-setup-prompt">
          <p className="fortune-setup-text">별자리를 설정하면 오늘의 운세를 볼 수 있어요!</p>
          <button className="btn btn-primary fortune-setup-btn" onClick={onSetZodiac}>
            별자리 설정하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fortune-card">
      <div className="fortune-card-header">
        <span className="fortune-title">🔮 오늘의 운세</span>
        <span className="fortune-zodiac-badge">
          {ZODIAC_EMOJIS[user.zodiacSign]} {user.zodiacSign}
        </span>
      </div>

      {loading ? (
        <p className="fortune-loading">운세를 불러오는 중...</p>
      ) : fortune ? (
        <div className="fortune-content-wrap">
          <div className={`fortune-content${revealed ? ' revealed' : ' blurred'}`}>
            <div className="fortune-category">
              {CATEGORY_ICONS[fortune.category]} {fortune.category}
            </div>
            <p className="fortune-text">{fortune.text}</p>
          </div>
          {!revealed && (
            <div className="fortune-spoiler" onClick={handleReveal}>
              <p className="fortune-spoiler-hint">오늘의 운세가 도착했어요 👀</p>
              <button className="fortune-reveal-btn">클릭해서 확인하기 ✨</button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
