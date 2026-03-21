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
      this.speed = 1 + speedBonus;
      this.baseHealth = 50 + baseHealthBonus;
      this.damage = 10;
      this.color = "#00FF00";
      this.coins = 2;
      this.exp = 10;
      this.spriteKey = "zombie_normal";
      this.spriteFrames = 3;

      this.stoppingDistance = 18;
      this.attackRange = 52; // was 38
      this.knockback = 4;
      this.attackWindupDuration = 300;
      this.attackStopDuration = 500;
      this.attackTiltAmount = 0.35;
      this.attackCooldown = 1000;
    } else if (type === "witch") {
      this.size = 22;
      this.speed = 1.5 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = 15;
      this.color = "#FF00FF";
      this.coins = 4;
      this.exp = 15;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;

      this.stoppingDistance = 20;
      this.attackRange = 56; // was 42
      this.knockback = 5;
      this.attackWindupDuration = 250;
      this.attackStopDuration = 450;
      this.attackTiltAmount = 0.4;
      this.attackCooldown = 900;
    } else if (type === "crawler") {
      this.size = 18;
      this.speed = 2 + speedBonus;
      this.baseHealth = 60 + baseHealthBonus;
      this.damage = 20;
      this.color = "#FFFF00";
      this.coins = 6;
      this.exp = 20;
      this.spriteKey = "zombie_crawler";
      this.spriteFrames = 3;

      this.stoppingDistance = 14;
      this.attackRange = 46; // was 32 — small but fast, needs reliable reach
      this.knockback = 6;
      this.attackWindupDuration = 180;
      this.attackStopDuration = 350;
      this.attackTiltAmount = 0.5;
      this.attackCooldown = 800;
    } else if (type === "slasher") {
      this.size = 32;
      this.speed = 3 + speedBonus;
      this.baseHealth = 800 + baseHealthBonus;
      this.damage = 25;
      this.color = "#FF0000";
      this.coins = 10;
      this.exp = 25;
      this.spriteKey = "zombie_slasher";
      this.spriteFrames = 3;

      this.stoppingDistance = 28;
      this.attackRange = 72; // was 58
      this.knockback = 10;
      this.attackWindupDuration = 400;
      this.attackStopDuration = 600;
      this.attackTiltAmount = 0.55;
      this.attackCooldown = 1200;
    } else if (type === "tank") {
      this.size = 60;
      this.speed = 4 + speedBonus;
      this.baseHealth = 1500 + baseHealthBonus;
      this.damage = 50;
      this.color = "#8B0000";
      this.coins = 20;
      this.exp = 50;
      this.spriteKey = null;
      this.spriteFrames = 4;

      this.stoppingDistance = 50;
      this.attackRange = 95; // was 80
      this.knockback = 18;
      this.attackWindupDuration = 500;
      this.attackStopDuration = 800;
      this.attackTiltAmount = 0.6;
      this.attackCooldown = 1500;
    }

    this.health = Math.floor(this.baseHealth * healthMultiplier);
    this.maxHealth = this.health;

    this.lastAttackTime = 0;

    // Knockback from weapons
    this._zkbX = 0;
    this._zkbY = 0;
    this._zkbDecay = 0.7;

    // Attack state machine
    this._attackPhase = "idle";
    this._attackPhaseStart = 0;
    this._attackAngle = 0;
    this._tiltAngle = 0;
    this._pendingHit = false;
    this._didHitThisAttack = false;

    this.spriteSheet = null;
    this.spriteState = new SpriteState(10, this.spriteFrames);
    this._gameState = null;
  }

  initSprite(gameState) {
    if (this.spriteKey && typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get(this.spriteKey);
    }
    if (gameState) this._gameState = gameState;
  }

  applyKnockback(kbX, kbY) {
    this._zkbX = kbX;
    this._zkbY = kbY;
  }

  update(playerX, playerY) {
    let dx = playerX - this.x;
    let dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let now = millis();

    if (dx !== 0) this.spriteState.flipX = dx < 0;

    // Apply and decay knockback
    this.x += this._zkbX;
    this.y += this._zkbY;
    this._zkbX *= this._zkbDecay;
    this._zkbY *= this._zkbDecay;
    if (Math.abs(this._zkbX) < 0.05) this._zkbX = 0;
    if (Math.abs(this._zkbY) < 0.05) this._zkbY = 0;

    // Recompute after knockback
    dx = playerX - this.x;
    dy = playerY - this.y;
    distance = Math.sqrt(dx * dx + dy * dy);

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
          this._attackAngle = Math.atan2(dy, dx);
          this._didHitThisAttack = false;
        }
        this._tiltAngle = 0;
        break;
      }

      case "windup": {
        let windupProgress =
          (now - this._attackPhaseStart) / this.attackWindupDuration;
        this._tiltAngle =
          -this.attackTiltAmount * Math.sin((windupProgress * Math.PI) / 2);
        if (windupProgress >= 1) {
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
        let stopProgress =
          (now - this._attackPhaseStart) / this.attackStopDuration;
        this._tiltAngle = this.attackTiltAmount * 0.6 * (1 - stopProgress);
        if (stopProgress >= 1) {
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
    let barY = this.y - this.size / 2 - 14;

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

  takeDamage(damage, gameState) {
    this.health -= damage;
    this.spriteState.flash();

    let gs = gameState || this._gameState;
    if (gs) {
      let offsetX = (Math.random() - 0.5) * 20;
      gs.spawnDamagePopup(
        this.x + offsetX,
        this.y - this.size / 2 - 10,
        damage,
      );
    }

    if (this.health <= 0) this.active = false;
  }

  getLeft() {
    return this.x - this.size / 2;
  }
  getRight() {
    return this.x + this.size / 2;
  }
  getTop() {
    return this.y - this.size / 2;
  }
  getBottom() {
    return this.y + this.size / 2;
  }
}
