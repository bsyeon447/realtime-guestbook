const fs = require('fs');
const path = require('path');
const express = require('express');
const http = require('http');
const cors = require('cors');
const multer = require('multer');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ posts: [] }, null, 2));

const readData = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const writeData = (data) => fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${makeId()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')) });

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_ORIGIN, methods: ['GET', 'POST'] } });

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/posts', (_req, res) => res.json(readData().posts));

app.post('/api/posts', upload.single('imageFile'), (req, res) => {
  const { message = '', drawingDataUrl = '' } = req.body;
  const trimmed = message.trim();
  if (!trimmed && !req.file && !drawingDataUrl) return res.status(400).json({ error: '메시지, 사진 또는 그림 중 하나는 필요합니다.' });

  const post = {
    id: makeId(),
    message: trimmed,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : drawingDataUrl,
    imageType: req.file ? 'upload' : drawingDataUrl ? 'drawing' : 'none',
    comments: [],
    createdAt: new Date().toISOString(),
  };
  const data = readData();
  data.posts.unshift(post);
  writeData(data);
  io.emit('new-post', post);
  res.status(201).json(post);
});

io.on('connection', (socket) => {
  socket.emit('posts:init', readData().posts);

  socket.on('post:join', (postId) => socket.join(`post:${postId}`));
  socket.on('post:leave', (postId) => socket.leave(`post:${postId}`));

  socket.on('comment:add', ({ postId, text }, ack) => {
    const cleanText = String(text || '').trim();
    if (!postId || !cleanText) return ack?.({ ok: false, error: '댓글 내용을 입력하세요.' });
    const data = readData();
    const post = data.posts.find((item) => item.id === postId);
    if (!post) return ack?.({ ok: false, error: '방명록을 찾을 수 없습니다.' });
    const comment = { id: makeId(), text: cleanText, createdAt: new Date().toISOString() };
    post.comments.push(comment);
    writeData(data);
    io.to(`post:${postId}`).emit('comment-added', { postId, comment });
    io.emit('post-updated', post);
    return ack?.({ ok: true, comment });
  });
});

server.listen(PORT, () => console.log(`Realtime guestbook server listening on http://localhost:${PORT}`));
