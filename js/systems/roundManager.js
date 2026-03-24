class RoundManager {
  constructor() {
    this.currentRound = 1;
    this.zombiesPerRound = 6; // base count for round 1
    this.zombiesToSpawn = this.zombiesPerRound;
    this.zombiesAlive = 0;
    this.roundActive = false;
    this.roundComplete = false;

    this.inIntermission = false;
    this.intermissionDuration = 15000;
    this.intermissionStartTime = 0;
    this.intermissionTimeLeft = 0;

    this.spawnInterval = 2000;
    this.lastSpawnTime = 0;

    // Difficulty modifiers applied in applyDifficulty()
    this.extraZombiesPerRound = 0;
    this.speedBonus = 0;
    this.baseHealthBonus = 0;
    this.hellMode = false;

    // Per-difficulty config passed to every Zombie constructor so they
    // can scale damage, attack speed, and coin drops independently.
    this.difficultyConfig = { dmgMult: 1.0, atkSpeedMult: 1.0, coinMult: 1.0 };
  }

  applyDifficulty(difficulty) {
    if (difficulty === "hard") {
      this.extraZombiesPerRound = 4; // +4 extra per round on top of base growth
      this.speedBonus = 0.4;
      this.baseHealthBonus = 15;
      this.hellMode = false;
      this.difficultyConfig = {
        dmgMult: 1.3,
        atkSpeedMult: 1.25,
        coinMult: 1.2,
      };
    } else if (difficulty === "hell") {
      this.extraZombiesPerRound = 10; // +10 extra per round
      this.speedBonus = 1.0;
      this.baseHealthBonus = 40;
      this.hellMode = true;
      this.difficultyConfig = {
        dmgMult: 1.8,
        atkSpeedMult: 1.6,
        coinMult: 1.5,
      };
    } else {
      // easy — no changes to defaults
      this.difficultyConfig = {
        dmgMult: 1.0,
        atkSpeedMult: 1.0,
        coinMult: 1.0,
      };
    }
  }

  startRound(gameState) {
    // Each round the base count grows: floor(6 * 1.35^(round-1)) + extraZombiesPerRound
    let base =
      Math.floor(this.zombiesPerRound * Math.pow(1.35, this.currentRound - 1)) +
      this.extraZombiesPerRound;
    this.zombiesToSpawn = base;
    this.zombiesAlive = 0;
    this.roundActive = true;
    this.roundComplete = false;
    this.inIntermission = false;
    this.lastSpawnTime = pauseClock.now();

    // Reduce spawn interval slightly each round (floors at 800 ms)
    this.spawnInterval = Math.max(800, 2000 - (this.currentRound - 1) * 60);

    if (gameState) gameState.tickHealthMultipliers();
  }

  beginIntermission() {
    this.inIntermission = true;
    this.intermissionStartTime = pauseClock.now();
    this.intermissionTimeLeft = this.intermissionDuration;
  }

  updateIntermission() {
    if (!this.inIntermission) return false;
    this.intermissionTimeLeft = Math.max(
      0,
      this.intermissionDuration -
        (pauseClock.now() - this.intermissionStartTime),
    );
    return this.intermissionTimeLeft <= 0;
  }

  skipIntermission() {
    if (!this.inIntermission) return;
    this.intermissionTimeLeft = 0;
    this.intermissionStartTime = pauseClock.now() - this.intermissionDuration;
  }

  update(currentTime, zombies, gameState) {
    if (!this.roundActive) return null;
    this.zombiesAlive = zombies.length;

    let now = pauseClock.now();
    if (
      this.zombiesToSpawn > 0 &&
      now - this.lastSpawnTime > this.spawnInterval
    ) {
      this.lastSpawnTime = now;
      let clusterChance = this.getClusterChance();
      if (Math.random() * 100 < clusterChance && this.zombiesToSpawn >= 3) {
        let size = Math.min(
          Math.floor(Math.random() * 3) + 3,
          this.zombiesToSpawn,
        );
        return this.spawnCluster(size, gameState);
      } else {
        this.zombiesToSpawn--;
        return this.spawnZombie(gameState);
      }
    }

    if (this.zombiesToSpawn === 0 && this.zombiesAlive === 0)
      this.completeRound();
    return null;
  }

  getClusterChance() {
    if (this.currentRound <= 2) return 0;
    if (this.currentRound <= 5) return 15;
    if (this.currentRound <= 10) return 30;
    if (this.currentRound <= 15) return 45;
    return 65;
  }

  spawnCluster(clusterSize, gameState) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
    let side = Math.floor(Math.random() * 4);
    let bx = 0,
      by = 0;
    if (side === 0) {
      bx = Math.random() * W;
      by = -50;
    } else if (side === 1) {
      bx = W + 50;
      by = Math.random() * H;
    } else if (side === 2) {
      bx = Math.random() * W;
      by = H + 50;
    } else {
      bx = -50;
      by = Math.random() * H;
    }

    let zombies = [];
    for (let i = 0; i < clusterSize; i++) {
      let type = this.getZombieType();
      let z = this.createZombie(
        bx + (Math.random() - 0.5) * 100,
        by + (Math.random() - 0.5) * 100,
        type,
        gameState,
      );
      zombies.push(z);
      this.zombiesToSpawn--;
    }
    return { type: "cluster", zombies };
  }

  spawnZombie(gameState) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
    let side = Math.floor(Math.random() * 4);
    let sx = 0,
      sy = 0;
    if (side === 0) {
      sx = Math.random() * W;
      sy = -50;
    } else if (side === 1) {
      sx = W + 50;
      sy = Math.random() * H;
    } else if (side === 2) {
      sx = Math.random() * W;
      sy = H + 50;
    } else {
      sx = -50;
      sy = Math.random() * H;
    }
    return this.createZombie(sx, sy, this.getZombieType(), gameState);
  }

  createZombie(x, y, type, gameState) {
    if (gameState) gameState.introduceZombieType(type);
    let mult = gameState ? gameState.zombieHealthMultipliers[type] : 1.0;
    let z = new Zombie(
      x,
      y,
      type,
      mult,
      this.speedBonus,
      this.baseHealthBonus,
      this.difficultyConfig, // <-- new param
    );
    z.initSprite(gameState);
    z.applyRoundScaling(this.currentRound);
    return z;
  }

  getZombieType() {
    let rand = Math.random() * 100;
    if (this.hellMode) {
      if (this.currentRound < 2) return rand < 50 ? "normal" : "witch";
      if (this.currentRound < 4) {
        if (rand < 25) return "normal";
        if (rand < 55) return "witch";
        return "crawler";
      }
      if (rand < 15) return "normal";
      if (rand < 35) return "witch";
      if (rand < 65) return "crawler";
      return "slasher";
    }

    // Easy / Hard
    if (this.currentRound < 3) return "normal";
    if (this.currentRound < 5) return rand < 70 ? "normal" : "witch";
    if (this.currentRound < 8) {
      if (rand < 50) return "normal";
      if (rand < 80) return "witch";
      return "crawler";
    }
    if (rand < 30) return "normal";
    if (rand < 55) return "witch";
    if (rand < 80) return "crawler";
    return "slasher";
  }

  completeRound() {
    this.roundActive = false;
    this.roundComplete = true;
  }

  nextRound() {
    this.currentRound++;
    this.roundComplete = false;
    this.inIntermission = false;
    // zombiesPerRound stays as the base seed; startRound() handles exponential growth
  }
}
