import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import Todo from '../models/Todo.js';
import Reflection from '../models/Reflection.js';

const router = express.Router();

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: '메시지가 필요합니다' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다' });

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

    const systemText = `너는 DayLog AI 코치야. 사용자의 할일, 회고, 기분 데이터를 보고 맞춤 조언을 해줘. 한국어로 친근하게 대화해. 짧고 핵심적으로 답해.\n\n최근 7일 데이터:\n[할일]\n${todoSummary}\n\n[회고/기분]\n${reflectionSummary}`;

    // history: [{role:'user'|'model', text:'...'}] → Gemini contents 형식
    const prevContents = history
      .filter(h => h.role === 'user' || h.role === 'model')
      .map(h => ({ role: h.role, parts: [{ text: h.text }] }));

    // Gemini 요구사항: contents는 user로 시작, user/model 교대
    while (prevContents.length > 0 && prevContents[0].role !== 'user') {
      prevContents.shift();
    }

    const contents = [
      ...prevContents,
      { role: 'user', parts: [{ text: message }] },
    ];

    const body = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: { maxOutputTokens: 600, temperature: 0.8 },
    };

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errData = await geminiRes.json();
      console.error('Gemini API error:', errData);
      return res.status(500).json({ error: errData.error?.message || 'Gemini 오류' });
    }

    const data = await geminiRes.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '응답을 받지 못했어요.';
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
