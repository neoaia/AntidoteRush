class CombatManager {
  constructor(gameState) {
    this.gameState = gameState;
  }

  shoot(player, targetX, targetY) {
    const shootResult = player.shoot(targetX, targetY);
    if (shootResult !== null) {
      this.handleShootResult(shootResult, player, targetX, targetY);
    }
  }

  handleShootResult(shootResult, player, targetX, targetY) {
    const w = shootResult.weapon;

    if (w.recoil !== undefined) player.applyRecoil(w.recoil);
    if (w.fireMoveSlowMultiplier !== undefined)
      player.applyFireSlow(w.fireMoveSlowMultiplier);

    if (shootResult.type === "bullet") {
      if (typeof audioManager !== "undefined") audioManager.playFire(w.name);

      // Use pool-aware addBullet (x, y, tx, ty, damage, options)
      this.gameState.addBullet(player.x, player.y, targetX, targetY, w.damage, {
        piercing: w.piercing || false,
        maxPierce: w.maxPierce || 0,
        pierceDamageFalloff: w.pierceDamageFalloff || 0.6,
        size: w.bulletSize || 5,
        speed: w.bulletSpeed || 10,
        color: w.bulletColor || "#594e1e",
        knockback: w.knockback || 0,
      });
    } else if (shootResult.type === "shotgun") {
      if (typeof audioManager !== "undefined") audioManager.playFire(w.name);

      const pellets = w.pellets || 6;
      const spreadAngle = w.spreadAngle || 0.4;
      const baseAngle = atan2(targetY - player.y, targetX - player.x);

      for (let i = 0; i < pellets; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
        this.gameState.addBullet(
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

      const hitCount = this.executeMeleeAttack(
        player,
        w,
        this.gameState.meleeSlashAngle,
      );
      this.executeMeleeProjectileDestroy(
        player,
        w,
        this.gameState.meleeSlashAngle,
      );

      if (hitCount > 0 && typeof audioManager !== "undefined")
        audioManager.playKnifeHit();
    }
  }

  // ── Knife AoE: depth-based damage ──────────────────────────────────────

  executeMeleeAttack(player, weapon, attackAngle) {
    const arcAngle = PI / 3; // ±60° total arc
    const range = weapon.range;
    const minDamageFrac = 0.55;
    let hitCount = 0;

    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      const z = this.gameState.zombies[i];
      const dx = z.x - player.x;
      const dy = z.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const effectiveRange = range + z.hitW / 2;

      if (distance > effectiveRange) continue;

      let angleDiff = atan2(dy, dx) - attackAngle;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;
      if (abs(angleDiff) > arcAngle) continue;

      const angularDepth = 1 - abs(angleDiff) / arcAngle;
      const distanceDepth = 1 - distance / effectiveRange;
      const depth = angularDepth * 0.6 + distanceDepth * 0.4;
      const damageMult = minDamageFrac + (1 - minDamageFrac) * depth;
      const finalDmg = Math.round(weapon.damage * damageMult);

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

  // ── Melee destroys witch projectiles in swing arc ───────────────────────

  executeMeleeProjectileDestroy(player, weapon, attackAngle) {
    if (!this.gameState._zombieManager) return;
    const projectiles = this.gameState._zombieManager.witchProjectiles;
    if (!projectiles) return;

    const arcAngle = PI / 3;
    const range = weapon.range + 10;

    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const dx = p.x - player.x;
      const dy = p.y - player.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > range + p.size / 2) continue;

      let angleDiff = atan2(dy, dx) - attackAngle;
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;

      if (abs(angleDiff) <= arcAngle) {
        p.active = false;
        projectiles.splice(i, 1);
      }
    }
  }

  // ── Bullet updates ──────────────────────────────────────────────────────

  updateBullets() {
    for (let i = this.gameState.bullets.length - 1; i >= 0; i--) {
      const b = this.gameState.bullets[i];
      b.update();

      if (!b.active) {
        this.gameState.removeBullet(i);
        continue;
      }

      for (let j = this.gameState.zombies.length - 1; j >= 0; j--) {
        const z = this.gameState.zombies[j];
        const hitX = b.x >= z.getLeft() && b.x <= z.getRight();
        const hitY = b.y >= z.getTop() && b.y <= z.getBottom();

        if (hitX && hitY) {
          const dmg = b.onHitZombie(z);
          if (dmg !== null) {
            z.takeDamage(dmg, this.gameState);
            if (b.knockback > 0) {
              const bLen = Math.sqrt(
                b.velocityX * b.velocityX + b.velocityY * b.velocityY,
              );
              if (bLen > 0)
                z.applyKnockback(
                  (b.velocityX / bLen) * b.knockback,
                  (b.velocityY / bLen) * b.knockback,
                );
            }
          }
          if (!b.active) break;
        }
      }

      if (!b.active) this.gameState.removeBullet(i);
    }
  }

  // ── Melee slash timer ───────────────────────────────────────────────────

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
