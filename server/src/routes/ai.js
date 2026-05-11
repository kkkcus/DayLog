import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import Todo from '../models/Todo.js';
import Reflection from '../models/Reflection.js';

const router = express.Router();

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

router.post('/chat', authenticate, async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: '메시지가 필요합니다' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY가 설정되지 않았습니다' });

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

    const systemPrompt = `너는 델록이야. DayLog 앱의 AI 코치로, 사용자의 할일, 회고, 기분 데이터를 보고 맞춤 조언을 해줘. 한국어로 존댓말을 사용해서 친근하게 대화해. 짧고 핵심적으로 답해.

최근 7일 데이터:
[할일]
${todoSummary}

[회고/기분]
${reflectionSummary}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.text })),
      { role: 'user', content: message },
    ];

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        max_tokens: 600,
        temperature: 0.8,
      }),
    });

    if (!groqRes.ok) {
      const errData = await groqRes.json();
      console.error('Groq API error:', errData);
      return res.status(500).json({ error: errData.error?.message || 'Groq 오류' });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || '응답을 받지 못했어요.';
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
