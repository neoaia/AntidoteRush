class Zombie {
  constructor(
    x,
    y,
    type,
    healthMultiplier = 1.0,
    speedBonus = 0,
    baseHealthBonus = 0,
    difficultyConfig = null,
  ) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;

    // difficultyConfig carries per-difficulty stat modifiers set by RoundManager
    const dc = difficultyConfig || {
      dmgMult: 1.0,
      atkSpeedMult: 1.0,
      coinMult: 1.0,
    };

    if (type === "normal") {
      this.size = 20;
      this.hitW = 22;
      this.hitH = 32;
      this.speed = 1 + speedBonus;
      this.baseHealth = 50 + baseHealthBonus;
      this.damage = Math.round(10 * dc.dmgMult);
      this.color = "#00FF00";
      this.coinMin = Math.round(1 * dc.coinMult);
      this.coinMax = Math.round(3 * dc.coinMult);
      this.exp = 10;
      this.spriteKey = "zombie_normal";
      this.spriteFrames = 3;
      this.stoppingDistance = 18;
      this.attackRange = 52;
      this.knockback = 4;
      this.attackWindupDuration = Math.round(300 / dc.atkSpeedMult);
      this.attackStopDuration = Math.round(500 / dc.atkSpeedMult);
      this.attackTiltAmount = 0.35;
      this.attackCooldown = Math.round(1000 / dc.atkSpeedMult);
      this.isRanged = false;
    } else if (type === "witch") {
      this.size = 22;
      this.hitW = 24;
      this.hitH = 36;
      this.speed = 1.2 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = Math.round(12 * dc.dmgMult);
      this.color = "#FF00FF";
      this.coinMin = Math.round(2 * dc.coinMult);
      this.coinMax = Math.round(5 * dc.coinMult);
      this.exp = 15;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;
      this.knockback = 2;
      this.isRanged = true;
      this.preferredRange = 200;
      this.preferredRangeSlack = 30;
      this.projectileDamage = Math.round(8 * dc.dmgMult);
      this.attackCooldown = Math.round(1800 / dc.atkSpeedMult);
      this.lastAttackTime = 0;
      this._witchState = "approach";
      this._pendingShot = false;
    } else if (type === "crawler") {
      this.size = 18;
      this.hitW = 20;
      this.hitH = 28;
      this.speed = 2 + speedBonus;
      this.baseHealth = 60 + baseHealthBonus;
      this.damage = Math.round(20 * dc.dmgMult);
      this.color = "#FFFF00";
      this.coinMin = Math.round(3 * dc.coinMult);
      this.coinMax = Math.round(7 * dc.coinMult);
      this.exp = 20;
      this.spriteKey = "zombie_crawler";
      this.spriteFrames = 3;
      this.stoppingDistance = 14;
      this.attackRange = 46;
      this.knockback = 6;
      this.attackWindupDuration = Math.round(180 / dc.atkSpeedMult);
      this.attackStopDuration = Math.round(350 / dc.atkSpeedMult);
      this.attackTiltAmount = 0.5;
      this.attackCooldown = Math.round(800 / dc.atkSpeedMult);
      this.isRanged = false;

      // ── Crawler explosion config ────────────────────────────────────────
      this.explodes = true;
      this.explosionRadius = 90;
      this.explosionPlayerDamage = Math.round(35 * dc.dmgMult);
      this.explosionZombieDamage = 20;
      this.explosionIndicatorDuration = 1000;
      this._explodePhase = "none";
      this._explodeStart = 0;
    } else if (type === "slasher") {
      this.size = 32;
      this.hitW = 34;
      this.hitH = 52;
      this.speed = 2.7 + speedBonus;
      this.baseHealth = 200 + baseHealthBonus;
      this.damage = Math.round(25 * dc.dmgMult);
      this.color = "#FF0000";
      this.coinMin = Math.round(5 * dc.coinMult);
      this.coinMax = Math.round(12 * dc.coinMult);
      this.exp = 25;
      this.spriteKey = "zombie_slasher";
      this.spriteFrames = 3;
      this.stoppingDistance = 28;
      this.attackRange = 72;
      this.knockback = 10;
      this.attackWindupDuration = Math.round(400 / dc.atkSpeedMult);
      this.attackStopDuration = Math.round(600 / dc.atkSpeedMult);
      this.attackTiltAmount = 0.55;
      this.attackCooldown = Math.round(1200 / dc.atkSpeedMult);
      this.isRanged = false;
    } else if (type === "tank") {
      this.size = 60;
      this.hitW = 64;
      this.hitH = 80;
      this.speed = 4 + speedBonus;
      this.baseHealth = 1500 + baseHealthBonus;
      this.damage = Math.round(50 * dc.dmgMult);
      this.color = "#8B0000";
      this.coinMin = Math.round(10 * dc.coinMult);
      this.coinMax = Math.round(25 * dc.coinMult);
      this.exp = 50;
      this.spriteKey = null;
      this.spriteFrames = 4;
      this.stoppingDistance = 50;
      this.attackRange = 95;
      this.knockback = 18;
      this.attackWindupDuration = Math.round(500 / dc.atkSpeedMult);
      this.attackStopDuration = Math.round(800 / dc.atkSpeedMult);
      this.attackTiltAmount = 0.6;
      this.attackCooldown = Math.round(1500 / dc.atkSpeedMult);
      this.isRanged = false;
    }

    // Randomise coin reward once on construction
    this.coins = Math.floor(
      this.coinMin + Math.random() * (this.coinMax - this.coinMin + 1),
    );

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
    // Scale every 2 rounds instead of every 3, and 15% per tier instead of 10%
    let scale = 1 + Math.floor((round - 1) / 2) * 0.15;
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
  updateExplosion() {
    if (!this.explodes) return "none";
    let now = pauseClock.now();

    if (this._explodePhase === "none" && !this.active) {
      this._explodePhase = "indicator";
      this._explodeStart = now;
      return "indicator";
    }

    if (this._explodePhase === "indicator") {
      let elapsed = now - this._explodeStart;
      if (elapsed >= this.explosionIndicatorDuration) {
        this._explodePhase = "done";
        return "explode";
      }
      return "indicator";
    }
    return "none";
  }

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

  displayExplosionIndicator() {
    let progress = this.explosionIndicatorProgress();
    let r = this.explosionRadius;

    let pulse = 0.5 + 0.5 * Math.sin(progress * Math.PI * 6);
    noStroke();
    fill(255, 60, 30, 40 + pulse * 40);
    circle(this.x, this.y, r * 2);

    let ringR = r * (0.5 + progress * 0.5);
    noFill();
    stroke(255, 80, 30, 200 - progress * 120);
    strokeWeight(3);
    circle(this.x, this.y, ringR * 2);

    stroke(255, 60, 30, 160);
    strokeWeight(1.5);
    drawingContext.setLineDash([8, 6]);
    circle(this.x, this.y, r * 2);
    drawingContext.setLineDash([]);

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
      if (typeof audioManager !== "undefined")
        audioManager.playZombieDead(this.type, isMelee);
    } else {
      this.spriteState.flash();
      if (typeof audioManager !== "undefined")
        audioManager.playZombieHurt(this.type, isMelee);
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
