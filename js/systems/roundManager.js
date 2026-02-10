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
  }

  startRound() {
    this.zombiesToSpawn = this.zombiesPerRound;
    this.zombiesAlive = 0;
    this.roundActive = true;
    this.roundComplete = false;
  }

  update(currentTime, zombies) {
    if (!this.roundActive) {
      return null;
    }

    this.zombiesAlive = zombies.length;

    if (
      this.zombiesToSpawn > 0 &&
      currentTime - this.lastSpawnTime > this.spawnInterval
    ) {
      this.lastSpawnTime = currentTime;

      // Check if this spawn should be a cluster/horde
      let clusterChance = this.getClusterChance();
      let shouldSpawnCluster = Math.random() * 100 < clusterChance;

      if (shouldSpawnCluster && this.zombiesToSpawn >= 3) {
        // Spawn a cluster of 3-5 zombies
        let clusterSize = Math.floor(Math.random() * 3) + 3; // 3 to 5 zombies
        clusterSize = Math.min(clusterSize, this.zombiesToSpawn); // Don't exceed remaining zombies

        return this.spawnCluster(clusterSize);
      } else {
        // Normal single spawn
        this.zombiesToSpawn = this.zombiesToSpawn - 1;
        return this.spawnZombie();
      }
    }

    if (this.zombiesToSpawn === 0 && this.zombiesAlive === 0) {
      this.completeRound();
    }

    return null;
  }

  getClusterChance() {
    // Cluster chance increases with rounds
    // Round 1-2: 0% chance
    // Round 3-5: 10% chance
    // Round 6-10: 25% chance
    // Round 11-15: 40% chance
    // Round 16+: 60% chance

    if (this.currentRound <= 2) {
      return 0;
    } else if (this.currentRound <= 5) {
      return 10;
    } else if (this.currentRound <= 10) {
      return 25;
    } else if (this.currentRound <= 15) {
      return 40;
    } else {
      return 60;
    }
  }

  spawnCluster(clusterSize) {
    // Pick a spawn side first
    let spawnSide = Math.floor(Math.random() * 4);
    let baseX = 0;
    let baseY = 0;

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

    // Create array to hold cluster zombies
    let clusterZombies = [];

    for (let i = 0; i < clusterSize; i++) {
      // Spawn zombies in a cluster around the base position
      let offsetX = (Math.random() - 0.5) * 100; // Random offset -50 to +50
      let offsetY = (Math.random() - 0.5) * 100;

      let zombieType = this.getZombieType();
      let zombie = new Zombie(baseX + offsetX, baseY + offsetY, zombieType);
      clusterZombies.push(zombie);

      this.zombiesToSpawn = this.zombiesToSpawn - 1;
    }

    // Return the cluster (we'll need to modify game.js to handle this)
    return { type: "cluster", zombies: clusterZombies };
  }

  spawnZombie() {
    let spawnSide = Math.floor(Math.random() * 4);
    let spawnX = 0;
    let spawnY = 0;

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

    let zombieType = this.getZombieType();
    return new Zombie(spawnX, spawnY, zombieType);
  }

  getZombieType() {
    let rand = Math.random() * 100;

    if (this.currentRound < 3) {
      return "normal";
    } else if (this.currentRound < 5) {
      if (rand < 70) {
        return "normal";
      } else {
        return "witch";
      }
    } else if (this.currentRound < 8) {
      if (rand < 50) {
        return "normal";
      } else if (rand < 80) {
        return "witch";
      } else {
        return "crawler";
      }
    } else {
      if (rand < 30) {
        return "normal";
      } else if (rand < 55) {
        return "witch";
      } else if (rand < 80) {
        return "crawler";
      } else {
        return "slasher";
      }
    }
  }

  completeRound() {
    this.roundActive = false;
    this.roundComplete = true;
  }

  nextRound() {
    this.currentRound = this.currentRound + 1;
    this.zombiesPerRound = Math.floor(this.zombiesPerRound * 1.5);
    this.roundComplete = false;
  }
}
