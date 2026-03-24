class ZombieManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.witchProjectiles = [];
    this._pendingCrawlers = [];

    this.gameState._zombieManager = this;
  }

  clearProjectiles() {
    this.witchProjectiles = [];
    this._pendingCrawlers = [];
  }

  // ── Per-frame update ────────────────────────────────────────────────────

  update(player) {
    // ── Live zombie updates ─────────────────────────────────────────────
    for (let i = this.gameState.zombies.length - 1; i >= 0; i--) {
      const z = this.gameState.zombies[i];
      z.update(player.x, player.y);

      // Witch: spawn projectile + attack sound
      if (z.type === "witch" && z.consumePendingShot()) {
        this.witchProjectiles.push(
          new WitchProjectile(z.x, z.y, player.x, player.y, z.projectileDamage),
        );
        if (typeof audioManager !== "undefined")
          audioManager.playZombieAttack("witch");
      }

      if (!z.active) {
        const zx = z.x,
          zy = z.y,
          zCoins = z.coins,
          zExp = z.exp,
          zSize = z.size;

        if (z.type === "crawler" && z.explodes) {
          if (typeof audioManager !== "undefined")
            audioManager.playZombieDead("crawler");
          this._pendingCrawlers.push(z);
        }

        this.gameState.addCoins(zCoins);
        this.gameState.spawnCoinPopup(zx, zy - zSize / 2 - 12, zCoins);
        this.gameState.addExp(zExp);
        this.gameState.spawnExpPopup(zx, zy - zSize / 2 - 28, zExp);
        this.gameState.removeZombie(i);
        continue;
      }

      // Melee hit
      if (!z.isRanged && z.consumePendingHit()) {
        if (typeof audioManager !== "undefined")
          audioManager.playZombieAttack(z.type);
        const dx = player.x - z.x,
          dy = player.y - z.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= z.attackRange) {
          player.takeDamage(z.damage, this.gameState);
          if (dist > 0)
            player.applyKnockback(
              (dx / dist) * (z.knockback || 4),
              (dy / dist) * (z.knockback || 4),
            );
        }
      }
    }

    // ── Zombie separation (O(n) spatial grid replaces O(n²) nested loop) ─
    this._separateZombies();

    // ── Pending crawler explosion phases ────────────────────────────────
    for (let i = this._pendingCrawlers.length - 1; i >= 0; i--) {
      const c = this._pendingCrawlers[i];
      const phase = c.updateExplosion();
      if (phase === "explode") {
        this._crawlerExplosion(c, player);
        this._pendingCrawlers.splice(i, 1);
      } else if (phase === "none" && c._explodePhase === "done") {
        this._pendingCrawlers.splice(i, 1);
      }
    }

    // ── Witch projectile updates ─────────────────────────────────────────
    for (let i = this.witchProjectiles.length - 1; i >= 0; i--) {
      const p = this.witchProjectiles[i];
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

  // ── Spatial-grid zombie separation ─────────────────────────────────────
  //
  //  Old: O(n²) — every pair checked, e.g. 50 zombies = 2,500 comparisons/frame.
  //  New: O(n)  — each zombie only checks its 3×3 neighbourhood of grid cells.
  //               At 50 zombies with CELL=60 this is typically ~100-200 checks.

  _separateZombies() {
    const zArr = this.gameState.zombies;
    if (zArr.length < 2) return;

    const CELL = 60; // slightly larger than the widest zombie (slasher hitW=34)
    const grid = new Map();

    // 1. Insert all zombies into grid by their cell
    for (let i = 0; i < zArr.length; i++) {
      const z = zArr[i];
      const cx = Math.floor(z.x / CELL);
      const cy = Math.floor(z.y / CELL);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(i);
    }

    // 2. For each zombie, only resolve against neighbours in the 3×3 block
    for (let i = 0; i < zArr.length; i++) {
      const a = zArr[i];
      const cx = Math.floor(a.x / CELL);
      const cy = Math.floor(a.y / CELL);

      for (let nx = cx - 1; nx <= cx + 1; nx++) {
        for (let ny = cy - 1; ny <= cy + 1; ny++) {
          const bucket = grid.get(`${nx},${ny}`);
          if (!bucket) continue;

          for (const j of bucket) {
            if (j <= i) continue; // avoid double-processing each pair

            const b = zArr[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = (a.size + b.size) * 0.72;

            if (dist < minDist && dist > 0) {
              const push = ((minDist - dist) / dist) * 0.5;
              const px = dx * push;
              const py = dy * push;
              a.x -= px;
              a.y -= py;
              b.x += px;
              b.y += py;
            }
          }
        }
      }
    }
  }

  // ── Crawler explosion blast ─────────────────────────────────────────────

  _crawlerExplosion(crawler, player) {
    const cx = crawler.x,
      cy = crawler.y,
      r = crawler.explosionRadius;

    this.gameState.spawnExplosion(cx, cy, r);
    if (typeof audioManager !== "undefined") audioManager.playExplosion();

    const pdx = player.x - cx,
      pdy = player.y - cy;
    const pd = Math.sqrt(pdx * pdx + pdy * pdy);
    if (pd < r + player.size / 2) {
      player.takeDamage(crawler.explosionPlayerDamage, this.gameState);
      if (pd > 0) {
        const force = map(pd, 0, r, 12, 2);
        player.applyKnockback((pdx / pd) * force, (pdy / pd) * force);
      }
    }

    for (const z of this.gameState.zombies) {
      if (z === crawler || !z.active) continue;
      const zdx = z.x - cx,
        zdy = z.y - cy;
      const zd = Math.sqrt(zdx * zdx + zdy * zdy);
      if (zd < r + z.size / 2) {
        const falloff = 1 - (zd / r) * 0.5;
        const dmg = Math.floor(crawler.explosionZombieDamage * falloff);
        z.takeDamage(dmg, this.gameState);
        if (zd > 0) {
          const force = map(zd, 0, r, 8, 1);
          z.applyKnockback((zdx / zd) * force, (zdy / zd) * force);
        }
      }
    }
  }

  handleRoundSpawning(roundManager) {
    const currentTime = pauseClock.now();
    const spawnResult = roundManager.update(
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
    for (const z of this.gameState.zombies) z.display();

    for (const c of this._pendingCrawlers) {
      if (c._explodePhase === "indicator") c.displayExplosionIndicator();
    }

    for (const p of this.witchProjectiles) p.display();

    if (this.gameState.explosions) this._drawExplosions();
  }

  _drawExplosions() {
    const now = pauseClock.now();
    for (let i = this.gameState.explosions.length - 1; i >= 0; i--) {
      const ex = this.gameState.explosions[i];
      const elapsed = now - ex.startTime;
      const duration = 500;
      if (elapsed > duration) {
        this.gameState.explosions.splice(i, 1);
        continue;
      }

      const progress = elapsed / duration;
      const alpha = (1 - progress) * 220;

      noStroke();
      fill(255, 220, 80, alpha * (1 - progress) * 1.4);
      circle(ex.x, ex.y, ex.radius * (0.4 + progress * 0.6) * 2);
      fill(255, 120, 30, alpha * 0.5);
      circle(ex.x, ex.y, ex.radius * (0.6 + progress * 0.8) * 2);
      noFill();
      stroke(220, 80, 20, alpha * 0.7);
      strokeWeight(3 * (1 - progress));
      circle(ex.x, ex.y, ex.radius * (0.8 + progress * 0.5) * 2);
      noStroke();
    }
  }
}
