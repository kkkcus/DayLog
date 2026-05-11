import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#7c3aed' },
  createdAt: { type: Date, default: Date.now },
});

categorySchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
