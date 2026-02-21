class CombatManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  // Called by mousePressed (single shot)
  shoot(player, targetX, targetY) {
    let shootResult = player.shoot(targetX, targetY);
    if (shootResult !== null) {
      this.handleShootResult(shootResult, player, targetX, targetY);
    }
  }

  // Called by both single-shot and auto-fire loop
  handleShootResult(shootResult, player, targetX, targetY) {
    if (shootResult.type === "bullet") {
      let bullet = new Bullet(
        player.x,
        player.y,
        targetX,
        targetY,
        shootResult.weapon.damage,
      );
      this.gameState.addBullet(bullet);
    } else if (shootResult.type === "shotgun") {
      let weapon = shootResult.weapon;
      let pellets = weapon.pellets || 6;
      let spreadAngle = weapon.spreadAngle || 0.4;
      let baseAngle = atan2(targetY - player.y, targetX - player.x);

      for (let i = 0; i < pellets; i++) {
        let angleOffset = (Math.random() - 0.5) * spreadAngle;
        let angle = baseAngle + angleOffset;
        let pelletTargetX = player.x + cos(angle) * 500;
        let pelletTargetY = player.y + sin(angle) * 500;
        let bullet = new Bullet(
          player.x,
          player.y,
          pelletTargetX,
          pelletTargetY,
          weapon.damage,
        );
        this.gameState.addBullet(bullet);
      }
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

  executeMeleeAttack(player, weapon, attackAngle) {
    let arcAngle = PI / 3;

    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
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
    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      let currentBullet = this.gameState.bullets[i];
      currentBullet.update();

      if (!currentBullet.active) {
        this.gameState.removeBullet(i);
        continue;
      }

      for (let j = this.gameState.zombies.length - 1; j >= 0; j--) {
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
