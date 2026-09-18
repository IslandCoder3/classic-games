window.GameModules = window.GameModules || {};

window.GameModules.minesweeper = function (container, api) {
  const SIZES = {
    easy: { size: 9, mines: 10 },
    normal: { size: 12, mines: 22 },
    hard: { size: 16, mines: 45 }
  };
  const NUM_COLORS = ["", "#46dbe8", "#4ade80", "#fb5d5d", "#8b6bff", "#ffab2e", "#ffc24b", "#e9ebf7", "#9aa1c4"];

  let grid, size, mineCount, revealedCount, flags, firstClick, timer, seconds, running, boardEl, difficulty, gameEnded;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <div style="display:flex; gap:18px; font-size:13px; color:var(--text-muted);">
        <span>💣 <span id="msMineCount">0</span> left</span>
        <span>🚩 Right-click or long-press to flag</span>
      </div>
      <div class="ms-board" id="msBoard" role="grid" aria-label="Minesweeper board"></div>
    </div>
  `;
  boardEl = container.querySelector("#msBoard");
  const mineCountEl = container.querySelector("#msMineCount");

  function build(size, mines, avoid){
    const g = Array.from({ length: size }, () => Array.from({ length: size }, () => ({ mine: false, count: 0, open: false, flag: false })));
    let placed = 0;
    while (placed < mines) {
      const x = Math.floor(Math.random() * size), y = Math.floor(Math.random() * size);
      if (g[y][x].mine) continue;
      if (avoid && Math.abs(x - avoid.x) <= 1 && Math.abs(y - avoid.y) <= 1) continue;
      g[y][x].mine = true; placed++;
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (g[y][x].mine) continue;
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < size && nx >= 0 && nx < size && g[ny][nx].mine) c++;
        }
        g[y][x].count = c;
      }
    }
    return g;
  }

  function newGame(){
    difficulty = api.getDifficulty();
    const cfg = SIZES[difficulty] || SIZES.easy;
    size = cfg.size; mineCount = cfg.mines;
    grid = build(size, mineCount, null);
    firstClick = true;
    revealedCount = 0; flags = 0; seconds = 0; gameEnded = false;
    mineCountEl.textContent = mineCount;
    api.setScore("0:00");
    const bestKey = "cg_ms_best_" + difficulty;
    const prevBest = parseInt(Store.getRaw(bestKey, "0"), 10);
    const hsEl = document.getElementById("highScoreValue");
    if (hsEl) hsEl.textContent = prevBest ? `${Math.floor(prevBest/60)}:${(prevBest%60).toString().padStart(2,"0")}` : "–";
    api.hideOverlay();
    api.resetControls && api.resetControls();
    if (timer) clearInterval(timer);
    running = true;
    timer = setInterval(() => {
      if (!running) return;
      seconds++;
      const m = Math.floor(seconds / 60), s = seconds % 60;
      api.setScore(`${m}:${s.toString().padStart(2,"0")}`);
    }, 1000);
    render();
  }

  function render(){
    CG.applyCell(boardEl, container, size, 28, 16);
    boardEl.style.gridTemplateColumns = `repeat(${size}, var(--cell))`;
    boardEl.innerHTML = "";
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = grid[y][x];
        const el = document.createElement("div");
        el.className = "ms-cell" + (cell.open ? " open" : "") + (cell.open && cell.mine ? " mine" : "");
        if (cell.open && !cell.mine && cell.count) { el.textContent = cell.count; el.style.color = NUM_COLORS[cell.count]; }
        if (cell.open && cell.mine) el.textContent = "💣";
        if (!cell.open && cell.flag) { el.textContent = "🚩"; el.classList.add("flag"); }
        el.setAttribute("role", "gridcell");
        el.setAttribute("aria-label", `Row ${y+1} column ${x+1}${cell.open ? (cell.mine ? ", mine" : ", " + cell.count + " nearby mines") : ", hidden"}`);
        el.addEventListener("click", () => handleReveal(x, y));
        el.addEventListener("contextmenu", (e) => { e.preventDefault(); handleFlag(x, y); });
        bindLongPress(el, () => handleFlag(x, y));
        boardEl.appendChild(el);
      }
    }
  }

  function bindLongPress(el, cb){
    let t;
    el.addEventListener("touchstart", () => { t = setTimeout(cb, 480); }, { passive: true });
    el.addEventListener("touchend", () => clearTimeout(t));
    el.addEventListener("touchmove", () => clearTimeout(t));
  }

  function handleFlag(x, y){
    if (gameEnded) return;
    const cell = grid[y][x];
    if (cell.open) return;
    cell.flag = !cell.flag;
    flags += cell.flag ? 1 : -1;
    mineCountEl.textContent = mineCount - flags;
    api.sound.flag();
    render();
  }

  function handleReveal(x, y){
    if (gameEnded) return;
    const cell = grid[y][x];
    if (cell.flag || cell.open) return;

    if (firstClick) {
      grid = build(size, mineCount, { x, y });
      firstClick = false;
    }

    if (grid[y][x].mine) return explode(x, y);
    floodOpen(x, y);
    render();
    checkWin();
  }

  function floodOpen(x, y){
    const stack = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop();
      const cell = grid[cy][cx];
      if (cell.open || cell.flag) continue;
      cell.open = true;
      revealedCount++;
      if (cell.count === 0) {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size && !grid[ny][nx].open) stack.push([nx, ny]);
        }
      }
    }
    api.sound.tick();
  }

  function explode(x, y){
    gameEnded = true; running = false;
    if (timer) clearInterval(timer);
    for (let yy = 0; yy < size; yy++) for (let xx = 0; xx < size; xx++) if (grid[yy][xx].mine) grid[yy][xx].open = true;
    render();
    api.sound.lose();
    api.resetControls && api.resetControls();
    api.showOverlay("Boom!", "You hit a mine. Give it another go.", [
      { label: "Try again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
    ]);
  }

  function checkWin(){
    const total = size * size;
    if (revealedCount === total - mineCount) {
      gameEnded = true; running = false;
      if (timer) clearInterval(timer);
      api.sound.win();
      const bestKey = "cg_ms_best_" + difficulty;
      const prevBest = parseInt(Store.getRaw(bestKey, "0"), 10);
      let bestMsg = "";
      if (!prevBest || seconds < prevBest) {
        Store.setRaw(bestKey, seconds);
        bestMsg = " New best time for this field size!";
      }
      api.resetControls && api.resetControls();
      api.showOverlay("Field cleared!", `You cleared the board in ${seconds} seconds.${bestMsg}`, [
        { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
    }
  }

  window.addEventListener("resize", () => { if (boardEl && size) CG.applyCell(boardEl, container, size, 28, 16); });

  return {
    init(){ newGame(); },
    start(){ running = true; },
    pause(){ running = false; },
    restart(){ newGame(); },
    setDifficulty(v){ difficulty = v; },
    destroy(){ if (timer) clearInterval(timer); },
    handleTouch(){}
  };
};
