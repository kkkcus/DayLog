import Reflection from '../models/Reflection.js';
import Todo from '../models/Todo.js';

// 날짜별 회고 조회
export const getReflectionByDate = async (req, res) => {
  try {
    const { date, start, end } = req.query;
    const userId = req.user.id;

    if (start && end) {
      const reflections = await Reflection.find({
        userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 });
      return res.json(reflections);
    }

    if (date) {
      const reflection = await Reflection.findOne({ date, userId });
      if (!reflection) {
        return res.status(404).json({ error: '회고를 찾을 수 없습니다' });
      }
      return res.json(reflection);
    }

    res.status(400).json({ error: '날짜(date) 또는 기간(start, end)을 입력해주세요' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 회고 작성
export const createReflection = async (req, res) => {
  try {
    const { date, done, feeling, mood, tomorrow } = req.body;
    const userId = req.user.id;

    if (!date) {
      return res.status(400).json({ error: 'date는 필수입니다' });
    }

    const existing = await Reflection.findOne({ date, userId });
    if (existing) {
      return res.status(409).json({ error: '해당 날짜의 회고가 이미 존재합니다' });
    }

    const reflection = new Reflection({
      userId,
      date,
      done: done || '',
      feeling: feeling || '',
      mood: mood || 3,
      tomorrow: tomorrow || ''
    });

    await reflection.save();
    await updateStreak(date, userId);

    res.status(201).json(reflection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 회고 수정
export const updateReflection = async (req, res) => {
  try {
    const { id } = req.params;
    const { done, feeling, mood, tomorrow } = req.body;

    const reflection = await Reflection.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      {
        ...(done !== undefined && { done }),
        ...(feeling !== undefined && { feeling }),
        ...(mood !== undefined && { mood }),
        ...(tomorrow !== undefined && { tomorrow }),
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!reflection) {
      return res.status(404).json({ error: '회고를 찾을 수 없습니다' });
    }

    await updateStreak(reflection.date, req.user.id);

    res.json(reflection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 스트릭 업데이트 (사용자별)
const updateStreak = async (date, userId) => {
  try {
    const completedTodos = await Todo.countDocuments({ date, completed: true, userId });
    const reflection = await Reflection.findOne({ date, userId });

    if (completedTodos > 0 && reflection) {
      const lastReflection = await Reflection.findOne({ userId }).sort({ date: -1 });

      let currentStreak = 1;
      let bestStreak = 1;
      let lastActiveDate = date;

      if (lastReflection && lastReflection.currentStreak) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastReflection.lastActiveDate === yesterdayStr) {
          currentStreak = lastReflection.currentStreak + 1;
        } else {
          currentStreak = 1;
        }
        bestStreak = Math.max(currentStreak, lastReflection.bestStreak || 0);
      }

      await Reflection.updateMany({ userId }, { currentStreak, bestStreak, lastActiveDate });
    }
  } catch (error) {
    console.error('Streak update error:', error);
  }
};
