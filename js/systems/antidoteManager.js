class AntidoteManager {
  constructor(gameState, canvasWidth, canvasHeight) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  scheduleNext() {
    let minWait = 3000;
    let maxWait = 10000;
    let randomWait = Math.random() * (maxWait - minWait) + minWait;

    this.gameState.nextAntidoteSpawnTime = millis() + randomWait;
    this.gameState.antidoteCanSpawn = true;
  }

  spawn(base) {
    let margin = 50;
    let randomX = Math.random() * (this.canvasWidth - margin * 2) + margin;
    let randomY = Math.random() * (this.canvasHeight - margin * 2) + margin;

    let tooCloseToBase = true;
    let attempts = 0;
    let maxAttempts = 20;

    while (tooCloseToBase && attempts < maxAttempts) {
      randomX = Math.random() * (this.canvasWidth - margin * 2) + margin;
      randomY = Math.random() * (this.canvasHeight - margin * 2) + margin;

      let dx = randomX - (base.x + base.width / 2);
      let dy = randomY - (base.y + base.height / 2);
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 150) {
        tooCloseToBase = false;
      }

      attempts = attempts + 1;
    }

    this.gameState.currentAntidote = new Antidote(randomX, randomY);
  }

  update(player, base) {
    // Check if it's time to spawn
    if (
      this.gameState.currentAntidote === null &&
      this.gameState.antidoteCanSpawn
    ) {
      if (millis() >= this.gameState.nextAntidoteSpawnTime) {
        this.spawn(base);
        this.gameState.antidoteCanSpawn = false;
      }
    }

    // Update existing antidote
    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.update();

      if (!this.gameState.currentAntidote.active) {
        this.gameState.currentAntidote = null;
        this.scheduleNext();
      } else if (
        !this.gameState.playerHasAntidote &&
        this.gameState.currentAntidote.checkPlayerPickup(player)
      ) {
        this.gameState.playerHasAntidote = true;
        this.gameState.currentAntidote = null;
      }
    }

    // Check if player delivers antidote to base
    if (this.gameState.playerHasAntidote && base.checkPlayerInside(player)) {
      this.gameState.increaseScore(30);
      player.health = player.health + 20;
      if (player.health > player.maxHealth) {
        player.health = player.maxHealth;
      }
      this.gameState.playerHasAntidote = false;
      this.scheduleNext();
    }
  }

  display() {
    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.display();
    }
  }
}
