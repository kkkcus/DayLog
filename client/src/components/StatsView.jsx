import { useState, useEffect } from 'react'
import api from '../api.js'

const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#84cc16', 5: '#22c55e' }
const MOOD_LABELS = { 1: '최악', 2: '나쁨', 3: '보통', 4: '좋음', 5: '최고' }
const CATEGORY_COLORS = ['#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#3b82f6','#ec4899']
const CATEGORY_LABELS = {
  general: '일반', work: '업무', study: '학습', health: '건강',
  personal: '개인', hobby: '취미', exercise: '운동', finance: '재정',
}
const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

export default function StatsView({ streak }) {
  const [range, setRange] = useState(7)
  const [completion, setCompletion] = useState([])
  const [categories, setCategories] = useState([])
  const [moodMap, setMoodMap] = useState({})
  const [loading, setLoading] = useState(true)
  const year = new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchCompletion() }, [range])
  useEffect(() => { fetchCategoriesAndMood() }, [])

  const fetchCompletion = async () => {
    try {
      const res = await api.get(`/stats/completion?range=${range}`)
      setCompletion(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCategoriesAndMood = async () => {
    setLoading(true)
    try {
      const [catRes, moodRes] = await Promise.all([
        api.get('/stats/categories'),
        api.get(`/stats/yearly-mood?year=${year}`),
      ])
      setCategories(catRes.data)
      setMoodMap(moodRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 평균 완료율
  const activeDays = completion.filter(d => d.total > 0)
  const avgRate = activeDays.length
    ? Math.round(activeDays.reduce((s, d) => s + d.rate, 0) / activeDays.length)
    : 0

  // 연간 픽셀 데이터
  const yearDays = Array.from({ length: 12 }, (_, m) => {
    const days = new Date(year, m + 1, 0).getDate()
    return Array.from({ length: days }, (_, d) =>
      `${year}-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')}`
    )
  })

  // 활동 추천 메시지
  const recommendations = []
  if (streak?.current > 0)
    recommendations.push({ icon: '🔥', text: `연속 ${streak.current}일째 기록 중! 대단해요!` })
  const highCat = categories.find(c => c.rate >= 80 && c.total >= 3)
  if (highCat)
    recommendations.push({ icon: '💪', text: `${CATEGORY_LABELS[highCat.category] || highCat.category} 관련 할일을 꾸준히 해내고 있어요!` })
  const lowCat = categories.find(c => c.rate < 40 && c.total >= 3)
  if (lowCat)
    recommendations.push({ icon: '📚', text: `${CATEGORY_LABELS[lowCat.category] || lowCat.category} 할일을 좀 더 신경 써보는 건 어때요?` })
  const recentMoods = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return moodMap[d.toISOString().split('T')[0]]
  }).filter(Boolean)
  const avgMood = recentMoods.length ? recentMoods.reduce((s, m) => s + m, 0) / recentMoods.length : null
  if (avgMood !== null && avgMood < 2.5)
    recommendations.push({ icon: '🌿', text: '최근 기분이 좋지 않았네요. 가벼운 산책을 추천해요!' })
  if (avgRate < 30 && activeDays.length > 3)
    recommendations.push({ icon: '✨', text: '할일을 조금 줄이고 집중해보는 건 어떨까요?' })
  if (!recommendations.length)
    recommendations.push({ icon: '😊', text: '꾸준히 기록하고 있어요. 잘 하고 있어요!' })

  if (loading) return <div className="stats-loading">통계를 불러오는 중...</div>

  return (
    <div className="stats-wrap">

      {/* 1. 완료율 차트 */}
      <div className="stats-card">
        <div className="stats-card-header">
          <h3 className="stats-card-title">📊 할일 완료율</h3>
          <div className="stats-range-toggle">
            <button className={`range-btn${range === 7 ? ' active' : ''}`} onClick={() => setRange(7)}>7일</button>
            <button className={`range-btn${range === 30 ? ' active' : ''}`} onClick={() => setRange(30)}>30일</button>
          </div>
        </div>
        <div className="stats-avg">
          평균 완료율 <strong>{activeDays.length ? `${avgRate}%` : '기록 없음'}</strong>
        </div>
        <div className="bar-chart">
          {completion.map((d, i) => {
            const label = range === 7 ? d.date.slice(5) : (i % 5 === 0 ? d.date.slice(5) : '')
            const barH = d.rate !== null ? Math.max(d.rate, 3) : 0
            return (
              <div key={d.date} className="bar-col">
                {range === 7 && (
                  <div className="bar-value">{d.rate !== null ? `${d.rate}%` : ''}</div>
                )}
                <div className="bar-track">
                  <div
                    className={`bar-fill${d.rate === null ? ' bar-empty' : ''}`}
                    style={{ height: `${barH}%` }}
                  />
                </div>
                <div className="bar-label">{label}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. 카테고리별 통계 */}
      {categories.length > 0 && (
        <div className="stats-card">
          <h3 className="stats-card-title">🗂️ 카테고리별 통계</h3>
          <p className="stats-summary">
            가장 열심히 한 분야: <strong>{CATEGORY_LABELS[categories[0].category] || categories[0].category}</strong> ({categories[0].total}회)
          </p>
          <div className="cat-list">
            {categories.map((cat, i) => (
              <div key={cat.category} className="cat-row">
                <div className="cat-row-top">
                  <span className="cat-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  <span className="cat-name">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                  <span className="cat-rate">{cat.completed}/{cat.total} · {cat.rate}%</span>
                </div>
                <div className="cat-bar-track">
                  <div
                    className="cat-bar-fill"
                    style={{ width: `${cat.rate}%`, background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. 활동 추천 */}
      <div className="stats-card">
        <h3 className="stats-card-title">💡 활동 추천</h3>
        <div className="rec-list">
          {recommendations.map((r, i) => (
            <div key={i} className="rec-item">
              <span className="rec-icon">{r.icon}</span>
              <span className="rec-text">{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Year in Pixels */}
      <div className="stats-card">
        <h3 className="stats-card-title">🎨 {year}년 기분 기록</h3>
        <div className="mood-legend">
          {Object.entries(MOOD_LABELS).map(([k, v]) => (
            <span key={k} className="mood-legend-item">
              <span className="mood-legend-dot" style={{ background: MOOD_COLORS[k] }} />
              {v}
            </span>
          ))}
        </div>
        <div className="pixels-grid">
          {yearDays.map((monthDays, mi) => (
            <div key={mi} className="pixels-month">
              <div className="pixels-month-label">{MONTHS[mi]}</div>
              <div className="pixels-days">
                {monthDays.map(date => {
                  const mood = moodMap[date]
                  const isFuture = date > today
                  const bg = mood ? MOOD_COLORS[mood] : isFuture ? 'transparent' : '#e5e7eb'
                  const tip = mood ? `${date} · ${MOOD_LABELS[mood]}` : isFuture ? '' : `${date} · 기록 없음`
                  return (
                    <div
                      key={date}
                      className="pixel"
                      style={{ background: bg }}
                      data-tip={tip || undefined}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
