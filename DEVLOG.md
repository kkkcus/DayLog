# DayLog 개발 일지

## 2026-04-01

### 완료한 작업

#### 🎯 프로젝트 초기 세팅
- 모노레포 구조 (npm workspaces) 구성
- Root: `package.json`, `.gitignore`, `README.md`
- Server: Express + MongoDB + Mongoose 기본 설정
- Client: React + Vite 기본 설정
- 동시 개발 서버 실행 명령어 설정 (`npm run dev`)

#### 📝 Todo CRUD API 구현
- **Model**: `models/Todo.js`
  - 필드: title, category, completed, date(YYYY-MM-DD), createdAt
- **Controller**: `controllers/todoController.js`
  - `getTodos`: 날짜별 조회 (query: ?date=YYYY-MM-DD)
  - `createTodo`: 할일 추가
  - `toggleTodo`: 완료 상태 토글 (PATCH)
  - `deleteTodo`: 할일 삭제
- **Route**: `routes/todos.js`
  - `GET /api/todos?date=YYYY-MM-DD`
  - `POST /api/todos`
  - `PATCH /api/todos/:id`
  - `DELETE /api/todos/:id`

#### 💭 Reflection(회고) CRUD API 구현
- **Model**: `models/Reflection.js`
  - 필드: date(unique), done, feeling, tomorrow, createdAt, updatedAt
  - 자동 updatedAt 갱신 middleware
- **Controller**: `controllers/reflectionController.js`
  - `getReflectionByDate`: 특정 날짜 조회, 기간별 조회 (query: ?date= 또는 ?start=&end=)
  - `createReflection`: 회고 작성 (date는 unique 제약)
  - `updateReflection`: 회고 수정 (부분 업데이트 지원)
- **Route**: `routes/reflections.js`
  - `GET /api/reflections?date=YYYY-MM-DD`
  - `GET /api/reflections?start=&end=`
  - `POST /api/reflections`
  - `PATCH /api/reflections/:id`

### 기술 결정사항
- Express 라우터 패턴 사용으로 API 관리 용이
- Mongoose middleware를 활용한 자동 타임스탐프 관리
- 날짜 형식 통일 (YYYY-MM-DD string) - 클라이언트에서 쉬운 처리

### 다음 단계
- [ ] 클라이언트에서 Todo API 연결
- [ ] 클라이언트에서 Reflection API 연결
- [ ] 에러 핸들링 미들웨어 추가
- [ ] 요청 유효성 검증 미들웨어 추가
- [ ] API 문서화 (Swagger/OpenAPI)

---

## 템플릿 (날짜별 추가용)

## YYYY-MM-DD

### 완료한 작업

#### 🎯 제목
- 항목 1
- 항목 2
- 항목 3

#### 📝 제목
- 항목 1
- 항목 2

### 기술 결정사항
- 결정 1
- 결정 2

### 배운 점 / 이슈
- 이슈 1
- 해결 방안

### 다음 단계
- [ ] 할일 1
- [ ] 할일 2
