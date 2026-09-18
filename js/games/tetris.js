window.GameModules = window.GameModules || {};

window.GameModules.tetris = function (container, api) {
  const COLS = 10, ROWS = 20;
  let cellSize, canvas, ctx;
  let grid, current, score, lines, level, dropTimer, running, loopId, gameOverFlag, startLevel;

  const SHAPES = {
    I: { color: "#46dbe8", cells: [[0,1],[1,1],[2,1],[3,1]] },
    J: { color: "#5b7cff", cells: [[0,0],[0,1],[1,1],[2,1]] },
    L: { color: "#ffab2e", cells: [[2,0],[0,1],[1,1],[2,1]] },
    O: { color: "#ffc24b", cells: [[1,0],[2,0],[1,1],[2,1]] },
    S: { color: "#4ade80", cells: [[1,0],[2,0],[0,1],[1,1]] },
    T: { color: "#8b6bff", cells: [[1,0],[0,1],[1,1],[2,1]] },
    Z: { color: "#fb5d5d", cells: [[0,0],[1,0],[1,1],[2,1]] }
  };
  const KEYS = Object.keys(SHAPES);

  container.innerHTML = `<canvas id="tetrisCanvas" aria-label="Tetris board"></canvas>`;
  canvas = container.querySelector("#tetrisCanvas");
  ctx = canvas.getContext("2d");

  function sizeCanvas(){
    const wrap = container.parentElement;
    const availH = Math.min(window.innerHeight * 0.55, 560);
    cellSize = Math.floor(availH / ROWS);
    const availW = wrap.clientWidth - 32;
    cellSize = Math.min(cellSize, Math.floor(availW / COLS));
    cellSize = Math.max(cellSize, 14);
    canvas.width = cellSize * COLS;
    canvas.height = cellSize * ROWS;
  }

  function emptyGrid(){
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function speedForLevel(lvl){
    const base = { slow: 900, normal: 700, fast: 480 }[startLevel] || 700;
    return Math.max(90, base - lvl * 55);
  }

  function newPiece(){
    const key = KEYS[Math.floor(Math.random() * KEYS.length)];
    const shape = SHAPES[key];
    return {
      key, color: shape.color,
      cells: shape.cells.map(([x, y]) => ({ x: x + 3, y })),
      rotIndex: 0
    };
  }

  function rotate(piece){
    if (piece.key === "O") return piece.cells;
    // rotate around the piece's second cell as pivot approx
    const pivot = piece.cells[1];
    return piece.cells.map(c => {
      const relX = c.x - pivot.x, relY = c.y - pivot.y;
      return { x: pivot.x - relY, y: pivot.y + relX };
    });
  }

  function collides(cells){
    return cells.some(c => c.x < 0 || c.x >= COLS || c.y >= ROWS || (c.y >= 0 && grid[c.y][c.x]));
  }

  function lockPiece(){
    current.cells.forEach(c => { if (c.y >= 0) grid[c.y][c.x] = current.color; });
    clearLines();
    current = newPiece();
    if (collides(current.cells)) return endGame();
    draw();
  }

  function clearLines(){
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every(cell => cell)) {
        grid.splice(y, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      const points = [0, 100, 300, 500, 800][cleared] || 1000;
      score += points * (level + 1);
      lines += cleared;
      level = Math.floor(lines / 10);
      api.setScore(score);
      api.sound.clear();
      restartDrop();
    }
  }

  function move(dx, dy){
    const moved = current.cells.map(c => ({ x: c.x + dx, y: c.y + dy }));
    if (collides(moved)) return false;
    current.cells = moved;
    draw();
    return true;
  }

  function tryRotate(){
    const rotated = rotate(current);
    if (!collides(rotated)) { current.cells = rotated; api.sound.rotate(); draw(); return; }
    // simple wall-kick attempts
    for (const dx of [-1, 1, -2, 2]) {
      const kicked = rotated.map(c => ({ x: c.x + dx, y: c.y }));
      if (!collides(kicked)) { current.cells = kicked; api.sound.rotate(); draw(); return; }
    }
  }

  function softDrop(){
    if (!move(0, 1)) { api.sound.place(); lockPiece(); }
    else { score += 1; api.setScore(score); }
  }

  function hardDrop(){
    let moved = true;
    let dist = 0;
    while (moved) { moved = move(0, 1); if (moved) dist++; }
    score += dist * 2;
    api.setScore(score);
    api.sound.place();
    lockPiece();
  }

  function restartDrop(){
    if (loopId) clearInterval(loopId);
    if (running) loopId = setInterval(() => { if (!move(0, 1)) { api.sound.place(); lockPiece(); } }, speedForLevel(level));
  }

  function draw(){
    ctx.fillStyle = "#0c1020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, canvas.height); ctx.stroke(); }
    for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(canvas.width, y * cellSize); ctx.stroke(); }

    grid.forEach((row, y) => row.forEach((cell, x) => { if (cell) drawCell(x, y, cell); }));
    if (current) current.cells.forEach(c => { if (c.y >= 0) drawCell(c.x, c.y, current.color); });
  }

  function drawCell(x, y, color){
    ctx.fillStyle = color;
    ctx.fillRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.strokeRect(x * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function endGame(){
    running = false;
    gameOverFlag = true;
    if (loopId) clearInterval(loopId);
    api.sound.lose();
    const isNew = api.reportHighScore(score);
    api.resetControls && api.resetControls();
    api.showOverlay("Game over", `Score ${score} · Level ${level + 1}.${isNew ? " New high score!" : ""}`, [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); startGame(); } }
    ]);
  }

  function keyHandler(e){
    if (gameOverFlag) return;
    if (["ArrowLeft","ArrowRight","ArrowDown","ArrowUp"," "].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowLeft") { move(-1, 0); api.sound.move(); }
    else if (e.key === "ArrowRight") { move(1, 0); api.sound.move(); }
    else if (e.key === "ArrowDown") softDrop();
    else if (e.key === "ArrowUp") tryRotate();
    else if (e.key === " ") hardDrop();
    else if (e.key === "p" || e.key === "P") document.getElementById("pauseBtn").click();
  }

  function startGame(){
    sizeCanvas();
    grid = emptyGrid();
    score = 0; lines = 0; level = 0; gameOverFlag = false;
    api.setScore(score);
    current = newPiece();
    draw();
    running = true;
    restartDrop();
  }

  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  return {
    init(){
      startLevel = api.getDifficulty();
      document.addEventListener("keydown", keyHandler);
      api.buildDpad(true);
      startGame();
    },
    start(){ if (!grid) return; if (gameOverFlag) return; running = true; restartDrop(); },
    pause(){ running = false; if (loopId) clearInterval(loopId); },
    restart(){ startGame(); },
    setDifficulty(v){ startLevel = v; },
    destroy(){ document.removeEventListener("keydown", keyHandler); if (loopId) clearInterval(loopId); api.clearTouch(); },
    handleTouch(action){
      if (gameOverFlag) return;
      if (action === "left") { move(-1, 0); api.sound.move(); }
      else if (action === "right") { move(1, 0); api.sound.move(); }
      else if (action === "down") softDrop();
      else if (action === "rotate") tryRotate();
      else if (action === "drop") hardDrop();
    }
  };
};
