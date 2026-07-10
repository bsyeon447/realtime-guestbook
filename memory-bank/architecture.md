# 실시간 방명록 애플리케이션 아키텍처 (Next.js + Supabase)

## 1. 시스템 구성도

`
+---------------------------+
| Next.js App (React FW)    |
|---------------------------|
| - Client Components (UI)  |
| - Server Components       |
| - Route Handlers (API)    |
+---------------------------+
           ^
           | HTTPS / WebSocket
           v
+-----------------------+
|   Supabase Platform   |
|-----------------------|
| - Postgres Database   |
| - Storage             |
| - Realtime            |
+-----------------------+

`

*   **Next.js (React Framework)**: 프론트엔드 UI 렌더링과 백엔드 로직(API)을 모두 처리하는 통합 프레임워크입니다. @supabase/supabase-js를 통해 직접 Supabase와 통신합니다.
*   **Supabase**: 데이터베이스, 파일 저장, 실시간 통신 등 모든 백엔드 서비스를 제공하는 BaaS(Backend as a Service) 플랫폼입니다.

## 2. 주요 기술 스택

*   **통합 프레임워크 (Fullstack)**
    *   **Next.js**: React 기반의 풀스택 프레임워크.
    *   **React**: UI 라이브러리.

*   **핵심 라이브러리**
    *   **@supabase/supabase-js**: Supabase와 통신하기 위한 클라이언트 라이브러리.
    *   **React-Konva / HTML5 Canvas**: 그림판 기능 구현.

*   **백엔드 서비스 (Supabase Platform)**
    *   **PostgreSQL**: 데이터베이스.
    *   **Storage**: 이미지 파일 저장.
    *   **Realtime**: 실시간 데이터 동기화.

## 3. 데이터 흐름

### 방명록 생성
1.  **Client Component (UI)**: 사용자가 텍스트, 그림/사진을 입력하고 '등록' 버튼을 클릭합니다.
2.  **Client Component (UI)**: 그림은 Blob/File 객체로 변환하고, @supabase/supabase-js를 사용하여 다음을 수행합니다:
    a.  이미지/그림 파일을 **Supabase Storage**에 업로드합니다.
    b.  업로드된 파일의 URL과 텍스트 메시지를 **Postgres Database**의 posts 테이블에 삽입합니다.
3.  **Supabase Realtime**: posts 테이블의 INSERT 이벤트를 감지하고, 이 채널을 구독(subscribe) 중인 모든 클라이언트에게 새로운 데이터를 브로드캐스트합니다.
4.  **Client Component (UI)**: 실시간 이벤트를 수신하여 화면의 포스트잇을 즉시 업데이트합니다.
