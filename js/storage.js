/* Thin localStorage wrapper — theme, favorites, high scores, recently played, mute. */
const Store = (() => {
  const KEYS = {
    theme: "cg_theme",
    favorites: "cg_favorites",
    highscores: "cg_highscores",
    recent: "cg_recent",
    muted: "cg_muted"
  };

  function read(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }

  return {
    getTheme(){ return read(KEYS.theme, "dark"); },
    setTheme(t){ write(KEYS.theme, t); },

    getFavorites(){ return read(KEYS.favorites, []); },
    toggleFavorite(id){
      const favs = read(KEYS.favorites, []);
      const idx = favs.indexOf(id);
      if (idx === -1) favs.push(id); else favs.splice(idx, 1);
      write(KEYS.favorites, favs);
      return favs;
    },
    isFavorite(id){ return read(KEYS.favorites, []).includes(id); },

    getHighScore(id){
      const all = read(KEYS.highscores, {});
      return all[id] || 0;
    },
    setHighScore(id, score){
      const all = read(KEYS.highscores, {});
      if (!all[id] || score > all[id]) {
        all[id] = score;
        write(KEYS.highscores, all);
        return true;
      }
      return false;
    },
    getAllHighScores(){ return read(KEYS.highscores, {}); },

    getRecent(){ return read(KEYS.recent, []); },
    addRecent(id){
      let recents = read(KEYS.recent, []).filter(r => r !== id);
      recents.unshift(id);
      recents = recents.slice(0, 6);
      write(KEYS.recent, recents);
    },

    isMuted(){ return read(KEYS.muted, false); },
    setMuted(m){ write(KEYS.muted, m); },

    // Generic safe accessors for game-specific keys (e.g. per-game win tallies).
    getRaw(key, fallback){
      try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
      catch (e) { return fallback; }
    },
    setRaw(key, value){
      try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
    }
  };
})();
