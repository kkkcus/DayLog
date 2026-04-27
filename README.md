# DayLog

> **하루에 할 일을 짜고 기록하는 사이트**

[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://day-log-client.vercel.app)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com)

**배포 URL:** https://day-log-client.vercel.app

---

## 소개

DayLog는 **할일 관리**와 **일일 회고**를 하나의 흐름으로 연결한 생산성 기록 서비스입니다.

기존 서비스들은 할일 관리 앱 또는 회고 앱 중 하나만 제공합니다. DayLog는 두 기능을 **양방향으로 연동**하여, 오늘 완료한 할일이 회고 화면에 자동으로 표시되고 — 회고 중 내일 할일을 작성하면 다음 날 할일 목록에 자동으로 반영되는 하나의 루프를 만듭니다.

```
할일 완료 → 회고 작성 시 자동 표시 → 내일 할일 추가 → 다음 날 자동 반영
```

---

## 주요 기능

### 할일 관리
- 카테고리별 그룹핑 (업무 / 학습 / 건강 / 생활 / 취미 / 기타)
- 자주 쓰는 할일 자동 추천 (MongoDB 집계 파이프라인으로 빈도 계산)
- 날짜별 조회 — 캘린더에서 날짜를 클릭하면 해당 날짜의 데이터로 이동
- 카테고리별 완료율 프로그레스 바

### 일일 회고
- 오늘 완료한 할일 목록 자동 표시 (할일 ↔ 회고 양방향 연동)
- 기분 5단계 트래킹 (😄 최고 / 😊 좋음 / 😐 보통 / 😔 나쁨 / 😢 최악)
- 잘한 점 / 아쉬운 점 / 한 줄 소감 작성
- 내일 할일 미리 추가 → 다음 날 할일 탭에 자동 반영
- 과거 날짜 수정 가능

### 캘린더
- 월간 뷰 / 주간 뷰 전환
- 날짜 셀에 기분 색상 배경 표시 (기록된 날짜를 한눈에 파악)
- 주간 뷰에 할일 제목 미리보기 (최대 3개, 초과 시 "+N개 더")
- 클릭한 날짜의 데이터를 할일/회고 탭으로 바로 이동

### 스트릭
- 연속 회고 작성 일수 실시간 계산
- 현재 스트릭 / 최고 스트릭 헤더 표시

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | ![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black) ![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat-square&logo=vite&logoColor=white) ![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white) |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express_4-000000?style=flat-square&logo=express&logoColor=white) |
| **Database** | ![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white) ![Mongoose](https://img.shields.io/badge/Mongoose_8-880000?style=flat-square) |
| **Deploy** | ![Vercel](https://img.shields.io/badge/Vercel_(Frontend)-000000?style=flat-square&logo=vercel&logoColor=white) ![Render](https://img.shields.io/badge/Render_(Backend)-46E3B7?style=flat-square&logo=render&logoColor=black) ![Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white) |

---

## 프로젝트 구조

```
DayLog/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx                  # 루트 컴포넌트 (탭 네비게이션, 날짜 상태 관리)
│   │   ├── App.css                  # 전역 스타일
│   │   ├── main.jsx
│   │   └── components/
│   │       ├── TodoList.jsx         # 할일 CRUD, 카테고리 그룹핑, 빈도 추천
│   │       ├── ReflectionSection.jsx # 회고 작성/조회, 기분 트래킹, 내일 할일 연동
│   │       └── CalendarView.jsx     # 월간/주간 캘린더, 기분 색상, 할일 미리보기
│   ├── vercel.json                  # Vercel SPA 라우팅 설정
│   └── vite.config.js
│
└── server/                          # Backend (Node.js + Express)
    └── src/
        ├── index.js                 # 서버 진입점
        ├── models/
        │   ├── Todo.js              # 스키마: title, category, date, completed
        │   └── Reflection.js        # 스키마: mood, good, bad, comment, tomorrowTodos
        ├── controllers/
        │   ├── todoController.js
        │   └── reflectionController.js
        └── routes/
            ├── todos.js             # GET/POST/PATCH/DELETE /api/todos
            └── reflections.js       # GET/POST/PUT /api/reflections
```

---

## 실행 방법

### 사전 요구사항
- Node.js 18+
- MongoDB Atlas 계정 (또는 로컬 MongoDB)

### 1. 저장소 클론

```bash
git clone https://github.com/kkkcus/DayLog.git
cd DayLog
```

### 2. 서버 실행

```bash
cd server
cp .env.example .env
# .env 파일에 MONGODB_URI, PORT 입력
npm install
npm run dev
```

### 3. 클라이언트 실행

```bash
cd client
cp .env.example .env
# .env 파일에 VITE_API_URL=http://localhost:PORT 입력
npm install
npm run dev
```

### 환경변수

**server/.env**
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/daylog
PORT=5000
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000
```

---

## 시장 조사

기획 단계에서 6개 경쟁 서비스를 분석했습니다.

| 기능 | Daylio | Habitica | Todoist | Day One | Reflection | **DayLog** |
|------|:------:|:--------:|:-------:|:-------:|:----------:|:----------:|
| 할일 관리 | ✗ | ✓ | ✓ | ✗ | ✗ | **✓** |
| 일일 회고 | ✓ | ✗ | ✗ | ✓ | ✓ | **✓** |
| **할일 ↔ 회고 연동** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| 기분 트래킹 | ✓ | ✗ | ✗ | ✗ | ✓ | **✓** |
| 스트릭 | ✓ | ✓ | ✓ | ✗ | ✗ | **✓** |
| 캘린더 뷰 | ✗ | ✗ | ✓ | ✗ | ✗ | **✓** |

**핵심 발견:** 조사한 6개 서비스 중 할일 완료 데이터를 회고로 자동 연결하거나, 회고에서 작성한 내일 할일을 익일에 자동 반영하는 서비스는 존재하지 않습니다. DayLog의 **양방향 연동 루프**가 핵심 차별점입니다.

---

## 트러블슈팅

개발 중 마주친 주요 이슈와 해결 과정은 [DEVLOG.md](./DEVLOG.md)에 정리되어 있습니다.

| 이슈 | 원인 | 해결 |
|------|------|------|
| `l.reduce is not a function` (Vercel) | SPA 라우팅 미설정으로 API 요청이 `index.html` 반환 → 응답을 배열로 오인 | `vercel.json`에 `"source": "/(.*)"` 리라이트 추가 |
| `U.trim is not a function` | `onClick={fn}` 직접 참조 시 SyntheticEvent가 첫 인자로 전달됨 | `onClick={() => fn()}`으로 수정 |
| 탭 전환 시 캘린더 상태 초기화 | 조건부 렌더링(`&&`)으로 컴포넌트 언마운트 | `display: none` 방식으로 마운트 유지 |

---

## 개발 정보

| | |
|---|---|
| **개발 기간** | 2025년 4월 |
| **개발자** | 강인석 |
| **GitHub** | [@kkkcus](https://github.com/kkkcus) |
| **이메일** | dremsis1234@gmail.com |
