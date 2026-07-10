'use client';

import { useState } from 'react';
// import { supabase } from '@/lib/supabaseClient'; // Supabase 클라이언트 (경로 확인 필요)
// import DrawingCanvas from './DrawingCanvas'; // 그림판 컴포넌트 (생성 예정)

export default function GuestbookForm() {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [drawingDataUrl, setDrawingDataUrl] = useState('');
  const [mode, setMode] = useState('draw');
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 이 부분에 Supabase로 데이터와 파일을 업로드하는 로직이 들어갑니다.
    setStatus('등록 중...');
    console.log({ message, imageFile, drawingDataUrl, mode });
    // 임시로 3초 후 완료 처리
    setTimeout(() => {
      setStatus('등록되었습니다! (기능 구현 예정)');
      setMessage('');
      setImageFile(null);
    }, 3000);
  };

  return (
    <section className="mb-10">
      <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">방명록 남기기</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="따뜻한 메시지를 남겨보세요..."
          rows={4}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 transition"
        />
        <div className="my-4">
          <div className="flex border-b">
            <button
              type="button"
              className={px-4 py-2 font-medium }
              onClick={() => setMode('draw')}
            >
              그림 그리기
            </button>
            <button
              type="button"
              className={px-4 py-2 font-medium }
              onClick={() => setMode('upload')}
            >
              사진 업로드
            </button>
          </div>
          <div className="py-4">
            {/* {mode === 'draw' ? <DrawingCanvas onChange={setDrawingDataUrl} /> : <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />} */}
            {mode === 'draw' ? (
                <div className="h-48 flex items-center justify-center bg-gray-100 rounded-md text-gray-400">
                    그림판 영역 (구현 예정)
                </div>
            ) : (
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            )}
          </div>
        </div>
        <div className="flex justify-end items-center">
          {status && <p className="mr-4 text-sm text-gray-600">{status}</p>}
          <button
            type="submit"
            disabled={status === '등록 중...'}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            등록
          </button>
        </div>
      </form>
    </section>
  );
}
