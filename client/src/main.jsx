import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { io } from 'socket.io-client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function DrawingCanvas({ onChange, disabled }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [color, setColor] = useState('#1f2937');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const point = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return { x: source.clientX - rect.left, y: source.clientY - rect.top };
  };

  const start = (event) => {
    if (disabled) return;
    drawingRef.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (event) => {
    if (!drawingRef.current || disabled) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = point(event);
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const stop = () => { drawingRef.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    onChange('');
  };

  return <div className="drawing-card">
    <div className="toolbar">
      {['#1f2937', '#ef4444', '#2563eb', '#16a34a', '#f59e0b'].map((item) => <button key={item} type="button" className="swatch" style={{ background: item, outline: color === item ? '3px solid #111827' : 'none' }} onClick={() => setColor(item)} aria-label={`${item} 색상`} />)}
      <button type="button" onClick={clear}>전체 지우기</button>
    </div>
    <canvas ref={canvasRef} width="520" height="260" onMouseDown={start} onMouseMove={draw} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={draw} onTouchEnd={stop} />
  </div>;
}

function GuestbookForm() {
  const [message, setMessage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [drawingDataUrl, setDrawingDataUrl] = useState('');
  const [mode, setMode] = useState('draw');
  const [status, setStatus] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setStatus('등록 중...');
    const formData = new FormData();
    formData.append('message', message);
    if (mode === 'upload' && imageFile) formData.append('imageFile', imageFile);
    if (mode === 'draw' && drawingDataUrl) formData.append('drawingDataUrl', drawingDataUrl);
    const response = await fetch(`${API_URL}/api/posts`, { method: 'POST', body: formData });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setStatus(body.error || '등록에 실패했습니다.');
      return;
    }
    setMessage('');
    setImageFile(null);
    setDrawingDataUrl('');
    event.currentTarget.reset();
    setStatus('등록되었습니다!');
  };

  return <form className="composer" onSubmit={submit}>
    <h2>방명록 남기기</h2>
    <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="따뜻한 메시지를 남겨보세요" rows="4" />
    <div className="mode-tabs">
      <button type="button" className={mode === 'draw' ? 'active' : ''} onClick={() => setMode('draw')}>그림 그리기</button>
      <button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}>사진 업로드</button>
    </div>
    {mode === 'draw' ? <DrawingCanvas onChange={setDrawingDataUrl} /> : <input type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] || null)} />}
    <button className="primary" type="submit">등록</button>
    {status && <p className="status">{status}</p>}
  </form>;
}

function PostDetailModal({ post, socket, onClose }) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);

  useEffect(() => {
    setComments(post.comments || []);
    socket.emit('post:join', post.id);
    const handler = ({ postId, comment }) => { if (postId === post.id) setComments((items) => items.some((item) => item.id === comment.id) ? items : [...items, comment]); };
    socket.on('comment-added', handler);
    return () => { socket.emit('post:leave', post.id); socket.off('comment-added', handler); };
  }, [post, socket]);

  const submitComment = (event) => {
    event.preventDefault();
    socket.emit('comment:add', { postId: post.id, text: commentText }, (reply) => { if (reply?.ok) setCommentText(''); });
  };

  return <div className="modal-backdrop" onClick={onClose}>
    <article className="modal" onClick={(event) => event.stopPropagation()}>
      <button className="close" onClick={onClose}>×</button>
      <p className="date">{new Date(post.createdAt).toLocaleString()}</p>
      <p className="full-message">{post.message}</p>
      {post.imageUrl && <img className="hero-image" src={post.imageUrl.startsWith('/uploads') ? `${API_URL}${post.imageUrl}` : post.imageUrl} alt="방명록 이미지" />}
      <section><h3>실시간 댓글</h3>
        <form className="comment-form" onSubmit={submitComment}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="댓글을 입력하세요" /><button>등록</button></form>
        <ul className="comments">{comments.map((comment) => <li key={comment.id}>{comment.text}<span>{new Date(comment.createdAt).toLocaleTimeString()}</span></li>)}</ul>
      </section>
    </article>
  </div>;
}

function PostItGrid({ posts, onSelect }) {
  return <section className="grid">{posts.map((post) => <button className="postit" key={post.id} onClick={() => onSelect(post)}>
    {post.imageUrl && <img src={post.imageUrl.startsWith('/uploads') ? `${API_URL}${post.imageUrl}` : post.imageUrl} alt="썸네일" />}
    <p>{post.message || '그림/사진 방명록'}</p><small>댓글 {post.comments?.length || 0}개</small>
  </button>)}</section>;
}

function App() {
  const socket = useMemo(() => io(API_URL), []);
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/posts`).then((res) => res.json()).then(setPosts);
    socket.on('posts:init', setPosts);
    socket.on('new-post', (post) => setPosts((items) => items.some((item) => item.id === post.id) ? items : [post, ...items]));
    socket.on('post-updated', (post) => setPosts((items) => items.map((item) => item.id === post.id ? post : item)));
    return () => socket.disconnect();
  }, [socket]);

  useEffect(() => { if (selectedPost) setSelectedPost(posts.find((post) => post.id === selectedPost.id) || selectedPost); }, [posts]);

  return <main><header><h1>실시간 방명록</h1><p>메시지와 직접 그린 그림 또는 업로드한 사진을 포스트잇으로 공유하세요.</p></header><GuestbookForm /><h2>모아보기</h2><PostItGrid posts={posts} onSelect={setSelectedPost} />{selectedPost && <PostDetailModal post={selectedPost} socket={socket} onClose={() => setSelectedPost(null)} />}</main>;
}

createRoot(document.getElementById('root')).render(<App />);
