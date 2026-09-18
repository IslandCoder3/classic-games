(() => {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get("id") || "tetris";
  const game = getGameById(gameId) || GAMES_DATA[0];

  /* ---------- theme (shared logic with home page) ---------- */
  function applyTheme(theme){
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("themeIcon");
    if (theme === "light") {
      icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
      icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
  }
  applyTheme(Store.getTheme());
  document.getElementById("themeToggle").addEventListener("click", () => {
    const next = Store.getTheme() === "dark" ? "light" : "dark";
    Store.setTheme(next);
    applyTheme(next);
  });

  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  navToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  document.getElementById("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") window.location.href = `index.html#library`;
  });
  document.getElementById("randomBtn").addEventListener("click", () => {
    const others = GAMES_DATA.filter(g => g.id !== gameId);
    const pick = others[Math.floor(Math.random() * others.length)];
    window.location.href = `game.html?id=${pick.id}`;
  });
  const mobileRandomBtn = document.getElementById("mobileRandomBtn");
  if (mobileRandomBtn) mobileRandomBtn.addEventListener("click", () => {
    const others = GAMES_DATA.filter(g => g.id !== gameId);
    const pick = others[Math.floor(Math.random() * others.length)];
    window.location.href = `game.html?id=${pick.id}`;
  });

  /* ---------- header text ---------- */
  document.title = `${game.title} — Classic Games`;
  document.getElementById("crumbTitle").textContent = game.title;
  document.getElementById("titleIcon").innerHTML = game.icon;
  document.getElementById("titleText").textContent = game.title;
  document.getElementById("catTag").textContent = game.categoryLabel;
  document.getElementById("scoreLabelText").textContent = (game.scoreLabel || "Score").toUpperCase();

  /* ---------- favorite ---------- */
  const pageFavBtn = document.getElementById("pageFavBtn");
  function refreshFav(){
    const isFav = Store.isFavorite(game.id);
    pageFavBtn.classList.toggle("is-fav", isFav);
    pageFavBtn.setAttribute("aria-pressed", String(isFav));
  }
  refreshFav();
  pageFavBtn.addEventListener("click", () => { Store.toggleFavorite(game.id); refreshFav(); });

  /* ---------- high score ---------- */
  const scoreValueEl = document.getElementById("scoreValue");
  const highScoreValueEl = document.getElementById("highScoreValue");
  highScoreValueEl.textContent = Store.getHighScore(game.id);
  scoreValueEl.textContent = "0";

  /* ---------- sound ---------- */
  const soundToggle = document.getElementById("soundToggle");
  const muteBtn = document.getElementById("muteBtn");
  let sfxMuted = Store.isMuted(); // session source of truth — Store is persistence, not the live state
  function refreshMuteUI(){
    soundToggle.checked = !sfxMuted;
    muteBtn.innerHTML = sfxMuted
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
  }
  function setSfxMuted(muted){ sfxMuted = muted; Store.setMuted(muted); refreshMuteUI(); }
  refreshMuteUI();
  soundToggle.addEventListener("change", () => setSfxMuted(!soundToggle.checked));
  muteBtn.addEventListener("click", () => setSfxMuted(!sfxMuted));

  /* ---------- difficulty ---------- */
  const difficultyCard = document.getElementById("difficultyCard");
  const difficultySeg = document.getElementById("difficultySeg");
  let currentDifficulty = game.defaultDifficulty || (game.difficultyOptions && game.difficultyOptions[0].value);
  if (game.hasDifficulty && game.difficultyOptions) {
    difficultyCard.hidden = false;
    document.getElementById("difficultyLabel").textContent = game.difficultyLabel || "Difficulty";
    difficultySeg.innerHTML = game.difficultyOptions.map(opt =>
      `<button data-val="${opt.value}" class="${opt.value === currentDifficulty ? "active" : ""}">${opt.label}</button>`
    ).join("");
    difficultySeg.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        difficultySeg.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentDifficulty = btn.getAttribute("data-val");
        if (controller && controller.setDifficulty) controller.setDifficulty(currentDifficulty);
        controller && controller.restart && controller.restart();
      });
    });
  }

  /* ---------- keyboard / instructions panels ---------- */
  const kbdList = document.getElementById("kbdList");
  if (game.keyboard && game.keyboard.length) {
    kbdList.innerHTML = game.keyboard.map(([k, d]) =>
      `<div class="kbd-row"><span>${d}</span><span class="kbd">${k}</span></div>`
    ).join("");
  } else {
    document.getElementById("keyboardCard").hidden = true;
  }
  document.getElementById("instructionsList").innerHTML =
    (game.instructions || []).map(t => `<p>${t}</p>`).join("");

  /* ---------- more games ---------- */
  const moreGamesGrid = document.getElementById("moreGamesGrid");
  const others = GAMES_DATA.filter(g => g.id !== game.id).sort(() => Math.random() - 0.5).slice(0, 4);
  moreGamesGrid.innerHTML = others.map(g => `
    <article class="game-card" data-id="${g.id}">
      <div class="game-thumb" style="background:${g.thumbGradient}">
        ${g.isNew ? '<span class="new-badge">New</span>' : ""}
        <span class="thumb-icon">${g.icon}</span>
      </div>
      <div class="game-info">
        <div class="game-info-top">
          <span class="game-cat-tag">${g.categoryLabel}</span>
          <span class="players-tag">${g.players || ""}</span>
        </div>
        <h3>${g.title}</h3>
        <p>${g.description}</p>
        <div class="game-card-foot">
          <span></span>
          <a href="game.html?id=${g.id}" class="game-play-btn">Play <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg></a>
        </div>
      </div>
    </article>`).join("");
  CG.initCardTilt(moreGamesGrid);

  /* ---------- overlay ---------- */
  const overlayMsg = document.getElementById("overlayMsg");
  const overlayTitle = document.getElementById("overlayTitle");
  const overlayText = document.getElementById("overlayText");
  const overlayActions = document.getElementById("overlayActions");
  function showOverlay(title, text, actions){
    overlayTitle.textContent = title;
    overlayText.textContent = text || "";
    overlayActions.innerHTML = "";
    (actions || [{ label: "Resume", primary: true, action: () => hideOverlay() && controller.start() }]).forEach(a => {
      const b = document.createElement("button");
      b.className = "btn " + (a.primary ? "btn-primary" : "btn-secondary");
      b.textContent = a.label;
      b.addEventListener("click", a.action);
      overlayActions.appendChild(b);
    });
    overlayMsg.classList.add("show");
  }
  function hideOverlay(){ overlayMsg.classList.remove("show"); return true; }

  /* ---------- touch controls (d-pad, built per game) ---------- */
  const touchControls = document.getElementById("touchControls");
  function buildDpad(opts){
    touchControls.classList.add("active");
    let centerLabel = "", centerAct = "", extraLabel = "", extraAct = "";
    if (opts === true) { centerLabel = "⟳"; centerAct = "rotate"; extraLabel = "Hard Drop"; extraAct = "drop"; }
    else if (opts && typeof opts === "object") {
      if (opts.center) { centerLabel = opts.center.label; centerAct = opts.center.action; }
      if (opts.extra) { extraLabel = opts.extra.label; extraAct = opts.extra.action; }
    }
    touchControls.innerHTML = `
      <div class="dpad">
        <button class="up" data-act="up" aria-label="Up">▲</button>
        <button class="left" data-act="left" aria-label="Left">◀</button>
        ${centerAct ? `<button class="rotate" data-act="${centerAct}" aria-label="${centerLabel}">${centerLabel}</button>` : '<span></span>'}
        <button class="right" data-act="right" aria-label="Right">▶</button>
        <button class="down" data-act="down" aria-label="Down">▼</button>
      </div>
      ${extraAct ? `<div class="touch-row"><button class="btn btn-secondary btn-sm" data-act="${extraAct}">${extraLabel}</button></div>` : ""}
    `;
    touchControls.querySelectorAll("[data-act]").forEach(btn => {
      const fire = (ev) => { ev.preventDefault(); controller && controller.handleTouch && controller.handleTouch(btn.getAttribute("data-act")); };
      btn.addEventListener("touchstart", fire, { passive: false });
      btn.addEventListener("click", fire);
    });
  }
  function clearTouch(){ touchControls.classList.remove("active"); touchControls.innerHTML = ""; }

  /* ---------- score / high score api ---------- */
  function setScore(n){ scoreValueEl.textContent = n; }
  function reportHighScore(n){
    const isNew = Store.setHighScore(game.id, n);
    if (isNew) highScoreValueEl.textContent = n;
    return isNew;
  }

  /* ---------- build controller ---------- */
  const canvasWrap = document.getElementById("canvasWrap");
  const mountPoint = document.createElement("div");
  mountPoint.className = "game-mount";
  canvasWrap.insertBefore(mountPoint, overlayMsg);

  const api = {
    setScore,
    getHighScore: () => Store.getHighScore(game.id),
    reportHighScore,
    showOverlay,
    hideOverlay,
    buildDpad,
    clearTouch,
    sound: Sound,
    isMuted: () => Store.isMuted(),
    getDifficulty: () => currentDifficulty,
    gameId: game.id
  };

  let controller = null;
  const factory = window.GameModules && window.GameModules[game.id];
  const pauseBtn = document.getElementById("pauseBtn");
  const restartBtn = document.getElementById("restartBtn");
  let isPaused = false;

  if (factory) {
    controller = factory(mountPoint, api);
    controller.init && controller.init();
    if (controller.difficultyOptions === false) difficultyCard.hidden = true;
    controller.start && controller.start();
    Store.addRecent(game.id);
  } else {
    mountPoint.innerHTML = `<p style="color:var(--text-muted); padding:40px;">This game is coming soon.</p>`;
    pauseBtn.disabled = true;
  }

  pauseBtn.addEventListener("click", () => {
    if (!controller) return;
    isPaused = !isPaused;
    if (isPaused) {
      controller.pause && controller.pause();
      pauseBtn.textContent = "Resume";
      showOverlay("Paused", "Take your time — resume whenever you're ready.", [
        { label: "Resume", primary: true, action: () => { hideOverlay(); isPaused = false; pauseBtn.textContent = "Pause"; controller.start && controller.start(); } }
      ]);
    } else {
      hideOverlay();
      pauseBtn.textContent = "Pause";
      controller.start && controller.start();
    }
  });

  restartBtn.addEventListener("click", () => {
    if (!controller) return;
    isPaused = false;
    pauseBtn.textContent = "Pause";
    hideOverlay();
    controller.restart && controller.restart();
  });

  // Give games a way to reset the pause button label when they end
  api.resetControls = () => { isPaused = false; pauseBtn.textContent = "Pause"; };

  window.addEventListener("beforeunload", () => { controller && controller.destroy && controller.destroy(); });
})();
