import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName: { type: String, required: true },
  type: { type: String, enum: ['text', 'todo'], default: 'text' },
  content: { type: String, default: '' },
  todoData: {
    title: String,
    photoUrl: String,
    category: String,
    date: String,
  },
  createdAt: { type: Date, default: Date.now },
})

messageSchema.index({ roomId: 1, createdAt: 1 })

export default mongoose.model('Message', messageSchema)
