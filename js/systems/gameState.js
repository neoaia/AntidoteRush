class GameState {
  constructor() {
    this.playerName = null;
    this.inputMethod = null;
    this.score = 0;
    this.gameOver = false;
    this.roundTransitioning = false;

    this.bullets = [];
    this.zombies = [];
    this.weaponPickups = [];

    // Floating score popups: { x, y, value, spawnTime, lifetime }
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
  }

  initialize(playerName, inputMethod) {
    this.playerName = playerName || "Player";
    this.inputMethod = inputMethod || "mouse";
  }

  reset() {
    this.score = 0;
    this.gameOver = false;
    this.roundTransitioning = false;
    this.bullets = [];
    this.zombies = [];
    this.weaponPickups = [];
    this.scorePopups = [];
    this.currentAntidote = null;
    this.playerHasAntidote = false;
    this.antidoteCanSpawn = true;
  }

  addBullet(bullet) {
    this.bullets.push(bullet);
  }
  addZombie(zombie) {
    this.zombies.push(zombie);
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

  // Spawn a floating +score popup at world position x, y
  spawnScorePopup(x, y, value) {
    this.scorePopups.push({
      x: x,
      y: y,
      value: value,
      spawnTime: millis(),
      lifetime: 1200, // ms
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
