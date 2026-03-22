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

    // ── Per-type stats ────────────────────────────────────────────────────
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
      // Normal uses melee state machine
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

      // ── Witch ranged config (tune here) ──────────────────────────────
      this.isRanged = true;
      this.preferredRange = 200; // stop moving at this distance from player
      this.preferredRangeSlack = 30; // hysteresis: resume moving if > range + slack
      this.projectileDamage = 8; // base damage per projectile
      this.attackCooldown = 1800; // ms between projectile shots
      this.projectileSpeed = 4.5; // px/frame (set on WitchProjectile)
      // ─────────────────────────────────────────────────────────────────

      this.lastAttackTime = 0;
      this._witchState = "approach"; // "approach" | "ranged"
      this._pendingShot = false; // signal to manager to spawn projectile
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

      // ── Crawler explosion config (tune here) ──────────────────────────
      this.explodes = true;
      this.explosionRadius = 90; // px
      this.explosionPlayerDamage = 35; // damage dealt to player
      this.explosionZombieDamage = 20; // damage dealt to nearby zombies
      this._exploded = false;
      // ─────────────────────────────────────────────────────────────────
    } else if (type === "slasher") {
      this.size = 32;
      this.hitW = 34;
      this.hitH = 52;
      this.speed = 3 + speedBonus;
      this.baseHealth = 800 + baseHealthBonus;
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

    // Shared state
    this.lastAttackTime = this.lastAttackTime || 0;
    this._zkbX = 0;
    this._zkbY = 0;
    this._zkbDecay = 0.7;

    // Melee attack state (non-witch)
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

  // ── Scale damage based on round (called after construction) ──────────────
  applyRoundScaling(round) {
    // Every 3 rounds past round 1, increase special damages by 10%
    let scale = 1 + Math.floor((round - 1) / 3) * 0.1;
    if (this.type === "witch" && this.projectileDamage !== undefined) {
      this.projectileDamage = Math.floor(this.projectileDamage * scale);
    }
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

  // ── Hitbox ────────────────────────────────────────────────────────────────
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

  // ── Update ────────────────────────────────────────────────────────────────
  update(playerX, playerY) {
    let now = pauseClock.now();

    // Knockback
    this.x += this._zkbX;
    this.y += this._zkbY;
    this._zkbX *= this._zkbDecay;
    this._zkbY *= this._zkbDecay;
    if (Math.abs(this._zkbX) < 0.05) this._zkbX = 0;
    if (Math.abs(this._zkbY) < 0.05) this._zkbY = 0;

    let dx = playerX - this.x;
    let dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (dx !== 0) this.spriteState.flipX = dx < 0;

    if (this.isRanged) {
      this._updateWitch(dx, dy, distance, now);
    } else {
      this._updateMelee(dx, dy, distance, now);
    }
  }

  // ── Witch ranged state machine ────────────────────────────────────────────
  _updateWitch(dx, dy, distance, now) {
    let preferred = this.preferredRange;
    let slack = this.preferredRangeSlack;

    if (this._witchState === "approach") {
      // Move toward player until within preferred range
      if (distance > preferred) {
        this.x += (dx / distance) * this.speed;
        this.y += (dy / distance) * this.speed;
      } else {
        // Close enough — switch to ranged attack
        this._witchState = "ranged";
      }
      this._tiltAngle = 0;
    } else if (this._witchState === "ranged") {
      // Stand still and shoot
      // If player moves too far away, resume approaching
      if (distance > preferred + slack) {
        this._witchState = "approach";
        return;
      }

      // Fire projectile on cooldown
      if (now - this.lastAttackTime >= this.attackCooldown) {
        this.lastAttackTime = now;
        this._pendingShot = true; // zombieManager will consume this
      }

      // Slight levitation bob on tilt for visual flair
      this._tiltAngle = Math.sin(now * 0.003) * 0.08;
    }
  }

  // Returns true if witch has a shot ready to fire, resets flag
  consumePendingShot() {
    if (this._pendingShot) {
      this._pendingShot = false;
      return true;
    }
    return false;
  }

  // ── Melee state machine (normal/slasher/tank/crawler) ────────────────────
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

  // ── Display ───────────────────────────────────────────────────────────────
  display() {
    // Shadow
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

    // Witch floating glow
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

  // ── Damage & death ────────────────────────────────────────────────────────
  takeDamage(damage, gameState) {
    this.health -= damage;
    this.spriteState.flash();
    let gs = gameState || this._gameState;
    if (gs) {
      let offsetX = (Math.random() - 0.5) * 20;
      gs.spawnDamagePopup(
        this.x + offsetX,
        this.y - this.hitH / 2 - 10,
        damage,
      );
    }
    if (this.health <= 0) this.active = false;
  }
}
