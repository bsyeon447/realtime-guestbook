'use client'; 

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import GuestbookForm from '@/components/GuestbookForm';
import PostItGrid from '@/components/PostItGrid';
import { Post } from '@/types'; // 올바른 경로

const pageStyles: React.CSSProperties = {
  textAlign: 'center',
};

const headerStyles: React.CSSProperties = {
  margin: '3rem 0',
};

const h1Styles: React.CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: 'bold',
};

const pStyles: React.CSSProperties = {
  fontSize: '1.1rem',
  color: '#555',
  marginTop: '0.5rem',
};

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else if (data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel('realtime posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prevPosts) => {
            if (prevPosts.some(p => p.id === (payload.new as Post).id)) {
              return prevPosts;
            }
            return [payload.new as Post, ...prevPosts];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={pageStyles}>
      <header style={headerStyles}>
        <h1 style={h1Styles}>실시간 방명록</h1>
        <p style={pStyles}>
          메시지와 직접 그린 그림 또는 업로드한 사진을 포스트잇으로 공유하세요.
        </p>
      </header>

      <GuestbookForm onNewPost={(newPost) => setPosts(prevPosts => [newPost, ...prevPosts])} />

      <section style={{ marginTop: '3rem', padding: '0 1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>모아보기</h2>
        <PostItGrid posts={posts} loading={loading} />
      </section>
    </div>
  );
}