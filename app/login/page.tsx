import Link from 'next/link';
import { login, signup } from './actions';

type LoginPageProps = {
  searchParams?: {
    message?: string;
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main style={{ maxWidth: '420px', margin: '4rem auto', padding: '1.5rem' }}>
      <Link href="/" style={{ color: '#2563eb', fontSize: '0.875rem' }}>
        Back to guestbook
      </Link>

      <section
        style={{
          marginTop: '1rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Sign in
        </h1>
        <p style={{ color: '#4b5563', lineHeight: 1.5, marginBottom: '1.25rem' }}>
          Enter your email and password to write guestbook posts.
        </p>

        <form style={{ display: 'grid', gap: '0.875rem' }}>
          <label style={{ display: 'grid', gap: '0.375rem', textAlign: 'left' }}>
            <span style={{ color: '#374151', fontWeight: 700 }}>Email</span>
            <input
              name="email"
              type="email"
              required
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.65rem 0.75rem',
              }}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.375rem', textAlign: 'left' }}>
            <span style={{ color: '#374151', fontWeight: 700 }}>Password</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              style={{
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.65rem 0.75rem',
              }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              formAction={login}
              style={{
                flex: 1,
                background: '#2563eb',
                border: 'none',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 800,
                padding: '0.7rem 1rem',
              }}
            >
              Sign in
            </button>
            <button
              formAction={signup}
              style={{
                flex: 1,
                background: '#111827',
                border: 'none',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 800,
                padding: '0.7rem 1rem',
              }}
            >
              Sign up
            </button>
          </div>
        </form>

        {searchParams?.message && (
          <p style={{ color: '#047857', marginTop: '1rem' }}>{searchParams.message}</p>
        )}
        {searchParams?.error && (
          <p style={{ color: '#b91c1c', marginTop: '1rem' }}>{searchParams.error}</p>
        )}
      </section>
    </main>
  );
}
