import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from './config/passport.js';
import todoRoutes from './routes/todos.js';
import reflectionRoutes from './routes/reflections.js';
import authRoutes from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/daylog';
const ALLOWED_ORIGINS = [
  'https://day-log-client.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.set('trust proxy', 1);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} is not allowed`));
    }
  },
  credentials: true,
}));

app.use(express.json());

// 세션 (OAuth 핸드셰이크용 — JWT 발급 후 불필요)
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'daylog-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000, // 10분 (OAuth 플로우용)
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// MongoDB 연결
mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✓ MongoDB 연결 성공');
    // 구 date 단독 unique 인덱스 제거 (userId+date 복합 인덱스로 교체됨)
    try {
      await mongoose.connection.collection('reflections').dropIndex('date_1');
      console.log('✓ reflections date_1 인덱스 제거');
    } catch {
      // 인덱스가 없으면 무시
    }
  })
  .catch((err) => {
    console.error('✗ MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/reflections', reflectionRoutes);

app.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다`);
});
