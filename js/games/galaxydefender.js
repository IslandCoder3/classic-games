window.GameModules = window.GameModules || {};

window.GameModules.galaxydefender = function (container, api) {
  let canvas, ctx, cw, ch;
  let ship, bullets, enemyBullets, enemies, score, lives, wave, running, gameOverFlag, rafId, difficulty;
  let enemyDir, enemyStepTimer, enemyStepInterval, moveLeft, moveRight, lastShot, stars, clock;

  container.innerHTML = `<canvas id="gdCanvas" aria-label="Galaxy Defender board"></canvas>`;
  canvas = container.querySelector("#gdCanvas");
  ctx = canvas.getContext("2d");

  function sizeCanvas(){
    const wrap = container.parentElement;
    const w = Math.max(200, Math.min((wrap.clientWidth || 320) - 32, 520));
    canvas.width = w; cw = w;
    canvas.height = Math.round(w * 0.78); ch = canvas.height;
    if (ship) ship.y = ch - 34;
  }

  function baseStep(){ return { slow: 620, normal: 430, fast: 280 }[difficulty] || 430; }

  function buildStars(){
    stars = [];
    const layers = [
      { count: 18, speed: 0.4, size: 1, alpha: 0.35 },
      { count: 14, speed: 0.8, size: 1.6, alpha: 0.55 },
      { count: 9, speed: 1.4, size: 2.2, alpha: 0.8 }
    ];
    layers.forEach(layer => {
      for (let i = 0; i < layer.count; i++) {
        stars.push({ x: Math.random() * cw, y: Math.random() * ch, speed: layer.speed, size: layer.size, alpha: layer.alpha });
      }
    });
  }

  function buildWave(){
    enemies = [];
    const cols = 7, rows = Math.min(4 + Math.floor(wave / 2), 6);
    const spacingX = cw / (cols + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        enemies.push({ x: spacingX * (c + 1) - 12, y: 30 + r * 30, w: 24, h: 18, alive: true, phase: Math.random() * Math.PI * 2 });
      }
    }
    enemyDir = 1;
    enemyStepInterval = Math.max(120, baseStep() - wave * 25);
    enemyStepTimer = 0;
  }

  function newGame(){
    sizeCanvas();
    score = 0; lives = 3; wave = 1; gameOverFlag = false; running = true; clock = 0;
    ship = { x: cw / 2 - 14, y: ch - 34, w: 28, h: 18 };
    bullets = []; enemyBullets = [];
    moveLeft = false; moveRight = false; lastShot = 0;
    api.setScore(score);
    api.hideOverlay();
    api.resetControls && api.resetControls();
    buildStars();
    buildWave();
    draw();
    if (rafId) cancelAnimationFrame(rafId);
    let last = performance.now();
    function loop(t){
      const dt = t - last; last = t;
      if (running) { update(dt); draw(); }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function fire(){
    if (gameOverFlag) return;
    const now = performance.now();
    if (now - lastShot < 260) return;
    lastShot = now;
    bullets.push({ x: ship.x + ship.w / 2 - 2, y: ship.y - 8, w: 4, h: 10 });
    api.sound.move();
  }

  function update(dt){
    if (gameOverFlag) return;
    clock += dt;
    stars.forEach(s => { s.y += s.speed * (dt / 16); if (s.y > ch) { s.y = 0; s.x = Math.random() * cw; } });

    const speed = 4.2;
    if (moveLeft) ship.x -= speed;
    if (moveRight) ship.x += speed;
    ship.x = Math.max(0, Math.min(cw - ship.w, ship.x));

    bullets.forEach(b => b.y -= 7);
    bullets = bullets.filter(b => b.y > -20);
    enemyBullets.forEach(b => b.y += 4.4);
    enemyBullets = enemyBullets.filter(b => b.y < ch + 20);

    enemyStepTimer += dt;
    if (enemyStepTimer >= enemyStepInterval) {
      enemyStepTimer = 0;
      const alive = enemies.filter(e => e.alive);
      let hitEdge = false;
      alive.forEach(e => { e.x += enemyDir * 10; if (e.x < 4 || e.x + e.w > cw - 4) hitEdge = true; });
      if (hitEdge) { enemyDir *= -1; alive.forEach(e => e.y += 14); }
      if (Math.random() < 0.5 && alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)];
        enemyBullets.push({ x: shooter.x + shooter.w / 2 - 2, y: shooter.y + shooter.h, w: 4, h: 10 });
      }
      if (alive.some(e => e.y + e.h >= ship.y)) return loseLife(true);
    }

    for (const b of bullets) {
      for (const e of enemies) {
        if (!e.alive) continue;
        if (b.x < e.x + e.w && b.x + b.w > e.x && b.y < e.y + e.h && b.y + b.h > e.y) {
          e.alive = false; b.y = -999;
          score += 15;
          api.setScore(score);
          api.sound.eat();
        }
      }
    }
    bullets = bullets.filter(b => b.y > -50);

    for (const b of enemyBullets) {
      if (b.x < ship.x + ship.w && b.x + b.w > ship.x && b.y < ship.y + ship.h && b.y + b.h > ship.y) {
        b.y = ch + 999;
        return loseLife(false);
      }
    }

    if (enemies.every(e => !e.alive)) return nextWave();
  }

  function nextWave(){
    wave++;
    api.sound.clear();
    bullets = []; enemyBullets = [];
    buildWave();
  }

  function loseLife(resetWave){
    lives--;
    api.sound.lose();
    if (lives <= 0) return endGame();
    bullets = []; enemyBullets = [];
    ship.x = cw / 2 - 14;
    if (resetWave) buildWave();
  }

  function endGame(){
    gameOverFlag = true; running = false;
    if (rafId) cancelAnimationFrame(rafId);
    const isNew = api.reportHighScore(score);
    api.resetControls && api.resetControls();
    api.showOverlay("Game over", `Score ${score} · Wave ${wave}.${isNew ? " New high score!" : ""}`, [
      { label: "Play again", primary: true, action: () => { api.hideOverlay(); newGame(); } }
    ]);
  }

  function draw(){
    ctx.fillStyle = "#05070f";
    ctx.fillRect(0, 0, cw, ch);

    // parallax starfield — cheap, reliable depth cue instead of a full 3D engine
    stars.forEach(s => {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = "#c9d4ff";
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = "11px 'Rajdhani', sans-serif";
    ctx.fillText(`Wave ${wave}`, 8, 16);
    ctx.fillText("♥".repeat(Math.max(0, lives)), cw - 44, 16);

    drawEnemies();
    drawBullets();
    drawShip();
  }

  // Each invader gets a glossy gradient body, a soft drop-shadow "beneath" it and a
  // gentle bob — a cheap but effective bevel/elevation illusion without a 3D engine.
  function drawEnemies(){
    enemies.forEach(e => {
      if (!e.alive) return;
      const bob = Math.sin(clock / 260 + e.phase) * 2;
      const cx = e.x + e.w / 2, cy = e.y + e.h / 2 + bob;

      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(cx, cy + e.h * 0.55, e.w * 0.45, e.h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      const grad = ctx.createRadialGradient(cx - e.w * 0.2, cy - e.h * 0.3, 1, cx, cy, e.w * 0.75);
      grad.addColorStop(0, "#ffb199");
      grad.addColorStop(0.55, "#ff6b45");
      grad.addColorStop(1, "#c8431f");
      ctx.save();
      ctx.shadowColor = "rgba(255,107,69,0.45)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = grad;
      roundRectPath(e.x, e.y + bob, e.w, e.h, 5);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath(); ctx.ellipse(cx - e.w * 0.18, e.y + bob + e.h * 0.28, e.w * 0.18, e.h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawBullets(){
    bullets.forEach(b => {
      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      grad.addColorStop(0, "#e0fbff");
      grad.addColorStop(1, "#46dbe8");
      ctx.save();
      ctx.shadowColor = "#46dbe8"; ctx.shadowBlur = 8;
      ctx.fillStyle = grad;
      roundRectPath(b.x, b.y, b.w, b.h, 2);
      ctx.fill();
      ctx.restore();
    });
    enemyBullets.forEach(b => {
      ctx.save();
      ctx.shadowColor = "#fb5d5d"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#fb5d5d";
      roundRectPath(b.x, b.y, b.w, b.h, 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // Gradient-shaded hull + a flickering engine glow beneath, for a bit of dimensional pop.
  function drawShip(){
    const flicker = 0.7 + Math.sin(clock / 60) * 0.3;
    ctx.save();
    ctx.globalAlpha = flicker;
    const flameGrad = ctx.createRadialGradient(ship.x + ship.w / 2, ship.y + ship.h + 4, 1, ship.x + ship.w / 2, ship.y + ship.h + 4, 10);
    flameGrad.addColorStop(0, "#fff3d0");
    flameGrad.addColorStop(0.5, "#ffc24b");
    flameGrad.addColorStop(1, "rgba(255,194,75,0)");
    ctx.fillStyle = flameGrad;
    ctx.beginPath(); ctx.ellipse(ship.x + ship.w / 2, ship.y + ship.h + 3, 9, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    const hullGrad = ctx.createLinearGradient(ship.x, ship.y, ship.x, ship.y + ship.h);
    hullGrad.addColorStop(0, "#ffffff");
    hullGrad.addColorStop(0.5, "#b7e9ff");
    hullGrad.addColorStop(1, "#2fa7c9");
    ctx.save();
    ctx.shadowColor = "#46dbe8";
    ctx.shadowBlur = 10;
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(ship.x + ship.w / 2, ship.y);
    ctx.lineTo(ship.x, ship.y + ship.h);
    ctx.lineTo(ship.x + ship.w * 0.28, ship.y + ship.h * 0.72);
    ctx.lineTo(ship.x + ship.w * 0.72, ship.y + ship.h * 0.72);
    ctx.lineTo(ship.x + ship.w, ship.y + ship.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function roundRectPath(x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function keyDown(e){
    if (gameOverFlag) return;
    if (e.key === "ArrowLeft") moveLeft = true;
    else if (e.key === "ArrowRight") moveRight = true;
    else if (e.key === " ") { e.preventDefault(); fire(); }
    else if (e.key === "p" || e.key === "P") document.getElementById("pauseBtn").click();
  }
  function keyUp(e){
    if (e.key === "ArrowLeft") moveLeft = false;
    else if (e.key === "ArrowRight") moveRight = false;
  }

  window.addEventListener("resize", () => { sizeCanvas(); draw(); });

  return {
    init(){
      difficulty = api.getDifficulty();
      document.addEventListener("keydown", keyDown);
      document.addEventListener("keyup", keyUp);
      api.buildDpad({ center: { label: "🔥", action: "fire" } }); // up/down unused for a shooter, fine to leave inert
      newGame();
    },
    start(){ running = true; },
    pause(){ running = false; },
    restart(){ newGame(); },
    setDifficulty(v){ difficulty = v; },
    destroy(){
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("keyup", keyUp);
      if (rafId) cancelAnimationFrame(rafId);
      api.clearTouch();
    },
    handleTouch(action){
      if (action === "left") { ship.x = Math.max(0, ship.x - 18); }
      else if (action === "right") { ship.x = Math.min(cw - ship.w, ship.x + 18); }
      else if (action === "fire") { fire(); }
    }
  };
};
