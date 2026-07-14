'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import AuthButton from '@/components/AuthButton';
import GuestbookForm from '@/components/GuestbookForm';
import PostItGrid from '@/components/PostItGrid';
import { Post } from '@/types';

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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(id, display_name, avatar_url, role)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
      } else if (data && mounted) {
        setPosts(data as Post[]);
      }

      if (mounted) {
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setUser(data.user);
      }
    };

    fetchUser();
    fetchPosts();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const channel = supabase
      .channel('realtime posts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prevPosts) => {
            const newPost = payload.new as Post;
            if (prevPosts.some((post) => post.id === newPost.id)) {
              return prevPosts;
            }
            return [newPost, ...prevPosts];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts((prevPosts) => prevPosts.filter((post) => post.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={pageStyles}>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <AuthButton />
      </div>

      <header style={headerStyles}>
        <h1 style={h1Styles}>Realtime Guestbook</h1>
        <p style={pStyles}>
          Share a message with a drawing or uploaded image. Sign in to write your own post.
        </p>
      </header>

      <GuestbookForm user={user} onNewPost={(newPost) => setPosts((prevPosts) => [newPost, ...prevPosts])} />

      <section style={{ marginTop: '3rem', padding: '0 1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>All posts</h2>
        <PostItGrid
          posts={posts}
          loading={loading}
          user={user}
          onDelete={(postId) => setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))}
        />
      </section>
    </div>
  );
}
