export default function LoginPage({ error }) {
  const apiUrl = import.meta.env.VITE_API_URL || ''

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">DayLog</div>
        <p className="login-tagline">하루에 할 일을 짜고 기록하는 사이트</p>

        <div className="login-features">
          <div className="login-feature-item">✅ 할일 카테고리 관리</div>
          <div className="login-feature-item">💭 일일 회고 & 기분 트래킹</div>
          <div className="login-feature-item">📅 캘린더 & 스트릭</div>
        </div>

        {error && (
          <div className="login-error">로그인에 실패했습니다. 다시 시도해주세요.</div>
        )}

        <a
          href={`${apiUrl}/api/auth/google`}
          className="google-login-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 로그인
        </a>

        <p className="login-disclaimer">
          로그인 시 개인 할일과 회고가 계정에 저장됩니다
        </p>
      </div>
    </div>
  )
}
