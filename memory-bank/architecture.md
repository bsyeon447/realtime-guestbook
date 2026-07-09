# 실시간 방명록 애플리케이션 아키텍처 (Supabase 기반)

## 1. 시스템 구성도

`
+-----------------------+
|    Client (React)     |
+-----------------------+
           ^
           | HTTPS / WebSocket
           v
+-----------------------+
|   Supabase Platform   |
|-----------------------|
| - Authentication      |
| - Postgres Database   |
| - Storage             |
| - Realtime            |
| - Edge Functions      |
+-----------------------+

`

*   **Client (React)**: 사용자와 상호작용하는 UI. Supabase 클라이언트 라이브러리(@supabase/supabase-js)를 통해 직접 Supabase와 통신합니다.
*   **Supabase**: 백엔드의 모든 역할을 수행하는 BaaS(Backend as a Service) 플랫폼입니다.

## 2. 주요 기술 스택

*   **프론트엔드 (Client)**
    *   **React**: UI 컴포넌트 기반 개발.
    *   **@supabase/supabase-js**: Supabase와 통신하기 위한 클라이언트 라이브러리.
    *   **React-Konva / HTML5 Canvas**: 그림판 기능 구현.
    *   **CSS / Styled-components**: 스타일링.

*   **백엔드 (Supabase Platform)**
    *   **PostgreSQL**: 모든 데이터를 저장하는 관계형 데이터베이스.
    *   **Storage**: 사용자가 업로드한 이미지나 그림 파일을 저장합니다.
    *   **Realtime**: 데이터베이스 변경 사항을 감지하여 연결된 클라이언트에게 실시간으로 브로드캐스트합니다.
    *   **Authentication**: (선택) 사용자 인증 기능을 제공합니다.
    *   **Edge Functions**: (선택) 복잡한 서버 사이드 로직이 필요할 경우 사용합니다.

## 3. 데이터 흐름

### 방명록 생성
1.  **Client**: 사용자가 텍스트, 그림/사진을 입력하고 '등록' 버튼을 클릭합니다.
2.  **Client**: 그림은 Blob/File 객체로 변환하고, @supabase/supabase-js를 사용하여 다음을 수행합니다:
    a.  이미지/그림 파일을 **Supabase Storage**에 업로드합니다.
    b.  업로드된 파일의 URL과 텍스트 메시지를 **Postgres Database**의 posts 테이블에 삽입합니다.
3.  **Supabase Realtime**: posts 테이블의 INSERT 이벤트를 감지하고, 이 채널을 구독(subscribe) 중인 모든 클라이언트에게 새로운 데이터를 브로드캐스트합니다.
4.  **Client**: 실시간 이벤트를 수신한 모든 클라이언트는 화면에 새로운 포스트잇을 즉시 추가합니다.

### 댓글 생성
1.  **Client**: 사용자가 댓글을 입력하고 '등록'합니다.
2.  **Client**: @supabase/supabase-js를 사용하여 comments 테이블에 새로운 댓글 데이터(포스트 ID, 내용)를 삽입합니다.
3.  **Supabase Realtime**: comments 테이블의 INSERT 이벤트를 감지하고, 해당 포스트를 보고 있는 클라이언트들에게 새로운 댓글 데이터를 브로드캐스트합니다.
4.  **Client**: 이벤트를 수신한 클라이언트는 댓글 목록을 실시간으로 업데이트합니다.
