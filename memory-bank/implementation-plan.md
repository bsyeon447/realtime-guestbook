# 구현 계획

## 1단계: 프로젝트 환경 설정 (1시간)

1.  **디렉토리 구조 생성**: 최상단에 server, client 폴더를 생성합니다.
2.  **백엔드 설정**:
    *   server 디렉토리에서 
pm init -y 실행.
    *   
pm install express socket.io (기본 라이브러리 설치)
    *   
pm install --save-dev nodemon (개발 편의성)
    *   server/index.js 파일 생성 및 기본 Express, Socket.io 코드 작성.
3.  **프론트엔드 설정**:
    *   client 디렉토리에서 
px create-react-app . 실행.
    *   
pm install socket.io-client react-konva konva (필요 라이브러리 설치).

## 2단계: 핵심 백엔드 기능 구현 (3시간)

1.  **데이터 관리 설계**:
    *   server/data.json 파일을 생성하여 방명록과 댓글 데이터를 저장할 초기 구조를 정의합니다. (예: { posts: [] })
2.  **파일 업로드 처리**:
    *   multer 라이브러리를 사용하여 이미지 업로드를 처리하는 미들웨어를 설정합니다. (uploads/ 폴더에 이미지 저장)
3.  **API 엔드포인트 구현**:
    *   POST /api/posts: 새로운 방명록 생성 (텍스트 + 이미지 파일).
    *   GET /api/posts: 모든 방명록 목록을 반환.
4.  **Socket.io 이벤트 처리**:
    *   connection: 클라이언트 연결 시 기존 방명록 목록 전송.
    *   
ew-post: 새 방명록이 생성되면, 모든 클라이언트에게 해당 데이터 브로드캐스트.
    *   
ew-comment: 새 댓글이 달리면, 해당 포스트 ID와 댓글 데이터를 특정 채널(room)의 클라이언트들에게 브로드캐스트.

## 3단계: 핵심 프론트엔드 기능 구현 (4시간)

1.  **컴포넌트 구조화**:
    *   GuestbookForm.js: 텍스트 입력, 그림판, 파일 업로드 UI 포함.
    *   DrawingCanvas.js: eact-konva를 사용한 그림판 컴포넌트.
    *   PostItGrid.js: 전체 방명록을 그리드 형태로 표시.
    *   PostIt.js: 개별 포스트잇 아이템.
    *   PostDetailModal.js: 상세 내용 및 댓글 표시.
2.  **Socket.io 연동**: App.js에서 소켓 서버에 연결하고, posts 상태를 관리합니다.
3.  **방명록 목록 표시**: 컴포넌트 마운트 시 GET /api/posts를 호출하여 초기 데이터를 가져오고, 
ew-post 소켓 이벤트를 리스닝하여 목록을 실시간 업데이트합니다.
4.  **방명록 작성 기능**: GuestbookForm에서 폼 데이터를 FormData로 구성하여 백엔드 API로 전송합니다.

## 4단계: 통합 및 세부 기능 구현 (2시간)

1.  **댓글 기능 연동**: PostDetailModal에서 
ew-comment 소켓 이벤트를 전송하고, comment-added 이벤트를 수신하여 댓글 목록을 실시간으로 렌더링합니다.
2.  **스타일링**: 포스트잇, 모달, 버튼 등 전체적인 UI/UX를 개선합니다.
3.  **최종 테스트**: 기능이 모두 정상적으로 동작하는지 확인하고 버그를 수정합니다.

---
**총 예상 소요 시간**: 약 10시간