class Zombie {
  constructor(
    xPosition,
    yPosition,
    zombieType,
    healthMultiplier = 1.0,
    speedBonus = 0,
    baseHealthBonus = 0,
    difficultyConfig = null,
  ) {
    this.x = xPosition;
    this.y = yPosition;
    this.type = zombieType;
    this.active = true;

    const diffConfig = difficultyConfig || {
      dmgMult: 1.0,
      atkSpeedMult: 1.0,
      coinMult: 1.0,
    };

    this.diffConfig = diffConfig; // Saved variable para magamit sa round scaling

    if (zombieType === "normal") {
      this.size = 20;
      this.hitW = 22;
      this.hitH = 32;
      this.speed = 1 + speedBonus;
      this.baseHealth = 50 + baseHealthBonus;
      this.damage = Math.round(10 * diffConfig.dmgMult);
      this.color = "#00FF00";
      this.coinMin = Math.round(1 * diffConfig.coinMult);
      this.coinMax = Math.round(3 * diffConfig.coinMult);
      this.exp = 10;
      this.spriteKey = "zombie_normal";
      this.spriteFrames = 3;
      this.stoppingDistance = 18;
      this.attackRange = 52;
      this.knockback = 4;
      this.attackWindupDuration = Math.round(300 / diffConfig.atkSpeedMult);
      this.attackStopDuration = Math.round(500 / diffConfig.atkSpeedMult);
      this.attackTiltAmount = 0.35;
      this.attackCooldown = Math.round(1000 / diffConfig.atkSpeedMult);
      this.isRanged = false;
    } else if (zombieType === "witch") {
      this.size = 22;
      this.hitW = 24;
      this.hitH = 36;
      this.speed = 1.2 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = Math.round(12 * diffConfig.dmgMult);
      this.color = "#FF00FF";
      this.coinMin = Math.round(2 * diffConfig.coinMult);
      this.coinMax = Math.round(5 * diffConfig.coinMult);
      this.exp = 15;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;
      this.knockback = 2;
      this.isRanged = true;
      this.preferredRange = 200;
      this.preferredRangeSlack = 30;
      this.projectileDamage = Math.round(8 * diffConfig.dmgMult);
      this.attackCooldown = Math.round(1800 / diffConfig.atkSpeedMult);
      this.lastAttackTime = 0;
      this._witchState = "approach";
      this._pendingShot = false;
    } else if (zombieType === "crawler") {
      this.size = 18;
      this.hitW = 20;
      this.hitH = 28;
      this.speed = 2 + speedBonus;
      this.baseHealth = 60 + baseHealthBonus;
      this.damage = Math.round(20 * diffConfig.dmgMult);
      this.color = "#FFFF00";
      this.coinMin = Math.round(3 * diffConfig.coinMult);
      this.coinMax = Math.round(7 * diffConfig.coinMult);
      this.exp = 20;
      this.spriteKey = "zombie_crawler";
      this.spriteFrames = 3;
      this.stoppingDistance = 14;
      this.attackRange = 46;
      this.knockback = 6;
      this.attackWindupDuration = Math.round(180 / diffConfig.atkSpeedMult);
      this.attackStopDuration = Math.round(350 / diffConfig.atkSpeedMult);
      this.attackTiltAmount = 0.5;
      this.attackCooldown = Math.round(800 / diffConfig.atkSpeedMult);
      this.isRanged = false;

      this.explodes = true;
      this.explosionRadius = 90;
      this.explosionPlayerDamage = Math.round(35 * diffConfig.dmgMult);
      this.explosionZombieDamage = 20;
      this.explosionIndicatorDuration = 1000;
      this._explodePhase = "none";
      this._explodeStart = 0;
    } else if (zombieType === "slasher") {
      this.size = 32;
      this.hitW = 34;
      this.hitH = 52;
      this.speed = 2.7 + speedBonus;
      this.baseHealth = 200 + baseHealthBonus;
      this.damage = Math.round(25 * diffConfig.dmgMult);
      this.color = "#FF0000";
      this.coinMin = Math.round(5 * diffConfig.coinMult);
      this.coinMax = Math.round(12 * diffConfig.coinMult);
      this.exp = 25;
      this.spriteKey = "zombie_slasher";
      this.spriteFrames = 3;
      this.stoppingDistance = 28;
      this.attackRange = 72;
      this.knockback = 10;
      this.attackWindupDuration = Math.round(400 / diffConfig.atkSpeedMult);
      this.attackStopDuration = Math.round(600 / diffConfig.atkSpeedMult);
      this.attackTiltAmount = 0.55;
      this.attackCooldown = Math.round(1200 / diffConfig.atkSpeedMult);
      this.isRanged = false;
    } else if (zombieType === "tank") {
      this.size = 60;
      this.hitW = 64;
      this.hitH = 80;
      this.speed = 4 + speedBonus;
      this.baseHealth = 1500 + baseHealthBonus;
      this.damage = Math.round(50 * diffConfig.dmgMult);
      this.color = "#8B0000";
      this.coinMin = Math.round(10 * diffConfig.coinMult);
      this.coinMax = Math.round(25 * diffConfig.coinMult);
      this.exp = 50;
      this.spriteKey = null;
      this.spriteFrames = 4;
      this.stoppingDistance = 50;
      this.attackRange = 95;
      this.knockback = 18;
      this.attackWindupDuration = Math.round(500 / diffConfig.atkSpeedMult);
      this.attackStopDuration = Math.round(800 / diffConfig.atkSpeedMult);
      this.attackTiltAmount = 0.6;
      this.attackCooldown = Math.round(1500 / diffConfig.atkSpeedMult);
      this.isRanged = false;
    }

    this.coins = Math.floor(
      this.coinMin + Math.random() * (this.coinMax - this.coinMin + 1),
    );

    this.health = Math.floor(this.baseHealth * healthMultiplier);
    this.maxHealth = this.health;

    this.lastAttackTime = this.lastAttackTime || 0;
    this._knockbackX = 0;
    this._knockbackY = 0;
    this._knockbackDecay = 0.7;
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

  applyRoundScaling(currentRound) {
    let growthRate = 0.05;
    if (this.diffConfig.dmgMult >= 1.8) growthRate = 0.25;
    else if (this.diffConfig.dmgMult >= 1.3) growthRate = 0.15;

    let scaleFactor = 1 + (currentRound - 1) * growthRate;

    this.maxHealth = Math.floor(this.maxHealth * scaleFactor);
    this.health = this.maxHealth;
    this.damage = Math.floor(this.damage * scaleFactor);

    if (this.type === "witch" && this.projectileDamage !== undefined)
      this.projectileDamage = Math.floor(this.projectileDamage * scaleFactor);

    if (this.type === "crawler" && this.explodes) {
      this.explosionPlayerDamage = Math.floor(
        this.explosionPlayerDamage * scaleFactor,
      );
      this.explosionZombieDamage = Math.floor(
        this.explosionZombieDamage * scaleFactor,
      );
    }
  }

  applyKnockback(knockbackX, knockbackY) {
    this._knockbackX = knockbackX;
    this._knockbackY = knockbackY;
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
    let currentTimeMs = pauseClock.now();

    this.x += this._knockbackX;
    this.y += this._knockbackY;
    this._knockbackX *= this._knockbackDecay;
    this._knockbackY *= this._knockbackDecay;
    if (Math.abs(this._knockbackX) < 0.05) this._knockbackX = 0;
    if (Math.abs(this._knockbackY) < 0.05) this._knockbackY = 0;

    let deltaX = playerX - this.x,
      deltaY = playerY - this.y;
    let distanceFromPlayer = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (deltaX !== 0) this.spriteState.flipX = deltaX < 0;

    if (this.isRanged) {
      this._updateWitch(deltaX, deltaY, distanceFromPlayer, currentTimeMs);
    } else {
      this._updateMelee(deltaX, deltaY, distanceFromPlayer, currentTimeMs);
    }
  }

  _updateWitch(deltaX, deltaY, distanceFromPlayer, currentTimeMs) {
    let preferredDistance = this.preferredRange;
    let rangeSlack = this.preferredRangeSlack;

    if (this._witchState === "approach") {
      if (distanceFromPlayer > preferredDistance) {
        this.x += (deltaX / distanceFromPlayer) * this.speed;
        this.y += (deltaY / distanceFromPlayer) * this.speed;
      } else {
        this._witchState = "ranged";
      }
      this._tiltAngle = 0;
    } else if (this._witchState === "ranged") {
      if (distanceFromPlayer > preferredDistance + rangeSlack) {
        this._witchState = "approach";
        return;
      }
      if (currentTimeMs - this.lastAttackTime >= this.attackCooldown) {
        this.lastAttackTime = currentTimeMs;
        this._pendingShot = true;
      }
      this._tiltAngle = Math.sin(currentTimeMs * 0.003) * 0.08;
    }
  }

  consumePendingShot() {
    if (this._pendingShot) {
      this._pendingShot = false;
      return true;
    }
    return false;
  }

  _updateMelee(deltaX, deltaY, distanceFromPlayer, currentTimeMs) {
    switch (this._attackPhase) {
      case "idle": {
        let stopDistance = this.stoppingDistance + this.size / 2;
        if (distanceFromPlayer > stopDistance) {
          this.x += (deltaX / distanceFromPlayer) * this.speed;
          this.y += (deltaY / distanceFromPlayer) * this.speed;
        }
        if (
          distanceFromPlayer <= stopDistance + 4 &&
          currentTimeMs - this.lastAttackTime > this.attackCooldown
        ) {
          this._attackPhase = "windup";
          this._attackPhaseStart = currentTimeMs;
          this._didHitThisAttack = false;
        }
        this._tiltAngle = 0;
        break;
      }
      case "windup": {
        let windupProgress =
          (currentTimeMs - this._attackPhaseStart) / this.attackWindupDuration;
        this._tiltAngle =
          -this.attackTiltAmount * Math.sin((windupProgress * Math.PI) / 2);
        if (windupProgress >= 1) {
          this._attackPhase = "attacking";
          this._attackPhaseStart = currentTimeMs;
        }
        break;
      }
      case "attacking": {
        this._tiltAngle = this.attackTiltAmount * 0.6;
        if (!this._didHitThisAttack) {
          this._didHitThisAttack = true;
          this._pendingHit = true;
        }
        if (currentTimeMs - this._attackPhaseStart > 100) {
          this._attackPhase = "stopped";
          this._attackPhaseStart = currentTimeMs;
        }
        break;
      }
      case "stopped": {
        let stopProgress =
          (currentTimeMs - this._attackPhaseStart) / this.attackStopDuration;
        this._tiltAngle = this.attackTiltAmount * 0.6 * (1 - stopProgress);
        if (stopProgress >= 1) {
          this._attackPhase = "idle";
          this.lastAttackTime = currentTimeMs;
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

  updateExplosion() {
    if (!this.explodes) return "none";
    let currentTimeMs = pauseClock.now();

    if (this._explodePhase === "none" && !this.active) {
      this._explodePhase = "indicator";
      this._explodeStart = currentTimeMs;
      return "indicator";
    }

    if (this._explodePhase === "indicator") {
      let timeElapsed = currentTimeMs - this._explodeStart;
      if (timeElapsed >= this.explosionIndicatorDuration) {
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

    let wasSpriteDrawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      0,
      0,
      1.5,
    );
    if (!wasSpriteDrawn) {
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
    let currentProgress = this.explosionIndicatorProgress();
    let radius = this.explosionRadius;

    let pulseAmount = 0.5 + 0.5 * Math.sin(currentProgress * Math.PI * 6);
    noStroke();
    fill(255, 60, 30, 40 + pulseAmount * 40);
    circle(this.x, this.y, radius * 2);

    let ringRadius = radius * (0.5 + currentProgress * 0.5);
    noFill();
    stroke(255, 80, 30, 200 - currentProgress * 120);
    strokeWeight(3);
    circle(this.x, this.y, ringRadius * 2);

    stroke(255, 60, 30, 160);
    strokeWeight(1.5);
    drawingContext.setLineDash([8, 6]);
    circle(this.x, this.y, radius * 2);
    drawingContext.setLineDash([]);

    noFill();
    stroke(255, 200, 60, 220);
    strokeWeight(4);
    let startAngle = -HALF_PI;
    let endAngle = startAngle + TWO_PI * currentProgress;
    arc(this.x, this.y, radius * 2 + 8, radius * 2 + 8, startAngle, endAngle);

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
    let healthPercentage = this.health / this.maxHealth;
    if (healthPercentage > 0.6) fill(50, 200, 50);
    else if (healthPercentage > 0.3) fill(220, 160, 0);
    else fill(200, 30, 30);
    rect(barX, barY, barWidth * healthPercentage, barHeight);
  }

  takeDamage(damageAmount, gameState, damageSource) {
    this.health -= damageAmount;
    let currentGameState = gameState || this._gameState;
    let isMeleeHit = damageSource === "melee";

    if (this.health <= 0) {
      this.health = 0;
      this.active = false;
      if (typeof audioManager !== "undefined")
        audioManager.playZombieDead(this.type, isMeleeHit);
    } else {
      this.spriteState.flash();
      if (typeof audioManager !== "undefined")
        audioManager.playZombieHurt(this.type, isMeleeHit);
    }

    if (currentGameState) {
      let randomOffsetX = (Math.random() - 0.5) * 20;
      currentGameState.spawnDamagePopup(
        this.x + randomOffsetX,
        this.y - this.hitH / 2 - 10,
        damageAmount,
      );
    }
  }
}
