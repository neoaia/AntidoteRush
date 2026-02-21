class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  update(player) {
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      if (!z.active) {
        // Score
        this.gameState.increaseScore(z.points);
        this.gameState.spawnScorePopup(z.x, z.y - z.size / 2 - 12, z.points);

        // Coins — offset slightly so popups don't stack
        this.gameState.addCoins(z.coins);
        this.gameState.spawnCoinPopup(z.x, z.y - z.size / 2 - 28, z.coins);

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
    let spawnResult = roundManager.update(
      currentTime,
      this.gameState.zombies,
      this.gameState,
    );

    if (spawnResult !== null) {
      if (spawnResult.type === "cluster") {
        this.gameState.addZombies(spawnResult.zombies);
      } else {
        this.gameState.addZombie(spawnResult);
      }
    }
  }

  display() {
    for (let z of this.gameState.zombies) z.display();
  }
}
