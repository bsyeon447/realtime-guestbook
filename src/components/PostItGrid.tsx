'use client';

import { Post } from '@/types'; // 올바른 경로

interface PostItGridProps {
  posts: Post[];
  loading: boolean;
}

export default function PostItGrid({ posts, loading }: PostItGridProps) {
  if (loading) {
    return <p style={{ textAlign: 'center', color: '#888' }}>방명록을 불러오는 중...</p>;
  }

  // posts가 배열이 아닐 경우(undefined, null 등)를 대비한 안전장치 추가
  if (!posts || posts.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#888', border: '2px dashed #ccc', borderRadius: '8px' }}>
        아직 등록된 방명록이 없습니다. 첫 번째 글을 남겨보세요!
      </div>
    );
  }

  // 스타일 정의
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1.5rem',
    padding: '0 1rem'
  };

  const postItStyle: React.CSSProperties = {
    padding: '1rem',
    backgroundColor: '#fffff0',
    border: '1px solid #eee',
    boxShadow: '3px 3px 7px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
  };
  
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    backgroundColor: '#f0f0f0'
  };

  return (
    <div style={gridStyle}>
      {posts.map((post) => (
        <div 
          key={post.id} 
          style={{ 
            ...postItStyle, 
            transform: `rotate(${post.id % 2 === 0 ? 1.5 : -1.5}deg)` 
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={e => e.currentTarget.style.transform = `rotate(${post.id % 2 === 0 ? 1.5 : -1.5}deg)`}
        >
          {post.image_url && <img src={post.image_url} alt="방명록 이미지" style={imageStyle} />}
          <p style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace' }}>{post.message}</p>
        </div>
      ))}
    </div>
  );
}