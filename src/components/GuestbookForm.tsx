'use client';

import { useRef, useState, ComponentType } from 'react';
import type { User } from '@supabase/supabase-js';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Post } from '@/types';

type DrawingCanvasHandle = {
  clearCanvas: () => void;
};

type DrawingCanvasProps = {
  onChange: (dataUrl: string) => void;
  ref?: React.Ref<DrawingCanvasHandle>;
};

const DrawingCanvas = dynamic(() => import('./DrawingCanvas'), { ssr: false }) as ComponentType<DrawingCanvasProps>;

interface GuestbookFormProps {
  user: User | null;
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

export default function GuestbookForm({ user, onNewPost }: GuestbookFormProps) {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [drawingDataUrl, setDrawingDataUrl] = useState('');
  const [mode, setMode] = useState<'draw' | 'upload'>('draw');
  const [status, setStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const isSubmitting = status === 'Submitting...';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setStatus('Sign in before writing a post.');
      return;
    }

    if (!message && !imageFile && !drawingDataUrl) {
      setStatus('Add a message, photo, or drawing first.');
      return;
    }

    setStatus('Submitting...');

    try {
      let fileToUpload: File | null = null;
      if (mode === 'upload' && imageFile) {
        fileToUpload = imageFile;
      } else if (mode === 'draw' && drawingDataUrl) {
        fileToUpload = dataURLtoFile(drawingDataUrl, `drawing-${Date.now()}.png`);
      }

      let imageUrl: string | null = null;
      let imagePath: string | null = null;

      if (fileToUpload) {
        const safeFileName = fileToUpload.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        imagePath = `posts/${user.id}/${Date.now()}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from('guestbook')
          .upload(imagePath, fileToUpload);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('guestbook')
          .getPublicUrl(imagePath);

        imageUrl = urlData.publicUrl;
      }

      const { data: insertedData, error: insertError } = await supabase
        .from('posts')
        .insert([{ message, image_url: imageUrl, image_path: imagePath, user_id: user.id }])
        .select('*, profiles(id, display_name, avatar_url, role)')
        .single();

      if (insertError) throw insertError;
      if (!insertedData) throw new Error('The post was created, but no row was returned.');

      onNewPost(insertedData as Post);

      setStatus('Post submitted.');
      setMessage('');
      setImageFile(null);
      setDrawingDataUrl('');

      if (mode === 'draw') {
        canvasRef.current?.clearCanvas();
      }

      if (mode === 'upload' && fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      console.error('Error submitting post:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Submit failed: ${message}`);
    }
  };

  const formStyle: React.CSSProperties = { padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' };
  const h2Style: React.CSSProperties = { fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' };
  const textareaStyle: React.CSSProperties = { width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '0.375rem', transition: 'all 0.2s', minHeight: '80px' };
  const buttonStyle: React.CSSProperties = { padding: '0.5rem 1.5rem', color: 'white', fontWeight: 'bold', borderRadius: '0.375rem', backgroundColor: '#2563eb', border: 'none', cursor: 'pointer' };
  const tabContainerStyle: React.CSSProperties = { display: 'flex', borderBottom: '1px solid #eee', marginBottom: '1rem' };
  const getTabStyle = (tabMode: 'draw' | 'upload'): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    fontWeight: 500,
    borderBottom: mode === tabMode ? '2px solid #2563eb' : '2px solid transparent',
    color: mode === tabMode ? '#1d4ed8' : '#6b7280',
    background: 'none',
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    cursor: 'pointer',
    marginBottom: '-1px',
  });

  if (!user) {
    return (
      <section style={{ marginBottom: '2.5rem' }}>
        <div style={formStyle}>
          <h2 style={h2Style}>Write a guestbook post</h2>
          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
            Anyone can read the guestbook. Sign in to add a post or upload an image.
          </p>
          <Link href="/login" style={{ ...buttonStyle, display: 'inline-flex', textDecoration: 'none' }}>
            Sign in to write
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: '2.5rem' }}>
      <form onSubmit={handleSubmit} style={formStyle}>
        <h2 style={h2Style}>Write a guestbook post</h2>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Leave a message..."
          style={textareaStyle}
        />
        <div style={{ marginTop: '1rem' }}>
          <div style={tabContainerStyle}>
            <button type="button" style={getTabStyle('draw')} onClick={() => setMode('draw')}>Draw</button>
            <button type="button" style={{ ...getTabStyle('upload'), marginLeft: '0.5rem' }} onClick={() => setMode('upload')}>Upload photo</button>
          </div>
          <div style={{ paddingTop: '1rem', minHeight: '305px' }}>
            {mode === 'draw' ? (
              <DrawingCanvas ref={canvasRef} onChange={setDrawingDataUrl} />
            ) : (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => setImageFile(event.target.files?.[0] || null)}
              />
            )}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '1rem' }}>
          {status && <p style={{ marginRight: '1rem', fontSize: '0.875rem', color: '#4b5563' }}>{status}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ ...buttonStyle, ...(isSubmitting && { backgroundColor: '#9ca3af', cursor: 'not-allowed' }) }}
          >
            Submit
          </button>
        </div>
      </form>
    </section>
  );
}
