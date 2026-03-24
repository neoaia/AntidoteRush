class Zombie {
  constructor(
    x,
    y,
    type,
    healthMultiplier = 1.0,
    speedBonus = 0,
    baseHealthBonus = 0,
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;

    if (type === "normal") {
      this.size = 20;
      this.hitW = 22;
      this.hitH = 32;
      this.speed = 1 + speedBonus;
      this.baseHealth = 50 + baseHealthBonus;
      this.damage = 10;
      this.color = "#00FF00";
      this.coins = 2;
      this.exp = 10;
      this.spriteKey = "zombie_normal";
      this.spriteFrames = 3;
      this.stoppingDistance = 18;
      this.attackRange = 52;
      this.knockback = 4;
      this.attackWindupDuration = 300;
      this.attackStopDuration = 500;
      this.attackTiltAmount = 0.35;
      this.attackCooldown = 1000;
      this.isRanged = false;
    } else if (type === "witch") {
      this.size = 22;
      this.hitW = 24;
      this.hitH = 36;
      this.speed = 1.2 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = 12;
      this.color = "#FF00FF";
      this.coins = 4;
      this.exp = 15;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;
      this.knockback = 2;
      this.isRanged = true;
      this.preferredRange = 200;
      this.preferredRangeSlack = 30;
      this.projectileDamage = 8;
      this.attackCooldown = 1800;
      this.lastAttackTime = 0;
      this._witchState = "approach";
      this._pendingShot = false;
    } else if (type === "crawler") {
      this.size = 18;
      this.hitW = 20;
      this.hitH = 28;
      this.speed = 2 + speedBonus;
      this.baseHealth = 60 + baseHealthBonus;
      this.damage = 20;
      this.color = "#FFFF00";
      this.coins = 6;
      this.exp = 20;
      this.spriteKey = "zombie_crawler";
      this.spriteFrames = 3;
      this.stoppingDistance = 14;
      this.attackRange = 46;
      this.knockback = 6;
      this.attackWindupDuration = 180;
      this.attackStopDuration = 350;
      this.attackTiltAmount = 0.5;
      this.attackCooldown = 800;
      this.isRanged = false;

      // ── Crawler explosion config ────────────────────────────────────────
      this.explodes = true;
      this.explosionRadius = 90;
      this.explosionPlayerDamage = 35;
      this.explosionZombieDamage = 20;
      // Two-phase: indicator shows for this long before the blast fires
      this.explosionIndicatorDuration = 1000; // ms
      this._explodePhase = "none"; // "none" | "indicator" | "done"
      this._explodeStart = 0;
      // ─────────────────────────────────────────────────────────────────
    } else if (type === "slasher") {
      this.size = 32;
      this.hitW = 34;
      this.hitH = 52;
      this.speed = 2.7 + speedBonus;
      this.baseHealth = 200 + baseHealthBonus;
      this.damage = 25;
      this.color = "#FF0000";
      this.coins = 10;
      this.exp = 25;
      this.spriteKey = "zombie_slasher";
      this.spriteFrames = 3;
      this.stoppingDistance = 28;
      this.attackRange = 72;
      this.knockback = 10;
      this.attackWindupDuration = 400;
      this.attackStopDuration = 600;
      this.attackTiltAmount = 0.55;
      this.attackCooldown = 1200;
      this.isRanged = false;
    } else if (type === "tank") {
      this.size = 60;
      this.hitW = 64;
      this.hitH = 80;
      this.speed = 4 + speedBonus;
      this.baseHealth = 1500 + baseHealthBonus;
      this.damage = 50;
      this.color = "#8B0000";
      this.coins = 20;
      this.exp = 50;
      this.spriteKey = null;
      this.spriteFrames = 4;
      this.stoppingDistance = 50;
      this.attackRange = 95;
      this.knockback = 18;
      this.attackWindupDuration = 500;
      this.attackStopDuration = 800;
      this.attackTiltAmount = 0.6;
      this.attackCooldown = 1500;
      this.isRanged = false;
    }

    this.health = Math.floor(this.baseHealth * healthMultiplier);
    this.maxHealth = this.health;

    this.lastAttackTime = this.lastAttackTime || 0;
    this._zkbX = 0;
    this._zkbY = 0;
    this._zkbDecay = 0.7;
    this._attackPhase = "idle";
    this._attackPhaseStart = 0;
    this._tiltAngle = 0;
    this._pendingHit = false;
    this._didHitThisAttack = false;

    this.spriteSheet = null;
    this.spriteState = new SpriteState(10, this.spriteFrames);
    this._gameState = null;
  }

  initSprite(gameState) {
    if (this.spriteKey && typeof spriteManager !== "undefined")
      this.spriteSheet = spriteManager.get(this.spriteKey);
    if (gameState) this._gameState = gameState;
  }

  applyRoundScaling(round) {
    let scale = 1 + Math.floor((round - 1) / 3) * 0.1;
    if (this.type === "witch" && this.projectileDamage !== undefined)
      this.projectileDamage = Math.floor(this.projectileDamage * scale);
    if (this.type === "crawler" && this.explodes) {
      this.explosionPlayerDamage = Math.floor(
        this.explosionPlayerDamage * scale,
      );
      this.explosionZombieDamage = Math.floor(
        this.explosionZombieDamage * scale,
      );
    }
  }

  applyKnockback(kbX, kbY) {
    this._zkbX = kbX;
    this._zkbY = kbY;
  }

  getLeft() {
    return this.x - this.hitW / 2;
  }
  getRight() {
    return this.x + this.hitW / 2;
  }
  getTop() {
    return this.y - this.hitH / 2;
  }
  getBottom() {
    return this.y + this.hitH / 2;
  }

  update(playerX, playerY) {
    let now = pauseClock.now();

    // Knockback
    this.x += this._zkbX;
    this.y += this._zkbY;
    this._zkbX *= this._zkbDecay;
    this._zkbY *= this._zkbDecay;
    if (Math.abs(this._zkbX) < 0.05) this._zkbX = 0;
    if (Math.abs(this._zkbY) < 0.05) this._zkbY = 0;

    let dx = playerX - this.x,
      dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (dx !== 0) this.spriteState.flipX = dx < 0;

    if (this.isRanged) {
      this._updateWitch(dx, dy, distance, now);
    } else {
      this._updateMelee(dx, dy, distance, now);
    }
  }

  _updateWitch(dx, dy, distance, now) {
    let preferred = this.preferredRange;
    let slack = this.preferredRangeSlack;

    if (this._witchState === "approach") {
      if (distance > preferred) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      } else {
        this._witchState = "ranged";
      }
      this._tiltAngle = 0;
    } else if (this._witchState === "ranged") {
      if (distance > preferred + slack) {
        this._witchState = "approach";
        return;
      }
      if (now - this.lastAttackTime >= this.attackCooldown) {
        this.lastAttackTime = now;
        this._pendingShot = true;
      }
      this._tiltAngle = Math.sin(now * 0.003) * 0.08;
    }
  }

  consumePendingShot() {
    if (this._pendingShot) {
      this._pendingShot = false;
      return true;
    }
    return false;
  }

  _updateMelee(dx, dy, distance, now) {
    switch (this._attackPhase) {
      case "idle": {
        let stopAt = this.stoppingDistance + this.size / 2;
        if (distance > stopAt) {
          this.x += (dx / distance) * this.speed;
          this.y += (dy / distance) * this.speed;
        }
        if (
          distance <= stopAt + 4 &&
          now - this.lastAttackTime > this.attackCooldown
        ) {
          this._attackPhase = "windup";
          this._attackPhaseStart = now;
          this._didHitThisAttack = false;
        }
        this._tiltAngle = 0;
        break;
      }
      case "windup": {
        let wp = (now - this._attackPhaseStart) / this.attackWindupDuration;
        this._tiltAngle = -this.attackTiltAmount * Math.sin((wp * Math.PI) / 2);
        if (wp >= 1) {
          this._attackPhase = "attacking";
          this._attackPhaseStart = now;
        }
        break;
      }
      case "attacking": {
        this._tiltAngle = this.attackTiltAmount * 0.6;
        if (!this._didHitThisAttack) {
          this._didHitThisAttack = true;
          this._pendingHit = true;
        }
        if (now - this._attackPhaseStart > 100) {
          this._attackPhase = "stopped";
          this._attackPhaseStart = now;
        }
        break;
      }
      case "stopped": {
        let sp = (now - this._attackPhaseStart) / this.attackStopDuration;
        this._tiltAngle = this.attackTiltAmount * 0.6 * (1 - sp);
        if (sp >= 1) {
          this._attackPhase = "idle";
          this.lastAttackTime = now;
          this._tiltAngle = 0;
        }
        break;
      }
    }
  }

  consumePendingHit() {
    if (this._pendingHit) {
      this._pendingHit = false;
      return true;
    }
    return false;
  }

  // ── Crawler two-phase explosion ───────────────────────────────────────────
  // Returns "indicator" while showing warning, "explode" when ready to blast, "none" otherwise
  updateExplosion() {
    if (!this.explodes) return "none";
    let now = pauseClock.now();

    if (this._explodePhase === "none" && !this.active) {
      // Just died — start indicator phase
      this._explodePhase = "indicator";
      this._explodeStart = now;
      return "indicator";
    }

    if (this._explodePhase === "indicator") {
      let elapsed = now - this._explodeStart;
      if (elapsed >= this.explosionIndicatorDuration) {
        this._explodePhase = "done";
        return "explode"; // signal to zombieManager to run the blast
      }
      return "indicator";
    }

    return "none";
  }

  // Returns 0..1 indicator progress for drawing
  explosionIndicatorProgress() {
    if (this._explodePhase !== "indicator") return 0;
    return Math.min(
      1,
      (pauseClock.now() - this._explodeStart) / this.explosionIndicatorDuration,
    );
  }

  display() {
    noStroke();
    fill(0, 0, 0, 70);
    ellipse(
      this.x + 2,
      this.y + this.size / 2 + 10,
      this.size * 1.5,
      this.size * 0.42,
    );

    push();
    translate(this.x, this.y);
    if (this._tiltAngle !== 0) {
      let pivotY = this.size / 2;
      translate(0, pivotY);
      rotate(this._tiltAngle);
      translate(0, -pivotY);
    }

    if (this.type === "witch" && this._witchState === "ranged") {
      noStroke();
      fill(180, 80, 255, 40);
      circle(0, 0, this.size * 3);
      fill(200, 100, 255, 20);
      circle(0, 0, this.size * 4);
    }

    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      0,
      0,
      1.5,
    );
    if (!drawn) {
      fill(this.spriteState.hitFlashing ? color(255, 0, 0) : this.color);
      stroke(0);
      strokeWeight(2);
      circle(0, 0, this.size);
      fill(255, 0, 0);
      noStroke();
      circle(-6, -5, 4);
      circle(6, -5, 4);
    }
    pop();

    this.displayHealthBar();
  }

  // Draw explosion indicator (called by zombieManager while phase === "indicator")
  displayExplosionIndicator() {
    let progress = this.explosionIndicatorProgress();
    let r = this.explosionRadius;

    // Pulsing fill
    let pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 6);
    noStroke();
    fill(255, 60, 30, 40 + pulse * 40);
    circle(this.x, this.y, r * 2);

    // Expanding ring
    let ringR = r * (0.5 + progress * 0.5);
    noFill();
    stroke(255, 80, 30, 200 - progress * 120);
    strokeWeight(3);
    circle(this.x, this.y, ringR * 2);

    // Dashed outer boundary
    stroke(255, 60, 30, 160);
    strokeWeight(1.5);
    drawingContext.setLineDash([8, 6]);
    circle(this.x, this.y, r * 2);
    drawingContext.setLineDash([]);

    // Progress bar ring — grows as countdown fills
    noFill();
    stroke(255, 200, 60, 220);
    strokeWeight(4);
    let startAng = -HALF_PI;
    let endAng = startAng + TWO_PI * progress;
    arc(this.x, this.y, r * 2 + 8, r * 2 + 8, startAng, endAng);

    noStroke();
  }

  displayHealthBar() {
    let barWidth = 40,
      barHeight = 7;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.hitH / 2 - 14;
    fill(0);
    noStroke();
    rect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    fill(40, 10, 10);
    rect(barX, barY, barWidth, barHeight);
    let pct = this.health / this.maxHealth;
    if (pct > 0.6) fill(50, 200, 50);
    else if (pct > 0.3) fill(220, 160, 0);
    else fill(200, 30, 30);
    rect(barX, barY, barWidth * pct, barHeight);
  }

  takeDamage(damage, gameState, source) {
    this.health -= damage;
    let gs = gameState || this._gameState;
    let isMelee = source === "melee";

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;

      // Dead: skip generic dead.wav when killed by knife
      if (typeof audioManager !== "undefined") {
        audioManager.playZombieDead(this.type, isMelee);
      }
    } else {
      this.spriteState.flash();

      // Hurt: skip generic hurt.wav when damaged by knife
      if (typeof audioManager !== "undefined") {
        audioManager.playZombieHurt(this.type, isMelee);
      }
    }

    if (gs) {
      let offsetX = (Math.random() - 0.5) * 20;
      gs.spawnDamagePopup(
        this.x + offsetX,
        this.y - this.hitH / 2 - 10,
        damage,
      );
    }
  }
}
