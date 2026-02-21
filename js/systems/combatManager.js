class CombatManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  shoot(player, targetX, targetY) {
    let shootResult = player.shoot(targetX, targetY);
    if (shootResult !== null) {
      this.handleShootResult(shootResult, player, targetX, targetY);
    }
  }

  handleShootResult(shootResult, player, targetX, targetY) {
    if (shootResult.type === "bullet") {
      let w = shootResult.weapon;
      let bullet = new Bullet(player.x, player.y, targetX, targetY, w.damage, {
        piercing: w.piercing || false,
        maxPierce: w.maxPierce || 0,
        pierceDamageFalloff: w.pierceDamageFalloff || 0.6,
        size: w.bulletSize || 5,
        speed: w.bulletSpeed || 10,
        color: w.bulletColor || "#594e1e",
      });
      this.gameState.addBullet(bullet);
    } else if (shootResult.type === "shotgun") {
      let w = shootResult.weapon;
      let pellets = w.pellets || 6;
      let spreadAngle = w.spreadAngle || 0.4;
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
          w.damage,
          {
            piercing: w.piercing || false,
            maxPierce: w.maxPierce || 0,
            pierceDamageFalloff: w.pierceDamageFalloff || 0.6,
            size: w.bulletSize || 4,
            speed: w.bulletSpeed || 10,
            color: w.bulletColor || "#594e1e",
          },
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
      let z = this.gameState.zombies[i];
      let distance = dist(player.x, player.y, z.x, z.y);
      if (distance < weapon.range + z.size / 2) {
        let angleToZombie = atan2(z.y - player.y, z.x - player.x);
        let angleDiff = angleToZombie - attackAngle;
        while (angleDiff > PI) angleDiff -= TWO_PI;
        while (angleDiff < -PI) angleDiff += TWO_PI;
        if (abs(angleDiff) <= arcAngle) z.takeDamage(weapon.damage);
      }
    }
  }

  updateBullets() {
    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      let b = this.gameState.bullets[i];
      b.update();

      if (!b.active) {
        this.gameState.removeBullet(i);
        continue;
      }

      // Check against all zombies — piercing bullets can hit multiple
      for (let j = this.gameState.zombies.length - 1; j >= 0; j--) {
        let z = this.gameState.zombies[j];
        let distance = dist(b.x, b.y, z.x, z.y);

        if (distance < z.size / 2) {
          let dmg = b.onHitZombie(z);
          if (dmg !== null) {
            z.takeDamage(dmg);
          }
          // Stop checking further if bullet is now inactive
          if (!b.active) break;
        }
      }

      if (!b.active) {
        this.gameState.removeBullet(i);
      }
    }
  }

  updateMeleeSlash() {
    if (this.gameState.meleeSlashActive) {
      if (
        millis() - this.gameState.meleeSlashStartTime >
        this.gameState.meleeSlashDuration
      ) {
        this.gameState.meleeSlashActive = false;
      }
    }
  }
}
