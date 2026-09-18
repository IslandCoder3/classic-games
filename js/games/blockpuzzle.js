window.GameModules = window.GameModules || {};

window.GameModules.blockpuzzle = function (container, api) {
  const SIZE = 8;
  const PIECES = [
    [[0,0]],
    [[0,0],[1,0]],
    [[0,0],[0,1]],
    [[0,0],[1,0],[2,0]],
    [[0,0],[0,1],[0,2]],
    [[0,0],[1,0],[0,1],[1,1]],
    [[0,0],[1,0],[2,0],[3,0]],
    [[0,0],[0,1],[0,2],[0,3]],
    [[0,0],[1,0],[2,0],[0,1]],
    [[0,0],[1,0],[2,0],[2,1]],
    [[0,1],[1,1],[2,1],[2,0]],
    [[0,0],[0,1],[0,2],[1,2]],
    [[0,0],[1,0],[1,1],[2,1]],
    [[1,0],[0,1],[1,1],[2,1]],
    [[0,0],[1,0],[0,1],[1,1],[2,0]],
  ];

  let grid, score, tray, selectedPiece, boardEl, trayEl, cellPx, gameOver;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:6px;">
      <div class="bp-board" id="bpBoard" role="grid" aria-label="Block puzzle board"></div>
      <div class="bp-tray" id="bpTray"></div>
      <p style="font-size:12.5px; color:var(--text-faint); max-width:36ch; text-align:center;">Tap a piece below to select it, then tap a spot on the board to place it.</p>
    </div>
  `;
  boardEl = container.querySelector("#bpBoard");
  trayEl = container.querySelector("#bpTray");

  function newGame(){
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
    score = 0; selectedPiece = null; gameOver = false;
    api.setScore(score);
    api.hideOverlay();
    api.resetControls && api.resetControls();
    fillTray();
    renderBoard();
    renderTray();
  }

  function randomPiece(){
    const shape = PIECES[Math.floor(Math.random() * PIECES.length)];
    return { id: Math.random().toString(36).slice(2), shape };
  }
  function fillTray(){ tray = [randomPiece(), randomPiece(), randomPiece()]; }

  function renderBoard(){
    CG.applyCell(boardEl, container, SIZE, 34, 22);
    boardEl.innerHTML = "";
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const cell = document.createElement("div");
        cell.className = "bp-cell" + (grid[y][x] ? " filled" : "");
        cell.dataset.x = x; cell.dataset.y = y;
        cell.addEventListener("click", () => attemptPlace(x, y));
        cell.addEventListener("mouseenter", () => previewAt(x, y));
        cell.addEventListener("mouseleave", clearPreview);
        boardEl.appendChild(cell);
      }
    }
  }

  function renderTray(){
    trayEl.innerHTML = "";
    tray.forEach((piece) => {
      if (!piece) return;
      const maxX = Math.max(...piece.shape.map(c => c[0])) + 1;
      const maxY = Math.max(...piece.shape.map(c => c[1])) + 1;
      const wrap = document.createElement("div");
      wrap.className = "bp-piece" + (selectedPiece === piece.id ? " selected" : "");
      wrap.style.gridTemplateColumns = `repeat(${maxX}, 16px)`;
      wrap.setAttribute("tabindex", "0");
      wrap.setAttribute("role", "button");
      wrap.setAttribute("aria-label", "Puzzle piece, tap to select");
      for (let y = 0; y < maxY; y++) {
        for (let x = 0; x < maxX; x++) {
          const on = piece.shape.some(c => c[0] === x && c[1] === y);
          const cell = document.createElement("div");
          cell.className = "pc" + (on ? " on" : "");
          wrap.appendChild(cell);
        }
      }
      wrap.addEventListener("click", () => { selectedPiece = selectedPiece === piece.id ? null : piece.id; renderTray(); });
      trayEl.appendChild(wrap);
    });
  }

  function canPlace(piece, ox, oy){
    return piece.shape.every(([dx, dy]) => {
      const x = ox + dx, y = oy + dy;
      return x >= 0 && x < SIZE && y >= 0 && y < SIZE && !grid[y][x];
    });
  }

  function previewAt(x, y){
    clearPreview();
    const piece = tray.find(p => p && p.id === selectedPiece);
    if (!piece) return;
    const ok = canPlace(piece, x, y);
    piece.shape.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
        const idx = ny * SIZE + nx;
        const cellEl = boardEl.children[idx];
        if (cellEl) cellEl.style.background = ok ? "rgba(74,222,128,0.55)" : "rgba(251,93,93,0.5)";
      }
    });
  }
  function clearPreview(){ renderBoard(); }

  function attemptPlace(x, y){
    if (gameOver) return;
    const pieceIndex = tray.findIndex(p => p && p.id === selectedPiece);
    if (pieceIndex === -1) return;
    const piece = tray[pieceIndex];
    if (!canPlace(piece, x, y)) { return; }
    piece.shape.forEach(([dx, dy]) => { grid[y + dy][x + dx] = true; });
    api.sound.place();
    tray[pieceIndex] = null;
    selectedPiece = null;
    if (tray.every(p => !p)) fillTray();
    const cleared = clearFullLines();
    score += piece.shape.length + cleared * 18;
    api.setScore(score);
    renderBoard();
    renderTray();
    checkGameOver();
  }

  function clearFullLines(){
    const fullRows = [];
    const fullCols = [];
    for (let y = 0; y < SIZE; y++) if (grid[y].every(v => v)) fullRows.push(y);
    for (let x = 0; x < SIZE; x++) if (grid.every(row => row[x])) fullCols.push(x);
    fullRows.forEach(y => grid[y].fill(false));
    fullCols.forEach(x => { for (let y = 0; y < SIZE; y++) grid[y][x] = false; });
    if (fullRows.length || fullCols.length) api.sound.clear();
    return fullRows.length + fullCols.length;
  }

  function checkGameOver(){
    const anyFits = tray.some(piece => {
      if (!piece) return false;
      for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (canPlace(piece, x, y)) return true;
      return false;
    });
    if (!anyFits) {
      gameOver = true;
      api.sound.lose();
      const isNew = api.reportHighScore(score);
      api.resetControls && api.resetControls();
      api.showOverlay("No more moves", `Final score: ${score}.${isNew ? " New high score!" : ""}`, [
        { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
    }
  }

  function keyHandler(e){ if (e.key === "r" || e.key === "R") newGame(); }

  window.addEventListener("resize", () => { CG.applyCell(boardEl, container, SIZE, 34, 22); });

  return {
    difficultyOptions: false,
    init(){ document.addEventListener("keydown", keyHandler); newGame(); },
    start(){},
    pause(){},
    restart(){ newGame(); },
    destroy(){ document.removeEventListener("keydown", keyHandler); },
    handleTouch(){}
  };
};
