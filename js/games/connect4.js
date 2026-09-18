window.GameModules = window.GameModules || {};

window.GameModules.connect4 = function (container, api) {
  const COLS = 7, ROWS = 6;
  let grid, current, gameOver, wins, boardEl, turnEl, mode, thinking, cpuTimeoutId;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
      <div style="font-size:14px; color:var(--text-muted);" id="c4Turn">Turn: Player 1</div>
      <div class="c4-board" id="c4Board" role="grid" aria-label="Connect Four board"></div>
    </div>
  `;
  boardEl = container.querySelector("#c4Board");
  turnEl = container.querySelector("#c4Turn");

  function newGame(){
    grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    current = 1;
    gameOver = false;
    thinking = false;
    if (cpuTimeoutId) clearTimeout(cpuTimeoutId);
    wins = { 1: parseInt(Store.getRaw("cg_c4_p1", "0"), 10), 2: parseInt(Store.getRaw("cg_c4_p2", "0"), 10) };
    api.hideOverlay();
    api.resetControls && api.resetControls();
    updateScore();
    render();
  }

  function updateScore(){ api.setScore(`${wins[1]}–${wins[2]}`); }

  function opponentLabel(){ return mode === "friend" ? "Player 2" : "CPU"; }

  function render(){
    CG.applyCell(boardEl, container, COLS, 46, 28);
    boardEl.innerHTML = "";
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const val = grid[y][x];
        const cell = document.createElement("div");
        cell.className = "c4-cell" + (val ? " p" + val : "");
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `Column ${x+1} row ${y+1}${val ? ", player " + val : ", empty"}`);
        cell.addEventListener("click", () => drop(x));
        boardEl.appendChild(cell);
      }
    }
    turnEl.textContent = gameOver ? "" : (thinking ? `${opponentLabel()} is thinking…` : `Turn: ${current === 1 ? "Player 1" : opponentLabel()}`);
  }

  function lowestOpenRow(g, col){
    for (let y = ROWS - 1; y >= 0; y--) if (!g[y][col]) return y;
    return -1;
  }

  function drop(col){
    if (gameOver || thinking) return;
    if (mode !== "friend" && current === 2) return; // CPU's turn — ignore taps
    const row = lowestOpenRow(grid, col);
    if (row === -1) return;
    grid[row][col] = current;
    api.sound.place();
    render();
    const win = checkWin(grid, row, col);
    if (win) return endRound(win);
    if (grid.every(r => r.every(c => c))) return endRound({ draw: true });
    current = current === 1 ? 2 : 1;
    render();
    scheduleCpuMove();
  }

  function checkWin(g, row, col){
    const player = g[row][col];
    const dirs = [[1,0],[0,1],[1,1],[1,-1]];
    for (const [dx, dy] of dirs) {
      const cells = [[row, col]];
      for (const sign of [1, -1]) {
        let r = row + dy * sign, c = col + dx * sign;
        while (r >= 0 && r < ROWS && c >= 0 && c < COLS && g[r][c] === player) {
          cells.push([r, c]);
          r += dy * sign; c += dx * sign;
        }
      }
      if (cells.length >= 4) return { player, cells };
    }
    return null;
  }

  function endRound(result){
    gameOver = true;
    if (result.draw) {
      render();
      api.showOverlay("It's a draw", "The board filled up with no winner.", [
        { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
      return;
    }
    wins[result.player]++;
    Store.setRaw("cg_c4_p1", wins[1]);
    Store.setRaw("cg_c4_p2", wins[2]);
    updateScore();
    api.reportHighScore(Math.max(wins[1], wins[2]));
    render();
    result.cells.forEach(([r, c]) => {
      const idx = r * COLS + c;
      boardEl.children[idx].style.boxShadow = "0 0 0 3px var(--green)";
    });
    const humanWon = mode === "friend" || result.player === 1;
    api.sound[humanWon ? "win" : "lose"]();
    const label = mode !== "friend" ? (result.player === 1 ? "You win!" : "CPU wins") : `Player ${result.player} wins!`;
    api.showOverlay(label, "Four in a row.", [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
    ]);
  }

  // ---------------- CPU opponent ----------------
  const COL_ORDER = [3, 2, 4, 1, 5, 0, 6]; // center-first: stronger pruning + better tie-breaks
  function validCols(g){
    return COL_ORDER.filter(x => !g[0][x]);
  }

  function simulateDrop(g, col, player){
    const ng = g.map(row => row.slice());
    const row = lowestOpenRow(ng, col);
    if (row === -1) return null;
    ng[row][col] = player;
    return { grid: ng, row };
  }

  function evaluateWindow(cells, piece){
    const opp = piece === 1 ? 2 : 1;
    const countPiece = cells.filter(v => v === piece).length;
    const countEmpty = cells.filter(v => v === null).length;
    const countOpp = cells.filter(v => v === opp).length;
    if (countPiece === 4) return 1000;
    if (countPiece === 3 && countEmpty === 1) return 12;
    if (countPiece === 2 && countEmpty === 2) return 3;
    if (countOpp === 3 && countEmpty === 1) return -14;
    if (countOpp === 2 && countEmpty === 2) return -2;
    return 0;
  }

  function scorePosition(g, piece){
    let score = 0;
    for (let y = 0; y < ROWS; y++) if (g[y][3] === piece) score += 4;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS - 3; x++) score += evaluateWindow([g[y][x], g[y][x+1], g[y][x+2], g[y][x+3]], piece);
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS - 3; y++) score += evaluateWindow([g[y][x], g[y+1][x], g[y+2][x], g[y+3][x]], piece);
    for (let y = 0; y < ROWS - 3; y++) for (let x = 0; x < COLS - 3; x++) score += evaluateWindow([g[y][x], g[y+1][x+1], g[y+2][x+2], g[y+3][x+3]], piece);
    for (let y = 3; y < ROWS; y++) for (let x = 0; x < COLS - 3; x++) score += evaluateWindow([g[y][x], g[y-1][x+1], g[y-2][x+2], g[y-3][x+3]], piece);
    return score;
  }

  function minimax(g, depth, alpha, beta, maximizing){
    const cols = validCols(g);
    if (cols.length === 0) return { score: 0 };
    // terminal check via last-move-agnostic full scan is expensive; rely on depth cutoff + heuristic instead
    if (depth === 0) return { score: scorePosition(g, 2) - scorePosition(g, 1) };

    if (maximizing) {
      let best = -Infinity, bestCol = cols[0];
      for (const col of cols) {
        const sim = simulateDrop(g, col, 2);
        const win = checkWin(sim.grid, sim.row, col);
        const val = win ? 100000 + depth : minimax(sim.grid, depth - 1, alpha, beta, false).score;
        if (val > best) { best = val; bestCol = col; }
        alpha = Math.max(alpha, best);
        if (alpha >= beta) break;
      }
      return { score: best, col: bestCol };
    } else {
      let best = Infinity, bestCol = cols[0];
      for (const col of cols) {
        const sim = simulateDrop(g, col, 1);
        const win = checkWin(sim.grid, sim.row, col);
        const val = win ? -100000 - depth : minimax(sim.grid, depth - 1, alpha, beta, true).score;
        if (val < best) { best = val; bestCol = col; }
        beta = Math.min(beta, best);
        if (alpha >= beta) break;
      }
      return { score: best, col: bestCol };
    }
  }

  function scheduleCpuMove(){
    if (gameOver || mode === "friend" || current !== 2) return;
    thinking = true;
    render();
    cpuTimeoutId = setTimeout(cpuMove, 450);
  }

  function cpuMove(){
    if (gameOver) { thinking = false; return; }
    const cols = validCols(grid);
    if (!cols.length) { thinking = false; return; }
    let col;
    if (mode === "easy") {
      // win if possible, else block, else weighted-random toward center
      const winCol = cols.find(c => { const s = simulateDrop(grid, c, 2); return s && checkWin(s.grid, s.row, c); });
      const blockCol = cols.find(c => { const s = simulateDrop(grid, c, 1); return s && checkWin(s.grid, s.row, c); });
      if (winCol !== undefined) col = winCol;
      else if (blockCol !== undefined && Math.random() < 0.75) col = blockCol;
      else {
        const weights = cols.map(c => 4 - Math.abs(3 - c));
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        col = cols[0];
        for (let i = 0; i < cols.length; i++) { r -= weights[i]; if (r <= 0) { col = cols[i]; break; } }
      }
    } else {
      col = minimax(grid, 5, -Infinity, Infinity, true).col;
    }
    thinking = false;
    const row = lowestOpenRow(grid, col);
    grid[row][col] = 2;
    api.sound.place();
    render();
    const win = checkWin(grid, row, col);
    if (win) return endRound(win);
    if (grid.every(r => r.every(c => c))) return endRound({ draw: true });
    current = 1;
    render();
  }

  function keyHandler(e){
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 7) drop(n - 1);
    if (e.key === "r" || e.key === "R") newGame();
  }

  window.addEventListener("resize", () => { CG.applyCell(boardEl, container, COLS, 46, 28); });

  return {
    init(){ mode = api.getDifficulty(); document.addEventListener("keydown", keyHandler); newGame(); },
    start(){},
    pause(){},
    restart(){ mode = api.getDifficulty(); newGame(); },
    setDifficulty(v){ mode = v; },
    destroy(){ document.removeEventListener("keydown", keyHandler); if (cpuTimeoutId) clearTimeout(cpuTimeoutId); },
    handleTouch(){}
  };
};
