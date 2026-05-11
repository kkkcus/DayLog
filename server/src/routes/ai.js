import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate } from '../middleware/authenticate.js';
import Todo from '../models/Todo.js';
import Reflection from '../models/Reflection.js';

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: '메시지가 필요합니다' });

    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [todos, reflections] = await Promise.all([
      Todo.find({ userId: req.user.id, date: { $gte: sevenDaysAgo, $lte: today } }).sort({ date: -1 }),
      Reflection.find({ userId: req.user.id, date: { $gte: sevenDaysAgo, $lte: today } }).sort({ date: -1 }),
    ]);

    const todoSummary = todos.length
      ? todos.map(t => `[${t.date}] ${t.completed ? '✓' : '○'} ${t.title}(${t.category})`).join('\n')
      : '없음';

    const reflectionSummary = reflections.length
      ? reflections.map(r => `[${r.date}] 기분 ${r.mood}/5 | 한일: ${r.done?.slice(0, 50) || ''} | 느낌: ${r.feeling?.slice(0, 50) || ''}`).join('\n')
      : '없음';

    const systemInstruction = `너는 DayLog AI 코치야. 사용자의 할일, 회고, 기분 데이터를 보고 맞춤 조언을 해줘. 한국어로 친근하게 대화해. 짧고 핵심적으로 답해.

최근 7일 사용자 데이터:
[할일]
${todoSummary}

[회고/기분]
${reflectionSummary}`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
    });

    // Gemini history: must start with user and alternate user/model
    const geminiHistory = history
      .map(h => ({ role: h.role, parts: [{ text: h.text }] }))
      .reduce((acc, cur) => {
        const last = acc[acc.length - 1];
        if (!last || last.role !== cur.role) acc.push(cur);
        return acc;
      }, []);

    // Gemini requires history to start with 'user'
    while (geminiHistory.length > 0 && geminiHistory[0].role === 'model') {
      geminiHistory.shift();
    }

    const chat = model.startChat({ history: geminiHistory, generationConfig: { maxOutputTokens: 600 } });
    const result = await chat.sendMessage(message);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
