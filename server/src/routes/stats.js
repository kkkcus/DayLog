import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import Todo from '../models/Todo.js';
import Reflection from '../models/Reflection.js';

const router = express.Router();
router.use(authenticate);

function makeDateRange(days) {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

// GET /api/stats/completion?range=7|30
router.get('/completion', async (req, res) => {
  try {
    const range = Math.min(parseInt(req.query.range) || 7, 30);
    const dates = makeDateRange(range);
    const todos = await Todo.find({
      userId: req.user.id,
      date: { $gte: dates[0], $lte: dates[dates.length - 1] },
    });

    const byDate = {};
    todos.forEach(t => {
      if (!byDate[t.date]) byDate[t.date] = { total: 0, completed: 0 };
      byDate[t.date].total++;
      if (t.completed) byDate[t.date].completed++;
    });

    res.json(dates.map(date => ({
      date,
      total: byDate[date]?.total || 0,
      completed: byDate[date]?.completed || 0,
      rate: byDate[date]?.total ? Math.round(byDate[date].completed / byDate[date].total * 100) : null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/categories
router.get('/categories', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.user.id });
    const byCategory = {};
    todos.forEach(t => {
      const cat = t.category || 'general';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, completed: 0 };
      byCategory[cat].total++;
      if (t.completed) byCategory[cat].completed++;
    });

    res.json(
      Object.entries(byCategory)
        .map(([category, { total, completed }]) => ({
          category, total, completed,
          rate: Math.round(completed / total * 100),
        }))
        .sort((a, b) => b.total - a.total)
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/stats/yearly-mood?year=2025
router.get('/yearly-mood', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const reflections = await Reflection.find({
      userId: req.user.id,
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    }).select('date mood -_id');

    const moodMap = {};
    reflections.forEach(r => { moodMap[r.date] = r.mood; });
    res.json(moodMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
