import Todo from '../models/Todo.js';

// 날짜별 할일 조회
export const getTodos = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: '날짜를 입력해주세요 (YYYY-MM-DD)' });
    }

    const todos = await Todo.find({ date }).sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 할일 추가
export const createTodo = async (req, res) => {
  try {
    const { title, category, date } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'title과 date는 필수입니다' });
    }

    const todo = new Todo({
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
    const todo = await Todo.findById(id);

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

// 할일 삭제
export const deleteTodo = async (req, res) => {
  try {
    const { id } = req.params;
    const todo = await Todo.findByIdAndDelete(id);

    if (!todo) {
      return res.status(404).json({ error: '할일을 찾을 수 없습니다' });
    }

    res.json({ message: '삭제됨', todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
