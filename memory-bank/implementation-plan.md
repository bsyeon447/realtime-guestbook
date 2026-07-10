# 구현 계획 (Next.js + Supabase)

## 1단계: Next.js 프로젝트 설정 (1시간)

1.  **기존 디렉토리 정리**: 현재의 client와 server 폴더를 삭제합니다. (완료)
2.  **Next.js 프로젝트 생성**: 프로젝트 루트 디렉토리에서 
px create-next-app@latest 명령어를 실행하여 새 프로젝트를 생성합니다. (완료)
3.  **라이브러리 설치**: 
pm install @supabase/supabase-js react-konva konva (진행 중)
4.  **.env.local 파일 설정**: 프로젝트 루트에 .env.local 파일을 생성하고 Supabase 프로젝트 URL과 non 키를 입력합니다.
    `
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    `
5.  **Supabase 클라이언트 설정**: lib/supabase/client.ts 파일을 생성하여 Supabase 클라이언트를 초기화하고 export합니다.

## 2단계: 핵심 페이지 및 컴포넌트 구현 (4시간)

1.  **메인 페이지 (pp/page.tsx)**: 전체 애플리케이션의 레이아웃을 담당하고, 다른 컴포넌트들을 조합합니다.
2.  **컴포넌트 구조화 (components/)**:
    *   GuestbookForm.tsx: 텍스트 입력, 그림판, 파일 업로드 UI 포함. (Client Component: 'use client')
    *   DrawingCanvas.tsx: eact-konva를 사용한 그림판 컴포넌트. (Client Component)
    *   PostItGrid.tsx: 전체 방명록을 그리드 형태로 표시. (Client Component)
3.  **방명록 조회 및 실시간 구독**: PostItGrid.tsx에서 초기 데이터 로드 및 Supabase Realtime 구독 로직을 구현합니다.
4.  **방명록 작성 기능**: GuestbookForm.tsx에서 파일 업로드 및 데이터 삽입 로직을 구현합니다.

## 3단계: 상세 보기 및 댓글 기능 구현 (3시간)

1.  **동적 라우트 설정**: pp/post/[id]/page.tsx 경로를 생성하여 상세 페이지를 구현합니다.
    *   또는, 모달(Modal) 방식으로 구현할 수도 있습니다. 이 경우 라우팅이 필요 없습니다.
2.  **댓글 컴포넌트 (components/Comments.tsx)**: 댓글 목록 조회, 실시간 구독, 댓글 작성 기능을 포함합니다. (Client Component)
3.  **기능 연동**: PostDetailModal (또는 페이지)에 Comments.tsx 컴포넌트를 통합합니다.

## 4단계: 스타일링 및 마무리 (1시간)

1.  **Tailwind CSS 적용**: 생성된 컴포넌트들에 Tailwind CSS 유틸리티 클래스를 적용하여 디자인을 완성합니다.
2.  **최종 테스트**: 모든 기능이 정상적으로 동작하는지 확인하고 버그를 수정합니다.

---
**총 예상 소요 시간**: 약 9시간
