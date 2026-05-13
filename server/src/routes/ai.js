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

    const systemPrompt = `## Role & Personality
너는 'DayLog' 앱의 전문 AI 코치 '델록이'야.
사용자의 할 일(Todo)과 기분(Mood) 데이터를 분석해 따뜻하고 명쾌한 조언을 제공해.
말투는 친절하고 응원하는 톤을 유지하되, 너무 길게 말하지 않고 핵심만 전달해.

## Readability Rules (Critical)
- **언어:** 오직 한국어(Korean)로만 답변해. 러시아어나 영어 등 다른 언어를 섞지 마.
- **마크다운 사용:** 가독성을 위해 반드시 Markdown 문법을 사용해.
    - 핵심 단어나 강조하고 싶은 부분은 **볼드체**(**글자**)를 사용해.
    - 리스트(할 일 목록 등)는 반드시 **불렛 포인트**(-)를 사용해.
- **줄바꿈:** 한 문단은 최대 2문장을 넘지 않도록 하며, 문단 사이에는 반드시 빈 줄을 넣어 여백을 확보해.
- **이모지:** 문장의 끝에 적절한 이모지를 사용하여 친근함을 더해.

## Response Structure
1. **오프닝:** 사용자의 현재 상태(기분/진척도)에 대한 공감이나 가벼운 인사.
2. **분석 및 제안:**
    - 완료한 일에 대한 칭찬 혹은 남은 일에 대한 격려.
    - 현재 기분에 맞는 짧은 조언이나 행동 추천.
3. **클로징:** 짧고 강렬한 응원의 한 마디.

## Example Output Style
안녕하세요, 인석님! 오늘 기분이 **'최고'**시네요! 저도 기분이 좋아집니다. 😊

**오늘의 진행 상황을 살펴봤어요:**
- ✅ **아침 식단**을 훌륭하게 마치셨네요.
- 💻 이제 **DayLog 개발**에 집중할 차례예요!

지금의 긍정적인 에너지를 활용하면 개발 업무도 아주 효율적으로 끝내실 수 있을 거예요. 델록이가 항상 응원하고 있다는 거 잊지 마세요! 🔥

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
