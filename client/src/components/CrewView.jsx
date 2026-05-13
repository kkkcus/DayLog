import { useState, useEffect, useRef } from 'react'
import api from '../api.js'

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function CrewView({ user }) {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [sending, setSending] = useState(false)

  // 모달
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [modalError, setModalError] = useState('')
  const [copied, setCopied] = useState(false)

  // 모바일: 'rooms' | 'chat'
  const [mobilePanel, setMobilePanel] = useState('rooms')

  const bottomRef = useRef(null)
  const pollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { fetchRooms() }, [])

  useEffect(() => {
    clearInterval(pollRef.current)
    if (!selectedRoom) return
    fetchMessages(selectedRoom._id)
    pollRef.current = setInterval(() => fetchMessages(selectedRoom._id), 3000)
    return () => clearInterval(pollRef.current)
  }, [selectedRoom?._id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchRooms = async () => {
    setLoadingRooms(true)
    try {
      const res = await api.get('/rooms')
      setRooms(res.data)
    } catch (err) {
      console.error('크루 목록 로딩 실패:', err)
    } finally {
      setLoadingRooms(false)
    }
  }

  const fetchMessages = async (roomId) => {
    try {
      const res = await api.get(`/rooms/${roomId}/messages`)
      setMessages(res.data)
    } catch (err) {
      console.error('메시지 로딩 실패:', err)
    }
  }

  const selectRoom = (room) => {
    setSelectedRoom(room)
    setMessages([])
    setMobilePanel('chat')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleCreate = async () => {
    if (!roomName.trim()) return
    setModalError('')
    try {
      const res = await api.post('/rooms', { name: roomName.trim() })
      setRooms(prev => [res.data, ...prev])
      selectRoom(res.data)
      setShowCreate(false)
      setRoomName('')
    } catch (err) {
      setModalError(err.response?.data?.error || '방 만들기에 실패했습니다')
    }
  }

  const handleJoin = async () => {
    if (joinCode.length !== 6) return
    setModalError('')
    try {
      const res = await api.post('/rooms/join', { inviteCode: joinCode })
      setRooms(prev => [...prev, res.data])
      selectRoom(res.data)
      setShowJoin(false)
      setJoinCode('')
    } catch (err) {
      setModalError(err.response?.data?.error || '입장에 실패했습니다')
    }
  }

  const handleLeave = async () => {
    if (!selectedRoom || !window.confirm(`'${selectedRoom.name}' 크루를 나가시겠어요?`)) return
    try {
      await api.delete(`/rooms/${selectedRoom._id}/leave`)
      setRooms(prev => prev.filter(r => r._id !== selectedRoom._id))
      setSelectedRoom(null)
      setMessages([])
      setMobilePanel('rooms')
    } catch (err) {
      console.error('방 나가기 실패:', err)
    }
  }

  const handleSend = async () => {
    const text = newMsg.trim()
    if (!text || !selectedRoom || sending) return
    setSending(true)
    setNewMsg('')
    try {
      const res = await api.post(`/rooms/${selectedRoom._id}/messages`, { type: 'text', content: text })
      setMessages(prev => [...prev, res.data])
    } catch (err) {
      console.error('메시지 전송 실패:', err)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(selectedRoom.inviteCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const myId = user._id || user.id

  const renderMessage = (msg) => {
    const isMine = msg.senderId === myId

    if (msg.type === 'todo') {
      return (
        <div key={msg._id} className={`crew-msg-wrap ${isMine ? 'mine' : 'theirs'}`}>
          {!isMine && <span className="crew-sender">{msg.senderName}</span>}
          <div className="crew-todo-card">
            {msg.todoData?.photoUrl && (
              <img src={msg.todoData.photoUrl} alt={msg.todoData.title} className="crew-todo-photo" />
            )}
            <div className="crew-todo-body">
              {msg.todoData?.category && (
                <span className="crew-todo-cat">{msg.todoData.category}</span>
              )}
              <p className="crew-todo-title">{msg.todoData?.title}</p>
              {msg.todoData?.date && (
                <p className="crew-todo-date">{formatDate(msg.todoData.date)}</p>
              )}
            </div>
          </div>
          {msg.content && (
            <div className={`crew-bubble ${isMine ? 'mine' : 'theirs'}`}>{msg.content}</div>
          )}
          <span className="crew-msg-time">{formatTime(msg.createdAt)}</span>
        </div>
      )
    }

    return (
      <div key={msg._id} className={`crew-msg-wrap ${isMine ? 'mine' : 'theirs'}`}>
        {!isMine && <span className="crew-sender">{msg.senderName}</span>}
        <div className={`crew-bubble ${isMine ? 'mine' : 'theirs'}`}>{msg.content}</div>
        <span className="crew-msg-time">{formatTime(msg.createdAt)}</span>
      </div>
    )
  }

  const openCreate = () => { setRoomName(''); setModalError(''); setShowCreate(true) }
  const openJoin = () => { setJoinCode(''); setModalError(''); setShowJoin(true) }

  return (
    <div className="crew-page">
      {/* ── 사이드바: 방 목록 ── */}
      <div className={`crew-sidebar${mobilePanel === 'chat' ? ' mobile-hidden' : ''}`}>
        <div className="crew-sidebar-header">
          <h2 className="crew-sidebar-title">크루</h2>
          <div className="crew-sidebar-btns">
            <button className="crew-action-btn" onClick={openCreate}>+ 만들기</button>
            <button className="crew-action-btn outline" onClick={openJoin}>코드 입장</button>
          </div>
        </div>

        {loadingRooms ? (
          <p className="crew-list-empty">로딩 중...</p>
        ) : rooms.length === 0 ? (
          <div className="crew-list-empty">
            <p>아직 참여한 크루가 없어요</p>
            <p>만들거나 코드로 입장해보세요!</p>
          </div>
        ) : (
          <div className="crew-room-list">
            {rooms.map(room => (
              <div
                key={room._id}
                className={`crew-room-item${selectedRoom?._id === room._id ? ' active' : ''}`}
                onClick={() => selectRoom(room)}
              >
                <div className="crew-room-avatar">{room.name[0]}</div>
                <div className="crew-room-info">
                  <p className="crew-room-name">{room.name}</p>
                  <p className="crew-room-meta">멤버 {room.members?.length || 0}명</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 채팅 영역 ── */}
      <div className={`crew-chat-area${mobilePanel === 'rooms' ? ' mobile-hidden' : ''}`}>
        {!selectedRoom ? (
          <div className="crew-placeholder">
            <p className="crew-placeholder-icon">💬</p>
            <p>크루를 선택하면 채팅이 시작돼요</p>
          </div>
        ) : (
          <>
            <div className="crew-chat-header">
              <button className="crew-back-btn" onClick={() => setMobilePanel('rooms')}>←</button>
              <div className="crew-chat-room-info">
                <p className="crew-chat-room-name">{selectedRoom.name}</p>
                <p className="crew-chat-room-meta">멤버 {selectedRoom.members?.length || 0}명</p>
              </div>
              <button className="crew-code-btn" onClick={copyCode} title="초대 코드 복사">
                {copied ? '복사됨!' : selectedRoom.inviteCode}
              </button>
              <button className="crew-leave-btn" onClick={handleLeave} title="방 나가기">나가기</button>
            </div>

            <div className="crew-messages">
              {messages.length === 0 ? (
                <div className="crew-placeholder">
                  <p>아직 메시지가 없어요</p>
                  <p>첫 메시지를 보내보세요!</p>
                </div>
              ) : (
                messages.map(msg => renderMessage(msg))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="crew-input-row">
              <input
                ref={inputRef}
                className="crew-input"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="메시지를 입력하세요..."
                disabled={sending}
              />
              <button
                className="crew-send-btn"
                onClick={handleSend}
                disabled={sending || !newMsg.trim()}
              >전송</button>
            </div>
          </>
        )}
      </div>

      {/* ── 방 만들기 모달 ── */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="crew-modal" onClick={e => e.stopPropagation()}>
            <h3 className="crew-modal-title">새 크루 만들기</h3>
            <input
              className="crew-modal-input"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="크루 이름 (최대 30자)"
              maxLength={30}
              autoFocus
            />
            {modalError && <p className="crew-modal-error">{modalError}</p>}
            <div className="crew-modal-btns">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={!roomName.trim()}>만들기</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 코드 입장 모달 ── */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="crew-modal" onClick={e => e.stopPropagation()}>
            <h3 className="crew-modal-title">코드로 입장</h3>
            <p className="crew-modal-desc">친구에게 받은 6자리 코드를 입력하세요</p>
            <input
              className="crew-modal-input crew-code-input"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="예: AB12CD"
              maxLength={6}
              autoFocus
            />
            {modalError && <p className="crew-modal-error">{modalError}</p>}
            <div className="crew-modal-btns">
              <button className="btn btn-secondary" onClick={() => setShowJoin(false)}>취소</button>
              <button className="btn btn-primary" onClick={handleJoin} disabled={joinCode.length !== 6}>입장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
