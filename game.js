/**
 * Snake Cyber Game - HTML5 Canvas Edition
 * Replicated from Group 1 (Nhóm 1) Pygame project with AvaSnap SDK v1 Integration.
 */

(function () {
  'use strict';

  // --- 1. HẰNG SỐ & CẤU HÌNH ---
  const CANVAS_WIDTH = 1024;
  const CANVAS_HEIGHT = 768;
  const BLOCK_SIZE = 40;
  const GRID_W = Math.floor(CANVAS_WIDTH / BLOCK_SIZE); // 25
  const GRID_H = Math.floor(CANVAS_HEIGHT / BLOCK_SIZE); // 19

  // Trạng thái ứng dụng
  const STATES = {
    INPUT_NAME: 'INPUT_NAME',
    MAIN_MENU: 'MAIN_MENU',
    INSTRUCTIONS: 'INSTRUCTIONS',
    SETTINGS: 'SETTINGS',
    HIGHSCORE: 'HIGHSCORE',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    WIN: 'WIN',
    GAMEOVER: 'GAMEOVER'
  };

  const LEVELS = {
    1: { name: 'Level 1 (Dễ)', speed: 300, foodRange: [3, 5], obstacles: 0 },
    2: { name: 'Level 2 (Thường)', speed: 275, foodRange: [10, 15], obstacles: 0 },
    3: { name: 'Level 3 (Khó)', speed: 250, foodRange: [10, 15], obstacles: (lvl) => lvl * randInt(5, 8) },
    4: { name: 'Level 4 (Siêu Khó)', speed: 150, foodRange: [15, 20], obstacles: (lvl) => lvl * randInt(5, 8) }
  };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // --- 2. QUẢN LÝ TÀI NGUYÊN (ASSETS) ---
  const IMAGES_SRC = {
    head: 'assets/images/head.png',
    head_noneck: 'assets/images/head_noneck.png',
    body: 'assets/images/body.png',
    tail: 'assets/images/tail.png',
    meat: 'assets/images/meat.png',
    cancel: 'assets/images/cancel.png',
    corner1: 'assets/images/corner1.png',
    corner2: 'assets/images/corner2.png',
    corner3: 'assets/images/corner3.png',
    corner4: 'assets/images/corner4.png'
  };

  const SOUNDS_SRC = {
    eat: 'assets/sounds/eat.wav',
    die: 'assets/sounds/die.wav',
    win: 'assets/sounds/win.wav',
    click: 'assets/sounds/click.wav',
    play: 'assets/sounds/play.wav',
    intro: 'assets/sounds/intro.wav',
    background: 'assets/sounds/background.wav'
  };

  const images = {};
  const sounds = {};
  let masterVolume = 0.5;
  let isMuted = false;
  let currentBgm = null;
  let audioUnlocked = false;

  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    // Play & pause a dummy sound to unlock mobile audio context
    try {
      const dummy = new Audio();
      dummy.play().catch(() => {});
    } catch (e) {}
  }

  function playSound(name) {
    if (isMuted || !sounds[name]) return;
    try {
      const s = sounds[name].cloneNode();
      s.volume = masterVolume;
      s.play().catch(() => {});
    } catch (e) {}
  }

  function playBgm(name) {
    if (!sounds[name]) return;
    if (currentBgm === name && sounds[name].paused === false) return;
    stopBgm();
    currentBgm = name;
    try {
      sounds[name].loop = true;
      sounds[name].volume = isMuted ? 0 : masterVolume;
      sounds[name].currentTime = 0;
      sounds[name].play().catch(() => {});
    } catch (e) {}
  }

  function stopBgm() {
    if (currentBgm && sounds[currentBgm]) {
      try {
        sounds[currentBgm].pause();
        sounds[currentBgm].currentTime = 0;
      } catch (e) {}
    }
    currentBgm = null;
  }

  function updateVolume(newVol) {
    masterVolume = Math.max(0, Math.min(1, newVol));
    if (currentBgm && sounds[currentBgm]) {
      sounds[currentBgm].volume = isMuted ? 0 : masterVolume;
    }
  }

  // --- 3. BACKGROUND GENERATORS (TỪ PYTHON) ---
  let cachedStoneBg = null;
  let cachedMenuBg = null;

  // Mô phỏng background.py: ve_nen_san_da
  function generateStoneBackground(w, h) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const ctx = offCanvas.getContext('2d');

    // Nền kẽ đá
    ctx.fillStyle = 'rgb(30, 25, 20)';
    ctx.fillRect(0, 0, w, h);

    const gach_toi = 'rgb(60, 65, 60)';
    const gach_sang = 'rgb(80, 85, 80)';
    const mau_cu = 'rgb(50, 55, 50)';

    for (let x = 0; x < w; x += BLOCK_SIZE) {
      for (let y = 0; y < h; y += BLOCK_SIZE) {
        ctx.fillStyle = gach_sang;
        ctx.fillRect(x + 1, y + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);

        ctx.fillStyle = gach_toi;
        ctx.fillRect(x + 3, y + 3, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

        if ((x + y) % 7 === 0) {
          ctx.fillStyle = mau_cu;
          ctx.fillRect(x + 5, y + 5, BLOCK_SIZE - 8, BLOCK_SIZE - 8);
        }
      }
    }

    // Các vết rêu phong ngẫu nhiên
    const list_reu = ['rgb(30, 60, 30)', 'rgb(50, 100, 50)'];
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const co_reu = randInt(4, 15);
      const mau = list_reu[Math.floor(Math.random() * list_reu.length)];
      ctx.fillStyle = mau;
      ctx.fillRect(rx, ry, co_reu, co_reu);
      if (Math.random() < 0.5) {
        ctx.fillRect(rx + co_reu, ry, co_reu / 2, co_reu / 2);
        ctx.fillRect(rx, ry + co_reu, co_reu / 2, co_reu / 2);
      }
    }

    return offCanvas;
  }

  // Mô phỏng menu_background.py: create_menu_background (Rắn xoắn ốc Gary)
  function generateMenuBackground(w, h) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const ctx = offCanvas.getContext('2d');

    ctx.fillStyle = 'rgb(235, 233, 227)'; // BG_COLOR
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const max_dist = Math.sqrt(cx * cx + cy * cy) + 200;
    const max_theta = 30 * 2 * Math.PI;

    let theta = 0;
    let head_pos = null;
    let head_r = 0;
    let head_ang = 0;

    const BELLY_COLOR = 'rgb(200, 240, 210)';

    while (theta < max_theta) {
      const r = 8.0 * theta;
      const ratio = theta / max_theta;

      let direction = -1.5 + ratio * 2.5;
      if (direction > 1.0) direction = 1.0;
      const final_theta = theta + -20 * direction;

      const x = cx + r * Math.cos(final_theta);
      const y = cy + r * Math.sin(final_theta);

      const size = Math.floor(5 + (r / max_dist) * 105);

      // Gradient color
      let red, green, blue;
      if (ratio < 0.5) {
        const t = ratio * 2;
        red = Math.floor(0 + 0 * t);
        green = Math.floor(60 + (120 - 60) * t);
        blue = Math.floor(150 + (215 - 150) * t);
      } else {
        const t = (ratio - 0.5) * 2;
        red = Math.floor(0 + 0 * t);
        green = Math.floor(120 + (200 - 120) * t);
        blue = Math.floor(215 + (255 - 215) * t);
      }

      if (x > -100 && x < w + 100 && y > -100 && y < h + 100) {
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        // Belly
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0) {
          const bx = x + (dx / dist) * size * 0.45;
          const by = y + (dy / dist) * size * 0.45;
          ctx.fillStyle = BELLY_COLOR;
          ctx.beginPath();
          ctx.arc(bx, by, size * 0.55, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      head_pos = { x, y };
      head_r = size;
      head_ang = final_theta;
      theta += 0.08;
    }

    // Gary's Head
    if (head_pos) {
      ctx.save();
      ctx.translate(head_pos.x, head_pos.y);
      ctx.rotate(head_ang + Math.PI / 2);

      const radius = head_r;
      // Head base
      ctx.fillStyle = 'rgb(90, 200, 230)';
      ctx.beginPath();
      ctx.ellipse(0, -radius * 0.5, radius * 1.1, radius * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cheeks
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.3, radius * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.fillStyle = 'rgb(100, 20, 30)';
      ctx.beginPath();
      ctx.ellipse(0, radius * 0.4, radius * 0.9, radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eyes
      for (const side of [-1, 1]) {
        const ex = side * radius * 0.65;
        const ey = -radius * 0.4;
        const er = radius * 0.45;
        ctx.fillStyle = 'rgb(50, 150, 180)';
        ctx.beginPath();
        ctx.arc(ex, ey, er + 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgb(255, 225, 60)';
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgb(20, 20, 30)';
        ctx.beginPath();
        ctx.ellipse(ex, ey, er * 0.25, er * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // Black overlay (100/255)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);

    return offCanvas;
  }

  // --- 4. GAME ENGINE & STATE ---
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');

  let currentState = STATES.INPUT_NAME;
  let playerName = 'PLAYER 1';
  let currentLevel = 1;
  let currentSpeed = 300;
  let lastMoveTime = 0;

  // Snake data
  let snake = [];
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let foods = [];
  let obstacles = [];
  let totalFoodCount = 0;
  let eatenCount = 0;

  // Mouse / UI interaction
  let mousePos = { x: 0, y: 0 };
  let hoveredButton = null;
  let viewHsLevel = 1;

  // UI Buttons definitions for different states
  let activeButtons = [];

  // LocalStorage Leaderboard
  function getHighscores(lvl) {
    try {
      const data = JSON.parse(localStorage.getItem('snake_cyber_highscores') || '[]');
      const filtered = data.filter((item) => item.level === lvl);
      filtered.sort((a, b) => b.score - a.score);
      return filtered.slice(0, 5);
    } catch (e) {
      return [];
    }
  }

  function saveHighscore(name, score, lvl) {
    try {
      const data = JSON.parse(localStorage.getItem('snake_cyber_highscores') || '[]');
      data.push({ name: name || 'ANONYMOUS', score: score, level: lvl, date: new Date().toLocaleDateString() });
      localStorage.setItem('snake_cyber_highscores', JSON.stringify(data));
    } catch (e) {}
  }

  function clearHighscores() {
    try {
      localStorage.removeItem('snake_cyber_highscores');
    } catch (e) {}
  }

  // --- 5. GAMEPLAY LOGIC ---
  function initGame(lvl) {
    currentLevel = lvl;
    currentSpeed = LEVELS[lvl].speed;
    eatenCount = 0;
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };

    // Snake starts at (1, 1)
    snake = [{ x: 1, y: 1 }];

    // Sinh thức ăn ngẫu nhiên
    const range = LEVELS[lvl].foodRange;
    const foodTarget = randInt(range[0], range[1]);
    foods = [];

    const isOccupied = (x, y) => {
      if (snake.some((s) => s.x === x && s.y === y)) return true;
      if (foods.some((f) => f.x === x && f.y === y)) return true;
      if (obstacles.some((o) => o.x === x && o.y === y)) return true;
      return false;
    };

    while (foods.length < foodTarget) {
      const fx = randInt(0, GRID_W - 1);
      const fy = randInt(2, GRID_H - 1); // 2 dòng đầu cho thanh progress bar
      if (!isOccupied(fx, fy)) {
        foods.push({ x: fx, y: fy });
      }
    }
    totalFoodCount = foods.length;

    // Sinh rào chắn (level >= 3)
    obstacles = [];
    if (lvl >= 3) {
      const count = typeof LEVELS[lvl].obstacles === 'function' ? LEVELS[lvl].obstacles(lvl) : LEVELS[lvl].obstacles;
      while (obstacles.length < count) {
        const ox = randInt(1, GRID_W - 2);
        const oy = randInt(2, GRID_H - 2);
        if (!isOccupied(ox, oy)) {
          obstacles.push({ x: ox, y: oy });
        }
      }
    }

    lastMoveTime = performance.now();
    currentState = STATES.PLAYING;
    playBgm('background');
  }

  function updateGame(currentTime) {
    if (currentState !== STATES.PLAYING) return;

    if (currentTime - lastMoveTime >= currentSpeed) {
      lastMoveTime = currentTime;

      // Áp dụng hướng mới đã buffer
      dir = { ...nextDir };

      const head = snake[0];
      const newHead = { x: head.x + dir.x, y: head.y + dir.y };

      // 1. Kiểm tra va chạm biên tường (theo kích thước động)
      if (newHead.x < 0 || newHead.x >= GRID_W || newHead.y < 0 || newHead.y >= GRID_H) {
        handleGameOver();
        return;
      }

      // 2. Kiểm tra va chạm rào chắn
      if (obstacles.some((o) => o.x === newHead.x && o.y === newHead.y)) {
        handleGameOver();
        return;
      }

      // 3. Kiểm tra va chạm thân mình (trừ đuôi nếu không ăn)
      const bodyCheck = snake.slice(0, -1);
      if (bodyCheck.some((b) => b.x === newHead.x && b.y === newHead.y)) {
        handleGameOver();
        return;
      }

      // Thêm đầu mới
      snake.unshift(newHead);

      // 4. Kiểm tra ăn mồi
      const foodIndex = foods.findIndex((f) => f.x === newHead.x && f.y === newHead.y);
      if (foodIndex !== -1) {
        playSound('eat');
        foods.splice(foodIndex, 1);
        eatenCount++;

        // Kiểm tra chiến thắng khi ăn hết mồi
        if (foods.length === 0) {
          handleGameWin();
          return;
        }
      } else {
        // Không ăn mồi -> xóa đuôi cũ
        snake.pop();
      }
    }
  }

  function handleGameOver() {
    playSound('die');
    stopBgm();
    currentState = STATES.GAMEOVER;
    saveHighscore(playerName, eatenCount, currentLevel);

    // Gửi telemetry về Hub AvaSnap
    if (window.AvaSnap && typeof window.AvaSnap.result === 'function') {
      window.AvaSnap.result({
        score: eatenCount,
        level: currentLevel,
        status: 'gameover'
      });
    }
  }

  function handleGameWin() {
    playSound('win');
    stopBgm();
    currentState = STATES.WIN;
    saveHighscore(playerName, eatenCount, currentLevel);

    // Gửi telemetry về Hub AvaSnap
    if (window.AvaSnap && typeof window.AvaSnap.result === 'function') {
      window.AvaSnap.result({
        score: eatenCount,
        level: currentLevel,
        status: 'win'
      });
    }
  }

  // --- 6. VẼ ĐỒ HỌA & SKIN RẮN (TỪ skinFull.py) ---

  // Vẽ ảnh xoay góc
  function drawRotatedImage(image, x, y, angleRad) {
    ctx.save();
    ctx.translate(x + BLOCK_SIZE / 2, y + BLOCK_SIZE / 2);
    ctx.rotate(angleRad);
    ctx.drawImage(image, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
    ctx.restore();
  }

  function getAngleFromRelation(rel) {
    if (rel.x === 1 && rel.y === 0) return Math.PI / 2; // Phải (90 deg)
    if (rel.x === -1 && rel.y === 0) return -Math.PI / 2; // Trái (-90 deg)
    if (rel.x === 0 && rel.y === 1) return Math.PI; // Xuống (180 deg)
    if (rel.x === 0 && rel.y === -1) return 0; // Lên (0 deg)
    return 0;
  }

  function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
      const block = snake[i];
      const px = block.x * BLOCK_SIZE;
      const py = block.y * BLOCK_SIZE;

      // 1. VẼ ĐẦU
      if (i === 0) {
        if (snake.length > 1) {
          const neck = snake[1];
          const rel = { x: block.x - neck.x, y: block.y - neck.y };
          drawRotatedImage(images.head, px, py, getAngleFromRelation(rel));
        } else {
          // Đầu không cổ khi chỉ có 1 đốt
          drawRotatedImage(images.head_noneck, px, py, getAngleFromRelation(dir));
        }
      }
      // 2. VẼ ĐUÔI
      else if (i === snake.length - 1) {
        const prevTail = snake[i - 1];
        const rel = { x: prevTail.x - block.x, y: prevTail.y - block.y };
        drawRotatedImage(images.tail, px, py, getAngleFromRelation(rel));
      }
      // 3. VẼ THÂN
      else {
        const prev = { x: snake[i + 1].x - block.x, y: snake[i + 1].y - block.y };
        const next = { x: snake[i - 1].x - block.x, y: snake[i - 1].y - block.y };

        if (prev.x === next.x) {
          // Thân thẳng đứng
          ctx.drawImage(images.body, px, py, BLOCK_SIZE, BLOCK_SIZE);
        } else if (prev.y === next.y) {
          // Thân nằm ngang (xoay 90 độ)
          drawRotatedImage(images.body, px, py, Math.PI / 2);
        } else {
          // Khúc cua (Corner 1, 2, 3, 4 theo chuẩn skinFull.py)
          if ((prev.x === -1 && next.y === -1) || (prev.y === -1 && next.x === -1)) {
            ctx.drawImage(images.corner2, px, py, BLOCK_SIZE, BLOCK_SIZE); // Top-Left
          } else if ((prev.x === -1 && next.y === 1) || (prev.y === 1 && next.x === -1)) {
            ctx.drawImage(images.corner3, px, py, BLOCK_SIZE, BLOCK_SIZE); // Bottom-Left
          } else if ((prev.x === 1 && next.y === -1) || (prev.y === -1 && next.x === 1)) {
            ctx.drawImage(images.corner1, px, py, BLOCK_SIZE, BLOCK_SIZE); // Top-Right
          } else if ((prev.x === 1 && next.y === 1) || (prev.y === 1 && next.x === 1)) {
            ctx.drawImage(images.corner4, px, py, BLOCK_SIZE, BLOCK_SIZE); // Bottom-Right
          }
        }
      }
    }
  }

  function drawFoods() {
    for (const f of foods) {
      ctx.drawImage(images.meat, f.x * BLOCK_SIZE, f.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
  }

  function drawObstacles() {
    for (const o of obstacles) {
      ctx.drawImage(images.cancel, o.x * BLOCK_SIZE, o.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }
  }

  // Thanh tiến trình trên cùng (draw_progress_bar từ main.py)
  function drawProgressBar() {
    const barWidth = CANVAS_WIDTH - 100;
    const barX = 50;
    const barY = 20;
    const barHeight = 25;

    const percent = totalFoodCount > 0 ? eatenCount / totalFoodCount : 0;
    const fillWidth = Math.floor(barWidth * percent);

    // Nền & Viền
    ctx.fillStyle = 'rgba(20, 20, 25, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Phần đã ăn
    ctx.fillStyle = 'rgb(50, 200, 50)';
    ctx.fillRect(barX + 2, barY + 2, Math.max(0, fillWidth - 4), barHeight - 4);

    // Text tỉ lệ %
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.floor(percent * 100)}% (${eatenCount}/${totalFoodCount})`, barX + barWidth / 2, barY + barHeight / 2);
  }

  // --- 7. UI RENDERERS ---

  function drawButton(btn, isSelected) {
    const { x, y, w, h, text, colorActive, colorPassive, borderColor } = btn;
    const bg = isSelected ? colorActive || 'rgb(50, 200, 50)' : colorPassive || 'rgb(80, 80, 80)';
    const stroke = isSelected ? '#00ffff' : borderColor || 'rgb(200, 200, 200)';
    const borderWidth = isSelected ? 3 : 1.5;

    // Bo góc
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h);
    ctx.fill();

    ctx.strokeStyle = stroke;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);
  }

  function renderInputState() {
    ctx.drawImage(cachedMenuBg, 0, 0);

    const cx = CANVAS_WIDTH / 2;

    // Tiêu đề
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 52px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE CYBER', cx, 150);

    ctx.fillStyle = 'rgb(0, 255, 100)';
    ctx.font = 'bold 28px Tahoma, sans-serif';
    ctx.fillText('NHẬP TÊN CỦA BẠN:', cx, 270);

    // Khung nhập tên
    const boxW = 340;
    const boxH = 60;
    const boxX = cx - boxW / 2;
    const boxY = 320;

    ctx.fillStyle = 'rgba(50, 50, 50, 0.85)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 10) : ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();

    ctx.strokeStyle = 'rgb(0, 255, 100)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px Tahoma, sans-serif';
    ctx.fillText(playerName + (Math.floor(Date.now() / 500) % 2 === 0 ? '|' : ''), cx, boxY + boxH / 2 + 2);

    ctx.fillStyle = '#cccccc';
    ctx.font = 'italic 18px Tahoma, sans-serif';
    ctx.fillText('(Gõ bàn phím và bấm BẮT ĐẦU hoặc phím Enter)', cx, 420);

    // Nút Bắt Đầu
    const startBtn = {
      id: 'btn_start',
      x: cx - 110,
      y: 470,
      w: 220,
      h: 50,
      text: 'BẮT ĐẦU',
      colorActive: 'rgb(0, 200, 100)',
      colorPassive: 'rgb(0, 150, 80)'
    };
    activeButtons = [startBtn];
    drawButton(startBtn, hoveredButton === startBtn.id);
  }

  function renderMainMenu() {
    ctx.drawImage(cachedMenuBg, 0, 0);

    const cx = CANVAS_WIDTH / 2;

    // Lời chào
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 44px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`CHÀO ${playerName.toUpperCase()}!`, cx, 110);

    const btnW = 280;
    const btnH = 46;
    const startY = 175;
    const gap = 56;

    activeButtons = [
      { id: 'lvl_1', x: cx - btnW / 2, y: startY + 0 * gap, w: btnW, h: btnH, text: 'Level 1 (Dễ)', colorActive: 'rgb(50, 200, 50)', colorPassive: 'rgb(60, 100, 60)' },
      { id: 'lvl_2', x: cx - btnW / 2, y: startY + 1 * gap, w: btnW, h: btnH, text: 'Level 2 (Thường)', colorActive: 'rgb(50, 200, 50)', colorPassive: 'rgb(60, 100, 60)' },
      { id: 'lvl_3', x: cx - btnW / 2, y: startY + 2 * gap, w: btnW, h: btnH, text: 'Level 3 (Khó)', colorActive: 'rgb(200, 140, 30)', colorPassive: 'rgb(120, 80, 20)' },
      { id: 'lvl_4', x: cx - btnW / 2, y: startY + 3 * gap, w: btnW, h: btnH, text: 'Level 4 (Siêu Khó)', colorActive: 'rgb(220, 50, 50)', colorPassive: 'rgb(140, 30, 30)' },
      { id: 'btn_instr', x: cx - btnW / 2, y: startY + 4 * gap, w: btnW, h: btnH, text: 'HƯỚNG DẪN', colorActive: 'rgb(50, 150, 200)', colorPassive: 'rgb(50, 90, 140)' },
      { id: 'btn_settings', x: cx - btnW / 2, y: startY + 5 * gap, w: btnW, h: btnH, text: 'CÀI ĐẶT', colorActive: 'rgb(200, 200, 50)', colorPassive: 'rgb(120, 120, 30)' },
      { id: 'btn_hs', x: cx - btnW / 2, y: startY + 6 * gap, w: btnW, h: btnH, text: 'BẢNG XẾP HẠNG', colorActive: 'rgb(0, 120, 220)', colorPassive: 'rgb(0, 70, 130)' },
      { id: 'btn_rename', x: cx - btnW / 2, y: startY + 7 * gap, w: btnW, h: btnH, text: 'ĐỔI TÊN NGƯỜI CHƠI', colorActive: 'rgb(160, 100, 220)', colorPassive: 'rgb(100, 60, 140)' }
    ];

    for (const btn of activeButtons) {
      drawButton(btn, hoveredButton === btn.id);
    }
  }

  function renderInstructions() {
    ctx.drawImage(cachedMenuBg, 0, 0);

    const cx = CANVAS_WIDTH / 2;

    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 44px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HƯỚNG DẪN CHƠI', cx, 110);

    const lines = [
      '1. Dùng phím Mũi tên, WASD hoặc phím ảo cảm ứng để di chuyển.',
      '2. Ăn thịt (Màu đỏ) để ghi điểm và giúp rắn dài ra.',
      '3. Tránh va vào tường bao quanh và tự cắn vào đuôi.',
      '4. Level 3 và 4 sẽ xuất hiện các chướng ngại vật rào chắn.',
      '5. Nhấn phím ESC hoặc nút Tạm dừng để dừng game.',
      '6. Mẹo: Hãy cẩn thận khi tốc độ tăng vọt ở Level 4!'
    ];

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '20px Tahoma, sans-serif';
    ctx.textAlign = 'left';
    const startX = cx - 350;
    const startY = 200;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], startX, startY + i * 54);
    }

    const backBtn = {
      id: 'btn_back',
      x: cx - 100,
      y: CANVAS_HEIGHT - 120,
      w: 200,
      h: 50,
      text: 'ĐÃ HIỂU',
      colorActive: 'rgb(0, 200, 100)',
      colorPassive: 'rgb(0, 130, 70)'
    };
    activeButtons = [backBtn];
    drawButton(backBtn, hoveredButton === backBtn.id);
  }

  function renderSettings() {
    ctx.drawImage(cachedMenuBg, 0, 0);

    const cx = CANVAS_WIDTH / 2;

    ctx.fillStyle = '#ffff00';
    ctx.font = 'bold 44px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CÀI ĐẶT', cx, 110);

    // Âm lượng
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Tahoma, sans-serif';
    ctx.fillText(`Âm lượng: ${isMuted ? 'TẮT' : Math.floor(masterVolume * 100) + '%'}`, cx, 230);

    const btnSub = { id: 'btn_vol_sub', x: cx - 110, y: 280, w: 70, h: 50, text: '-', colorActive: 'rgb(220, 50, 50)', colorPassive: 'rgb(120, 30, 30)' };
    const btnAdd = { id: 'btn_vol_add', x: cx + 40, y: 280, w: 70, h: 50, text: '+', colorActive: 'rgb(50, 200, 50)', colorPassive: 'rgb(30, 120, 30)' };
    const btnMute = { id: 'btn_vol_mute', x: cx - 100, y: 360, w: 200, h: 44, text: isMuted ? 'BẬT ÂM' : 'TẮT ÂM', colorActive: 'rgb(220, 120, 30)', colorPassive: 'rgb(120, 70, 20)' };

    // Thông tin Hub AvaSnap
    ctx.fillStyle = '#00ffff';
    ctx.font = '18px Tahoma, sans-serif';
    ctx.fillText('Nền tảng: NexusPlay Web Hub / AvaSnap SDK v1.1', cx, 470);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Độ phân giải hiển thị: ${CANVAS_WIDTH} x ${CANVAS_HEIGHT}`, cx, 510);

    const backBtn = {
      id: 'btn_back',
      x: cx - 110,
      y: CANVAS_HEIGHT - 120,
      w: 220,
      h: 50,
      text: 'LƯU & QUAY LẠI',
      colorActive: 'rgb(0, 200, 100)',
      colorPassive: 'rgb(0, 130, 70)'
    };

    activeButtons = [btnSub, btnAdd, btnMute, backBtn];
    for (const b of activeButtons) drawButton(b, hoveredButton === b.id);
  }

  function renderHighscore() {
    ctx.drawImage(cachedMenuBg, 0, 0);

    const cx = CANVAS_WIDTH / 2;

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 44px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BẢNG VÀNG CAO THỦ', cx, 90);

    // 4 Tabs Level
    const tabW = 90;
    const tabH = 42;
    const tabStartX = cx - (4 * tabW + 3 * 16) / 2;

    activeButtons = [];
    for (let i = 1; i <= 4; i++) {
      const tabX = tabStartX + (i - 1) * (tabW + 16);
      const isCurrent = i === viewHsLevel;
      const tabBtn = {
        id: `hs_tab_${i}`,
        x: tabX,
        y: 150,
        w: tabW,
        h: tabH,
        text: `Level ${i}`,
        colorActive: '#00ffff',
        colorPassive: isCurrent ? 'rgb(0, 150, 200)' : 'rgb(60, 70, 80)'
      };
      activeButtons.push(tabBtn);
      drawButton(tabBtn, isCurrent || hoveredButton === tabBtn.id);
    }

    // Bảng danh sách
    const frameW = 600;
    const frameH = 280;
    const frameX = cx - frameW / 2;
    const frameY = 220;

    ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(frameX, frameY, frameW, frameH, 12) : ctx.rect(frameX, frameY, frameW, frameH);
    ctx.fill();

    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Tiêu đề cột
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('HẠNG', frameX + 40, frameY + 36);
    ctx.fillText('TÊN CAO THỦ', frameX + 170, frameY + 36);
    ctx.fillText('ĐIỂM SỐ', frameX + 450, frameY + 36);

    const scores = getHighscores(viewHsLevel);
    if (scores.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'italic 18px Tahoma, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('(Chưa có kỷ lục nào ở Level này)', cx, frameY + 140);
    } else {
      ctx.font = 'bold 18px monospace';
      for (let i = 0; i < scores.length; i++) {
        const item = scores[i];
        const rowY = frameY + 80 + i * 38;
        const color = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#ffffff';
        ctx.fillStyle = color;
        ctx.textAlign = 'left';
        ctx.fillText(`#${i + 1}`, frameX + 50, rowY);
        ctx.fillText(item.name.slice(0, 16), frameX + 170, rowY);
        ctx.fillText(String(item.score), frameX + 470, rowY);
      }
    }

    // Nút Xóa & Nút Quay lại
    const btnReset = {
      id: 'btn_hs_reset',
      x: cx - 220,
      y: CANVAS_HEIGHT - 120,
      w: 180,
      h: 48,
      text: 'XÓA BXH',
      colorActive: 'rgb(220, 50, 50)',
      colorPassive: 'rgb(120, 30, 30)'
    };
    const btnBack = {
      id: 'btn_back',
      x: cx + 40,
      y: CANVAS_HEIGHT - 120,
      w: 180,
      h: 48,
      text: 'QUAY LẠI',
      colorActive: 'rgb(0, 200, 100)',
      colorPassive: 'rgb(0, 130, 70)'
    };
    activeButtons.push(btnReset, btnBack);
    drawButton(btnReset, hoveredButton === btnReset.id);
    drawButton(btnBack, hoveredButton === btnBack.id);
  }

  // Bảng thông báo Pause Menu (nhấn ESC)
  function renderPauseMenu() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const boxW = 440;
    const boxH = 360;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 14) : ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TẠM DỪNG', cx, boxY + 60);

    const btnW = 240;
    const btnH = 46;
    activeButtons = [
      { id: 'btn_resume', x: cx - btnW / 2, y: boxY + 110, w: btnW, h: btnH, text: 'TIẾP TỤC [ESC]', colorActive: 'rgb(0, 200, 100)', colorPassive: 'rgb(0, 120, 60)' },
      { id: 'btn_restart', x: cx - btnW / 2, y: boxY + 175, w: btnW, h: btnH, text: 'CHƠI LẠI', colorActive: 'rgb(220, 150, 30)', colorPassive: 'rgb(140, 90, 20)' },
      { id: 'btn_menu', x: cx - btnW / 2, y: boxY + 240, w: btnW, h: btnH, text: 'VỀ MENU CHÍNH', colorActive: 'rgb(220, 50, 50)', colorPassive: 'rgb(120, 30, 30)' }
    ];

    for (const b of activeButtons) drawButton(b, hoveredButton === b.id);
  }

  // Bảng thông báo Win / Game Over (ve_bang từ main.py)
  function renderEndModal(title, isWin) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT / 2;
    const boxW = 560;
    const boxH = 420;
    const boxX = cx - boxW / 2;
    const boxY = cy - boxH / 2;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 16) : ctx.rect(boxX, boxY, boxW, boxH);
    ctx.fill();

    ctx.strokeStyle = isWin ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = isWin ? '#15803d' : '#b91c1c';
    ctx.font = 'bold 44px Tahoma, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, cx, boxY + 65);

    ctx.fillStyle = '#1f2937';
    ctx.font = '22px Tahoma, sans-serif';
    ctx.fillText(`Điểm số đạt được: ${eatenCount} mồi`, cx, boxY + 120);
    ctx.fillText(`Bạn đang ở Level ${currentLevel}`, cx, boxY + 155);

    ctx.fillStyle = '#4b5563';
    ctx.font = '16px Tahoma, sans-serif';
    ctx.fillText('Nhấn phím [Y] để chơi lại - Nhấn [1-4] chọn Level - [ESC] về Menu', cx, boxY + 195);

    const btnW = 160;
    const btnH = 44;
    const rowY = boxY + 235;

    activeButtons = [
      { id: 'btn_replay', x: cx - 180, y: rowY, w: 160, h: btnH, text: 'CHƠI LẠI [Y]', colorActive: 'rgb(34, 197, 94)', colorPassive: 'rgb(22, 101, 52)' },
      { id: 'btn_end_menu', x: cx + 20, y: rowY, w: 160, h: btnH, text: 'MENU CHÍNH [ESC]', colorActive: 'rgb(239, 68, 68)', colorPassive: 'rgb(153, 27, 27)' },
      // Nút chọn nhanh level
      { id: 'quick_lvl_1', x: cx - 210, y: rowY + 65, w: 90, h: 40, text: 'Level 1', colorActive: '#00ffff', colorPassive: '#475569' },
      { id: 'quick_lvl_2', x: cx - 105, y: rowY + 65, w: 90, h: 40, text: 'Level 2', colorActive: '#00ffff', colorPassive: '#475569' },
      { id: 'quick_lvl_3', x: cx + 5, y: rowY + 65, w: 90, h: 40, text: 'Level 3', colorActive: '#00ffff', colorPassive: '#475569' },
      { id: 'quick_lvl_4', x: cx + 115, y: rowY + 65, w: 90, h: 40, text: 'Level 4', colorActive: '#00ffff', colorPassive: '#475569' }
    ];

    for (const b of activeButtons) drawButton(b, hoveredButton === b.id);
  }

  // --- 8. VÒNG LẶP CHÍNH (RENDER LOOP) ---
  function mainLoop(time) {
    updateGame(time);

    // Xóa canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Vẽ theo trạng thái
    switch (currentState) {
      case STATES.INPUT_NAME:
        renderInputState();
        break;

      case STATES.MAIN_MENU:
        renderMainMenu();
        break;

      case STATES.INSTRUCTIONS:
        renderInstructions();
        break;

      case STATES.SETTINGS:
        renderSettings();
        break;

      case STATES.HIGHSCORE:
        renderHighscore();
        break;

      case STATES.PLAYING:
        ctx.drawImage(cachedStoneBg, 0, 0);
        drawProgressBar();
        drawFoods();
        drawObstacles();
        drawSnake();
        break;

      case STATES.PAUSED:
        ctx.drawImage(cachedStoneBg, 0, 0);
        drawProgressBar();
        drawFoods();
        drawObstacles();
        drawSnake();
        renderPauseMenu();
        break;

      case STATES.WIN:
        ctx.drawImage(cachedStoneBg, 0, 0);
        drawProgressBar();
        drawFoods();
        drawObstacles();
        drawSnake();
        renderEndModal('CHIẾN THẮNG!', true);
        break;

      case STATES.GAMEOVER:
        ctx.drawImage(cachedStoneBg, 0, 0);
        drawProgressBar();
        drawFoods();
        drawObstacles();
        drawSnake();
        renderEndModal('GAME OVER!', false);
        break;
    }

    requestAnimationFrame(mainLoop);
  }

  // --- 9. BẮT SỰ KIỆN PHÍM & CHUỘT ---
  function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  window.addEventListener('mousemove', (e) => {
    mousePos = getCanvasCoords(e);
    hoveredButton = null;
    for (const btn of activeButtons) {
      if (mousePos.x >= btn.x && mousePos.x <= btn.x + btn.w && mousePos.y >= btn.y && mousePos.y <= btn.y + btn.h) {
        hoveredButton = btn.id;
        break;
      }
    }
  });

  window.addEventListener('click', (e) => {
    unlockAudio();
    const pos = getCanvasCoords(e);

    for (const btn of activeButtons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        playSound('click');
        handleButtonClick(btn.id);
        break;
      }
    }
  });

  function handleButtonClick(id) {
    if (id === 'btn_start') {
      if (playerName.trim().length === 0) playerName = 'PLAYER 1';
      currentState = STATES.MAIN_MENU;
      playBgm('intro');
    } else if (id === 'lvl_1') initGame(1);
    else if (id === 'lvl_2') initGame(2);
    else if (id === 'lvl_3') initGame(3);
    else if (id === 'lvl_4') initGame(4);
    else if (id === 'btn_instr') currentState = STATES.INSTRUCTIONS;
    else if (id === 'btn_settings') currentState = STATES.SETTINGS;
    else if (id === 'btn_hs') currentState = STATES.HIGHSCORE;
    else if (id === 'btn_rename') currentState = STATES.INPUT_NAME;
    else if (id === 'btn_back') {
      currentState = STATES.MAIN_MENU;
      playBgm('intro');
    } else if (id === 'btn_vol_sub') updateVolume(masterVolume - 0.1);
    else if (id === 'btn_vol_add') updateVolume(masterVolume + 0.1);
    else if (id === 'btn_vol_mute') {
      isMuted = !isMuted;
      updateVolume(masterVolume);
    } else if (id.startsWith('hs_tab_')) {
      viewHsLevel = parseInt(id.replace('hs_tab_', ''), 10);
    } else if (id === 'btn_hs_reset') {
      clearHighscores();
    } else if (id === 'btn_resume') {
      currentState = STATES.PLAYING;
      playBgm('background');
    } else if (id === 'btn_restart' || id === 'btn_replay') {
      initGame(currentLevel);
    } else if (id === 'btn_menu' || id === 'btn_end_menu') {
      stopBgm();
      currentState = STATES.MAIN_MENU;
      playBgm('intro');
    } else if (id.startsWith('quick_lvl_')) {
      const lvl = parseInt(id.replace('quick_lvl_', ''), 10);
      initGame(lvl);
    }
  }

  // Điều khiển bàn phím (WASD + Mũi tên + ESC + 1-4 + Y)
  window.addEventListener('keydown', (e) => {
    unlockAudio();

    // Nhập tên
    if (currentState === STATES.INPUT_NAME) {
      if (e.key === 'Enter') {
        if (playerName.trim().length === 0) playerName = 'PLAYER 1';
        playSound('play');
        currentState = STATES.MAIN_MENU;
        playBgm('intro');
      } else if (e.key === 'Backspace') {
        playerName = playerName.slice(0, -1);
      } else if (e.key.length === 1 && playerName.length < 12) {
        playerName += e.key;
      }
      return;
    }

    // Khi đang chơi: điều khiển hướng rắn
    if (currentState === STATES.PLAYING) {
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && dir.y !== 1) {
        nextDir = { x: 0, y: -1 };
      } else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && dir.y !== -1) {
        nextDir = { x: 0, y: 1 };
      } else if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && dir.x !== 1) {
        nextDir = { x: -1, y: 0 };
      } else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && dir.x !== -1) {
        nextDir = { x: 1, y: 0 };
      } else if (e.key === 'Escape') {
        playSound('click');
        currentState = STATES.PAUSED;
      }
      return;
    }

    // Khi Pause
    if (currentState === STATES.PAUSED) {
      if (e.key === 'Escape') {
        currentState = STATES.PLAYING;
        playBgm('background');
      }
      return;
    }

    // Khi Thắng / Thua
    if (currentState === STATES.WIN || currentState === STATES.GAMEOVER) {
      if (e.key === 'y' || e.key === 'Y') {
        playSound('play');
        initGame(currentLevel);
      } else if (['1', '2', '3', '4'].includes(e.key)) {
        playSound('play');
        initGame(parseInt(e.key, 10));
      } else if (e.key === 'Escape') {
        stopBgm();
        currentState = STATES.MAIN_MENU;
        playBgm('intro');
      }
      return;
    }

    // Các menu khác nhấn ESC để quay lại
    if (e.key === 'Escape') {
      if ([STATES.INSTRUCTIONS, STATES.SETTINGS, STATES.HIGHSCORE].includes(currentState)) {
        currentState = STATES.MAIN_MENU;
        playBgm('intro');
      }
    }
  });

  // --- 10. HỖ TRỢ CẢM ỨNG (TOUCH / D-PAD TRÊN MOBILE) ---
  const touchControls = document.getElementById('touch-controls');
  const btnTouchToggle = document.getElementById('btn-touch-toggle');
  const btnSound = document.getElementById('btn-sound');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  // Tự bật touch controls nếu là thiết bị cảm ứng
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    touchControls.style.display = 'grid';
  }

  btnTouchToggle.addEventListener('click', () => {
    touchControls.style.display = touchControls.style.display === 'grid' ? 'none' : 'grid';
  });

  btnSound.addEventListener('click', () => {
    unlockAudio();
    isMuted = !isMuted;
    updateVolume(masterVolume);
    btnSound.textContent = isMuted ? '🔇 TẮT ÂM' : '🔊 ÂM LƯỢNG';
  });

  btnFullscreen.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Gán sự kiện D-Pad
  const setTouchDir = (newX, newY) => {
    unlockAudio();
    if (currentState === STATES.PLAYING) {
      if (newX !== 0 && dir.x !== -newX) nextDir = { x: newX, y: 0 };
      if (newY !== 0 && dir.y !== -newY) nextDir = { x: 0, y: newY };
    }
  };

  document.getElementById('touch-up').addEventListener('touchstart', (e) => { e.preventDefault(); setTouchDir(0, -1); });
  document.getElementById('touch-down').addEventListener('touchstart', (e) => { e.preventDefault(); setTouchDir(0, 1); });
  document.getElementById('touch-left').addEventListener('touchstart', (e) => { e.preventDefault(); setTouchDir(-1, 0); });
  document.getElementById('touch-right').addEventListener('touchstart', (e) => { e.preventDefault(); setTouchDir(1, 0); });
  document.getElementById('touch-pause').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (currentState === STATES.PLAYING) currentState = STATES.PAUSED;
    else if (currentState === STATES.PAUSED) currentState = STATES.PLAYING;
  });

  // Swipe Gestures trên Canvas
  let touchStartX = 0;
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.changedTouches.length > 0 && currentState === STATES.PLAYING) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setTouchDir(dx > 0 ? 1 : -1, 0);
        } else {
          setTouchDir(0, dy > 0 ? 1 : -1);
        }
      }
    }
  }, { passive: true });

  // --- 11. KHỞI CHẠY & NẠP ASSETS ---
  function preloadAll(onProgress, onComplete) {
    let loaded = 0;
    const total = Object.keys(IMAGES_SRC).length + Object.keys(SOUNDS_SRC).length;

    const checkDone = () => {
      loaded++;
      onProgress(Math.floor((loaded / total) * 100));
      if (loaded >= total) onComplete();
    };

    // Nạp ảnh
    for (const [key, src] of Object.entries(IMAGES_SRC)) {
      const img = new Image();
      img.src = src;
      img.onload = () => { images[key] = img; checkDone(); };
      img.onerror = () => { console.warn(`Không tải được ảnh: ${src}`); checkDone(); };
    }

    // Nạp âm thanh
    for (const [key, src] of Object.entries(SOUNDS_SRC)) {
      const audio = new Audio();
      audio.src = src;
      audio.preload = 'auto';
      audio.oncanplaythrough = () => { checkDone(); audio.oncanplaythrough = null; };
      audio.onerror = () => { console.warn(`Không tải được âm thanh: ${src}`); checkDone(); };
      sounds[key] = audio;
    }
  }

  // Bắt đầu nạp
  const progressElem = document.getElementById('loading-progress');
  const loadingOverlay = document.getElementById('loading-overlay');

  preloadAll(
    (pct) => {
      if (progressElem) progressElem.textContent = `${pct}%`;
    },
    () => {
      // Tạo các background tĩnh một lần để tối ưu hiệu năng
      cachedStoneBg = generateStoneBackground(CANVAS_WIDTH, CANVAS_HEIGHT);
      cachedMenuBg = generateMenuBackground(CANVAS_WIDTH, CANVAS_HEIGHT);

      // Ẩn màn hình tải
      if (loadingOverlay) loadingOverlay.style.display = 'none';

      // --- TÍCH HỢP AVASNAP SDK ---
      // Thông báo với Hub rằng game đã nạp xong và sẵn sàng chạy trong iframe
      if (window.AvaSnap && typeof window.AvaSnap.ready === 'function') {
        console.log('[AvaSnap] Báo game đã sẵn sàng: gameId = snake-cyber');
        window.AvaSnap.ready({ gameId: 'snake-cyber' });
      }

      // Khởi động vòng lặp game
      requestAnimationFrame(mainLoop);
    }
  );

})();
