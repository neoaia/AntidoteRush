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
    let w = shootResult.weapon;

    if (w.recoil !== undefined) player.applyRecoil(w.recoil);
    if (w.fireMoveSlowMultiplier !== undefined)
      player.applyFireSlow(w.fireMoveSlowMultiplier);

    if (shootResult.type === "bullet") {
      let bullet = new Bullet(player.x, player.y, targetX, targetY, w.damage, {
        piercing: w.piercing || false,
        maxPierce: w.maxPierce || 0,
        pierceDamageFalloff: w.pierceDamageFalloff || 0.6,
        size: w.bulletSize || 5,
        speed: w.bulletSpeed || 10,
        color: w.bulletColor || "#594e1e",
        knockback: w.knockback || 0,
      });
      this.gameState.addBullet(bullet);
    } else if (shootResult.type === "shotgun") {
      let pellets = w.pellets || 6;
      let spreadAngle = w.spreadAngle || 0.4;
      let baseAngle = atan2(targetY - player.y, targetX - player.x);

      for (let i = 0; i < pellets; i++) {
        let angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
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
            knockback: w.knockback || 0,
          },
        );
        this.gameState.addBullet(bullet);
      }
    } else if (shootResult.type === "melee") {
      player.triggerKnifeSwing();
      this.gameState.meleeSlashActive = true;
      this.gameState.meleeSlashStartTime = pauseClock.now();
      this.gameState.meleeSlashAngle = atan2(
        targetY - player.y,
        targetX - player.x,
      );
      this.executeMeleeAttack(player, w, this.gameState.meleeSlashAngle);
    }
  }

  executeMeleeAttack(player, weapon, attackAngle) {
    let arcAngle = PI / 3;
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      // Distance to zombie center — melee range check
      let distance = dist(player.x, player.y, z.x, z.y);
      if (distance < weapon.range + z.size / 2) {
        let angleToZombie = atan2(z.y - player.y, z.x - player.x);
        let angleDiff = angleToZombie - attackAngle;
        while (angleDiff > PI) angleDiff -= TWO_PI;
        while (angleDiff < -PI) angleDiff += TWO_PI;
        if (abs(angleDiff) <= arcAngle) {
          z.takeDamage(weapon.damage, this.gameState);
          if (weapon.knockback && distance > 0) {
            let dx = z.x - player.x,
              dy = z.y - player.y;
            let d = Math.sqrt(dx * dx + dy * dy);
            z.applyKnockback(
              (dx / d) * weapon.knockback,
              (dy / d) * weapon.knockback,
            );
          }
        }
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

      for (let j = this.gameState.zombies.length - 1; j >= 0; j--) {
        let z = this.gameState.zombies[j];

        // ── Rect-based hit detection ──────────────────────────────────────
        // Bullet is a small circle — check if bullet center is inside zombie hitbox
        // (most accurate for fast small bullets without needing swept collision)
        let hitX = b.x >= z.getLeft() && b.x <= z.getRight();
        let hitY = b.y >= z.getTop() && b.y <= z.getBottom();

        if (hitX && hitY) {
          let dmg = b.onHitZombie(z);
          if (dmg !== null) {
            z.takeDamage(dmg, this.gameState);
            if (b.knockback && b.knockback > 0) {
              let bLen = Math.sqrt(
                b.velocityX * b.velocityX + b.velocityY * b.velocityY,
              );
              if (bLen > 0) {
                z.applyKnockback(
                  (b.velocityX / bLen) * b.knockback,
                  (b.velocityY / bLen) * b.knockback,
                );
              }
            }
          }
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
        pauseClock.now() - this.gameState.meleeSlashStartTime >
        this.gameState.meleeSlashDuration
      ) {
        this.gameState.meleeSlashActive = false;
      }
    }
  }
}
