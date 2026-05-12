import { useState, useRef } from 'react'
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

export default function ProfilePage({ user, onBack, onSave }) {
  const [zodiacSign, setZodiacSign] = useState(user.zodiacSign || '')
  const [birthday, setBirthday] = useState(user.birthday || '')
  const [bio, setBio] = useState(user.bio || '')
  const [profileImage, setProfileImage] = useState(user.profileImage || '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef(null)

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
              <div className="profile-photo-placeholder">
                {user.name[0]}
              </div>
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
      </div>
    </div>
  )
}
