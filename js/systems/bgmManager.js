/**
 * BgmManager — Background music manager.
 *
 * Menu BGM   : plays and loops while on menu pages.
 * Ingame BGM : alternates between ingame_1 and ingame_2 with a 4s gap,
 *              loops indefinitely.
 *
 * Setup in game.js preload():
 *   bgmManager = new BgmManager();
 *
 * Setup in game.js setup():
 *   bgmManager.init();
 *   bgmManager.playIngame();
 *
 * ── VOLUME SETTINGS ─────────────────────────────────────────────────────────
 * Adjust _volumes below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
class BgmManager {
  constructor() {
    this._ctx = null;
    this._buffers = {};
    this._unlocked = false;

    // Currently playing source node + gain
    this._currentSource = null;
    this._masterGain = null;

    this._mode = "stopped"; // "menu" | "ingame" | "stopped"
    this._trackIndex = 0; // 0 or 1 for ingame tracks
    this._gapTimer = null; // setTimeout handle for the 4s gap

    // ── ADJUST VOLUMES HERE ───────────────────────────────────────────────
    this._volumes = {
      menu: 0.45,
      ingame: 0.25, // kept low so it doesn't overpower SFX
    };
    // ─────────────────────────────────────────────────────────────────────

    this._files = {
      menu: "../assets/audios/bgm/menu.mp3",
      ingame_1: "../assets/audios/bgm/ingame/ingame_1.mp3",
      ingame_2: "../assets/audios/bgm/ingame/ingame_2.mp3",
    };

    this._ingameTracks = ["ingame_1", "ingame_2"];
  }

  // ── Call in game.js setup() ───────────────────────────────────────────────
  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("BgmManager: Web Audio API not supported.", e);
      return;
    }

    // Master gain node — all BGM goes through this
    this._masterGain = this._ctx.createGain();
    this._masterGain.gain.value = this._volumes.ingame;
    this._masterGain.connect(this._ctx.destination);

    // Load all tracks
    for (let [key, path] of Object.entries(this._files)) {
      this._loadBuffer(key, path);
    }

    // Unlock AudioContext on first user gesture
    const unlock = () => {
      if (this._unlocked || !this._ctx) return;
      this._ctx.resume().then(() => {
        this._unlocked = true;
        // If a mode was requested before unlock, start it now
        if (this._mode === "menu")
          this._startTrack("menu", true, this._volumes.menu);
        if (this._mode === "ingame") this._startIngameTrack();
      });
      document.removeEventListener("mousedown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("touchstart", unlock);
    };
    document.addEventListener("mousedown", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("touchstart", unlock);
  }

  _loadBuffer(key, path) {
    fetch(path)
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status + " loading " + path);
        return r.arrayBuffer();
      })
      .then((ab) => this._ctx.decodeAudioData(ab))
      .then((buf) => {
        this._buffers[key] = buf;
        // If we're supposed to be playing this track but it wasn't ready yet, start now
        if (this._unlocked && this._mode === "ingame" && !this._currentSource) {
          this._startIngameTrack();
        }
        if (
          this._unlocked &&
          this._mode === "menu" &&
          !this._currentSource &&
          key === "menu"
        ) {
          this._startTrack("menu", true, this._volumes.menu);
        }
      })
      .catch((e) => console.warn("BgmManager: failed to load", path, e));
  }

  // ── Internal: play a single track, optional loop, optional onended ────────
  _startTrack(key, loop, volume, onEnded) {
    if (!this._ctx || !this._buffers[key]) return;

    this._stopCurrent();

    let source = this._ctx.createBufferSource();
    source.buffer = this._buffers[key];
    source.loop = loop || false;

    this._masterGain.gain.value = volume != null ? volume : 0.3;
    source.connect(this._masterGain);

    if (!loop && onEnded) {
      source.onended = onEnded;
    }

    source.start(0);
    this._currentSource = source;
  }

  // ── Internal: stop whatever is playing ───────────────────────────────────
  _stopCurrent() {
    if (this._gapTimer) {
      clearTimeout(this._gapTimer);
      this._gapTimer = null;
    }
    if (this._currentSource) {
      try {
        this._currentSource.stop();
      } catch (e) {}
      this._currentSource.onended = null;
      this._currentSource = null;
    }
  }

  // ── Internal: start current ingame track, schedule next after it ends ─────
  _startIngameTrack() {
    if (this._mode !== "ingame") return;
    let key = this._ingameTracks[this._trackIndex];
    if (!this._buffers[key]) return; // not loaded yet — loader will retry

    this._startTrack(key, false, this._volumes.ingame, () => {
      if (this._mode !== "ingame") return;
      // 4 second gap before next track
      this._currentSource = null;
      this._gapTimer = setTimeout(() => {
        this._gapTimer = null;
        if (this._mode !== "ingame") return;
        // Advance to next track
        this._trackIndex = (this._trackIndex + 1) % this._ingameTracks.length;
        this._startIngameTrack();
      }, 4000);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  playMenu() {
    this._mode = "menu";
    this._trackIndex = 0;
    if (!this._unlocked) return; // will start after unlock
    this._startTrack("menu", true, this._volumes.menu);
  }

  playIngame() {
    this._mode = "ingame";
    this._trackIndex = 0;
    if (!this._unlocked) return; // will start after unlock
    this._startIngameTrack();
  }

  stop() {
    this._mode = "stopped";
    this._stopCurrent();
  }

  // Pause/resume BGM with the game pause system
  pause() {
    if (!this._ctx) return;
    this._ctx.suspend();
  }

  resume() {
    if (!this._ctx) return;
    this._ctx.resume();
  }
}
