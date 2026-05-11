import { useState, useEffect } from 'react'
import api from '../api.js'

const WEATHER_ACTIVITIES = {
  clear: [
    { icon: '🌞', text: '산책하기 좋은 날이에요!' },
    { icon: '🏃', text: '공원에서 운동 어때요?' },
    { icon: '☕', text: '야외 카페에서 여유 즐기기' },
  ],
  clouds: [
    { icon: '📚', text: '카페에서 독서 추천' },
    { icon: '🧘', text: '실내 스트레칭 해보세요' },
    { icon: '🎵', text: '음악 들으며 집 정리' },
  ],
  rain: [
    { icon: '🎬', text: '실내에서 영화 감상' },
    { icon: '☂️', text: '우산 챙기고 비 소리 들으며 작업' },
    { icon: '🍵', text: '따뜻한 차 한 잔 어때요?' },
  ],
  snow: [
    { icon: '🍵', text: '따뜻한 차 한 잔과 함께' },
    { icon: '💪', text: '실내 운동 추천' },
    { icon: '📖', text: '책 읽으며 힐링하기' },
  ],
  thunderstorm: [
    { icon: '🏠', text: '오늘은 집에서 편안하게' },
    { icon: '🎮', text: '실내 게임으로 스트레스 해소' },
    { icon: '📝', text: '일기 쓰며 하루 정리' },
  ],
  mist: [
    { icon: '🚶', text: '안전하게 외출 준비하세요' },
    { icon: '🍵', text: '따뜻한 음료로 시작하는 하루' },
    { icon: '📚', text: '실내에서 책 읽기' },
  ],
}

const CONDITION_MAP = {
  Thunderstorm: { key: 'thunderstorm', label: '천둥번개', emoji: '⛈️' },
  Drizzle:      { key: 'rain',         label: '이슬비',   emoji: '🌦️' },
  Rain:         { key: 'rain',         label: '비',       emoji: '🌧️' },
  Snow:         { key: 'snow',         label: '눈',       emoji: '❄️' },
  Atmosphere:   { key: 'mist',         label: '안개',     emoji: '🌫️' },
  Mist:         { key: 'mist',         label: '안개',     emoji: '🌫️' },
  Smoke:        { key: 'mist',         label: '연무',     emoji: '🌫️' },
  Haze:         { key: 'mist',         label: '박무',     emoji: '🌫️' },
  Fog:          { key: 'mist',         label: '안개',     emoji: '🌫️' },
  Clear:        { key: 'clear',        label: '맑음',     emoji: '☀️' },
  Clouds:       { key: 'clouds',       label: '흐림',     emoji: '☁️' },
}

const SEOUL = { lat: 37.5665, lon: 126.9780 }

export default function WeatherCard() {
  const today = new Date().toISOString().split('T')[0]
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addedActivities, setAddedActivities] = useState(new Set())
  const [toast, setToast] = useState(false)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
    if (!apiKey) { setLoading(false); return }

    const fetchByCoords = async (lat, lon) => {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const main = data.weather[0].main
      const condition = CONDITION_MAP[main] || CONDITION_MAP.Clear
      setWeather({
        condition,
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        city: data.name,
        iconCode: data.weather[0].icon,
      })
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchByCoords(pos.coords.latitude, pos.coords.longitude)
        .catch(() => fetchByCoords(SEOUL.lat, SEOUL.lon))
        .finally(() => setLoading(false)),
      () => fetchByCoords(SEOUL.lat, SEOUL.lon)
        .catch(() => {})
        .finally(() => setLoading(false)),
      { timeout: 5000 }
    )
  }, [])

  const handleAddActivity = async (text) => {
    if (addedActivities.has(text)) return
    try {
      // 'DayLog 추천!' 카테고리 없으면 자동 생성 (409 중복은 무시)
      await api.post('/categories', { name: 'DayLog 추천!', color: '#06b6d4' }).catch(e => {
        if (e?.response?.status !== 409) console.error(e)
      })
      await api.post('/todos', { title: text, category: 'DayLog 추천!', date: today })
      setAddedActivities(prev => new Set([...prev, text]))
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    } catch (err) {
      console.error('할일 추가 실패:', err)
    }
  }

  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY

  return (
    <div className="weather-card">
      {toast && <div className="weather-toast">✓ 'DayLog 추천!' 카테고리에 추가됐어요!</div>}
      <div className="weather-card-header">
        <span className="weather-title">🌤️ 오늘의 날씨</span>
        {weather && <span className="weather-city">{weather.city}</span>}
      </div>

      {!apiKey ? (
        <p className="weather-error">날씨 API 키를 설정해주세요 (VITE_OPENWEATHER_API_KEY)</p>
      ) : loading ? (
        <p className="weather-loading">날씨를 불러오는 중...</p>
      ) : !weather ? (
        <p className="weather-error">날씨 정보를 가져올 수 없어요</p>
      ) : (
        <>
          <div className="weather-main">
            <img
              src={`https://openweathermap.org/img/wn/${weather.iconCode}@2x.png`}
              alt={weather.condition.label}
              className="weather-icon-img"
            />
            <div className="weather-info">
              <span className="weather-temp">{weather.temp}°C</span>
              <span className="weather-label">{weather.condition.emoji} {weather.condition.label}</span>
              <span className="weather-feels">체감 {weather.feelsLike}°C</span>
            </div>
          </div>

          <div className="weather-activities">
            <p className="weather-activities-label">추천 활동 <span className="weather-activities-hint">클릭하면 오늘 할일에 추가돼요</span></p>
            <div className="weather-activity-list">
              {(WEATHER_ACTIVITIES[weather.condition.key] || WEATHER_ACTIVITIES.clear).map(({ icon, text }) => (
                <button
                  key={text}
                  className={`weather-activity-btn${addedActivities.has(text) ? ' added' : ''}`}
                  onClick={() => handleAddActivity(`${icon} ${text}`)}
                  disabled={addedActivities.has(text)}
                >
                  {icon} {text}
                  {addedActivities.has(text) && <span className="activity-check"> ✓</span>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
