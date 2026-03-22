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
      if (typeof audioManager !== "undefined") audioManager.playFire(w.name);
      this.gameState.addBullet(
        new Bullet(player.x, player.y, targetX, targetY, w.damage, {
          piercing: w.piercing || false,
          maxPierce: w.maxPierce || 0,
          pierceDamageFalloff: w.pierceDamageFalloff || 0.6,
          size: w.bulletSize || 5,
          speed: w.bulletSpeed || 10,
          color: w.bulletColor || "#594e1e",
          knockback: w.knockback || 0,
        }),
      );
    } else if (shootResult.type === "shotgun") {
      if (typeof audioManager !== "undefined") audioManager.playFire(w.name);
      let pellets = w.pellets || 6;
      let spreadAngle = w.spreadAngle || 0.4;
      let baseAngle = atan2(targetY - player.y, targetX - player.x);
      for (let i = 0; i < pellets; i++) {
        let angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
        this.gameState.addBullet(
          new Bullet(
            player.x,
            player.y,
            player.x + cos(angle) * 500,
            player.y + sin(angle) * 500,
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
          ),
        );
      }
    } else if (shootResult.type === "melee") {
      player.triggerKnifeSwing();
      if (typeof audioManager !== "undefined") audioManager.playKnifeSwing();

      this.gameState.meleeSlashActive = true;
      this.gameState.meleeSlashStartTime = pauseClock.now();
      this.gameState.meleeSlashAngle = atan2(
        targetY - player.y,
        targetX - player.x,
      );

      let hitCount = this.executeMeleeAttack(
        player,
        w,
        this.gameState.meleeSlashAngle,
      );

      // Destroy any witch projectiles caught in the swing
      this.executeMeleeProjectileDestroy(
        player,
        w,
        this.gameState.meleeSlashAngle,
      );

      if (hitCount > 0 && typeof audioManager !== "undefined") {
        audioManager.playKnifeHit();
      }
    }
  }

  // ── Knife AoE: depth-based damage ────────────────────────────────────────
  // Damage falls off from center to edge of arc.
  // Center of swing = full damage, edge = minDamageFraction of full damage.
  executeMeleeAttack(player, weapon, attackAngle) {
    let arcAngle = PI / 3; // ±60° total arc (same as before)
    let range = weapon.range; // px from player center
    let minDamageFrac = 0.55; // edge gets 55% of full damage
    let hitCount = 0;

    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];

      let dx = z.x - player.x;
      let dy = z.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      // Effective reach: range + half of zombie hitbox size for reliability
      let effectiveRange = range + z.hitW / 2;
      if (distance > effectiveRange) continue;

      let angleToZombie = atan2(dy, dx);
      let angleDiff = angleToZombie - attackAngle;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;

      if (abs(angleDiff) > arcAngle) continue;

      // Depth score: 0 = at edge of arc, 1 = dead center of swing
      // Combines angular depth and distance depth
      let angularDepth = 1 - abs(angleDiff) / arcAngle; // 0..1
      let distanceDepth = 1 - distance / effectiveRange; // 0..1
      let depth = angularDepth * 0.6 + distanceDepth * 0.4; // weighted

      // Damage: lerp from minDamageFrac to 1.0 based on depth
      let damageMult = minDamageFrac + (1 - minDamageFrac) * depth;
      let finalDmg = Math.round(weapon.damage * damageMult);

      z.takeDamage(finalDmg, this.gameState, "melee");
      hitCount++;

      if (weapon.knockback && distance > 0) {
        z.applyKnockback(
          (dx / distance) * weapon.knockback,
          (dy / distance) * weapon.knockback,
        );
      }
    }

    return hitCount;
  }

  // ── Melee destroys witch projectiles in swing arc ─────────────────────────
  executeMeleeProjectileDestroy(player, weapon, attackAngle) {
    if (!this.gameState._zombieManager) return;
    let projectiles = this.gameState._zombieManager.witchProjectiles;
    if (!projectiles) return;

    let arcAngle = PI / 3;
    let range = weapon.range + 10; // slightly extended for projectile intercept

    for (let i = projectiles.length - 1; i >= 0; i--) {
      let p = projectiles[i];
      let dx = p.x - player.x;
      let dy = p.y - player.y;
      let distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > range + p.size / 2) continue;

      let angleToProj = atan2(dy, dx);
      let angleDiff = angleToProj - attackAngle;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;

      if (abs(angleDiff) <= arcAngle) {
        p.active = false;
        projectiles.splice(i, 1);
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
        let hitX = b.x >= z.getLeft() && b.x <= z.getRight();
        let hitY = b.y >= z.getTop() && b.y <= z.getBottom();

        if (hitX && hitY) {
          let dmg = b.onHitZombie(z);
          if (dmg !== null) {
            z.takeDamage(dmg, this.gameState);
            if (b.knockback > 0) {
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

      if (!b.active) this.gameState.removeBullet(i);
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
