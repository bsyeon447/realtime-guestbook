import GuestbookForm from '@/components/GuestbookForm'; // 경로 수정 및 주석 해제
// import PostItGrid from '@/components/PostItGrid';

export default function Home() {
  return (
    <main className="container mx-auto p-4 max-w-2xl">
      <header className="text-center my-8">
        <h1 className="text-4xl font-bold">실시간 방명록</h1>
        <p className="text-lg text-gray-600 mt-2">
          메시지와 직접 그린 그림 또는 업로드한 사진을 포스트잇으로 공유하세요.
        </p>
      </header>

      {/* 방명록 작성 폼 */}
      <GuestbookForm />

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">모아보기</h2>
        {/* 방명록 그리드 (구현 예정) */}
        {/* <PostItGrid /> */}
        <div className="p-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
          방명록이 여기에 표시됩니다.
        </div>
      </section>
    </main>
  );
}
