import { ZODIAC_FORTUNES } from '../data/fortuneData.js';

export const getFortune = (req, res) => {
  const { zodiac } = req.query;

  if (!zodiac || !ZODIAC_FORTUNES[zodiac]) {
    return res.status(400).json({ error: '유효하지 않은 별자리입니다' });
  }

  const today = new Date().toISOString().split('T')[0];
  const dateNum = parseInt(today.replace(/-/g, ''));
  const fortunes = ZODIAC_FORTUNES[zodiac];
  const fortune = fortunes[dateNum % fortunes.length];

  res.json({ zodiac, date: today, ...fortune });
};
