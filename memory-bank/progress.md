# 개발 진행 상황 (Next.js + Supabase)

*   [x] **1단계: Next.js 프로젝트 설정**
    *   [x] 기존 디렉토리 정리
    *   [x] Next.js 프로젝트 생성 (create-next-app)
    *   [ ] 
pm install 로 의존성 설치 완료
    *   [ ] @supabase/supabase-js, eact-konva, konva 라이브러리 설치
    *   [ ] .env.local 파일에 Supabase 키 설정
    *   [ ] lib/supabase/client.ts 설정 파일 생성

*   [ ] **2단계: 프론트엔드 핵심 기능 구현**
    *   [ ] pp/page.tsx 메인 페이지 레이아웃 구현
    *   [ ] 방명록 작성 폼 (GuestbookForm.tsx) UI 및 기능 구현
    *   [ ] 그림판 (DrawingCanvas.tsx) UI 및 기능 구현
    *   [ ] 방명록 그리드 (PostItGrid.tsx) UI 및 실시간 구독 기능 구현

*   [ ] **3단계: 댓글 및 기타 기능**
    *   [ ] 상세 보기 모달 또는 페이지 UI 구현
    *   [ ] 댓글 기능 (Comments.tsx) 구현

*   [ ] **4단계: 마무리**
    *   [ ] 전체 스타일링 및 최종 테스트

*   [x] **인증/인가 계획 수립**
    *   [x] memory-bank/auth-plan.md 작성

*   [x] **인증/인가 코드 구현**
    *   [x] @supabase/ssr 설치
    *   [x] 브라우저/서버 Supabase 클라이언트 분리
    *   [x] 인증 세션 갱신 middleware 추가
    *   [x] 로그인/회원가입 페이지 및 auth callback route 추가
    *   [x] 비로그인 사용자 작성 차단
    *   [x] 인증 사용자 user_id 기반 글/이미지 작성 흐름 구현
    *   [x] 본인 글 삭제 UI 및 삭제 로직 구현
    *   [x] Supabase RLS/Storage 정책 SQL 파일 작성
    *   [ ] Supabase 원격 DB 마이그레이션 적용 (현재 MCP read-only로 미적용)

*   [x] **프로필 설정 기능 PRD 작성**
    *   [x] memory-bank/prd-user-profile.md 작성

*   [x] **에이전트 작업 지침 갱신**
    *   [x] AGENTS.md에 PRD 참조, memory-bank 최신화, Supabase MCP/CLI 사용 원칙 추가
