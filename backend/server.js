require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 5001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0903636778';
const DATA_DIR = __dirname;
const MENU_FILE = path.join(DATA_DIR, 'menu.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]');

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '-');
    cb(null, Date.now() + '-' + safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8'); }
function isAdmin(req) {
  return req.headers['x-admin-password'] === ADMIN_PASSWORD || req.body?.adminPassword === ADMIN_PASSWORD || req.query?.password === ADMIN_PASSWORD;
}
function makeId(text) {
  return String(text || 'item').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
}
function itemName(item) { return item.name_vi || item.name_zh || item.name_en || item.name || 'Món'; }

app.get('/', (req, res) => res.json({ ok: true, name: 'Pho Khang API', endpoints: ['/menu', '/order', '/admin/menu'] }));
app.get('/health', (req, res) => res.json({ ok: true }));

app.get('/menu', (req, res) => res.json(readJson(MENU_FILE, [])));

app.post('/admin/login', (req, res) => {
  if ((req.body?.password || '') === ADMIN_PASSWORD) return res.json({ ok: true });
  res.status(401).json({ ok: false, message: 'Sai mật khẩu admin' });
});

app.get('/admin/menu', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  res.json(readJson(MENU_FILE, []));
});

app.post('/admin/menu', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const menu = readJson(MENU_FILE, []);
  const body = req.body || {};
  const item = {
    id: body.id || makeId(body.name_vi || body.name_zh || body.name_en),
    category: body.category || 'pho',
    name_vi: body.name_vi || '', name_zh: body.name_zh || '', name_en: body.name_en || '',
    price: Number(body.price || 0), image: body.image || '',
    description_vi: body.description_vi || '', description_zh: body.description_zh || '', description_en: body.description_en || '',
    available: body.available !== false, featured: !!body.featured,
    options: body.options || { spicy: false, beefCooked: false }
  };
  menu.push(item); writeJson(MENU_FILE, menu); res.json({ ok: true, item });
});

app.put('/admin/menu/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const menu = readJson(MENU_FILE, []);
  const idx = menu.findIndex(i => i.id === req.params.id);
  if (idx < 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy món' });
  menu[idx] = { ...menu[idx], ...req.body, id: req.params.id, price: Number(req.body.price ?? menu[idx].price) };
  writeJson(MENU_FILE, menu); res.json({ ok: true, item: menu[idx] });
});

app.delete('/admin/menu/:id', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const menu = readJson(MENU_FILE, []);
  const next = menu.filter(i => i.id !== req.params.id);
  writeJson(MENU_FILE, next); res.json({ ok: true });
});

app.post('/admin/upload', upload.single('image'), (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  if (!req.file) return res.status(400).json({ ok: false, message: 'Chưa có ảnh' });
  const base = `${req.protocol}://${req.get('host')}`;
  res.json({ ok: true, url: `${base}/uploads/${req.file.filename}` });
});

app.get('/admin/orders', (req, res) => {
  if (!isAdmin(req)) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  res.json(readJson(ORDERS_FILE, []));
});

app.post('/order', async (req, res) => {
  try {
    const { table, type, customerName, phone, note, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ ok: false, message: 'Chưa có món trong giỏ hàng' });
    const total = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
    const order = { id: Date.now().toString(), createdAt: new Date().toISOString(), table: table || '', type: type || 'dine-in', customerName: customerName || '', phone: phone || '', note: note || '', items, total };
    const orders = readJson(ORDERS_FILE, []); orders.unshift(order); writeJson(ORDERS_FILE, orders.slice(0, 500));

    const lines = [];
    lines.push('🍜 ĐƠN MỚI - PHỞ KHANG');
    lines.push(type === 'takeaway' ? '🥡 Mang về' : `🍽️ Ăn tại bàn: ${table || 'chưa chọn'}`);
    if (customerName) lines.push(`👤 Khách: ${customerName}`);
    if (phone) lines.push(`📞 SĐT: ${phone}`);
    lines.push('');
    items.forEach((it, idx) => {
      const opts = [];
      if (it.spicy) opts.push(it.spicy === 'spicy' ? 'Cay' : 'Không cay');
      if (it.beefCooked) opts.push(it.beefCooked === 'cooked' ? 'Thịt bò chín' : 'Bò tái');
      if (it.extraNote) opts.push(it.extraNote);
      lines.push(`${idx + 1}. ${itemName(it)} x${it.quantity || 1} = ${Number(it.price || 0) * Number(it.quantity || 1)}$${opts.length ? ' (' + opts.join(', ') + ')' : ''}`);
    });
    lines.push(''); lines.push(`💰 Tổng: ${total}$`);
    if (note) lines.push(`📝 Ghi chú: ${note}`);

    if (process.env.BOT_TOKEN && process.env.CHAT_ID) {
      await axios.post(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, { chat_id: process.env.CHAT_ID, text: lines.join('\n') });
    }
    res.json({ ok: true, order });
  } catch (err) { console.error(err); res.status(500).json({ ok: false, message: 'Lỗi gửi đơn', error: err.message }); }
});

app.get('/qr/:table', async (req, res) => {
  const front = process.env.FRONTEND_URL || 'http://localhost:3001';
  const url = `${front.replace(/\/$/, '')}/?table=${encodeURIComponent(req.params.table)}`;
  res.type('png'); QRCode.toFileStream(res, url, { width: 512, margin: 2 });
});

app.listen(PORT, () => console.log(`Pho Khang API running on port ${PORT}`));
