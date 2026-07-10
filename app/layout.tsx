import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '실시간 방명록',
  description: 'Next.js와 Supabase로 만든 실시간 방명록',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body><main>{children}</main></body>
    </html>
  );
}