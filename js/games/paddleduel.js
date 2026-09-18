window.GameModules = window.GameModules || {};

window.GameModules.paddleduel = function (container, api) {
  let canvas, ctx, cw, ch;
  let p1, p2, ball, score1, score2, mode, running, gameOverFlag, rafId;
  let p1Up, p1Down, p2Up, p2Down;
  const WIN_SCORE = 7;
  const PADDLE_H_RATIO = 0.22;

  container.innerHTML = `
    <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
      <canvas id="pdCanvas" aria-label="Paddle Duel board"></canvas>
      <p style="font-size:12px; color:var(--text-faint);">First to ${WIN_SCORE} wins the match</p>
    </div>
  `;
  canvas = container.querySelector("#pdCanvas");
  ctx = canvas.getContext("2d");

  function sizeCanvas(){
    const wrap = container.parentElement;
    const w = Math.max(200, Math.min((wrap.clientWidth || 320) - 32, 540));
    canvas.width = w; cw = w;
    canvas.height = Math.round(w * 0.62); ch = canvas.height;
  }

  function resetBall(direction){
    ball = { x: cw / 2, y: ch / 2, r: 7, vx: 4.2 * (direction || (Math.random() > 0.5 ? 1 : -1)), vy: (Math.random() * 4 - 2) };
  }

  function newGame(){
    sizeCanvas();
    const ph = ch * PADDLE_H_RATIO;
    p1 = { x: 14, y: ch / 2 - ph / 2, w: 9, h: ph };
    p2 = { x: cw - 23, y: ch / 2 - ph / 2, w: 9, h: ph };
    score1 = 0; score2 = 0; gameOverFlag = false; running = true;
    p1Up = p1Down = p2Up = p2Down = false;
    api.setScore(`${score1}–${score2}`);
    api.hideOverlay();
    api.resetControls && api.resetControls();
    resetBall();
    draw();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function loop(){
    if (running) { update(); draw(); }
    rafId = requestAnimationFrame(loop);
  }

  function cpuDifficultyReact(){ return mode === "hard" ? 0.5 : 0.14; }

  function update(){
    if (gameOverFlag) return;
    const speed = 5.4;
    if (p1Up) p1.y -= speed;
    if (p1Down) p1.y += speed;
    p1.y = Math.max(0, Math.min(ch - p1.h, p1.y));

    if (mode === "friend") {
      if (p2Up) p2.y -= speed;
      if (p2Down) p2.y += speed;
      p2.y = Math.max(0, Math.min(ch - p2.h, p2.y));
    } else {
      const target = ball.y - p2.h / 2;
      p2.y += (target - p2.y) * cpuDifficultyReact();
      p2.y = Math.max(0, Math.min(ch - p2.h, p2.y));
    }

    ball.x += ball.vx;
    ball.y += ball.vy;
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
    if (ball.y + ball.r > ch) { ball.y = ch - ball.r; ball.vy *= -1; }

    if (ball.vx < 0 && ball.x - ball.r <= p1.x + p1.w && ball.x - ball.r >= p1.x - 6 && ball.y >= p1.y && ball.y <= p1.y + p1.h) {
      const hit = (ball.y - (p1.y + p1.h / 2)) / (p1.h / 2);
      const spd = Math.min(11, Math.hypot(ball.vx, ball.vy) * 1.06);
      ball.vx = Math.abs(spd * 0.92);
      ball.vy = hit * spd * 0.9;
      api.sound.move();
    }
    if (ball.vx > 0 && ball.x + ball.r >= p2.x && ball.x + ball.r <= p2.x + p2.w + 6 && ball.y >= p2.y && ball.y <= p2.y + p2.h) {
      const hit = (ball.y - (p2.y + p2.h / 2)) / (p2.h / 2);
      const spd = Math.min(11, Math.hypot(ball.vx, ball.vy) * 1.06);
      ball.vx = -Math.abs(spd * 0.92);
      ball.vy = hit * spd * 0.9;
      api.sound.move();
    }

    if (ball.x < -20) { score2++; onPoint(); }
    else if (ball.x > cw + 20) { score1++; onPoint(); }
  }

  function onPoint(){
    api.setScore(`${score1}–${score2}`);
    api.sound.eat();
    if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) return endGame();
    resetBall(score1 > score2 ? -1 : 1);
  }

  function endGame(){
    gameOverFlag = true; running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const humanWon = score1 > score2;
    const isNew = api.reportHighScore(Math.max(score1, score2));
    api.resetControls && api.resetControls();
    const label = mode === "friend" ? `Player ${humanWon ? 1 : 2} wins!` : (humanWon ? "You win!" : "CPU wins");
    api.showOverlay(label, `Final score ${score1}–${score2}.${isNew ? " New high score!" : ""}`, [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
    ]);
  }

  function draw(){
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.setLineDash([6, 8]);
    ctx.beginPath(); ctx.moveTo(cw / 2, 0); ctx.lineTo(cw / 2, ch); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#46dbe8";
    ctx.fillRect(p1.x, p1.y, p1.w, p1.h);
    ctx.fillStyle = mode === "friend" ? "#ff6b45" : "#ffc24b";
    ctx.fillRect(p2.x, p2.y, p2.w, p2.h);

    ctx.save();
    ctx.shadowColor = "#eef1f6";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#eef1f6";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function pointerYFromEvent(e){
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { y: ((t.clientY - rect.top) / rect.height) * ch, x: ((t.clientX - rect.left) / rect.width) * cw };
  }
  function onPointerMove(e){
    if (gameOverFlag) return;
    const { x, y } = pointerYFromEvent(e);
    if (x < cw / 2 || mode !== "friend") { p1.y = Math.max(0, Math.min(ch - p1.h, y - p1.h / 2)); }
    else { p2.y = Math.max(0, Math.min(ch - p2.h, y - p2.h / 2)); }
  }

  function keyDown(e){
    if (e.key === "w" || e.key === "W") p1Up = true;
    else if (e.key === "s" || e.key === "S") p1Down = true;
    else if (e.key === "ArrowUp") { e.preventDefault(); p2Up = true; }
    else if (e.key === "ArrowDown") { e.preventDefault(); p2Down = true; }
    else if (e.key === "p" || e.key === "P") document.getElementById("pauseBtn").click();
  }
  function keyUp(e){
    if (e.key === "w" || e.key === "W") p1Up = false;
    else if (e.key === "s" || e.key === "S") p1Down = false;
    else if (e.key === "ArrowUp") p2Up = false;
    else if (e.key === "ArrowDown") p2Down = false;
  }

  canvas.addEventListener("mousemove", onPointerMove);
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  return {
    init(){
      mode = api.getDifficulty();
      document.addEventListener("keydown", keyDown);
      document.addEventListener("keyup", keyUp);
      newGame();
    },
    start(){ running = true; },
    pause(){ running = false; },
    restart(){ newGame(); },
    setDifficulty(v){ mode = v; },
    destroy(){
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
      if (rafId) cancelAnimationFrame(rafId);
    },
    handleTouch(){}
  };
};
