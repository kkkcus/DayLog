import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  done: { type: String, default: '' },
  feeling: { type: String, default: '' },
  mood: { type: Number, min: 1, max: 5, default: 3 },
  tomorrow: { type: String, default: '' },
  currentStreak: { type: Number, default: 0 },
  bestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 사용자별 날짜 고유 인덱스
reflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

reflectionSchema.pre('findByIdAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

export default mongoose.model('Reflection', reflectionSchema);
