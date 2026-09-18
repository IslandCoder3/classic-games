(() => {
  const gameGrid = document.getElementById("gameGrid");
  const favoritesGrid = document.getElementById("favoritesGrid");
  const favEmptyState = document.getElementById("favEmptyState");
  const emptyState = document.getElementById("emptyState");
  const categoryChips = document.getElementById("categoryChips");
  const searchInput = document.getElementById("searchInput");
  const libraryTitle = document.getElementById("libraryTitle");
  const libraryCount = document.getElementById("libraryCount");
  const recentSection = document.getElementById("recent-section");
  const recentGrid = document.getElementById("recentGrid");

  let activeCategory = "all";
  let searchTerm = "";

  /* ---------- theme ---------- */
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

  /* ---------- mobile menu ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  navToggle.addEventListener("click", () => {
    const open = mobileMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
  mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }));

  /* ---------- category chips ---------- */
  function renderChips(){
    categoryChips.innerHTML = "";
    Object.keys(CATEGORY_META).forEach(key => {
      const meta = CATEGORY_META[key];
      const btn = document.createElement("button");
      btn.className = "chip" + (key === activeCategory ? " active" : "");
      btn.innerHTML = `<span>${meta.icon}</span><span>${meta.label}</span>`;
      btn.addEventListener("click", () => {
        activeCategory = key;
        renderChips();
        renderLibrary();
      });
      categoryChips.appendChild(btn);
    });
  }

  /* ---------- card rendering ---------- */
  function cardHTML(game){
    const isFav = Store.isFavorite(game.id);
    const hs = Store.getHighScore(game.id);
    return `
    <article class="game-card" data-id="${game.id}">
      <div class="game-thumb" style="background:${game.thumbGradient}">
        ${game.isNew ? '<span class="new-badge">New</span>' : ""}
        <button class="fav-btn ${isFav ? "is-fav" : ""}" data-fav="${game.id}" aria-pressed="${isFav}" aria-label="Toggle favorite for ${game.title}">
          <svg viewBox="0 0 24 24"><path d="M12 21s-6.7-4.35-9.3-8.1C.8 9.7 2 6 5.4 5.1 7.6 4.5 9.8 5.5 12 8c2.2-2.5 4.4-3.5 6.6-2.9C22 6 23.2 9.7 21.3 12.9 18.7 16.65 12 21 12 21z"/></svg>
        </button>
        <span class="thumb-icon">${game.icon}</span>
      </div>
      <div class="game-info">
        <div class="game-info-top">
          <span class="game-cat-tag">${game.categoryLabel}</span>
          <span class="players-tag">${game.players || ""}</span>
        </div>
        <h3>${game.title}</h3>
        <p>${game.description}</p>
        <div class="game-card-foot">
          <span class="high-score-tag">${hs ? "BEST " + hs : ""}</span>
          <a href="game.html?id=${game.id}" class="game-play-btn">Play <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg></a>
        </div>
      </div>
    </article>`;
  }

  /* ---------- card tilt + cursor-spotlight ---------- */
  const initCardTilt = CG.initCardTilt;

  function bindFavButtons(container){
    container.querySelectorAll("[data-fav]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-fav");
        Store.toggleFavorite(id);
        renderAll();
      });
    });
  }

  function renderLibrary(){
    let list = GAMES_DATA.filter(g => activeCategory === "all" || g.category === activeCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter(g => g.title.toLowerCase().includes(term) || g.description.toLowerCase().includes(term) || g.categoryLabel.toLowerCase().includes(term));
    }
    libraryTitle.textContent = activeCategory === "all" ? "Featured Games" : CATEGORY_META[activeCategory].label;
    libraryCount.textContent = `${list.length} game${list.length === 1 ? "" : "s"} in the arcade`;

    if (list.length === 0) {
      gameGrid.innerHTML = "";
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      gameGrid.innerHTML = list.map(cardHTML).join("");
      bindFavButtons(gameGrid);
      initCardTilt(gameGrid);
    }
  }

  function renderFavorites(){
    const favIds = Store.getFavorites();
    document.getElementById("statFavCount").textContent = favIds.length;
    const favGames = favIds.map(id => getGameById(id)).filter(Boolean);
    if (favGames.length === 0) {
      favoritesGrid.innerHTML = "";
      favEmptyState.hidden = false;
    } else {
      favEmptyState.hidden = true;
      favoritesGrid.innerHTML = favGames.map(cardHTML).join("");
      bindFavButtons(favoritesGrid);
      initCardTilt(favoritesGrid);
    }
  }

  function renderRecent(){
    const recentIds = Store.getRecent();
    const recentGames = recentIds.map(id => getGameById(id)).filter(Boolean);
    if (recentGames.length === 0) {
      recentSection.hidden = true;
      return;
    }
    recentSection.hidden = false;
    recentGrid.innerHTML = recentGames.map(cardHTML).join("");
    bindFavButtons(recentGrid);
    initCardTilt(recentGrid);
  }

  function renderAll(){
    renderLibrary();
    renderFavorites();
    renderRecent();
  }

  /* ---------- search ---------- */
  let searchDebounce;
  searchInput.addEventListener("input", (e) => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      searchTerm = e.target.value;
      renderLibrary();
    }, 120);
  });

  /* ---------- random game ---------- */
  document.getElementById("randomBtn").addEventListener("click", () => {
    const pick = GAMES_DATA[Math.floor(Math.random() * GAMES_DATA.length)];
    window.location.href = `game.html?id=${pick.id}`;
  });
  const mobileRandomBtn = document.getElementById("mobileRandomBtn");
  if (mobileRandomBtn) mobileRandomBtn.addEventListener("click", () => {
    const pick = GAMES_DATA[Math.floor(Math.random() * GAMES_DATA.length)];
    window.location.href = `game.html?id=${pick.id}`;
  });

  /* ---------- marquee ticker ---------- */
  function buildTicker(){
    const track = document.getElementById("tickerTrack");
    if (!track) return;
    const names = GAMES_DATA.map(g => g.title);
    const loop = [...names, ...names]; // duplicated for seamless -50% scroll
    track.innerHTML = loop.map(n => `<span>${n}</span>`).join("");
  }
  buildTicker();

  /* ---------- hero falling blocks (decorative, grounded in Tetris) ---------- */
  function buildHeroBlocks(){
    const screen = document.getElementById("heroScreen");
    const colors = ["#ffc24b", "#8b6bff", "#46dbe8", "#4ade80", "#fb5d5d"];
    const count = window.innerWidth < 700 ? 8 : 14;
    for (let i = 0; i < count; i++) {
      const b = document.createElement("div");
      b.className = "hero-block";
      const size = 22 + Math.round(Math.random() * 10);
      b.style.width = size + "px";
      b.style.height = size + "px";
      b.style.left = Math.round(Math.random() * 92) + "%";
      b.style.background = colors[i % colors.length];
      b.style.animationDuration = (3.5 + Math.random() * 3.5) + "s";
      b.style.animationDelay = (Math.random() * 5) + "s";
      screen.appendChild(b);
    }
  }
  buildHeroBlocks();

  const eyebrowCount = document.getElementById("eyebrowCount");
  const statGameCount = document.getElementById("statGameCount");
  if (eyebrowCount) eyebrowCount.textContent = GAMES_DATA.length;
  if (statGameCount) statGameCount.textContent = GAMES_DATA.length;

  renderChips();
  renderAll();
})();
