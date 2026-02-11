class GameState {
  constructor() {
    this.playerName = null;
    this.inputMethod = null;
    this.score = 0;
    this.gameOver = false;
    this.roundTransitioning = false;

    this.bullets = [];
    this.zombies = [];

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

  addZombies(zombieArray) {
    for (let i = 0; i < zombieArray.length; i++) {
      this.zombies.push(zombieArray[i]);
    }
  }

  removeBullet(index) {
    this.bullets.splice(index, 1);
  }

  removeZombie(index) {
    this.zombies.splice(index, 1);
  }

  increaseScore(points) {
    this.score += points;
  }
}
