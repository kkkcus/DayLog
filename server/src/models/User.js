import mongoose from 'mongoose';

const ZODIAC_SIGNS = ['양자리', '황소자리', '쌍둥이자리', '게자리', '사자자리', '처녀자리', '천칭자리', '전갈자리', '사수자리', '염소자리', '물병자리', '물고기자리'];

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  profileImage: { type: String, default: '' },
  zodiacSign: { type: String, enum: ZODIAC_SIGNS, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
