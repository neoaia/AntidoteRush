class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  update(player) {
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      if (!z.active) {
        let points = z.points;
        this.gameState.increaseScore(points);
        // Popup above zombie's death position
        this.gameState.spawnScorePopup(z.x, z.y - z.size / 2, points);
        this.gameState.removeZombie(i);
        continue;
      }

      if (checkCollision(player, z) && z.canAttack()) {
        player.takeDamage(z.damage);
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
    for (let i = 0; i < this.gameState.zombies.length; i++) {
      this.gameState.zombies[i].display();
    }
  }
}
