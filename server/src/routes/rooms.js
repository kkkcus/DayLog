import express from 'express'
import { authenticate } from '../middleware/authenticate.js'
import Room from '../models/Room.js'
import Message from '../models/Message.js'
import User from '../models/User.js'

const router = express.Router()
router.use(authenticate)

const generateCode = async () => {
  let code, exists
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
    exists = await Room.findOne({ inviteCode: code })
  } while (exists)
  return code
}

const isMember = (room, userId) =>
  room.members.some(m => m.toString() === userId.toString())

// 내 크루 목록
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ members: req.user.id })
      .populate('members', 'name profileImage')
      .sort({ createdAt: -1 })
    res.json(rooms)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 방 생성
router.post('/', async (req, res) => {
  try {
    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: '방 이름을 입력해주세요' })

    const inviteCode = await generateCode()
    const room = await Room.create({
      name: name.trim(),
      inviteCode,
      owner: req.user.id,
      members: [req.user.id],
    })
    await room.populate('members', 'name profileImage')
    res.status(201).json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 초대 코드로 입장
router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode) return res.status(400).json({ error: '초대 코드를 입력해주세요' })

    const room = await Room.findOne({ inviteCode: inviteCode.trim().toUpperCase() })
    if (!room) return res.status(404).json({ error: '존재하지 않는 초대 코드입니다' })
    if (isMember(room, req.user.id)) return res.status(400).json({ error: '이미 참여 중인 방입니다' })

    room.members.push(req.user.id)
    await room.save()
    await room.populate('members', 'name profileImage')
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 방 이름 수정 (방장만)
router.patch('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: '방을 찾을 수 없습니다' })
    if (room.owner.toString() !== req.user.id.toString())
      return res.status(403).json({ error: '방장만 이름을 변경할 수 있습니다' })

    const { name } = req.body
    if (!name?.trim()) return res.status(400).json({ error: '방 이름을 입력해주세요' })

    room.name = name.trim()
    await room.save()
    await room.populate('members', 'name profileImage')
    res.json(room)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 방 나가기
router.delete('/:id/leave', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: '방을 찾을 수 없습니다' })
    if (!isMember(room, req.user.id)) return res.status(403).json({ error: '권한이 없습니다' })

    room.members = room.members.filter(m => m.toString() !== req.user.id.toString())
    if (room.members.length === 0) {
      await Room.deleteOne({ _id: room._id })
      await Message.deleteMany({ roomId: room._id })
    } else {
      if (room.owner.toString() === req.user.id.toString()) {
        room.owner = room.members[0]
      }
      await room.save()
    }
    res.json({ message: '방을 나갔습니다' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 메시지 목록 조회
router.get('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: '방을 찾을 수 없습니다' })
    if (!isMember(room, req.user.id)) return res.status(403).json({ error: '권한이 없습니다' })

    const messages = await Message.find({ roomId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200)
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 메시지 전송
router.post('/:id/messages', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
    if (!room) return res.status(404).json({ error: '방을 찾을 수 없습니다' })
    if (!isMember(room, req.user.id)) return res.status(403).json({ error: '권한이 없습니다' })

    const { type, content, todoData } = req.body
    if (type === 'text' && !content?.trim()) return res.status(400).json({ error: '내용을 입력해주세요' })

    const user = await User.findById(req.user.id).select('name')
    const msg = await Message.create({
      roomId: req.params.id,
      senderId: req.user.id,
      senderName: user.name,
      type: type || 'text',
      content: content?.trim() || '',
      todoData: todoData || undefined,
    })
    res.status(201).json(msg)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
