/* Minimal WebAudio SFX generator — no audio files needed.
   Browsers auto-suspend an AudioContext after periods of silence (especially
   on mobile) to save power. If we only resume() it lazily inside the sound
   call itself, the very next beep has to wait on that resume to complete —
   which is exactly what reads as "sound effects feel delayed". So we resume
   proactively on the earliest possible user gesture and again whenever the
   tab regains focus, keeping the context warm well before a game action
   ever needs it. */
const Sound = (() => {
  let ctx = null;

  function ensureCtx(){
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  function unlock(){
    const c = ensureCtx();
    if (c && c.state === "suspended") c.resume().catch(() => {});
  }
  ["pointerdown", "keydown", "touchstart"].forEach(evt => {
    document.addEventListener(evt, unlock, { passive: true });
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) unlock(); });

  function scheduleBeep(audioCtx, { freq, duration, type, volume, glideTo }){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, audioCtx.currentTime + duration);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  function beep(opts = {}){
    if (Store.isMuted()) return;
    const { freq = 440, duration = 0.1, type = "sine", volume = 0.18, glideTo = null } = opts;
    const audioCtx = ensureCtx();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") {
      // Schedule against currentTime only once actually running, or timing
      // (and the effect's perceived promptness) comes out wrong.
      audioCtx.resume().then(() => scheduleBeep(audioCtx, { freq, duration, type, volume, glideTo })).catch(() => {});
      return;
    }
    scheduleBeep(audioCtx, { freq, duration, type, volume, glideTo });
  }

  return {
    move(){ beep({ freq: 260, duration: 0.06, type: "square", volume: 0.1 }); },
    rotate(){ beep({ freq: 340, duration: 0.07, type: "square", volume: 0.12 }); },
    place(){ beep({ freq: 200, duration: 0.09, type: "triangle", volume: 0.15 }); },
    clear(){ beep({ freq: 520, duration: 0.18, type: "square", volume: 0.16, glideTo: 880 }); },
    score(){ beep({ freq: 660, duration: 0.09, type: "sine", volume: 0.14 }); },
    eat(){ beep({ freq: 440, duration: 0.08, type: "square", volume: 0.15, glideTo: 660 }); },
    capture(){ beep({ freq: 300, duration: 0.12, type: "sawtooth", volume: 0.15 }); },
    win(){ beep({ freq: 523, duration: 0.14, type: "sine", volume: 0.18, glideTo: 1046 }); },
    lose(){ beep({ freq: 220, duration: 0.35, type: "sawtooth", volume: 0.16, glideTo: 80 }); },
    flag(){ beep({ freq: 380, duration: 0.06, type: "triangle", volume: 0.12 }); },
    tick(){ beep({ freq: 180, duration: 0.04, type: "square", volume: 0.07 }); }
  };
})();
