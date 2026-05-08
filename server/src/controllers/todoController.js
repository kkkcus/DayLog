import mongoose from 'mongoose';
import Todo from '../models/Todo.js';

// 날짜별 할일 조회
export const getTodos = async (req, res) => {
  try {
    const { date, start, end } = req.query;
    const userId = req.user.id;

    if (start && end) {
      const todos = await Todo.find({
        userId,
        date: { $gte: start, $lte: end }
      }).sort({ date: 1, createdAt: -1 });
      return res.json(todos);
    }

    if (!date) {
      return res.status(400).json({ error: '날짜를 입력해주세요 (YYYY-MM-DD)' });
    }

    const todos = await Todo.find({ userId, date }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 할일 추가
export const createTodo = async (req, res) => {
  try {
    const { title, category, date } = req.body;
    const userId = req.user.id;

    if (!title || !date) {
      return res.status(400).json({ error: 'title과 date는 필수입니다' });
    }

    const todo = new Todo({
      userId,
      title,
      category: category || 'general',
      date,
      completed: false
    });

    await todo.save();
    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 완료 토글
export const toggleTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOne({ _id: id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다' });
    }

    todo.completed = !todo.completed;
    await todo.save();
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 자주 쓰는 할일 집계
export const getFrequentTodos = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const results = await Todo.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { title: '$title', category: '$category' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
      {
        $project: {
          _id: 0,
          title: '$_id.title',
          category: '$_id.category',
          count: 1
        }
      }
    ]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 사진 URL 업데이트
export const updateTodoPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;
    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { photoUrl: photoUrl || null },
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: '할일을 찾을 수 없습니다' });
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 할일 삭제
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다' });
    }

    res.json({ message: '삭제됨', todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
