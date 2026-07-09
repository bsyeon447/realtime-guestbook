# 구현 계획 (Supabase 기반)

## 1단계: Supabase 프로젝트 설정 및 스키마 정의 (1.5시간)

1.  **Supabase 프로젝트 생성**: [Supabase 공식 홈페이지](https://supabase.com/)에서 새 프로젝트를 생성합니다.
2.  **데이터베이스 테이블 설계**:
    *   posts 테이블을 생성합니다. (id, created_at, message, image_url)
    *   comments 테이블을 생성합니다. (id, created_at, post_id, content)
        *   post_id는 posts 테이블의 id를 참조하는 외래 키(Foreign Key)로 설정합니다.
3.  **저장소(Storage) 버킷 생성**: guestbook-images라는 이름의 공개(public) 버킷을 생성하여 이미지 파일을 저장합니다.
4.  **Realtime 활성화**: posts와 comments 테이블에 대한 실시간 기능(Realtime)을 활성화합니다.
5.  **.env 파일 설정**: React 앱에서 Supabase에 연결할 수 있도록 프로젝트 URL과 non 키를 .env 파일에 저장합니다.

## 2단계: 프론트엔드 환경 설정 및 Supabase 연동 (1시간)

1.  **디렉토리 및 프로젝트 생성**:
    *   최상단에 client 폴더를 생성하고, 그 안에서 
px create-react-app .으로 React 프로젝트를 설정합니다. (이미 설정됨)
2.  **라이브러리 설치**:
    *   
pm install @supabase/supabase-js react-konva konva
3.  **Supabase 클라이언트 설정**:
    *   src/supabaseClient.js 파일을 생성하여 Supabase 클라이언트를 초기화하고 export합니다. .env 파일의 환경 변수를 사용합니다.

## 3단계: 핵심 프론트엔드 기능 구현 (4시간)

1.  **컴포넌트 구조화**: (기존 계획과 유사)
    *   GuestbookForm.js, DrawingCanvas.js, PostItGrid.js, PostIt.js, PostDetailModal.js 등.
2.  **방명록 목록 조회 및 실시간 구독**:
    *   PostItGrid.js에서 컴포넌트 마운트 시 supabase.from('posts').select('*')를 호출하여 초기 데이터를 가져옵니다.
    *   supabase.from('posts').on('INSERT', ...)를 사용하여 새로운 방명록이 추가될 때 상태(state)를 실시간으로 업데이트합니다.
3.  **방명록 작성 기능**:
    *   GuestbookForm.js에서 그림/이미지 파일을 **Supabase Storage**에 업로드합니다.
    *   업로드 성공 후 반환된 URL과 메시지를 **posts 테이블**에 삽입합니다.

## 4단계: 댓글 및 세부 기능 구현 (2.5시간)

1.  **댓글 기능 연동**:
    *   PostDetailModal.js에서 해당 포스트의 댓글을 조회합니다. (supabase.from('comments').select('*').eq('post_id', postId))
    *   새 댓글이 추가될 때 실시간으로 목록을 업데이트하기 위해 comments 테이블을 구독합니다.
    *   댓글 입력 폼을 통해 comments 테이블에 데이터를 삽입합니다.
2.  **스타일링 및 마무리**: 전체적인 UI/UX를 개선하고 최종 테스트를 진행합니다.

---
**총 예상 소요 시간**: 약 9시간
