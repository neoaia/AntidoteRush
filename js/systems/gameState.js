class GameState {
  constructor() {
    this.playerName = null;
    this.inputMethod = null;
    this.difficulty = "easy";
    this.coins = 0;
    this.gameOver = false;
    this.roundTransitioning = false;

    this.bullets = [];
    this.zombies = [];
    this.weaponPickups = [];
    this.scorePopups = [];
    this.explosions = []; // crawler death explosions

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
  }

  initialize(playerName, inputMethod, difficulty) {
    this.playerName = playerName || "Player";
    this.inputMethod = inputMethod || "mouse";
    this.difficulty = difficulty || "easy";
  }

  reset() {
    this.coins = 0;
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

  addBullet(b) {
    this.bullets.push(b);
  }
  addZombie(z) {
    this.zombies.push(z);
  }
  addZombies(arr) {
    for (let z of arr) this.zombies.push(z);
  }
  removeBullet(i) {
    this.bullets.splice(i, 1);
  }
  removeZombie(i) {
    this.zombies.splice(i, 1);
  }
  addCoins(n) {
    this.coins += n;
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNextLevel) {
      this.exp -= this.expToNextLevel;
      this.level++;
      this.expToNextLevel = Math.floor(this.expToNextLevel * 1.4);

      if (typeof audioManager !== "undefined") audioManager.playLevelUp();

      // ── Level up effects ────────────────────────────────────────────────
      // 1. Spawn "LEVEL UP!" popup above player
      if (this.player) {
        this.spawnLevelUpPopup(
          this.player.x,
          this.player.y - this.player.size / 2 - 30,
        );
      }

      // 2. Fully restore health and stamina
      if (this.player) {
        this.player.health = this.player.maxHealth;
        this.player.stamina = this.player.maxStamina;
      }

      // 3. Apply 3-second movement speed boost
      if (this.player) {
        this.player.applyLevelUpBoost(3000);
      }
    }
  }

  // Spawn a visual explosion at world position (x, y) with given radius
  spawnExplosion(x, y, radius) {
    this.explosions.push({ x, y, radius, startTime: pauseClock.now() });
  }

  introduceZombieType(type) {
    if (!this.introductedZombieTypes[type])
      this.introductedZombieTypes[type] = true;
  }

  tickHealthMultipliers() {
    const g = 0.005;
    for (let t of Object.keys(this.zombieHealthMultipliers))
      if (this.introductedZombieTypes[t]) this.zombieHealthMultipliers[t] += g;
  }

  // ── Popups (spawnTime in real millis, pausedMsAtSpawn for correct progress) ─
  _makePopup(x, y, value, flags, lifetime) {
    return {
      x,
      y,
      value,
      ...flags,
      spawnTime: millis(),
      pausedMsAtSpawn: pauseClock.totalPausedMs(),
      lifetime: lifetime || 1200,
    };
  }

  spawnCoinPopup(x, y, amount) {
    this.scorePopups.push(this._makePopup(x, y, amount, { isCoin: true }));
  }

  spawnExpPopup(x, y, amount) {
    this.scorePopups.push(this._makePopup(x, y, amount, { isExp: true }));
  }

  spawnDamagePopup(x, y, amount) {
    this.scorePopups.push(
      this._makePopup(x, y, Math.round(amount), { isDamage: true }, 800),
    );
  }

  spawnPlayerDamagePopup(x, y, amount) {
    this.scorePopups.push(
      this._makePopup(x, y, Math.round(amount), { isPlayerDamage: true }, 900),
    );
  }

  spawnLevelUpPopup(x, y) {
    this.scorePopups.push(
      this._makePopup(x, y, "LEVEL UP!", { isLevelUp: true }, 2000),
    );
  }

  updateScorePopups() {
    let now = millis();
    let totalPaused = pauseClock.totalPausedMs();
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      let p = this.scorePopups[i];
      let pausedSinceSpawn = totalPaused - p.pausedMsAtSpawn;
      let elapsed = now - p.spawnTime - pausedSinceSpawn;
      if (elapsed > p.lifetime) this.scorePopups.splice(i, 1);
    }
  }
}
