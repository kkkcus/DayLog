import Reflection from '../models/Reflection.js';
import Todo from '../models/Todo.js';

// 날짜별 회고 조회
export const getReflectionByDate = async (req, res) => {
  try {
    const { date, start, end } = req.query;

    // 기간별 조회
    if (start && end) {
      const reflections = await Reflection.find({
        date: { $gte: start, $lte: end }
      }).sort({ date: -1 });
      return res.json(reflections);
    }

    // 특정 날짜 조회
    if (date) {
      const reflection = await Reflection.findOne({ date });
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

    if (!date) {
      return res.status(400).json({ error: 'date는 필수입니다' });
    }

    // 중복 체크
    const existing = await Reflection.findOne({ date });
    if (existing) {
      return res.status(409).json({ error: '해당 날짜의 회고가 이미 존재합니다' });
    }

    const reflection = new Reflection({
      date,
      done: done || '',
      feeling: feeling || '',
      mood: mood || 3,
      tomorrow: tomorrow || ''
    });

    await reflection.save();

    // 스트릭 업데이트
    await updateStreak(date);

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

    const reflection = await Reflection.findByIdAndUpdate(
      id,
      {
        done: done !== undefined ? done : undefined,
        feeling: feeling !== undefined ? feeling : undefined,
        mood: mood !== undefined ? mood : undefined,
        tomorrow: tomorrow !== undefined ? tomorrow : undefined
      },
      { new: true, runValidators: true }
    );

    if (!reflection) {
      return res.status(404).json({ error: '회고를 찾을 수 없습니다' });
    }

    // 스트릭 업데이트
    await updateStreak(reflection.date);

    res.json(reflection);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 스트릭 업데이트 함수
const updateStreak = async (date) => {
  try {
    // 오늘 할일 완료 여부 체크
    const completedTodos = await Todo.countDocuments({
      date,
      completed: true
    });

    // 회고 존재 여부 체크
    const reflection = await Reflection.findOne({ date });

    if (completedTodos > 0 && reflection) {
      // 기존 스트릭 데이터 가져오기 (가장 최근 회고)
      const lastReflection = await Reflection.findOne().sort({ date: -1 });

      let currentStreak = 1;
      let bestStreak = 1;
      let lastActiveDate = date;

      if (lastReflection && lastReflection.currentStreak) {
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastReflection.lastActiveDate === yesterdayStr) {
          // 연속이면 증가
          currentStreak = lastReflection.currentStreak + 1;
        } else {
          // 끊기면 1로 리셋
          currentStreak = 1;
        }
        bestStreak = Math.max(currentStreak, lastReflection.bestStreak || 0);
      }

      // 모든 회고의 스트릭 업데이트 (전체 기록 유지)
      await Reflection.updateMany({}, {
        currentStreak,
        bestStreak,
        lastActiveDate
      });
    }
  } catch (error) {
    console.error('Streak update error:', error);
  }
};
