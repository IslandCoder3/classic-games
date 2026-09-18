window.GameModules = window.GameModules || {};

window.GameModules.chess = function (container, api) {
  const GLYPHS = {
    w: { K: "♔", Q: "♕", R: "♖", B: "♗", N: "♘", P: "♙" },
    b: { K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟" }
  };
  const PIECE_VALUES = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };

  let board, turn, selected, legalMoves, captured, gameOver, boardEl, lastMove, statusEl, mode, thinking, cpuTimeoutId;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
      <div style="font-size:14px; color:var(--text-muted);" id="chessStatus">White to move</div>
      <div class="chess-board" id="chessBoard" role="grid" aria-label="Chess board"></div>
      <div style="display:flex; gap:18px; font-size:20px;" id="chessCaptured"></div>
    </div>
  `;
  boardEl = container.querySelector("#chessBoard");
  statusEl = container.querySelector("#chessStatus");
  const capturedEl = container.querySelector("#chessCaptured");
  function resizeHandler(){ CG.applyCell(boardEl, container, 8, 46, 30); }

  function initialBoard(){
    const back = ["R","N","B","Q","K","B","N","R"];
    const b = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (let x = 0; x < 8; x++) {
      b[0][x] = { type: back[x], color: "b" };
      b[1][x] = { type: "P", color: "b" };
      b[6][x] = { type: "P", color: "w" };
      b[7][x] = { type: back[x], color: "w" };
    }
    return b;
  }

  function newGame(){
    board = initialBoard();
    turn = "w";
    selected = null;
    legalMoves = [];
    captured = { w: [], b: [] };
    gameOver = false;
    lastMove = null;
    thinking = false;
    if (cpuTimeoutId) clearTimeout(cpuTimeoutId);
    api.setScore("0");
    api.hideOverlay();
    api.resetControls && api.resetControls();
    render();
    updateStatus();
  }

  function inBounds(x, y){ return x >= 0 && x < 8 && y >= 0 && y < 8; }

  function pseudoMoves(b, x, y){
    const piece = b[y][x];
    if (!piece) return [];
    const moves = [];
    const dir = piece.color === "w" ? -1 : 1;
    const addSlide = (dxs) => {
      dxs.forEach(([dx, dy]) => {
        let nx = x + dx, ny = y + dy;
        while (inBounds(nx, ny)) {
          if (!b[ny][nx]) { moves.push({ x: nx, y: ny }); }
          else { if (b[ny][nx].color !== piece.color) moves.push({ x: nx, y: ny, capture: true }); break; }
          nx += dx; ny += dy;
        }
      });
    };
    if (piece.type === "P") {
      if (inBounds(x, y + dir) && !b[y + dir][x]) {
        moves.push({ x, y: y + dir });
        const startRank = piece.color === "w" ? 6 : 1;
        if (y === startRank && !b[y + dir * 2][x]) moves.push({ x, y: y + dir * 2, doubleStep: true });
      }
      [-1, 1].forEach(dx => {
        const nx = x + dx, ny = y + dir;
        if (inBounds(nx, ny) && b[ny][nx] && b[ny][nx].color !== piece.color) moves.push({ x: nx, y: ny, capture: true });
      });
    } else if (piece.type === "N") {
      [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (inBounds(nx, ny) && (!b[ny][nx] || b[ny][nx].color !== piece.color)) moves.push({ x: nx, y: ny, capture: !!b[ny][nx] });
      });
    } else if (piece.type === "B") {
      addSlide([[1,1],[1,-1],[-1,1],[-1,-1]]);
    } else if (piece.type === "R") {
      addSlide([[1,0],[-1,0],[0,1],[0,-1]]);
    } else if (piece.type === "Q") {
      addSlide([[1,1],[1,-1],[-1,1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]]);
    } else if (piece.type === "K") {
      [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (inBounds(nx, ny) && (!b[ny][nx] || b[ny][nx].color !== piece.color)) moves.push({ x: nx, y: ny, capture: !!b[ny][nx] });
      });
    }
    return moves;
  }

  function isSquareAttacked(b, x, y, byColor){
    for (let yy = 0; yy < 8; yy++) {
      for (let xx = 0; xx < 8; xx++) {
        const p = b[yy][xx];
        if (p && p.color === byColor) {
          const moves = pseudoMoves(b, xx, yy);
          if (moves.some(m => m.x === x && m.y === y)) return true;
        }
      }
    }
    return false;
  }

  function findKing(b, color){
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if (b[y][x] && b[y][x].type === "K" && b[y][x].color === color) return { x, y };
    return null;
  }

  function cloneBoard(b){ return b.map(row => row.map(c => c ? { ...c } : null)); }

  function applyMove(b, from, to){
    const nb = cloneBoard(b);
    const piece = nb[from.y][from.x];
    nb[to.y][to.x] = piece;
    nb[from.y][from.x] = null;
    // auto-queen promotion
    if (piece.type === "P" && (to.y === 0 || to.y === 7)) piece.type = "Q";
    return nb;
  }

  // ---- board-parametrized legality (used by both the UI and the AI search) ----
  function legalMovesForOnBoard(b, x, y){
    const piece = b[y][x];
    if (!piece) return [];
    const pseudo = pseudoMoves(b, x, y);
    return pseudo.filter(m => {
      const nb = applyMove(b, { x, y }, { x: m.x, y: m.y });
      const kingPos = findKing(nb, piece.color);
      return !isSquareAttacked(nb, kingPos.x, kingPos.y, piece.color === "w" ? "b" : "w");
    });
  }

  function allLegalMovesOnBoard(b, color){
    const all = [];
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const p = b[y][x];
      if (p && p.color === color) legalMovesForOnBoard(b, x, y).forEach(m => all.push({ from: { x, y }, to: m }));
    }
    return all;
  }

  function legalMovesFor(x, y){ return legalMovesForOnBoard(board, x, y); }
  function allLegalMoves(color){ return allLegalMovesOnBoard(board, color); }

  // ---------------- CPU opponent ----------------
  function evaluateBoard(b){
    let score = 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const p = b[y][x];
        if (!p) continue;
        let v = PIECE_VALUES[p.type];
        const centrality = (3.5 - Math.abs(3.5 - x)) + (3.5 - Math.abs(3.5 - y));
        v += centrality * 2;
        score += p.color === "w" ? v : -v;
      }
    }
    return score;
  }

  function minimax(b, depth, alpha, beta, color){
    const moves = allLegalMovesOnBoard(b, color);
    if (moves.length === 0) {
      const kingPos = findKing(b, color);
      const inCheck = kingPos && isSquareAttacked(b, kingPos.x, kingPos.y, color === "w" ? "b" : "w");
      if (inCheck) return color === "w" ? -100000 - depth : 100000 + depth;
      return 0;
    }
    if (depth === 0) return evaluateBoard(b);
    if (color === "w") {
      let best = -Infinity;
      for (const mv of moves) {
        const nb = applyMove(b, mv.from, mv.to);
        best = Math.max(best, minimax(nb, depth - 1, alpha, beta, "b"));
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const mv of moves) {
        const nb = applyMove(b, mv.from, mv.to);
        best = Math.min(best, minimax(nb, depth - 1, alpha, beta, "w"));
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  function scheduleCpuMove(){
    if (mode === "friend" || turn !== "b" || gameOver) return;
    thinking = true;
    statusEl.textContent = "Black is thinking…";
    cpuTimeoutId = setTimeout(cpuMove, 420);
  }

  function cpuMove(){
    if (gameOver) { thinking = false; return; }
    const moves = allLegalMovesOnBoard(board, "b");
    if (!moves.length) { thinking = false; return; }
    let pick;
    if (mode === "easy") {
      const captures = moves.filter(m => m.to.capture);
      pick = (captures.length && Math.random() < 0.65)
        ? captures[Math.floor(Math.random() * captures.length)]
        : moves[Math.floor(Math.random() * moves.length)];
    } else {
      const depth = 2;
      let bestVal = Infinity, bestMoves = [];
      moves.forEach(mv => {
        const nb = applyMove(board, mv.from, mv.to);
        const val = minimax(nb, depth, -Infinity, Infinity, "w");
        if (val < bestVal - 0.01) { bestVal = val; bestMoves = [mv]; }
        else if (Math.abs(val - bestVal) < 0.01) bestMoves.push(mv);
      });
      pick = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }
    thinking = false;
    performMove(pick.from, pick.to);
  }

  function updateStatus(){
    const kingPos = findKing(board, turn);
    const inCheck = kingPos && isSquareAttacked(board, kingPos.x, kingPos.y, turn === "w" ? "b" : "w");
    const moves = allLegalMoves(turn);
    if (moves.length === 0) {
      gameOver = true;
      if (inCheck) {
        const winnerColor = turn === "w" ? "b" : "w";
        const winner = winnerColor === "w" ? "White" : "Black";
        const humanWon = mode === "friend" || winnerColor === "w";
        api.sound[humanWon ? "win" : "lose"]();
        api.resetControls && api.resetControls();
        api.showOverlay("Checkmate", `${winner} wins the game.`, [
          { label: "New game", primary: true, action: () => { api.hideOverlay(); newGame(); } }
        ]);
      } else {
        api.resetControls && api.resetControls();
        api.showOverlay("Stalemate", "No legal moves remain — the game is a draw.", [
          { label: "New game", primary: true, action: () => { api.hideOverlay(); newGame(); } }
        ]);
      }
      statusEl.textContent = "Game over";
      return;
    }
    statusEl.textContent = `${turn === "w" ? "White" : "Black"} to move${inCheck ? " — Check!" : ""}`;
    scheduleCpuMove();
  }

  function render(){
    CG.applyCell(boardEl, container, 8, 46, 30);
    boardEl.innerHTML = "";
    const kingPos = findKing(board, turn);
    const inCheck = kingPos && !gameOver && isSquareAttacked(board, kingPos.x, kingPos.y, turn === "w" ? "b" : "w");
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const cell = document.createElement("div");
        const light = (x + y) % 2 === 0;
        cell.className = "chess-cell " + (light ? "light" : "dark");
        const piece = board[y][x];
        if (piece) { cell.textContent = GLYPHS[piece.color][piece.type]; cell.classList.add(piece.color === "w" ? "piece-w" : "piece-b"); }
        if (selected && selected.x === x && selected.y === y) cell.classList.add("selected");
        if (lastMove && ((lastMove.from.x === x && lastMove.from.y === y) || (lastMove.to.x === x && lastMove.to.y === y))) cell.classList.add("last-move");
        if (inCheck && kingPos.x === x && kingPos.y === y) cell.classList.add("in-check");
        const hint = legalMoves.find(m => m.x === x && m.y === y);
        if (hint) cell.classList.add(hint.capture ? "capture-hint" : "move-hint");
        cell.addEventListener("click", () => handleClick(x, y));
        cell.setAttribute("role", "gridcell");
        cell.setAttribute("aria-label", `${String.fromCharCode(97+x)}${8-y}${piece ? ", " + piece.color + " " + piece.type : ""}`);
        boardEl.appendChild(cell);
      }
    }
    capturedEl.innerHTML = `
      <div>${captured.w.map(p => GLYPHS.w[p]).join(" ")}</div>
      <div>${captured.b.map(p => GLYPHS.b[p]).join(" ")}</div>
    `;
  }

  function performMove(from, to){
    const capturedPiece = board[to.y][to.x];
    board = applyMove(board, from, to);
    if (capturedPiece) { captured[capturedPiece.color].push(capturedPiece.type); api.sound.capture(); }
    else api.sound.move();
    api.setScore(captured.w.length + captured.b.length);
    lastMove = { from, to };
    selected = null; legalMoves = [];
    turn = turn === "w" ? "b" : "w";
    render();
    updateStatus();
  }

  function handleClick(x, y){
    if (gameOver || thinking) return;
    if (mode !== "friend" && turn === "b") return; // CPU's turn — ignore taps
    const piece = board[y][x];
    const hint = legalMoves.find(m => m.x === x && m.y === y);
    if (selected && hint) {
      performMove(selected, { x, y });
      return;
    }
    if (piece && piece.color === turn) {
      selected = { x, y };
      legalMoves = legalMovesFor(x, y);
    } else {
      selected = null; legalMoves = [];
    }
    render();
  }

  return {
    init(){ mode = api.getDifficulty(); newGame(); window.addEventListener("resize", resizeHandler); },
    start(){},
    pause(){},
    restart(){ mode = api.getDifficulty(); newGame(); },
    setDifficulty(v){ mode = v; },
    destroy(){ if (cpuTimeoutId) clearTimeout(cpuTimeoutId); window.removeEventListener("resize", resizeHandler); },
    handleTouch(){}
  };
};
