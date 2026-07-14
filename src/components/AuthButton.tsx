'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (loading) {
    return <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Checking session...</span>;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '0.375rem',
          backgroundColor: '#111827',
          color: 'white',
          fontWeight: 700,
          padding: '0.5rem 0.875rem',
        }}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
      <span style={{ color: '#374151', fontSize: '0.875rem' }}>{user.email}</span>
      <button
        type="button"
        onClick={handleSignOut}
        style={{
          border: '1px solid #d1d5db',
          borderRadius: '0.375rem',
          background: 'white',
          color: '#374151',
          cursor: 'pointer',
          fontWeight: 700,
          padding: '0.45rem 0.875rem',
        }}
      >
        Sign out
      </button>
    </div>
  );
}
