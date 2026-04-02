import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';
const TODAY = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

console.log('🧪 API 테스트 시작...\n');

const tests = [];
let passed = 0;
let failed = 0;

// 테스트 헬퍼
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   에러: ${error.message}\n`);
    failed++;
  }
}

// 1. Health Check
await test('Health Check', async () => {
  const res = await fetch(`${API_URL}/api/health`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error('Health check failed');
});

// 2. Todo 추가
let todoId;
await test('Todo 추가', async () => {
  const res = await fetch(`${API_URL}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '테스트 할일',
      category: 'test',
      date: TODAY
    })
  });
  if (res.status !== 201) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  todoId = data._id;
  if (!todoId) throw new Error('No todo ID returned');
});

// 3. Todo 날짜별 조회
await test('Todo 날짜별 조회', async () => {
  const res = await fetch(`${API_URL}/api/todos?date=${TODAY}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Not an array');
  if (data.length === 0) throw new Error('No todos found');
});

// 4. Todo 완료 토글
await test('Todo 완료 토글', async () => {
  const res = await fetch(`${API_URL}/api/todos/${todoId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  });
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (data.completed !== true) throw new Error('Toggle failed');
});

// 5. Todo 삭제
await test('Todo 삭제', async () => {
  const res = await fetch(`${API_URL}/api/todos/${todoId}`, {
    method: 'DELETE'
  });
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
});

// 6. Reflection 작성
let reflectionId;
await test('Reflection 작성', async () => {
  const res = await fetch(`${API_URL}/api/reflections`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      date: TODAY,
      done: '테스트 완료',
      feeling: '좋음',
      tomorrow: '더 테스트하기'
    })
  });
  if (res.status !== 201) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  reflectionId = data._id;
});

// 7. Reflection 날짜 조회
await test('Reflection 날짜 조회', async () => {
  const res = await fetch(`${API_URL}/api/reflections?date=${TODAY}`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!data.date) throw new Error('No reflection data');
});

// 8. Reflection 기간별 조회
const startDate = new Date();
startDate.setDate(startDate.getDate() - 7);
const endDate = new Date();
const start = startDate.toISOString().split('T')[0];
const end = endDate.toISOString().split('T')[0];

await test('Reflection 기간별 조회', async () => {
  const res = await fetch(`${API_URL}/api/reflections?start=${start}&end=${end}`);
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Not an array');
});

// 9. Reflection 수정
await test('Reflection 수정', async () => {
  const res = await fetch(`${API_URL}/api/reflections/${reflectionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      done: '수정된 내용',
      feeling: '매우 좋음'
    })
  });
  if (res.status !== 200) throw new Error(`Status ${res.status}`);
});

// 결과 요약
console.log('\n' + '='.repeat(40));
console.log(`✅ 통과: ${passed}개`);
console.log(`❌ 실패: ${failed}개`);
console.log(`총: ${passed + failed}개`);
console.log('='.repeat(40));

process.exit(failed > 0 ? 1 : 0);
