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

    // EXP system
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
    this.currentAntidote = null;
    this.playerHasAntidote = false;
    this.antidoteCanSpawn = true;
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

  addCoins(amount) {
    this.coins += amount;
  }

  addExp(amount) {
    this.exp += amount;
    while (this.exp >= this.expToNextLevel) {
      this.exp -= this.expToNextLevel;
      this.level++;
      this.expToNextLevel = Math.floor(this.expToNextLevel * 1.4);
    }
  }

  introduceZombieType(type) {
    if (!this.introductedZombieTypes[type]) {
      this.introductedZombieTypes[type] = true;
    }
  }

  tickHealthMultipliers() {
    const growthPerRound = 0.005;
    for (let type of Object.keys(this.zombieHealthMultipliers)) {
      if (this.introductedZombieTypes[type]) {
        this.zombieHealthMultipliers[type] += growthPerRound;
      }
    }
  }

  // Coin popup — yellow with coin icon
  spawnCoinPopup(x, y, amount) {
    this.scorePopups.push({
      x,
      y,
      value: amount,
      isCoin: true,
      spawnTime: millis(),
      lifetime: 1200,
    });
  }

  // EXP popup — blue
  spawnExpPopup(x, y, amount) {
    this.scorePopups.push({
      x,
      y,
      value: amount,
      isExp: true,
      spawnTime: millis(),
      lifetime: 1200,
    });
  }

  // Zombie hit popup — white
  spawnDamagePopup(x, y, amount) {
    this.scorePopups.push({
      x,
      y,
      value: Math.round(amount),
      isDamage: true,
      spawnTime: millis(),
      lifetime: 800,
    });
  }

  // Player took damage popup — red, appears above player
  spawnPlayerDamagePopup(x, y, amount) {
    this.scorePopups.push({
      x,
      y,
      value: Math.round(amount),
      isPlayerDamage: true,
      spawnTime: millis(),
      lifetime: 900,
    });
  }

  updateScorePopups() {
    let now = millis();
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      if (now - this.scorePopups[i].spawnTime > this.scorePopups[i].lifetime) {
        this.scorePopups.splice(i, 1);
      }
    }
  }
}
