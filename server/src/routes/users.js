import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import User from '../models/User.js';

const router = express.Router();

router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { zodiacSign, birthday, bio, profileImage } = req.body;
    const updates = {};
    if (zodiacSign !== undefined) updates.zodiacSign = zodiacSign || null;
    if (birthday !== undefined) updates.birthday = birthday;
    if (bio !== undefined) updates.bio = bio;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true }
    ).select('-__v');
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
