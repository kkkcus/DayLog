import { useState } from 'react'
import api from '../api.js'

const ZODIAC_SIGNS = [
  { sign: '양자리', emoji: '♈', period: '3/21 – 4/19' },
  { sign: '황소자리', emoji: '♉', period: '4/20 – 5/20' },
  { sign: '쌍둥이자리', emoji: '♊', period: '5/21 – 6/20' },
  { sign: '게자리', emoji: '♋', period: '6/21 – 7/22' },
  { sign: '사자자리', emoji: '♌', period: '7/23 – 8/22' },
  { sign: '처녀자리', emoji: '♍', period: '8/23 – 9/22' },
  { sign: '천칭자리', emoji: '♎', period: '9/23 – 10/22' },
  { sign: '전갈자리', emoji: '♏', period: '10/23 – 11/21' },
  { sign: '사수자리', emoji: '♐', period: '11/22 – 12/21' },
  { sign: '염소자리', emoji: '♑', period: '12/22 – 1/19' },
  { sign: '물병자리', emoji: '♒', period: '1/20 – 2/18' },
  { sign: '물고기자리', emoji: '♓', period: '2/19 – 3/20' },
]

export default function ZodiacModal({ currentZodiac, onSave, onClose }) {
  const [selected, setSelected] = useState(currentZodiac || null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const res = await api.patch('/auth/profile', { zodiacSign: selected })
      onSave(res.data)
    } catch (err) {
      console.error('Save zodiac error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content zodiac-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">🔮 내 별자리 설정</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="zodiac-modal-desc">생일에 해당하는 별자리를 선택하세요</p>
        <div className="zodiac-grid">
          {ZODIAC_SIGNS.map(({ sign, emoji, period }) => (
            <button
              key={sign}
              className={`zodiac-option${selected === sign ? ' selected' : ''}`}
              onClick={() => setSelected(sign)}
            >
              <span className="zodiac-emoji">{emoji}</span>
              <span className="zodiac-name">{sign}</span>
              <span className="zodiac-period">{period}</span>
            </button>
          ))}
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">취소</button>
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={!selected || saving}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
