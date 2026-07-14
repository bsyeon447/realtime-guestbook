'use client';

import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Post } from '@/types';

interface PostItGridProps {
  posts: Post[];
  loading: boolean;
  user: User | null;
  onDelete: (postId: number) => void;
}

export default function PostItGrid({ posts, loading, user, onDelete }: PostItGridProps) {
  const handleDelete = async (post: Post) => {
    if (!user || post.user_id !== user.id) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', post.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting post:', error);
      alert(`Delete failed: ${error.message}`);
      return;
    }

    if (post.image_path) {
      const { error: storageError } = await supabase.storage
        .from('guestbook')
        .remove([post.image_path]);

      if (storageError) {
        console.error('Error deleting image:', storageError);
      }
    }

    onDelete(post.id);
  };

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#888' }}>Loading guestbook posts...</p>;
  }

  if (!posts || posts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888', border: '2px dashed #ccc', borderRadius: '8px' }}>
        No posts yet. Sign in and leave the first one.
      </div>
    );
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    padding: '0 1rem',
  };

  const postItStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#fffff0',
    border: '1px solid #eee',
    boxShadow: '3px 3px 7px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    position: 'relative',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    backgroundColor: '#f0f0f0',
  };

  return (
    <div style={gridStyle}>
      {posts.map((post) => {
        const isOwner = Boolean(user && post.user_id === user.id);
        const author = post.profiles?.display_name ?? (post.user_id ? 'Signed-in guest' : 'Anonymous guest');

        return (
          <div
            key={post.id}
            style={{
              ...postItStyle,
              transform: `rotate(${post.id % 2 === 0 ? 1.5 : -1.5}deg)`,
            }}
            onMouseOver={(event) => {
              event.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseOut={(event) => {
              event.currentTarget.style.transform = `rotate(${post.id % 2 === 0 ? 1.5 : -1.5}deg)`;
            }}
          >
            {isOwner && (
              <button
                type="button"
                onClick={() => handleDelete(post)}
                style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '0.5rem',
                  border: '1px solid #fecaca',
                  borderRadius: '999px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                }}
              >
                Delete
              </button>
            )}
            {post.image_url && <img src={post.image_url} alt="Guestbook attachment" style={imageStyle} />}
            <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{post.message}</p>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.75rem' }}>{author}</p>
          </div>
        );
      })}
    </div>
  );
}
