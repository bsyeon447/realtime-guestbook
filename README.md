# realtime-guestbook

실시간 방명록 웹 애플리케이션입니다. 사용자는 텍스트 메시지와 함께 사진을 업로드하거나 캔버스에 직접 그림을 그려 방명록을 등록할 수 있고, Socket.io를 통해 새 방명록과 댓글이 모든 접속자에게 즉시 반영됩니다.

## 실행 방법

### 백엔드

```bash
cd server
npm install
npm run dev
```

기본 서버 주소는 `http://localhost:4000`입니다. 업로드 이미지는 `server/uploads`에 저장되고, 방명록 데이터는 `server/data.json`에 저장됩니다.

### 프론트엔드

```bash
cd client
npm install
npm run dev
```

기본 클라이언트 주소는 `http://localhost:5173`입니다. API 서버 주소를 변경하려면 `VITE_API_URL` 환경 변수를 설정하세요.

## 주요 기능

- 텍스트 메시지 작성
- 이미지 파일 업로드
- HTML5 Canvas 기반 그림판, 색상 선택, 전체 지우기
- 포스트잇 형태의 방명록 그리드
- 상세 모달에서 원본 이미지와 전체 메시지 확인
- Socket.io 기반 새 방명록 및 댓글 실시간 동기화
