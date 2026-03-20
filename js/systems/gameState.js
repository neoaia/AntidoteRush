class GameState {
  constructor() {
    this.playerName = null;
    this.inputMethod = null;
    this.difficulty = "easy"; // "easy" | "hard" | "hell"
    this.score = 0;
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

    // Tracks which zombie types have been introduced (for health scaling)
    // Maps type -> true once that type has spawned at least once
    this.introductedZombieTypes = {};

    // Per-type health multiplier, starts at 1.0, grows 0.5% per round AFTER introduction
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
    this.score = 0;
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

  increaseScore(points) {
    this.score += points;
  }
  addCoins(amount) {
    this.coins += amount;
  }

  // Mark a zombie type as introduced (health scaling begins next round)
  introduceZombieType(type) {
    if (!this.introductedZombieTypes[type]) {
      this.introductedZombieTypes[type] = true;
    }
  }

  // Called at the start of each new round — tick health multipliers for introduced types
  tickHealthMultipliers() {
    const growthPerRound = 0.005; // 0.5% per round
    for (let type of Object.keys(this.zombieHealthMultipliers)) {
      if (this.introductedZombieTypes[type]) {
        this.zombieHealthMultipliers[type] += growthPerRound;
      }
    }
  }

  spawnScorePopup(x, y, value) {
    this.scorePopups.push({ x, y, value, spawnTime: millis(), lifetime: 1200 });
  }

  spawnCoinPopup(x, y, amount) {
    // Coin popups are gold-coloured; reuse scorePopups with a prefix
    this.scorePopups.push({
      x,
      y,
      value: "+" + amount + "¢",
      isCoin: true,
      spawnTime: millis(),
      lifetime: 1200,
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
