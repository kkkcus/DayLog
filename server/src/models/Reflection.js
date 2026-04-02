import mongoose from 'mongoose';

const reflectionSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  done: {
    type: String,
    default: ''
  },
  feeling: {
    type: String,
    default: ''
  },
  mood: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  tomorrow: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// updatedAt 자동 업데이트
reflectionSchema.pre('findByIdAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

export default mongoose.model('Reflection', reflectionSchema);
