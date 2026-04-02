# DayLog

모노레포 구조의 일일 로그 애플리케이션

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (client + server 동시)
npm run dev

# 또는 개별 실행
npm run dev:server
npm run dev:client
```

## 폴더 구조

```
DayLog/
├── server/          # Express + MongoDB
│   ├── src/
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── client/          # React + Vite
    ├── src/
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 기술 스택

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: React, Vite
- **Monorepo**: npm workspaces
