window.GameModules = window.GameModules || {};

window.GameModules.brickbreaker = function (container, api) {
  const COLS = 8, ROWS = 5;
  const ROW_COLORS = ["#ff6b45", "#ff8a63", "#ffc24b", "#b6ff3f", "#46dbe8"];
  let canvas, ctx, cellW, cellH, brickH;
  let paddle, ball, bricks, score, lives, level, running, launched, speedMult, difficulty, gameOverFlag, rafId;

  container.innerHTML = `<canvas id="bbCanvas" aria-label="Brick breaker board"></canvas>`;
  canvas = container.querySelector("#bbCanvas");
  ctx = canvas.getContext("2d");

  function sizeCanvas(){
    const wrap = container.parentElement;
    const w = Math.max(200, Math.min((wrap.clientWidth || 320) - 32, 520));
    canvas.width = w;
    canvas.height = Math.round(w * 0.72);
    cellW = canvas.width / COLS;
    brickH = 20;
    paddle && (paddle.y = canvas.height - 26);
  }

  function speedBase(){ return { slow: 3.2, normal: 4.4, fast: 6 }[difficulty] || 4.4; }

  function buildBricks(){
    bricks = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({ x: c * cellW, y: r * brickH + 34, w: cellW - 4, h: brickH - 4, color: ROW_COLORS[r % ROW_COLORS.length], alive: true });
      }
    }
  }

  function resetBallAndPaddle(){
    paddle = { w: Math.max(60, canvas.width * 0.18), h: 12, x: canvas.width / 2 - 45, y: canvas.height - 26 };
    ball = { x: canvas.width / 2, y: paddle.y - 10, r: 7, vx: 0, vy: 0 };
    launched = false;
  }

  function newGame(){
    sizeCanvas();
    score = 0; lives = 3; level = 1; gameOverFlag = false; running = true;
    speedMult = 1;
    api.setScore(score);
    api.hideOverlay();
    api.resetControls && api.resetControls();
    buildBricks();
    resetBallAndPaddle();
    draw();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function launch(){
    if (launched || gameOverFlag) return;
    const base = speedBase() * speedMult;
    ball.vx = base * (Math.random() > 0.5 ? 1 : -1) * 0.55;
    ball.vy = -base;
    launched = true;
  }

  function movePaddleTo(px){
    paddle.x = Math.min(Math.max(0, px - paddle.w / 2), canvas.width - paddle.w);
    if (!launched) ball.x = paddle.x + paddle.w / 2;
  }

  function loop(){
    if (running) { update(); draw(); }
    rafId = requestAnimationFrame(loop);
  }

  function update(){
    if (gameOverFlag || !launched) return;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
    if (ball.x + ball.r > canvas.width) { ball.x = canvas.width - ball.r; ball.vx *= -1; }
    if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }

    // paddle collision
    if (ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + 8 &&
        ball.x >= paddle.x && ball.x <= paddle.x + paddle.w && ball.vy > 0) {
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      const speed = Math.hypot(ball.vx, ball.vy);
      ball.vx = hit * speed * 1.05;
      ball.vy = -Math.abs(speed);
      api.sound.move();
    }

    // brick collisions
    for (const b of bricks) {
      if (!b.alive) continue;
      if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w && ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
        b.alive = false;
        ball.vy *= -1;
        score += 10;
        api.setScore(score);
        api.sound.eat();
        break;
      }
    }

    if (bricks.every(b => !b.alive)) return nextLevel();

    if (ball.y - ball.r > canvas.height) loseBall();
  }

  function nextLevel(){
    level++;
    speedMult += 0.15;
    api.sound.clear();
    buildBricks();
    resetBallAndPaddle();
  }

  function loseBall(){
    lives--;
    api.sound.lose();
    if (lives <= 0) return endGame();
    resetBallAndPaddle();
  }

  function endGame(){
    gameOverFlag = true; running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const isNew = api.reportHighScore(score);
    api.resetControls && api.resetControls();
    api.showOverlay("Game over", `Score ${score} · Level ${level}.${isNew ? " New high score!" : ""}`, [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
    ]);
  }

  function draw(){
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px 'Rajdhani', sans-serif";
    ctx.fillText(`Level ${level}`, 8, 16);
    ctx.fillText("♥".repeat(Math.max(0, lives)), canvas.width - 44, 16);

    bricks.forEach(b => {
      if (!b.alive) return;
      ctx.fillStyle = b.color;
      roundRect(b.x + 2, b.y, b.w, b.h, 4);
    });

    ctx.fillStyle = "#46dbe8";
    roundRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);

    ctx.save();
    ctx.shadowColor = "#eef1f6";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#eef1f6";
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (!launched && !gameOverFlag) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "12px 'Rajdhani', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Tap or press Space to launch", canvas.width / 2, canvas.height - 40);
      ctx.textAlign = "left";
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

  function pointerXFromEvent(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return ((clientX - rect.left) / rect.width) * canvas.width;
  }
  function onPointerMove(e){
    if (gameOverFlag) return;
    movePaddleTo(pointerXFromEvent(e));
  }
  function onPointerDown(e){
    onPointerMove(e);
    launch();
  }

  function keyHandler(e){
    if (gameOverFlag) return;
    if (e.key === "ArrowLeft") movePaddleTo(paddle.x + paddle.w / 2 - 26);
    else if (e.key === "ArrowRight") movePaddleTo(paddle.x + paddle.w / 2 + 26);
    else if (e.key === " ") { e.preventDefault(); launch(); }
    else if (e.key === "p" || e.key === "P") document.getElementById("pauseBtn").click();
  }

  canvas.addEventListener("mousemove", onPointerMove);
  canvas.addEventListener("mousedown", onPointerDown);
  canvas.addEventListener("touchmove", (e) => { e.preventDefault(); onPointerMove(e); }, { passive: false });
  canvas.addEventListener("touchstart", (e) => { e.preventDefault(); onPointerDown(e); }, { passive: false });
  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  return {
    init(){ difficulty = api.getDifficulty(); document.addEventListener("keydown", keyHandler); newGame(); },
    start(){ running = true; },
    pause(){ running = false; },
    restart(){ newGame(); },
    setDifficulty(v){ difficulty = v; },
    destroy(){ document.removeEventListener("keydown", keyHandler); if (rafId) cancelAnimationFrame(rafId); },
    handleTouch(){}
  };
};
