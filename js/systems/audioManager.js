/**
 * AudioManager — Web Audio API based sound manager.
 *
 * ── VOLUME SETTINGS ──────────────────────────────────────────────────────────
 * Adjust the numbers in _volumes below. Range: 0.0 (silent) to 1.0 (full).
 * ─────────────────────────────────────────────────────────────────────────────
 */
class AudioManager {
  constructor() {
    this._ctx = null;
    this._buffers = {};
    this._unlocked = false;
    this._pending = [];

    // ── ADJUST VOLUMES HERE ─────────────────────────────────────────────────
    this._volumes = {
      fire: {
        handgun: 0.7,
        rifle: 0.55,
        shotgun: 0.9,
        sniper: 0.85,
      },
      reload: {
        handgun: 0.5,
        rifle: 0.5,
        shotgun: 0.6,
        sniper: 0.55,
      },
    };
    // ────────────────────────────────────────────────────────────────────────

    this._files = {
      fire_handgun: "../assets/audios/guns/fire/handgun.mp3",
      fire_rifle: "../assets/audios/guns/fire/rifle.mp3",
      fire_shotgun: "../assets/audios/guns/fire/shotgun.mp3",
      fire_sniper: "../assets/audios/guns/fire/sniper.mp3",
      reload_handgun: "../assets/audios/guns/reload/handgun.mp3",
      reload_rifle: "../assets/audios/guns/reload/rifle.mp3",
      reload_shotgun: "../assets/audios/guns/reload/shotgun.mp3",
      reload_sniper: "../assets/audios/guns/reload/sniper.mp3",
    };
  }

  _keyFor(weaponName) {
    if (!weaponName) return null;
    let n = weaponName.toLowerCase();
    if (n.includes("handgun") || n.includes("pistol")) return "handgun";
    if (n.includes("rifle") || n.includes("auto")) return "rifle";
    if (n.includes("shotgun")) return "shotgun";
    if (n.includes("sniper")) return "sniper";
    return null;
  }

  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("AudioManager: Web Audio API not supported.", e);
      return;
    }

    for (let [key, path] of Object.entries(this._files)) {
      this._loadBuffer(key, path);
    }

    const unlock = () => {
      if (this._unlocked || !this._ctx) return;
      this._ctx.resume().then(() => {
        this._unlocked = true;
        for (let fn of this._pending) fn();
        this._pending = [];
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
      })
      .catch((e) => console.warn("AudioManager: failed to load", path, e));
  }

  _play(bufferKey, volume) {
    if (!this._ctx) return;
    if (typeof pauseClock !== "undefined" && pauseClock.isPaused()) return;

    const doPlay = () => {
      let buf = this._buffers[bufferKey];
      if (!buf) return;
      let source = this._ctx.createBufferSource();
      source.buffer = buf;
      let gain = this._ctx.createGain();
      gain.gain.value = volume != null ? volume : 1.0;
      source.connect(gain);
      gain.connect(this._ctx.destination);
      source.start(0);
    };

    if (this._unlocked) {
      doPlay();
    } else {
      if (this._pending.length < 4) this._pending.push(doPlay);
    }
  }

  playFire(weaponName) {
    let key = this._keyFor(weaponName);
    if (!key) return;
    this._play("fire_" + key, this._volumes.fire[key] || 0.7);
  }

  playReload(weaponName) {
    let key = this._keyFor(weaponName);
    if (!key) return;
    this._play("reload_" + key, this._volumes.reload[key] || 0.5);
  }

  stopAll() {
    // One-shot BufferSource nodes auto-GC — nothing to stop.
    // Pause flag in _play() prevents new sounds while paused.
  }
}
