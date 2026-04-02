import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'general'
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Todo', todoSchema);
