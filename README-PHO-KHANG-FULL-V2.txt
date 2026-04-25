PHO KHANG ORDER - FULL V2

Bản này gồm đầy đủ frontend + backend.

Có sẵn:
- 31 món đúng theo ảnh menu Phở Khang
- Chia mục: Phở, Bún, Cơm rang, Mỳ gói xào, Phở xào, Món ăn kèm & thức uống
- Chọn ngôn ngữ VI / 繁中 / EN: ngôn ngữ nào chỉ hiện ngôn ngữ đó
- Admin mật khẩu: 0903636778
- Admin thêm/sửa/xóa món
- Admin thêm ảnh bằng link hoặc upload ảnh
- Backend gửi đơn Telegram

CHẠY LOCAL KHÔNG ĐỤNG WEB CŨ:

1) Backend:
cd C:\Users\User\pho-khang-order\backend
set PORT=5001
npm install
npm start

2) Frontend:
cd C:\Users\User\pho-khang-order\frontend
set PORT=3001
npm install
npm start

Mở web:
http://localhost:3001/?table=1

Admin:
http://localhost:3001/admin
Mật khẩu: 0903636778

DEPLOY:
- Render root directory: backend
- Render build: npm install
- Render start: npm start
- Render env: BOT_TOKEN, CHAT_ID, ADMIN_PASSWORD=0903636778
- Vercel root directory: frontend
- Vercel env: REACT_APP_BACKEND_URL=https://link-render-cua-m.onrender.com
