import GuestbookForm from '@/components/GuestbookForm';

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
  return (
    <div style={pageStyles}>
      <header style={headerStyles}>
        <h1 style={h1Styles}>실시간 방명록</h1>
        <p style={pStyles}>
          메시지와 직접 그린 그림 또는 업로드한 사진을 포스트잇으로 공유하세요.
        </p>
      </header>
      
      <GuestbookForm />
      
      <section style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>모아보기</h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#888', border: '2px dashed #ccc', borderRadius: '8px' }}>
          방명록이 여기에 표시됩니다.
        </div>
      </section>
    </div>
  );
}