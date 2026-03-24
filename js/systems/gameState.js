class GameState {
  constructor() {
    this.playerName = null;
    this.inputMethod = null;
    this.difficulty = "easy";
    this.coins = 0;
    this.score = 0;
    this.zombiesKilled = 0;
    this.gameOver = false;
    this.roundTransitioning = false;

    this.bullets = [];
    this.zombies = [];
    this.weaponPickups = [];
    this.scorePopups = [];
    this.explosions = [];

    this.player = null;
    this.roundManager = null;
    this.base = null;

    this.currentAntidote = null;
    this.playerHasAntidote = false;
    this.nextAntidoteSpawnTime = 0;
    this.antidoteCanSpawn = true;

    this.meleeSlashActive = false;
    this.meleeSlashAngle = 0;
    this.meleeSlashStartTime = 0;
    this.meleeSlashDuration = 200;

    // EXP / level
    this.exp = 0;
    this.level = 1;
    this.expToNextLevel = 100;

    this.introductedZombieTypes = {};
    this.zombieHealthMultipliers = {
      normal: 1.0,
      witch: 1.0,
      crawler: 1.0,
      slasher: 1.0,
      tank: 1.0,
    };

    // ── Object pools (initialised after p5 is ready) ──────────────────
    // We defer creation to the first addBullet / _makePopup call so that
    // the Bullet constructor can safely reference p5 globals.
    this._bulletPool = null;
    this._popupPool = null;
  }

  // ── Pool lazy-init ──────────────────────────────────────────────────────

  _ensureBulletPool() {
    if (this._bulletPool) return;
    this._bulletPool = new ObjectPool(
      // factory — create a placeholder Bullet (values filled in by reset)
      () => {
        const b = Object.create(Bullet.prototype);
        b.hitZombies = new Set();
        return b;
      },
      // reset — re-initialise for reuse (mirrors the Bullet constructor)
      (b, x, y, targetX, targetY, damage, options = {}) => {
        b.x = x;
        b.y = y;
        b.size = options.size || 5;
        b.speed = options.speed || 10;
        b.color = options.color || "#594e1e";
        b.active = true;
        b.damage = damage;

        b.knockback = options.knockback || 0;
        b.piercing = options.piercing || false;
        b.maxPierce = options.maxPierce || 0;
        b.pierceCount = 0;
        b.pierceDamageFalloff = options.pierceDamageFalloff || 0.6;
        b.hitZombies.clear(); // reuse the Set — clear is cheaper than new Set()

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        b.velocityX = (dx / dist) * b.speed;
        b.velocityY = (dy / dist) * b.speed;
      },
      30, // pre-warm with 30 bullets
    );
  }

  _ensurePopupPool() {
    if (this._popupPool) return;
    this._popupPool = new ObjectPool(
      () => ({}),
      (p, x, y, value, flags, lifetime) => {
        // Clear any stale flags from previous use
        p.isCoin = false;
        p.isExp = false;
        p.isDamage = false;
        p.isPlayerDamage = false;
        p.isLevelUp = false;

        p.x = x;
        p.y = y;
        p.value = value;
        Object.assign(p, flags);
        p.spawnTime = millis();
        p.pausedMsAtSpawn = pauseClock.totalPausedMs();
        p.lifetime = lifetime || 1200;
      },
      50, // pre-warm with 50 popups
    );
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  initialize(playerName, inputMethod, difficulty) {
    this.playerName = playerName || "Player";
    this.inputMethod = inputMethod || "mouse";
    this.difficulty = difficulty || "easy";
  }

  reset() {
    // Release all pooled bullets back to the pool
    if (this._bulletPool) {
      for (const b of this.bullets) this._bulletPool.release(b);
    }
    // Release all pooled popups
    if (this._popupPool) {
      for (const p of this.scorePopups) this._popupPool.release(p);
    }

    this.coins = 0;
    this.score = 0;
    this.zombiesKilled = 0;
    this.gameOver = false;
    this.roundTransitioning = false;
    this.bullets = [];
    this.zombies = [];
    this.weaponPickups = [];
    this.scorePopups = [];
    this.explosions = [];
    this.currentAntidote = null;
    this.playerHasAntidote = false;
    this.antidoteCanSpawn = true;
    this.exp = 0;
    this.level = 1;
    this.expToNextLevel = 100;
    this.introductedZombieTypes = {};
    this.zombieHealthMultipliers = {
      normal: 1,
      witch: 1,
      crawler: 1,
      slasher: 1,
      tank: 1,
    };
  }

  // ── Bullet management (pooled) ─────────────────────────────────────────

  /**
   * Create a bullet using the pool and push it into the active list.
   * Accepts the same arguments as `new Bullet(x, y, tx, ty, dmg, opts)`.
   */
  addBullet(x, y, targetX, targetY, damage, options) {
    this._ensureBulletPool();
    const b = this._bulletPool.acquire(x, y, targetX, targetY, damage, options);
    this.bullets.push(b);
  }

  /**
   * Legacy overload: if a pre-constructed Bullet object is passed directly
   * (e.g. from combatManager before it's updated to use the pool),
   * just push it without pooling.
   */
  addBulletDirect(b) {
    this.bullets.push(b);
  }

  removeBullet(i) {
    const b = this.bullets[i];
    this.bullets.splice(i, 1);
    // Return to pool only if we own it
    if (this._bulletPool && b) this._bulletPool.release(b);
  }

  // ── Zombie management ──────────────────────────────────────────────────

  addZombie(z) {
    this.zombies.push(z);
  }
  addZombies(arr) {
    for (const z of arr) this.zombies.push(z);
  }

  removeZombie(i) {
    const z = this.zombies[i];
    if (z && !z.active) {
      this.zombiesKilled++;
      const scoreMap = {
        normal: 100,
        witch: 200,
        crawler: 250,
        slasher: 500,
        tank: 1000,
      };
      this.score += scoreMap[z.type] || 100;
    }
    this.zombies.splice(i, 1);
  }

  addCoins(n) {
    this.coins += n;
  }

  // ── EXP / Levelling ───────────────────────────────────────────────────

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNextLevel) {
      this.exp -= this.expToNextLevel;
      this.level++;
      this.expToNextLevel = Math.floor(this.expToNextLevel * 1.4);

      if (typeof audioManager !== "undefined") audioManager.playLevelUp();

      if (this.player) {
        this.spawnLevelUpPopup(
          this.player.x,
          this.player.y - this.player.size / 2 - 30,
        );
        this.player.health = this.player.maxHealth;
        this.player.stamina = this.player.maxStamina;
        this.player.applyLevelUpBoost(3000);
      }
    }
  }

  // ── Misc state ─────────────────────────────────────────────────────────

  spawnExplosion(x, y, radius) {
    this.explosions.push({ x, y, radius, startTime: pauseClock.now() });
  }

  introduceZombieType(type) {
    if (!this.introductedZombieTypes[type])
      this.introductedZombieTypes[type] = true;
  }

  tickHealthMultipliers() {
    const g = 0.005;
    for (const t of Object.keys(this.zombieHealthMultipliers)) {
      if (this.introductedZombieTypes[t]) this.zombieHealthMultipliers[t] += g;
    }
  }

  // ── Score popups (pooled) ──────────────────────────────────────────────

  _makePopup(x, y, value, flags, lifetime) {
    this._ensurePopupPool();
    const p = this._popupPool.acquire(x, y, value, flags, lifetime);
    this.scorePopups.push(p);
    return p;
  }

  spawnCoinPopup(x, y, amount) {
    this._makePopup(x, y, amount, { isCoin: true });
  }
  spawnExpPopup(x, y, amount) {
    this._makePopup(x, y, amount, { isExp: true });
  }
  spawnDamagePopup(x, y, amount) {
    this._makePopup(x, y, Math.round(amount), { isDamage: true }, 800);
  }
  spawnPlayerDamagePopup(x, y, amount) {
    this._makePopup(x, y, Math.round(amount), { isPlayerDamage: true }, 900);
  }
  spawnLevelUpPopup(x, y) {
    this._makePopup(x, y, "LEVEL UP!", { isLevelUp: true }, 2000);
  }

  updateScorePopups() {
    const now = millis();
    const totalPaused = pauseClock.totalPausedMs();
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const p = this.scorePopups[i];
      const pausedSinceSpawn = totalPaused - p.pausedMsAtSpawn;
      const elapsed = now - p.spawnTime - pausedSinceSpawn;
      if (elapsed > p.lifetime) {
        const expired = this.scorePopups.splice(i, 1)[0];
        if (this._popupPool) this._popupPool.release(expired);
      }
    }
  }
}
