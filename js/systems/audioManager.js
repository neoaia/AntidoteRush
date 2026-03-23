class AudioManager {
  constructor() {
    this._ctx = null;
    this._buffers = {};
    this._unlocked = false;
    this._pending = [];

    this._lastPlayed = {};
    this._activeCounts = {};

    // ── Volume multipliers ──────────────────────────────────────────────────
    this._masterVolume = 1.0;
    this._bgmVolume = 1.0;
    this._sfxVolume = 1.0;

    this._volumes = {
      fire: { handgun: 0.7, rifle: 0.55, shotgun: 0.9, sniper: 0.85 },
      reload: { handgun: 0.5, rifle: 0.5, shotgun: 0.6, sniper: 0.55 },
      melee: { knife_swing: 0.6, knife_attack: 0.8 },
      zombie_attack: { normal: 0.4, crawler: 0.3, slasher: 0.3, witch: 0.3 },
      zombie_hurt_layer: {
        normal: 0.28,
        crawler: 0.28,
        slasher: 0.32,
        witch: 0.28,
      },
      zombie_type_layer: {
        normal: 0.22,
        crawler: 0.22,
        slasher: 0.26,
        witch: 0.22,
      },
      zombie_dead_layer: 0.4,
      player: { hurt: 0.75, dead: 0.85 },
      explosion: 0.9,
      equip: 0.7,
      level_up: 0.85,
      pickup: 0.75,
      retrieve: 0.8,
      purchase: 0.7,
      round_start: 0.75,
      error: 0.6,
      hover: 0.45,
      select: 0.6,
    };

    this._maxConcurrent = {
      zombie_hurt: 2,
      zombie_dead: 2,
      zombie_type_normal: 2,
      zombie_type_crawler: 2,
      zombie_type_slasher: 2,
      zombie_type_witch: 2,
      zombie_atk_normal: 1,
      zombie_atk_crawler: 1,
      zombie_atk_slasher: 1,
      zombie_atk_witch: 1,
      explosion: 1,
      player_hurt: 1,
      player_dead: 1,
      hover: 1,
      select: 2,
    };

    this._rateLimit = {
      zombie_hurt: 60,
      zombie_dead: 80,
      zombie_type_normal: 60,
      zombie_type_crawler: 60,
      zombie_type_slasher: 60,
      zombie_type_witch: 60,
      zombie_atk_normal: 300,
      zombie_atk_crawler: 300,
      zombie_atk_slasher: 400,
      zombie_atk_witch: 500,
      player_hurt: 200,
      player_dead: 0,
      explosion: 0,
      hover: 80,
      select: 0,
    };

    this._files = {
      fire_handgun: "../assets/audios/guns/fire/handgun.mp3",
      fire_rifle: "../assets/audios/guns/fire/rifle.mp3",
      fire_shotgun: "../assets/audios/guns/fire/shotgun.mp3",
      fire_sniper: "../assets/audios/guns/fire/sniper.mp3",
      reload_handgun: "../assets/audios/guns/reload/handgun.mp3",
      reload_rifle: "../assets/audios/guns/reload/rifle.mp3",
      reload_shotgun: "../assets/audios/guns/reload/shotgun.mp3",
      reload_sniper: "../assets/audios/guns/reload/sniper.mp3",
      knife_swing: "../assets/audios/guns/knife_swing.wav",
      knife_attack: "../assets/audios/guns/knife_attack.wav",
      zombie_atk_normal: "../assets/audios/zombies/attack/normal.wav",
      zombie_atk_crawler: "../assets/audios/zombies/attack/crawler.wav",
      zombie_atk_slasher: "../assets/audios/zombies/attack/slasher.wav",
      zombie_atk_witch: "../assets/audios/zombies/attack/witch.mp3",
      zombie_type_normal: "../assets/audios/zombies/hurt/normal.wav",
      zombie_type_crawler: "../assets/audios/zombies/hurt/crawler.wav",
      zombie_type_slasher: "../assets/audios/zombies/hurt/slasher.wav",
      zombie_type_witch: "../assets/audios/zombies/hurt/witch.wav",
      zombie_hurt: "../assets/audios/zombies/hurt/hurt.wav",
      zombie_dead: "../assets/audios/zombies/hurt/dead.wav",
      player_hurt: "../assets/audios/player/hurt.mp3",
      player_dead: "../assets/audios/player/dead.mp3",
      explosion: "../assets/audios/zombies/attack/explosion.mp3",
      equip: "../assets/audios/guns/equip.mp3",
      level_up: "../assets/audios/misc/level_up.mp3",
      pickup: "../assets/audios/misc/pickup.mp3",
      retrieve: "../assets/audios/misc/retrieve.mp3",
      purchase: "../assets/audios/misc/purchase.mp3",
      round_start: "../assets/audios/misc/round-start.mp3",
      error: "../assets/audios/gui/error.mp3",
      hover: "../assets/audios/gui/hover.mp3",
      select: "../assets/audios/gui/select.mp3",
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
        if (!r.ok) throw new Error("HTTP " + r.status);
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

      let now = performance.now();
      let minGap = this._rateLimit[bufferKey] || 0;
      if (minGap > 0 && now - (this._lastPlayed[bufferKey] || 0) < minGap)
        return;

      let maxC = this._maxConcurrent[bufferKey];
      let active = this._activeCounts[bufferKey] || 0;
      if (maxC !== undefined && active >= maxC) return;

      this._lastPlayed[bufferKey] = now;
      this._activeCounts[bufferKey] = active + 1;

      let source = this._ctx.createBufferSource();
      source.buffer = buf;
      let gain = this._ctx.createGain();
      // Apply master * sfx multipliers
      gain.gain.value =
        (volume != null ? volume : 1.0) * this._masterVolume * this._sfxVolume;
      source.connect(gain);
      gain.connect(this._ctx.destination);
      source.onended = () => {
        this._activeCounts[bufferKey] = Math.max(
          0,
          (this._activeCounts[bufferKey] || 1) - 1,
        );
      };
      source.start(0);
    };

    if (this._unlocked) doPlay();
    else if (this._pending.length < 4) this._pending.push(doPlay);
  }

  _playGui(bufferKey, volume) {
    if (!this._ctx) return;
    const doPlay = () => {
      let buf = this._buffers[bufferKey];
      if (!buf) return;
      let now = performance.now();
      let minGap = this._rateLimit[bufferKey] || 0;
      if (minGap > 0 && now - (this._lastPlayed[bufferKey] || 0) < minGap)
        return;
      let maxC = this._maxConcurrent[bufferKey];
      let active = this._activeCounts[bufferKey] || 0;
      if (maxC !== undefined && active >= maxC) return;
      this._lastPlayed[bufferKey] = now;
      this._activeCounts[bufferKey] = active + 1;
      let source = this._ctx.createBufferSource();
      source.buffer = buf;
      let gain = this._ctx.createGain();
      gain.gain.value =
        (volume != null ? volume : 1.0) * this._masterVolume * this._sfxVolume;
      source.connect(gain);
      gain.connect(this._ctx.destination);
      source.onended = () => {
        this._activeCounts[bufferKey] = Math.max(
          0,
          (this._activeCounts[bufferKey] || 1) - 1,
        );
      };
      source.start(0);
    };
    if (this._unlocked) doPlay();
    else if (this._pending.length < 4) this._pending.push(doPlay);
  }

  // ── Volume control ────────────────────────────────────────────────────────
  setMasterVolume(v) {
    this._masterVolume = Math.max(0, Math.min(1, v));
    this._syncBgm();
  }
  setBgmVolume(v) {
    this._bgmVolume = Math.max(0, Math.min(1, v));
    this._syncBgm();
  }
  setSfxVolume(v) {
    this._sfxVolume = Math.max(0, Math.min(1, v));
  }
  getMasterVolume() {
    return this._masterVolume;
  }
  getBgmVolume() {
    return this._bgmVolume;
  }
  getSfxVolume() {
    return this._sfxVolume;
  }
  _syncBgm() {
    if (typeof bgmManager !== "undefined")
      bgmManager.setVolumeMultiplier(this._masterVolume * this._bgmVolume);
  }

  // ── Gun sounds ────────────────────────────────────────────────────────────
  playFire(weaponName) {
    let k = this._keyFor(weaponName);
    if (k) this._play("fire_" + k, this._volumes.fire[k] || 0.7);
  }
  playReload(weaponName) {
    let k = this._keyFor(weaponName);
    if (k) this._play("reload_" + k, this._volumes.reload[k] || 0.5);
  }

  // ── Melee ─────────────────────────────────────────────────────────────────
  playKnifeSwing() {
    this._play("knife_swing", this._volumes.melee.knife_swing);
  }
  playKnifeHit() {
    this._play("knife_attack", this._volumes.melee.knife_attack);
  }

  // ── Zombie attack ─────────────────────────────────────────────────────────
  playZombieAttack(zombieType) {
    let key = "zombie_atk_" + zombieType;
    if (!this._files[key]) return;
    this._play(key, this._volumes.zombie_attack[zombieType] || 0.65);
  }

  // ── Zombie hurt / dead ────────────────────────────────────────────────────
  playZombieHurt(zombieType, skipGeneric) {
    if (!skipGeneric)
      this._play(
        "zombie_hurt",
        this._volumes.zombie_hurt_layer[zombieType] || 0.28,
      );
    let typeKey = "zombie_type_" + zombieType;
    if (this._files[typeKey])
      this._play(typeKey, this._volumes.zombie_type_layer[zombieType] || 0.22);
  }
  playZombieDead(zombieType, skipGeneric) {
    if (!skipGeneric)
      this._play("zombie_dead", this._volumes.zombie_dead_layer || 0.4);
    let typeKey = "zombie_type_" + zombieType;
    if (this._files[typeKey])
      this._play(typeKey, this._volumes.zombie_type_layer[zombieType] || 0.22);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  playPlayerHurt() {
    this._play("player_hurt", this._volumes.player.hurt);
  }
  playPlayerDead() {
    this._play("player_dead", this._volumes.player.dead);
  }

  // ── Misc ──────────────────────────────────────────────────────────────────
  playExplosion() {
    this._play("explosion", this._volumes.explosion);
  }
  playEquip() {
    this._play("equip", this._volumes.equip);
  }
  playLevelUp() {
    this._play("level_up", this._volumes.level_up);
  }
  playPickup() {
    this._play("pickup", this._volumes.pickup);
  }
  playRetrieve() {
    this._play("retrieve", this._volumes.retrieve);
  }
  playPurchase() {
    this._play("purchase", this._volumes.purchase);
  }
  playRoundStart() {
    this._play("round_start", this._volumes.round_start);
  }
  playError() {
    this._play("error", this._volumes.error);
  }

  // ── GUI ───────────────────────────────────────────────────────────────────
  playHover() {
    this._playGui("hover", this._volumes.hover);
  }
  playSelect() {
    this._playGui("select", this._volumes.select);
  }

  stopAll() {}
}
