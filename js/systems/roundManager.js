class RoundManager {
  constructor() {
    this.currentRound = 1;
    this.zombiesPerRound = 5;
    this.zombiesToSpawn = this.zombiesPerRound;
    this.zombiesAlive = 0;
    this.roundActive = false;
    this.roundComplete = false;

    // Between-round intermission
    this.inIntermission = false;
    this.intermissionDuration = 45000; // 45 seconds
    this.intermissionStartTime = 0;
    this.intermissionTimeLeft = 0; // ms remaining (read by UI)

    this.spawnInterval = 2000;
    this.lastSpawnTime = 0;

    // Difficulty modifiers
    this.extraZombiesPerRound = 0;
    this.speedBonus = 0;
    this.baseHealthBonus = 0;
    this.hellMode = false;
  }

  applyDifficulty(difficulty) {
    if (difficulty === "hard") {
      this.extraZombiesPerRound = 10;
      this.speedBonus = 0.5;
      this.baseHealthBonus = 0;
      this.hellMode = false;
    } else if (difficulty === "hell") {
      this.extraZombiesPerRound = 20;
      this.speedBonus = 1.5;
      this.baseHealthBonus = 20;
      this.hellMode = true;
    }
  }

  startRound(gameState) {
    let base = this.zombiesPerRound + this.extraZombiesPerRound;
    this.zombiesToSpawn = base;
    this.zombiesAlive = 0;
    this.roundActive = true;
    this.roundComplete = false;
    this.inIntermission = false;
    if (gameState) gameState.tickHealthMultipliers();
  }

  // Called after roundComplete is set — begins the 45s intermission
  beginIntermission() {
    this.inIntermission = true;
    this.intermissionStartTime = millis();
  }

  // Returns true when intermission is over (time up or skipped)
  updateIntermission() {
    if (!this.inIntermission) return false;
    this.intermissionTimeLeft = Math.max(
      0,
      this.intermissionDuration - (millis() - this.intermissionStartTime),
    );
    return this.intermissionTimeLeft <= 0;
  }

  // Player pressed Enter — skip countdown
  skipIntermission() {
    if (!this.inIntermission) return;
    this.intermissionTimeLeft = 0;
    this.intermissionStartTime = millis() - this.intermissionDuration;
  }

  update(currentTime, zombies, gameState) {
    if (!this.roundActive) return null;
    this.zombiesAlive = zombies.length;

    if (
      this.zombiesToSpawn > 0 &&
      currentTime - this.lastSpawnTime > this.spawnInterval
    ) {
      this.lastSpawnTime = currentTime;
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
    if (this.currentRound <= 5) return 10;
    if (this.currentRound <= 10) return 25;
    if (this.currentRound <= 15) return 40;
    return 60;
  }

  spawnCluster(clusterSize, gameState) {
    let side = Math.floor(Math.random() * 4);
    let bx = 0,
      by = 0;
    if (side === 0) {
      bx = Math.random() * width;
      by = -50;
    } else if (side === 1) {
      bx = width + 50;
      by = Math.random() * height;
    } else if (side === 2) {
      bx = Math.random() * width;
      by = height + 50;
    } else {
      bx = -50;
      by = Math.random() * height;
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
    let side = Math.floor(Math.random() * 4);
    let sx = 0,
      sy = 0;
    if (side === 0) {
      sx = Math.random() * width;
      sy = -50;
    } else if (side === 1) {
      sx = width + 50;
      sy = Math.random() * height;
    } else if (side === 2) {
      sx = Math.random() * width;
      sy = height + 50;
    } else {
      sx = -50;
      sy = Math.random() * height;
    }
    return this.createZombie(sx, sy, this.getZombieType(), gameState);
  }

  createZombie(x, y, type, gameState) {
    if (gameState) gameState.introduceZombieType(type);
    let mult = gameState ? gameState.zombieHealthMultipliers[type] : 1.0;
    return new Zombie(x, y, type, mult, this.speedBonus, this.baseHealthBonus);
  }

  getZombieType() {
    let rand = Math.random() * 100;
    if (this.hellMode) {
      if (this.currentRound < 2) return rand < 50 ? "normal" : "witch";
      if (this.currentRound < 4) {
        if (rand < 30) return "normal";
        if (rand < 60) return "witch";
        return "crawler";
      }
      if (rand < 20) return "normal";
      if (rand < 40) return "witch";
      if (rand < 65) return "crawler";
      return "slasher";
    }
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
    this.zombiesPerRound = Math.floor(this.zombiesPerRound * 1.5);
    this.roundComplete = false;
    this.inIntermission = false;
  }
}
