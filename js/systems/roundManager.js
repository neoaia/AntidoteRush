class RoundManager {
  constructor() {
    this.currentRound = 1;
    this.zombiesPerRound = 5;
    this.zombiesToSpawn = this.zombiesPerRound;
    this.zombiesAlive = 0;
    this.roundActive = false;
    this.roundComplete = false;

    this.spawnInterval = 2000;
    this.lastSpawnTime = 0;

    // Difficulty modifiers (set from game.js after construction)
    this.extraZombiesPerRound = 0; // hard: +10, hell: +20
    this.speedBonus = 0; // hard: +0.5, hell: +1.5
    this.baseHealthBonus = 0; // hell: +20
    this.hellMode = false; // hell: spawn hard zombies earlier
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

    // Tick health multipliers at the start of each new round
    if (gameState) gameState.tickHealthMultipliers();
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
        let clusterSize = Math.min(
          Math.floor(Math.random() * 3) + 3,
          this.zombiesToSpawn,
        );
        return this.spawnCluster(clusterSize, gameState);
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
    let spawnSide = Math.floor(Math.random() * 4);
    let baseX = 0,
      baseY = 0;
    if (spawnSide === 0) {
      baseX = Math.random() * width;
      baseY = -50;
    } else if (spawnSide === 1) {
      baseX = width + 50;
      baseY = Math.random() * height;
    } else if (spawnSide === 2) {
      baseX = Math.random() * width;
      baseY = height + 50;
    } else {
      baseX = -50;
      baseY = Math.random() * height;
    }

    let clusterZombies = [];
    for (let i = 0; i < clusterSize; i++) {
      let offX = (Math.random() - 0.5) * 100;
      let offY = (Math.random() - 0.5) * 100;
      let type = this.getZombieType();
      let z = this.createZombie(baseX + offX, baseY + offY, type, gameState);
      clusterZombies.push(z);
      this.zombiesToSpawn--;
    }
    return { type: "cluster", zombies: clusterZombies };
  }

  spawnZombie(gameState) {
    let spawnSide = Math.floor(Math.random() * 4);
    let spawnX = 0,
      spawnY = 0;
    if (spawnSide === 0) {
      spawnX = Math.random() * width;
      spawnY = -50;
    } else if (spawnSide === 1) {
      spawnX = width + 50;
      spawnY = Math.random() * height;
    } else if (spawnSide === 2) {
      spawnX = Math.random() * width;
      spawnY = height + 50;
    } else {
      spawnX = -50;
      spawnY = Math.random() * height;
    }

    let type = this.getZombieType();
    return this.createZombie(spawnX, spawnY, type, gameState);
  }

  createZombie(x, y, type, gameState) {
    // Mark type as introduced (health scaling starts NEXT round)
    if (gameState) gameState.introduceZombieType(type);

    // Get current health multiplier for this type
    let healthMult = gameState ? gameState.zombieHealthMultipliers[type] : 1.0;

    return new Zombie(
      x,
      y,
      type,
      healthMult,
      this.speedBonus,
      this.baseHealthBonus,
    );
  }

  getZombieType() {
    let rand = Math.random() * 100;

    if (this.hellMode) {
      // Hell: spawn hard zombies from the start
      if (this.currentRound < 2) {
        if (rand < 50) return "normal";
        return "witch";
      } else if (this.currentRound < 4) {
        if (rand < 30) return "normal";
        if (rand < 60) return "witch";
        return "crawler";
      } else {
        if (rand < 20) return "normal";
        if (rand < 40) return "witch";
        if (rand < 65) return "crawler";
        return "slasher";
      }
    }

    // Normal / Hard mode zombie type table
    if (this.currentRound < 3) return "normal";
    if (this.currentRound < 5) {
      return rand < 70 ? "normal" : "witch";
    }
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
  }
}
