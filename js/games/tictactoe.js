window.GameModules = window.GameModules || {};

window.GameModules.tictactoe = function (container, api) {
  const LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  let board, current, wins, gameOver, mode;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:14px;">
      <div style="font-size:14px; color:var(--text-muted);" id="tttTurn">Turn: X</div>
      <div class="grid-board ttt-board" id="tttBoard" role="grid" aria-label="Tic Tac Toe board"></div>
    </div>
  `;
  const boardEl = container.querySelector("#tttBoard");
  const turnEl = container.querySelector("#tttTurn");

  function newGame(){
    board = Array(9).fill(null);
    current = "X";
    wins = { X: parseInt(Store.getRaw("cg_ttt_x", "0"), 10), O: parseInt(Store.getRaw("cg_ttt_o", "0"), 10) };
    gameOver = false;
    api.hideOverlay();
    api.resetControls && api.resetControls();
    render();
    updateScore();
    maybeCpuMove();
  }

  function updateScore(){
    api.setScore(wins.X + wins.O ? `${wins.X}–${wins.O}` : "0–0");
  }

  function checkWinner(){
    for (const line of LINES) {
      const [a,b,c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return { player: board[a], line };
    }
    if (board.every(c => c)) return { player: "draw", line: [] };
    return null;
  }

  function render(){
    boardEl.innerHTML = "";
    board.forEach((val, i) => {
      const cell = document.createElement("div");
      cell.className = "cell" + (val ? " " + val.toLowerCase() : "");
      cell.textContent = val || "";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-label", `Cell ${i + 1}${val ? ", " + val : ", empty"}`);
      cell.addEventListener("click", () => handleMove(i));
      boardEl.appendChild(cell);
    });
    turnEl.textContent = gameOver ? "" : `Turn: ${current}`;
  }

  function handleMove(i){
    if (gameOver || board[i]) return;
    if (mode !== "friend" && current === "O") return; // CPU's turn, ignore clicks
    board[i] = current;
    api.sound.move();
    const result = checkWinner();
    if (result) return endRound(result);
    current = current === "X" ? "O" : "X";
    render();
    maybeCpuMove();
  }

  function endRound(result){
    gameOver = true;
    if (result.player === "draw") {
      render();
      highlightWin([]);
      api.showOverlay("It's a draw", "Nobody got three in a row this time.", [
        { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
    } else {
      wins[result.player] = (wins[result.player] || 0) + 1;
      Store.setRaw("cg_ttt_x", wins.X);
      Store.setRaw("cg_ttt_o", wins.O);
      updateScore();
      api.reportHighScore(Math.max(wins.X, wins.O));
      render();
      highlightWin(result.line);
      api.sound.win();
      const label = mode !== "friend" ? (result.player === "X" ? "You win!" : "CPU wins") : `${result.player} wins!`;
      api.showOverlay(label, "Three in a row.", [
        { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
      ]);
    }
  }

  function highlightWin(line){
    line.forEach(i => boardEl.children[i].classList.add("win"));
  }

  function maybeCpuMove(){
    if (gameOver || mode === "friend" || current !== "O") return;
    setTimeout(() => {
      if (gameOver) return;
      const move = mode === "hard" ? bestMove() : randomMove();
      if (move != null) {
        board[move] = "O";
        api.sound.move();
        const result = checkWinner();
        if (result) return endRound(result);
        current = "X";
        render();
      }
    }, 380);
  }

  function randomMove(){
    const empties = board.map((v, i) => v ? null : i).filter(v => v !== null);
    return empties[Math.floor(Math.random() * empties.length)];
  }

  function bestMove(){
    // Minimax — unbeatable CPU
    function minimax(b, player){
      const res = checkWinnerFor(b);
      if (res === "O") return { score: 10 };
      if (res === "X") return { score: -10 };
      if (b.every(c => c)) return { score: 0 };
      const moves = [];
      b.forEach((v, i) => {
        if (!v) {
          const copy = b.slice();
          copy[i] = player;
          const result = minimax(copy, player === "O" ? "X" : "O");
          moves.push({ index: i, score: result.score });
        }
      });
      if (player === "O") {
        return moves.reduce((best, m) => (m.score > best.score ? m : best));
      } else {
        return moves.reduce((best, m) => (m.score < best.score ? m : best));
      }
    }
    function checkWinnerFor(b){
      for (const [a,b1,c] of LINES) if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
      return null;
    }
    return minimax(board, "O").index;
  }

  return {
    difficultyOptions: true,
    init(){ mode = api.getDifficulty(); newGame(); },
    start(){},
    pause(){},
    restart(){ mode = api.getDifficulty(); newGame(); },
    setDifficulty(v){ mode = v; },
    destroy(){},
    handleTouch(){}
  };
};
