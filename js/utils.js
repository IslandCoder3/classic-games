/* Shared helper: compute a board cell size that fits the available width,
   so grid-based games (chess, checkers, connect4, minesweeper, block puzzle)
   never overflow on small screens. Writes the result to --cell on the board
   element; the stylesheet's var(--cell, ...) rules do the rest. */
window.CG = window.CG || {};

CG.fitCell = function (container, cols, ideal, min) {
  min = min || 20;
  const wrap = (container && container.parentElement) || container || document.body;
  const avail = Math.max(140, (wrap.clientWidth || 320) - 40);
  let px = Math.floor(avail / cols);
  px = Math.min(px, ideal);
  px = Math.max(px, min);
  return px;
};

CG.applyCell = function (boardEl, container, cols, ideal, min) {
  const px = CG.fitCell(container, cols, ideal, min);
  boardEl.style.setProperty("--cell", px + "px");
  return px;
};

/* Card tilt + cursor-spotlight wiring, shared by the homepage grid and the
   "More Games" strip on each game page. No-ops on touch-only devices. */
CG.initCardTilt = function (scopeEl) {
  if (!scopeEl) return;
  const supportsHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!supportsHover) return;
  scopeEl.querySelectorAll(".game-card").forEach(card => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", (px * 100) + "%");
      card.style.setProperty("--my", (py * 100) + "%");
      card.style.setProperty("--rx", ((px - 0.5) * 8).toFixed(2) + "deg");
      card.style.setProperty("--ry", ((0.5 - py) * 8).toFixed(2) + "deg");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
};
