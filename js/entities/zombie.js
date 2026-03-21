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
      // hitbox: width x height in world px (covers visible sprite body)
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
    } else if (type === "witch") {
      this.size = 22;
      this.hitW = 24;
      this.hitH = 36;
      this.speed = 1.5 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = 15;
      this.color = "#FF00FF";
      this.coins = 4;
      this.exp = 15;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;
      this.stoppingDistance = 20;
      this.attackRange = 56;
      this.knockback = 5;
      this.attackWindupDuration = 250;
      this.attackStopDuration = 450;
      this.attackTiltAmount = 0.4;
      this.attackCooldown = 900;
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
    }

    this.health = Math.floor(this.baseHealth * healthMultiplier);
    this.maxHealth = this.health;
    this.lastAttackTime = 0;

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

  applyKnockback(kbX, kbY) {
    this._zkbX = kbX;
    this._zkbY = kbY;
  }

  // ── Rect-based hitbox getters ─────────────────────────────────────────────
  // Hitbox is centered on (x, y) horizontally, but offset slightly upward
  // so the feet align near y+hitH/2 (sprite is drawn centered on y)
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

  // Circle approximation for attack stopping — keep using size for movement logic
  _stopRadius() {
    return this.stoppingDistance + this.size / 2;
  }

  update(playerX, playerY) {
    let dx = playerX - this.x,
      dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let now = pauseClock.now();

    if (dx !== 0) this.spriteState.flipX = dx < 0;

    // Knockback
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
        let stopAt = this._stopRadius();
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
    let barY = this.y - this.hitH / 2 - 14; // align with top of hitbox
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
        this.y - this.hitH / 2 - 10,
        damage,
      );
    }
    if (this.health <= 0) this.active = false;
  }
}
