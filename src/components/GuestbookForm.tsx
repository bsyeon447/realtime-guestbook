'use client';

import { useState, useRef, ComponentType } from 'react';
import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import { Post } from '@/types'; // <--- 이 경로를 수정했습니다.

const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), { ssr: false }) as ComponentType<any>;

interface GuestbookFormProps {
  onNewPost: (post: Post) => void;
}

const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) throw new Error('Invalid data URL');
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default function GuestbookForm({ onNewPost }: GuestbookFormProps) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  // ... (이하 나머지 코드는 이전과 동일하므로 생략)
  const [drawingDataUrl, setDrawingDataUrl] = useState('');
  const [mode, setMode] = useState('draw');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<{ clearCanvas: () => void }>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message && !imageFile && !drawingDataUrl) {
      setStatus('메시지, 사진 또는 그림을 추가해주세요.');
      return;
    }
    setStatus('등록 중...');

    try {
      let fileToUpload: File | null = null;
      if (mode === 'upload' && imageFile) {
        fileToUpload = imageFile;
      } else if (mode === 'draw' && drawingDataUrl) {
        const fileName = `drawing-${Date.now()}.png`;
        fileToUpload = dataURLtoFile(drawingDataUrl, fileName);
      }

      let imageUrl: string | null = null;
      if (fileToUpload) {
        const filePath = `public/${Date.now()}-${fileToUpload.name}`;
        const { error: uploadError } = await supabase.storage
          .from('guestbook')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('guestbook')
          .getPublicUrl(filePath);
        
        if (!urlData) throw new Error('Public URL을 가져오는데 실패했습니다.');
        imageUrl = urlData.publicUrl;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('posts')
        .insert([{ message, image_url: imageUrl }])
        .select()
        .single();

      if (insertError) throw insertError;
      if (!insertedData) throw new Error('데이터 삽입 후 반환된 값이 없습니다.');

      onNewPost(insertedData);

      setStatus('방명록이 등록되었습니다!');
      setMessage('');
      setImageFile(null);
      setDrawingDataUrl('');
      if (mode === 'draw' && canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
      if (mode === 'upload' && fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setStatus(''), 3000);

    } catch (error: any) {
      console.error('Error submitting post:', error);
      setStatus(`등록 실패: ${error.message}`);
    }
  };

  const formStyle: React.CSSProperties = { padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' };
  const h2Style: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' };
  const textareaStyle: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.375rem', transition: 'all 0.2s', minHeight: '80px' };
  const buttonStyle: React.CSSProperties = { padding: '0.5rem 1.5rem', color: 'white', fontWeight: 'bold', borderRadius: '0.375rem', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer' };
  const tabContainerStyle: React.CSSProperties = { display: 'flex', borderBottom: '1px solid #eee', marginBottom: '1rem' };
  const getTabStyle = (tabMode: string): React.CSSProperties => ({ 
    padding: '0.5rem 1rem', 
    fontWeight: 500, 
    borderBottom: mode === tabMode ? '2px solid #2563eb' : '2px solid transparent', 
    color: mode === tabMode ? '#1d4ed8' : '#6b7280', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer',
    marginBottom: '-1px'
  });

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={h2Style}>방명록 남기기</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="따뜻한 메시지를 남겨보세요..."
          style={textareaStyle}
        />
        <div style={{ marginTop: '1rem' }}>
          <div style={tabContainerStyle}>
            <button type="button" style={getTabStyle('draw')} onClick={() => setMode('draw')}>그림 그리기</button>
            <button type="button" style={{...getTabStyle('upload'), marginLeft: '0.5rem' }} onClick={() => setMode('upload')}>사진 업로드</button>
          </div>
          <div style={{ paddingTop: '1rem', minHeight: '305px' }}>
            {mode === 'draw' ? (
                <DrawingCanvas ref={canvasRef} onChange={setDrawingDataUrl} />
            ) : (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1rem' }}>
          {status && <p style={{ marginRight: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>{status}</p>}
          <button
            type="submit"
            disabled={status === '등록 중...'}
            style={{...buttonStyle, ...(status === '등록 중...' && { backgroundColor: '#9ca3af', cursor: 'not-allowed' })}}
          >
            등록
          </button>
        </div>
      </form>
    </section>
  );
}