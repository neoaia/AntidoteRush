class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.witchProjectiles = [];

    // Dead crawlers awaiting explosion
    this._pendingCrawlers = [];

    // Register self on gameState so combatManager can reach witchProjectiles
    this.gameState._zombieManager = this;
  }

  update(player) {
    // ── Live zombie updates ───────────────────────────────────────────────
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      let z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      // Witch: spawn projectile
      if (z.type === "witch" && z.consumePendingShot()) {
        this.witchProjectiles.push(
          new WitchProjectile(z.x, z.y, player.x, player.y, z.projectileDamage),
        );
      }

      if (!z.active) {
        let zx = z.x,
          zy = z.y,
          zCoins = z.coins,
          zExp = z.exp,
          zSize = z.size;

        // Crawler: start two-phase explosion sequence
        if (z.type === "crawler" && z.explodes) {
          this._pendingCrawlers.push(z); // keep alive for indicator + blast
        }

        this.gameState.addCoins(zCoins);
        this.gameState.spawnCoinPopup(zx, zy - zSize / 2 - 12, zCoins);
        this.gameState.addExp(zExp);
        this.gameState.spawnExpPopup(zx, zy - zSize / 2 - 28, zExp);

        this.gameState.removeZombie(i);
        continue;
      }

      // Melee hit registration for non-ranged zombies
      if (!z.isRanged && z.consumePendingHit()) {
        let dx = player.x - z.x,
          dy = player.y - z.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= z.attackRange) {
          player.takeDamage(z.damage, this.gameState);
          if (dist > 0) {
            player.applyKnockback(
              (dx / dist) * (z.knockback || 4),
              (dy / dist) * (z.knockback || 4),
            );
          }
        }
      }
    }

    // ── Pending crawler explosion phases ─────────────────────────────────
    for (let i = this._pendingCrawlers.length - 1; i >= 0; i--) {
      let c = this._pendingCrawlers[i];
      let phase = c.updateExplosion();

      if (phase === "explode") {
        this._crawlerExplosion(c, player);
        this._pendingCrawlers.splice(i, 1);
      } else if (phase === "none" && c._explodePhase === "done") {
        this._pendingCrawlers.splice(i, 1);
      }
    }

    // ── Witch projectile updates ──────────────────────────────────────────
    for (let i = this.witchProjectiles.length - 1; i >= 0; i--) {
      let p = this.witchProjectiles[i];
      p.update();
      if (!p.active) {
        this.witchProjectiles.splice(i, 1);
        continue;
      }

      if (p.checkPlayerHit(player)) {
        player.takeDamage(p.damage, this.gameState);
        player.applyKnockback(p.vx * 1.5, p.vy * 1.5);
        p.active = false;
        this.witchProjectiles.splice(i, 1);
      }
    }
  }

  // ── Crawler explosion blast ───────────────────────────────────────────────
  _crawlerExplosion(crawler, player) {
    let cx = crawler.x,
      cy = crawler.y,
      r = crawler.explosionRadius;

    // Visual explosion effect
    this.gameState.spawnExplosion(cx, cy, r);

    // Damage player
    let pdx = player.x - cx,
      pdy = player.y - cy;
    let pd = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pd < r + player.size / 2) {
      player.takeDamage(crawler.explosionPlayerDamage, this.gameState);
      if (pd > 0) {
        let force = map(pd, 0, r, 12, 2);
        player.applyKnockback((pdx / pd) * force, (pdy / pd) * force);
      }
    }

    // Damage nearby zombies (friendly fire)
    for (let z of this.gameState.zombies) {
      if (z === crawler || !z.active) continue;
      let zdx = z.x - cx,
        zdy = z.y - cy;
      let zd = Math.sqrt(zdx * zdx + zdy * zdy);
      if (zd < r + z.size / 2) {
        let falloff = 1 - (zd / r) * 0.5;
        let dmg = Math.floor(crawler.explosionZombieDamage * falloff);
        z.takeDamage(dmg, this.gameState);
        if (zd > 0) {
          let force = map(zd, 0, r, 8, 1);
          z.applyKnockback((zdx / zd) * force, (zdy / zd) * force);
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
      if (spawnResult.type === "cluster")
        this.gameState.addZombies(spawnResult.zombies);
      else this.gameState.addZombie(spawnResult);
    }
  }

  display() {
    // Live zombies
    for (let z of this.gameState.zombies) z.display();

    // Pending crawler indicators (drawn in world space)
    for (let c of this._pendingCrawlers) {
      if (c._explodePhase === "indicator") c.displayExplosionIndicator();
    }

    // Witch projectiles
    for (let p of this.witchProjectiles) p.display();

    // Explosion flash effects
    if (this.gameState.explosions) this._drawExplosions();
  }

  _drawExplosions() {
    let now = pauseClock.now();
    for (let i = this.gameState.explosions.length - 1; i >= 0; i--) {
      let ex = this.gameState.explosions[i];
      let elapsed = now - ex.startTime;
      let duration = 500;
      if (elapsed > duration) {
        this.gameState.explosions.splice(i, 1);
        continue;
      }

      let progress = elapsed / duration;
      let alpha = (1 - progress) * 220;

      // Core flash
      noStroke();
      fill(255, 220, 80, alpha * (1 - progress) * 1.4);
      circle(ex.x, ex.y, ex.radius * (0.4 + progress * 0.6) * 2);

      // Expanding shockwave
      fill(255, 120, 30, alpha * 0.5);
      circle(ex.x, ex.y, ex.radius * (0.6 + progress * 0.8) * 2);

      // Ring
      noFill();
      stroke(220, 80, 20, alpha * 0.7);
      strokeWeight(3 * (1 - progress));
      circle(ex.x, ex.y, ex.radius * (0.8 + progress * 0.5) * 2);
      noStroke();
    }
  }
}
