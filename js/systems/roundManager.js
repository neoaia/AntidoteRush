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

    this.extraZombiesPerRound = 0;
    this.speedBonus = 0;
    this.baseHealthBonus = 0;
    this.hellMode = false;

    this.difficultyConfig = { dmgMult: 1.0, atkSpeedMult: 1.0, coinMult: 1.0 };
  }

  applyDifficulty(difficultyMode) {
    if (difficultyMode === "hard") {
      this.extraZombiesPerRound = 4;
      this.speedBonus = 0.8;
      this.baseHealthBonus = 15;
      this.hellMode = false;
      this.difficultyConfig = {
        dmgMult: 1.3,
        atkSpeedMult: 1.25,
        coinMult: 1.2,
      };
    } else if (difficultyMode === "hell") {
      this.extraZombiesPerRound = 10;
      this.speedBonus = 1.8;
      this.baseHealthBonus = 40;
      this.hellMode = true;
      this.difficultyConfig = {
        dmgMult: 1.8,
        atkSpeedMult: 1.6,
        coinMult: 1.5,
      };
    } else {
      // easy
      this.speedBonus = 0;
      this.difficultyConfig = {
        dmgMult: 1.0,
        atkSpeedMult: 1.0,
        coinMult: 1.0,
      };
    }
  }

  startRound(gameState) {
    let baseZombies =
      Math.floor(this.zombiesPerRound * Math.pow(1.35, this.currentRound - 1)) +
      this.extraZombiesPerRound;
    this.zombiesToSpawn = baseZombies;
    this.zombiesAlive = 0;
    this.roundActive = true;
    this.roundComplete = false;
    this.inIntermission = false;
    this.lastSpawnTime = pauseClock.now();

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

  update(currentTime, zombiesArray, gameState) {
    if (!this.roundActive) return null;
    this.zombiesAlive = zombiesArray.length;

    let currentTimeMs = pauseClock.now();
    if (
      this.zombiesToSpawn > 0 &&
      currentTimeMs - this.lastSpawnTime > this.spawnInterval
    ) {
      this.lastSpawnTime = currentTimeMs;
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
    if (this.currentRound <= 5) return 15;
    if (this.currentRound <= 10) return 30;
    if (this.currentRound <= 15) return 45;
    return 65;
  }

  spawnCluster(clusterSize, gameState) {
    let worldWidth = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let worldHeight =
      typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
    let spawnSide = Math.floor(Math.random() * 4);
    let spawnX = 0,
      spawnY = 0;
    if (spawnSide === 0) {
      spawnX = Math.random() * worldWidth;
      spawnY = -50;
    } else if (spawnSide === 1) {
      spawnX = worldWidth + 50;
      spawnY = Math.random() * worldHeight;
    } else if (spawnSide === 2) {
      spawnX = Math.random() * worldWidth;
      spawnY = worldHeight + 50;
    } else {
      spawnX = -50;
      spawnY = Math.random() * worldHeight;
    }

    let spawnedZombies = [];
    for (let i = 0; i < clusterSize; i++) {
      let zombieType = this.getZombieType();
      let newZombie = this.createZombie(
        spawnX + (Math.random() - 0.5) * 100,
        spawnY + (Math.random() - 0.5) * 100,
        zombieType,
        gameState,
      );
      spawnedZombies.push(newZombie);
      this.zombiesToSpawn--;
    }
    return { type: "cluster", zombies: spawnedZombies };
  }

  spawnZombie(gameState) {
    let worldWidth = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let worldHeight =
      typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
    let spawnSide = Math.floor(Math.random() * 4);
    let spawnX = 0,
      spawnY = 0;
    if (spawnSide === 0) {
      spawnX = Math.random() * worldWidth;
      spawnY = -50;
    } else if (spawnSide === 1) {
      spawnX = worldWidth + 50;
      spawnY = Math.random() * worldHeight;
    } else if (spawnSide === 2) {
      spawnX = Math.random() * worldWidth;
      spawnY = worldHeight + 50;
    } else {
      spawnX = -50;
      spawnY = Math.random() * worldHeight;
    }
    return this.createZombie(spawnX, spawnY, this.getZombieType(), gameState);
  }

  createZombie(xPosition, yPosition, zombieType, gameState) {
    if (gameState) gameState.introduceZombieType(zombieType);
    let healthMultiplier = gameState
      ? gameState.zombieHealthMultipliers[zombieType]
      : 1.0;
    let newZombie = new Zombie(
      xPosition,
      yPosition,
      zombieType,
      healthMultiplier,
      this.speedBonus,
      this.baseHealthBonus,
      this.difficultyConfig,
    );
    newZombie.initSprite(gameState);
    newZombie.applyRoundScaling(this.currentRound);
    return newZombie;
  }

  getZombieType() {
    let randomChance = Math.random() * 100;
    if (this.hellMode) {
      if (this.currentRound < 2) return randomChance < 50 ? "normal" : "witch";
      if (this.currentRound < 4) {
        if (randomChance < 25) return "normal";
        if (randomChance < 55) return "witch";
        return "crawler";
      }
      if (randomChance < 15) return "normal";
      if (randomChance < 35) return "witch";
      if (randomChance < 65) return "crawler";
      return "slasher";
    }

    if (this.currentRound < 3) return "normal";
    if (this.currentRound < 5) return randomChance < 70 ? "normal" : "witch";
    if (this.currentRound < 8) {
      if (randomChance < 50) return "normal";
      if (randomChance < 80) return "witch";
      return "crawler";
    }
    if (randomChance < 30) return "normal";
    if (randomChance < 55) return "witch";
    if (randomChance < 80) return "crawler";
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
  }
}
