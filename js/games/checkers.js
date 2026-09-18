window.GameModules = window.GameModules || {};

window.GameModules.checkers = function (container, api) {
  let board, turn, selected, legalTargets, captured, gameOver, boardEl, statusEl, mustContinueWith;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <div style="font-size:14px; color:var(--text-muted);" id="ckStatus">Gold to move</div>
      <div class="checkers-board" id="ckBoard" role="grid" aria-label="Checkers board"></div>
    </div>
  `;
  boardEl = container.querySelector("#ckBoard");
  statusEl = container.querySelector("#ckStatus");
  function resizeHandler(){ CG.applyCell(boardEl, container, 8, 46, 30); }

  function initialBoard(){
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let y = 0; y < 3; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 1) b[y][x] = { color: "p2", king: false };
    for (let y = 5; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 1) b[y][x] = { color: "p1", king: false };
    return b;
  }

  function newGame(){
    board = initialBoard();
    turn = "p1";
    selected = null; legalTargets = []; mustContinueWith = null;
    captured = { p1: 0, p2: 0 };
    gameOver = false;
    api.setScore("0–0");
    api.hideOverlay();
    api.resetControls && api.resetControls();
    render();
    updateStatus();
  }

  function inBounds(x, y){ return x >= 0 && x < 8 && y >= 0 && y < 8; }

  function pieceDirs(piece){
    if (piece.king) return [[1,1],[1,-1],[-1,1],[-1,-1]];
    return piece.color === "p1" ? [[1,-1],[-1,-1]] : [[1,1],[-1,1]];
  }

  function capturesFor(x, y){
    const piece = board[y][x];
    if (!piece) return [];
    const dirs = piece.king ? [[1,1],[1,-1],[-1,1],[-1,-1]] : [[1,-1],[-1,-1],[1,1],[-1,1]];
    const moves = [];
    dirs.forEach(([dx, dy]) => {
      const mx = x + dx, my = y + dy, jx = x + dx * 2, jy = y + dy * 2;
      if (inBounds(jx, jy) && board[my] && board[my][mx] && board[my][mx].color !== piece.color && !board[jy][jx]) {
        moves.push({ x: jx, y: jy, capture: { x: mx, y: my } });
      }
    });
    return moves;
  }

  function simpleMovesFor(x, y){
    const piece = board[y][x];
    if (!piece) return [];
    const moves = [];
    pieceDirs(piece).forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (inBounds(nx, ny) && !board[ny][nx]) moves.push({ x: nx, y: ny });
    });
    return moves;
  }

  function allCaptureOrigins(color){
    const origins = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if (board[y][x] && board[y][x].color === color && capturesFor(x, y).length) origins.push({ x, y });
    }
    return origins;
  }

  function legalMovesFor(x, y){
    const piece = board[y][x];
    if (!piece || piece.color !== turn) return [];
    const forced = allCaptureOrigins(turn);
    if (mustContinueWith) {
      if (mustContinueWith.x !== x || mustContinueWith.y !== y) return [];
      return capturesFor(x, y);
    }
    if (forced.length) {
      if (!forced.some(o => o.x === x && o.y === y)) return [];
      return capturesFor(x, y);
    }
    return simpleMovesFor(x, y);
  }

  function anyLegalMoves(color){
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      if (board[y][x] && board[y][x].color === color) {
        if (legalMovesFor(x, y).length) return true;
      }
    }
    return false;
  }

  function updateStatus(){
    if (!anyLegalMoves(turn)) {
      gameOver = true;
      const winner = turn === "p1" ? "Cyan" : "Gold";
      api.sound.win();
      api.resetControls && api.resetControls();
      api.showOverlay("Game over", `${winner} wins — no legal moves remain for the opponent.`, [
        { label: "New game", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
      statusEl.textContent = "Game over";
      return;
    }
    const label = turn === "p1" ? "Gold" : "Cyan";
    statusEl.textContent = mustContinueWith ? `${label} must continue jumping` : `${label} to move`;
  }

  function render(){
    CG.applyCell(boardEl, container, 8, 46, 30);
    boardEl.innerHTML = "";
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = document.createElement("div");
        const dark = (x + y) % 2 === 1;
        cell.className = "checkers-cell " + (dark ? "dark" : "light");
        const piece = board[y][x];
        if (piece) {
          const p = document.createElement("div");
          p.className = "checker-piece " + piece.color + (piece.king ? " king" : "");
          cell.appendChild(p);
        }
        if (selected && selected.x === x && selected.y === y) cell.classList.add("selected");
        if (legalTargets.find(m => m.x === x && m.y === y)) cell.classList.add("move-hint");
        cell.addEventListener("click", () => handleClick(x, y));
        cell.setAttribute("role", "gridcell");
        boardEl.appendChild(cell);
      }
    }
  }

  function handleClick(x, y){
    if (gameOver) return;
    const target = legalTargets.find(m => m.x === x && m.y === y);
    if (selected && target) {
      const piece = board[selected.y][selected.x];
      board[y][x] = piece;
      board[selected.y][selected.x] = null;
      let didCapture = false;
      if (target.capture) {
        board[target.capture.y][target.capture.x] = null;
        captured[turn]++;
        didCapture = true;
        api.sound.capture();
      } else {
        api.sound.move();
      }
      if ((piece.color === "p1" && y === 0) || (piece.color === "p2" && y === 7)) piece.king = true;

      api.setScore(`${captured.p1}–${captured.p2}`);

      if (didCapture) {
        const more = capturesFor(x, y);
        if (more.length) {
          mustContinueWith = { x, y };
          selected = { x, y };
          legalTargets = more;
          render();
          return;
        }
      }
      mustContinueWith = null;
      selected = null; legalTargets = [];
      turn = turn === "p1" ? "p2" : "p1";
      render();
      updateStatus();
      return;
    }
    const piece = board[y][x];
    if (piece && piece.color === turn) {
      const moves = legalMovesFor(x, y);
      if (moves.length) { selected = { x, y }; legalTargets = moves; }
      else { selected = null; legalTargets = []; }
    } else {
      selected = null; legalTargets = [];
    }
    render();
  }

  return {
    difficultyOptions: false,
    init(){ newGame(); window.addEventListener("resize", resizeHandler); },
    start(){},
    pause(){},
    restart(){ newGame(); },
    destroy(){ window.removeEventListener("resize", resizeHandler); },
    handleTouch(){}
  };
};
