class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  update(player) {
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      if (!z.active) {
        let coins = z.coins;
        let exp = z.exp;
        let px = z.x;
        let py = z.y;
        let psize = z.size;

        this.gameState.addCoins(coins);
        this.gameState.spawnCoinPopup(px, py - psize / 2 - 12, coins);
        this.gameState.addExp(exp);
        this.gameState.spawnExpPopup(px, py - psize / 2 - 28, exp);

        this.gameState.removeZombie(i);
        continue;
      }

      // Hit detection using per-zombie attackRange
      if (z.consumePendingHit()) {
        let dx = player.x - z.x;
        let dy = player.y - z.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= z.attackRange) {
          // Pass gameState so player.takeDamage can spawn the red popup
          player.takeDamage(z.damage, this.gameState);

          if (distance > 0) {
            let kbX = (dx / distance) * z.knockback;
            let kbY = (dy / distance) * z.knockback;
            player.applyKnockback(kbX, kbY);
          }
        }
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
