window.GameModules = window.GameModules || {};

window.GameModules.snake = function (container, api) {
  const COLS = 20, ROWS = 20;
  let cellSize, canvas, ctx;
  let snake, dir, dirQueue, food, score, loopId, running, speed, baseInterval;

  container.innerHTML = `<canvas id="snakeCanvas" aria-label="Snake game board"></canvas>`;
  canvas = container.querySelector("#snakeCanvas");
  ctx = canvas.getContext("2d");

  function sizeCanvas(){
    const wrap = container.parentElement;
    const available = Math.min((wrap.clientWidth || 320) - 32, 480);
    cellSize = Math.floor(available / COLS);
    cellSize = Math.max(cellSize, 12);
    canvas.width = cellSize * COLS;
    canvas.height = cellSize * ROWS;
  }

  function speedFor(level){
    return { slow: 160, normal: 110, fast: 72 }[level] || 110;
  }

  function placeFood(){
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function reset(){
    sizeCanvas();
    snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
    dir = { x: 1, y: 0 };
    dirQueue = [];
    score = 0;
    baseInterval = speedFor(api.getDifficulty());
    speed = baseInterval;
    api.setScore(score);
    placeFood();
    draw();
  }

  function loopTick(){
    if (dirQueue.length) dir = dirQueue.shift();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      api.setScore(score);
      api.sound.eat();
      placeFood();
      speed = Math.max(55, baseInterval - Math.floor(score / 5));
      restartLoop();
    } else {
      snake.pop();
    }
    draw();
  }

  function restartLoop(){
    if (loopId) clearInterval(loopId);
    if (running) loopId = setInterval(loopTick, speed);
  }

  function draw(){
    ctx.fillStyle = "#0c1020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle grid so the board reads as a bounded space
    ctx.strokeStyle = "rgba(182,255,63,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(canvas.width, y * cellSize); ctx.stroke(); }

    // food: glossy orb with a highlight, instead of a flat square
    const fx = food.x * cellSize + cellSize / 2, fy = food.y * cellSize + cellSize / 2, fr = cellSize * 0.38;
    const foodGrad = ctx.createRadialGradient(fx - fr * 0.3, fy - fr * 0.3, fr * 0.1, fx, fy, fr);
    foodGrad.addColorStop(0, "#fff3d0");
    foodGrad.addColorStop(1, "#ffc24b");
    ctx.save();
    ctx.shadowColor = "#ffc24b";
    ctx.shadowBlur = 14;
    ctx.fillStyle = foodGrad;
    ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    drawSnakeBody();
    drawSnakeHead();
  }

  // Body: a chain of tapering, overlapping circles (tail thinnest, head thickest)
  // reads as a continuous rounded snake rather than a row of separate blocks.
  function drawSnakeBody(){
    const n = snake.length;
    for (let i = n - 1; i >= 1; i--) {
      const seg = snake[i];
      const t = n > 1 ? i / (n - 1) : 0; // 0 near head .. 1 at tail tip
      const r = cellSize * (0.54 - 0.2 * t);
      const cx = seg.x * cellSize + cellSize / 2, cy = seg.y * cellSize + cellSize / 2;
      ctx.fillStyle = `rgba(74, 222, 128, ${(0.55 + 0.4 * (1 - t)).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    }
    // faint scale pattern down the spine for texture
    ctx.fillStyle = "rgba(10,12,18,0.18)";
    for (let i = n - 1; i >= 1; i -= 2) {
      const seg = snake[i];
      const cx = seg.x * cellSize + cellSize / 2, cy = seg.y * cellSize + cellSize / 2;
      ctx.beginPath(); ctx.arc(cx, cy, cellSize * 0.12, 0, Math.PI * 2); ctx.fill();
    }
  }

  // Head: a larger, lighter circle with two eyes oriented toward the travel direction.
  function drawSnakeHead(){
    const head = snake[0];
    const hx = head.x * cellSize + cellSize / 2, hy = head.y * cellSize + cellSize / 2, hr = cellSize * 0.6;
    const headGrad = ctx.createRadialGradient(hx - hr * 0.3, hy - hr * 0.3, hr * 0.15, hx, hy, hr);
    headGrad.addColorStop(0, "#eafff2");
    headGrad.addColorStop(1, "#4ade80");
    ctx.save();
    ctx.shadowColor = "rgba(74,222,128,0.5)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = headGrad;
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const ex = dir.x, ey = dir.y;
    const perpX = -ey, perpY = ex;
    const eyeForward = hr * 0.32, eyeSide = hr * 0.42, eyeR = hr * 0.17;
    [1, -1].forEach(side => {
      const exx = hx + ex * eyeForward + perpX * eyeSide * side;
      const eyy = hy + ey * eyeForward + perpY * eyeSide * side;
      ctx.fillStyle = "#eafff2";
      ctx.beginPath(); ctx.arc(exx, eyy, eyeR, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#0a0c12";
      ctx.beginPath(); ctx.arc(exx + ex * eyeR * 0.3, eyy + ey * eyeR * 0.3, eyeR * 0.55, 0, Math.PI * 2); ctx.fill();
    });

    // small forked tongue flicking out from the snout on odd ticks, for character
    if (Math.floor(Date.now() / 260) % 2 === 0) {
      const tx = hx + ex * hr, ty = hy + ey * hr;
      ctx.strokeStyle = "#ff6b45";
      ctx.lineWidth = Math.max(1.2, cellSize * 0.06);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + ex * hr * 0.6, ty + ey * hr * 0.6);
      ctx.moveTo(tx + ex * hr * 0.6, ty + ey * hr * 0.6);
      ctx.lineTo(tx + ex * hr * 0.6 + perpX * hr * 0.18, ty + ey * hr * 0.6 + perpY * hr * 0.18);
      ctx.moveTo(tx + ex * hr * 0.6, ty + ey * hr * 0.6);
      ctx.lineTo(tx + ex * hr * 0.6 - perpX * hr * 0.18, ty + ey * hr * 0.6 - perpY * hr * 0.18);
      ctx.stroke();
    }
  }

  function roundRect(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function gameOver(){
    running = false;
    if (loopId) clearInterval(loopId);
    api.sound.lose();
    const isNew = api.reportHighScore(score);
    api.resetControls && api.resetControls();
    api.showOverlay("Game over", `You scored ${score}.${isNew ? " New high score!" : ""}`, [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); startGame(); } }
    ]);
  }

  function setDir(x, y){
    // Queue up to 2 turns instead of overwriting a single "next direction" —
    // without this, pressing two keys in quick succession (the exact thing
    // you need to do to round a corner toward food near the edge) silently
    // drops the first one, since it gets overwritten before the tick that
    // would have applied it. Check reversal against whichever direction is
    // effectively "current" once the queue drains, not the stale live one.
    const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
    if (last.x === -x && last.y === -y) return; // no reversing
    if (last.x === x && last.y === y) return; // no duplicate queued turns
    if (dirQueue.length >= 2) return; // cap the buffer
    dirQueue.push({ x, y });
  }

  function keyHandler(e){
    const map = {
      ArrowUp: [0,-1], ArrowDown: [0,1], ArrowLeft: [-1,0], ArrowRight: [1,0],
      w: [0,-1], s: [0,1], a: [-1,0], d: [1,0], W: [0,-1], S: [0,1], A: [-1,0], D: [1,0]
    };
    if (map[e.key]) { e.preventDefault(); setDir(...map[e.key]); }
    if (e.key === "p" || e.key === "P") togglePauseKey();
  }
  function togglePauseKey(){ document.getElementById("pauseBtn").click(); }

  function startGame(){
    reset();
    running = true;
    restartLoop();
  }

  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  return {
    init(){
      document.addEventListener("keydown", keyHandler);
      api.buildDpad(false);
      startGame();
    },
    start(){ if (!snake) return; running = true; restartLoop(); },
    pause(){ running = false; if (loopId) clearInterval(loopId); },
    restart(){ startGame(); },
    setDifficulty(v){ baseInterval = speedFor(v); speed = baseInterval; },
    destroy(){ document.removeEventListener("keydown", keyHandler); if (loopId) clearInterval(loopId); api.clearTouch(); },
    handleTouch(action){
      const map = { up: [0,-1], down: [0,1], left: [-1,0], right: [1,0] };
      if (map[action]) setDir(...map[action]);
    }
  };
};
