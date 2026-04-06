import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import todoRoutes from './routes/todos.js';
import reflectionRoutes from './routes/reflections.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daylog';
const ALLOWED_ORIGINS = [
  'https://day-log-client.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우 (curl, Postman 등 non-browser 요청) 허용
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} is not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// MongoDB 연결
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB 연결 성공');
  })
  .catch((err) => {
    console.error('✗ MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

// 기본 라우트
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Todo 라우트
app.use('/api/todos', todoRoutes);

// Reflection 라우트
app.use('/api/reflections', reflectionRoutes);

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
});
