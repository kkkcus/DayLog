import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import Category from '../models/Category.js';

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: '이름이 필요합니다' });
    const category = new Category({ userId: req.user.id, name, color: color || '#7c3aed' });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: '이미 존재하는 카테고리입니다' });
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { name, color } = req.body;
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { name, color },
      { new: true }
    );
    if (!category) return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!category) return res.status(404).json({ error: '카테고리를 찾을 수 없습니다' });
    res.json({ message: '삭제됨' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
