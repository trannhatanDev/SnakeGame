# Snake Cyber Game - HTML5 Canvas & AvaSnap SDK Integration

Phiên bản Web HTML5 Canvas hoàn chỉnh của game Snake Cyber (chuyển đổi từ dự án Python Pygame của Nhóm 1), tích hợp đầy đủ **AvaSnap Game SDK v1** để chạy trên Hub NexusPlay (`https://nexusplay-eta.vercel.app/`).

---

## 🌟 Tính Năng Đã Chuyển Đổi Hoàn Chỉnh

1. **Giữ nguyên 100% Assets & Đồ họa**:
   - Sử dụng toàn bộ file hình ảnh từ bản Python: `head.png`, `head_noneck.png`, `body.png`, `corner1.png` - `corner4.png`, `tail.png`, `meat.png`, `cancel.png`.
   - Cơ chế xoay và nối thân rắn: Tái tạo chính xác thuật toán từ `skinFull.py` (khúc cua 4 góc, đầu có cổ / không cổ, xoay hướng theo vector di chuyển).
   - Nền sàn đá có rêu phong (`background.py`) và màn hình nền Gary's Snake dạng xoắn ốc (`menu_background.py`).

2. **Hệ Thống Âm Thanh**:
   - Tích hợp đầy đủ các hiệu ứng âm thanh gốc: `eat.wav`, `die.wav`, `win.wav`, `click.wav`, `play.wav`, `intro.wav`, `background.wav`.
   - Tự động vượt qua chính sách Autoplay Policy của trình duyệt khi người dùng chạm hoặc nhấn phím lần đầu.

3. **Cơ Chế Game & Độ Khó (4 Level)**:
   - **Level 1 (Dễ)**: Tốc độ 300ms, 3-5 mồi, không rào chắn.
   - **Level 2 (Thường)**: Tốc độ 275ms, 10-15 mồi, không rào chắn.
   - **Level 3 (Khó)**: Tốc độ 250ms, 10-15 mồi, có rào chắn.
   - **Level 4 (Siêu Khó)**: Tốc độ 150ms, 15-20 mồi, có nhiều rào chắn.
   - Thanh tiến trình % thức ăn đã ăn ở đầu màn hình.
   - Menu Tạm dừng (phím `ESC`).

4. **Hệ Thống Bảng Xếp Hạng (Highscore)**:
   - Lưu trữ kỷ lục theo từng Level (1-4) vào `localStorage` của trình duyệt.
   - Hỗ trợ xem top cao thủ và xóa dữ liệu.

5. **Điều Khiển Đa Nền Tảng (PC & Mobile)**:
   - **PC**: Phím Mũi tên hoặc phím `WASD`. `ESC` để tạm dừng/quay lại. Phím `Y` để chơi lại. Phím `1-4` để chọn nhanh level.
   - **Mobile / Cảm ứng**: D-Pad ảo (có thể bật/tắt qua nút `🎮 NÚT ẢO`) và hỗ trợ vuốt màn hình (Swipe gestures).

---

## 🚀 Tích Hợp AvaSnap SDK v1

File `index.html` và `game.js` đã tích hợp sẵn theo đúng đặc tả:

1. **Thẻ Script trong `index.html`**:
   ```html
   <script src="https://nexusplay-eta.vercel.app/sdk/avasnap-sdk.js"></script>
   ```

2. **Báo Game sẵn sàng khi load xong assets**:
   ```javascript
   if (window.AvaSnap && typeof window.AvaSnap.ready === 'function') {
     window.AvaSnap.ready({ gameId: 'snake-cyber' });
   }
   ```

3. **Báo Điểm số & Kết quả trận đấu khi Game Over hoặc Chiến Thắng**:
   ```javascript
   if (window.AvaSnap && typeof window.AvaSnap.result === 'function') {
     window.AvaSnap.result({
       score: eatenCount,
       level: currentLevel,
       status: isWin ? 'win' : 'gameover'
     });
   }
   ```

---

## 💻 Cách Chạy Thử Trên Máy

Vì trình duyệt bảo mật chặn nạp âm thanh/ảnh qua giao thức `file://`, bạn nên chạy qua một web server cục bộ:

### Cách 1: Dùng Node.js npx serve (Đã có sẵn trên máy)
Mở PowerShell tại thư mục này và gõ:
```bash
npx serve .
```
Sau đó truy cập: `http://localhost:3000`

### Cách 2: Dùng Python
```bash
python -m http.server 8000
```
Sau đó truy cập: `http://localhost:8000`

### Cách 3: Nhúng thử vào iframe của Hub
Khi deploy lên Vercel, Netlify hoặc GitHub Pages, bạn chỉ cần điền URL của trang này vào Hub AvaSnap / NexusPlay. Game sẽ tự động kết nối qua `postMessage` với Hub!
