class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
    // Active witch projectiles live here
    this.witchProjectiles = [];
  }

  update(player) {
    let now = pauseClock.now();

    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      // ── Witch: spawn projectile ─────────────────────────────────────────
      if (z.type === "witch" && z.consumePendingShot()) {
        this.witchProjectiles.push(
          new WitchProjectile(z.x, z.y, player.x, player.y, z.projectileDamage),
        );
      }

      if (!z.active) {
        // Save values before splice
        let zx = z.x,
          zy = z.y,
          zCoins = z.coins,
          zExp = z.exp,
          zSize = z.size;

        // ── Crawler: explosion on death ─────────────────────────────────
        if (z.type === "crawler" && z.explodes && !z._exploded) {
          z._exploded = true;
          this._crawlerExplosion(z, player);
        }

        // Rewards
        this.gameState.addCoins(zCoins);
        this.gameState.spawnCoinPopup(zx, zy - zSize / 2 - 12, zCoins);
        this.gameState.addExp(zExp);
        this.gameState.spawnExpPopup(zx, zy - zSize / 2 - 28, zExp);

        this.gameState.removeZombie(i);
        continue;
      }

      // ── Melee hit registration ──────────────────────────────────────────
      if (!z.isRanged && z.consumePendingHit()) {
        let dx = player.x - z.x,
          dy = player.y - z.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= z.attackRange) {
          player.takeDamage(z.damage, this.gameState);
          // Player knockback away from zombie
          if (dist > 0) {
            player.applyKnockback(
              (dx / dist) * (z.knockback || 4),
              (dy / dist) * (z.knockback || 4),
            );
          }
        }
      }
    }

    // ── Witch projectile updates ────────────────────────────────────────────
    for (let i = this.witchProjectiles.length - 1; i >= 0; i--) {
      let p = this.witchProjectiles[i];
      p.update();

      if (!p.active) {
        this.witchProjectiles.splice(i, 1);
        continue;
      }

      if (p.checkPlayerHit(player)) {
        player.takeDamage(p.damage, this.gameState);
        // Small knockback from projectile direction
        player.applyKnockback(p.vx * 1.5, p.vy * 1.5);
        p.active = false;
        this.witchProjectiles.splice(i, 1);
      }
    }
  }

  // ── Crawler explosion ─────────────────────────────────────────────────────
  _crawlerExplosion(crawler, player) {
    let cx = crawler.x,
      cy = crawler.y;
    let r = crawler.explosionRadius;

    // Visual — spawn a temporary explosion effect via gameState
    if (this.gameState.spawnExplosion) {
      this.gameState.spawnExplosion(cx, cy, r);
    }

    // Damage player if in radius
    let pdx = player.x - cx,
      pdy = player.y - cy;
    let pdist = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pdist < r + player.size / 2) {
      player.takeDamage(crawler.explosionPlayerDamage, this.gameState);
      // Knockback player outward
      if (pdist > 0) {
        let force = map(pdist, 0, r, 12, 2);
        player.applyKnockback((pdx / pdist) * force, (pdy / pdist) * force);
      }
    }

    // Damage nearby zombies (friendly fire — crawler is chaos)
    for (let z of this.gameState.zombies) {
      if (z === crawler || !z.active) continue;
      let zdx = z.x - cx,
        zdy = z.y - cy;
      let zdist = Math.sqrt(zdx * zdx + zdy * zdy);
      if (zdist < r + z.size / 2) {
        // Falloff: full damage at center, half at edge
        let falloff = 1 - (zdist / r) * 0.5;
        let dmg = Math.floor(crawler.explosionZombieDamage * falloff);
        z.takeDamage(dmg, this.gameState);
        // Knockback other zombies
        if (zdist > 0) {
          let force = map(zdist, 0, r, 8, 1);
          z.applyKnockback((zdx / zdist) * force, (zdy / zdist) * force);
        }
      }
    }
  }

  handleRoundSpawning(roundManager) {
    let currentTime = pauseClock.now();
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

    // Draw witch projectiles (in world space — called inside push/translate)
    for (let p of this.witchProjectiles) p.display();

    // Draw explosion effects
    if (this.gameState.explosions) {
      this._drawExplosions();
    }
  }

  _drawExplosions() {
    let now = pauseClock.now();
    for (let i = this.gameState.explosions.length - 1; i >= 0; i--) {
      let ex = this.gameState.explosions[i];
      let elapsed = now - ex.startTime;
      let duration = 500; // ms

      if (elapsed > duration) {
        this.gameState.explosions.splice(i, 1);
        continue;
      }

      let progress = elapsed / duration;
      let alpha = (1 - progress) * 200;
      let outerR = ex.radius * (0.6 + progress * 0.7);
      let innerR = ex.radius * (0.3 + progress * 0.4);

      noStroke();
      // Outer shockwave ring
      fill(255, 160, 40, alpha * 0.5);
      circle(ex.x, ex.y, outerR * 2);
      // Core flash
      fill(255, 220, 100, alpha * (1 - progress));
      circle(ex.x, ex.y, innerR * 2);
      // Dark smoke edge
      fill(80, 60, 40, alpha * 0.4);
      noFill();
      stroke(200, 100, 20, alpha * 0.6);
      strokeWeight(3 * (1 - progress));
      circle(ex.x, ex.y, outerR * 2);
      noStroke();
    }
  }
}
