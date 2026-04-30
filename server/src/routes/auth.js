import express from 'express';
import jwt from 'jsonwebtoken';
import passport from '../config/passport.js';
import { authenticate } from '../middleware/authenticate.js';
import User from '../models/User.js';

const router = express.Router();

// 구글 로그인 시작
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// 구글 OAuth 콜백
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.CLIENT_URL}?error=auth_failed`,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, name: req.user.name },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

// 현재 사용자 정보
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v');
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 프로필 업데이트 (별자리 등)
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { zodiacSign } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { zodiacSign },
      { new: true }
    ).select('-__v');
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
