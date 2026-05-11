import { useState, useRef, useEffect } from 'react'
import api from '../api.js'

const QUICK_QUESTIONS = ['오늘 뭐 하면 좋을까?', '이번 주 어땠어?', '기분 올리는 방법']
const INITIAL_MSG = { role: 'model', text: '안녕! 나는 DayLog AI 코치야 😊\n네 할일이랑 기분 데이터를 보고 맞춤 조언을 해줄게. 무엇이 궁금해?' }

export default function AiCoach() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([INITIAL_MSG])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')

    const userMsg = { role: 'user', text: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      // history = 모든 이전 메시지 (초기 인사 제외, user/model 교대로)
      const history = messages.slice(1).map(m => ({ role: m.role, text: m.text }))
      const res = await api.post('/ai/chat', { message: msg, history })
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply }])
    } catch (err) {
      const detail = err?.response?.data?.error || err?.message || '알 수 없는 오류'
      setMessages(prev => [...prev, { role: 'model', text: `오류: ${detail}` }])
    } finally {
      setLoading(false)
    }
  }

  const handleOpen = () => setIsOpen(v => !v)

  const isOnlyGreeting = messages.length === 1

  return (
    <>
      <button
        className={`ai-float-btn${isOpen ? ' open' : ''}`}
        onClick={handleOpen}
        title="AI 코치"
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {isOpen && (
        <div className="ai-chat-panel">
          <div className="ai-chat-header">
            <span>🤖 AI 코치</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="ai-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-msg ai-msg-${m.role}`}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="ai-msg ai-msg-model ai-loading">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {isOnlyGreeting && !loading && (
            <div className="ai-quick">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} className="ai-quick-btn" onClick={() => sendMessage(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="ai-chat-input">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="메시지를 입력하세요..."
              disabled={loading}
            />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              전송
            </button>
          </div>
        </div>
      )}
    </>
  )
}
