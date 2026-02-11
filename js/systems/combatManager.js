class CombatManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  shoot(player, targetX, targetY) {
    let shootResult = player.shoot(targetX, targetY);

    if (shootResult !== null) {
      if (shootResult.type === "bullet") {
        let bullet = new Bullet(
          player.x,
          player.y,
          targetX,
          targetY,
          shootResult.weapon.damage,
        );
        this.gameState.addBullet(bullet);
      } else if (shootResult.type === "melee") {
        this.gameState.meleeSlashActive = true;
        this.gameState.meleeSlashStartTime = millis();
        this.gameState.meleeSlashAngle = atan2(
          targetY - player.y,
          targetX - player.x,
        );
        this.executeMeleeAttack(
          player,
          shootResult.weapon,
          this.gameState.meleeSlashAngle,
        );
      }
    }
  }

  executeMeleeAttack(player, weapon, attackAngle) {
    let arcAngle = PI / 3;

    for (let i = this.gameState.zombies.length - 1; i >= 0; i = i - 1) {
      let currentZombie = this.gameState.zombies[i];
      let distance = dist(player.x, player.y, currentZombie.x, currentZombie.y);
      let effectiveRange = weapon.range + currentZombie.size / 2;

      if (distance < effectiveRange) {
        let angleToZombie = atan2(
          currentZombie.y - player.y,
          currentZombie.x - player.x,
        );
        let angleDiff = angleToZombie - attackAngle;

        while (angleDiff > PI) angleDiff -= TWO_PI;
        while (angleDiff < -PI) angleDiff += TWO_PI;

        if (abs(angleDiff) <= arcAngle) {
          currentZombie.takeDamage(weapon.damage);
        }
      }
    }
  }

  updateBullets() {
    for (let i = this.gameState.bullets.length - 1; i >= 0; i = i - 1) {
      let currentBullet = this.gameState.bullets[i];
      currentBullet.update();

      if (!currentBullet.active) {
        this.gameState.removeBullet(i);
        continue;
      }

      for (let j = this.gameState.zombies.length - 1; j >= 0; j = j - 1) {
        let currentZombie = this.gameState.zombies[j];
        let distance = dist(
          currentBullet.x,
          currentBullet.y,
          currentZombie.x,
          currentZombie.y,
        );

        if (distance < currentZombie.size / 2) {
          currentZombie.takeDamage(currentBullet.damage);
          currentBullet.active = false;
          break;
        }
      }
    }
  }

  updateMeleeSlash() {
    if (this.gameState.meleeSlashActive) {
      let elapsed = millis() - this.gameState.meleeSlashStartTime;
      if (elapsed > this.gameState.meleeSlashDuration) {
        this.gameState.meleeSlashActive = false;
      }
    }
  }
}
