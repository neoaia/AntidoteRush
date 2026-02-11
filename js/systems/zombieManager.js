class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  update(player) {
    for (let i = this.gameState.zombies.length - 1; i >= 0; i = i - 1) {
      let currentZombie = this.gameState.zombies[i];
      currentZombie.update(player.x, player.y);

      if (!currentZombie.active) {
        this.gameState.increaseScore(currentZombie.points);
        this.gameState.removeZombie(i);
        continue;
      }

      let isCollidingWithPlayer = checkCollision(player, currentZombie);
      if (isCollidingWithPlayer && currentZombie.canAttack()) {
        player.takeDamage(currentZombie.damage);
      }
    }
  }

  handleRoundSpawning(roundManager) {
    let currentTime = millis();
    let spawnResult = roundManager.update(currentTime, this.gameState.zombies);

    if (spawnResult !== null) {
      if (spawnResult.type === "cluster") {
        this.gameState.addZombies(spawnResult.zombies);
      } else {
        this.gameState.addZombie(spawnResult);
      }
    }
  }

  display() {
    for (let i = 0; i < this.gameState.zombies.length; i = i + 1) {
      this.gameState.zombies[i].display();
    }
  }
}
