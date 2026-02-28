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
      this.points = 10;
      this.coins = 2;
      this.spriteKey = "zombie_normal";
      this.spriteFrames = 3;
    } else if (type === "witch") {
      this.size = 22;
      this.speed = 1.5 + speedBonus;
      this.baseHealth = 75 + baseHealthBonus;
      this.damage = 15;
      this.color = "#FF00FF";
      this.points = 15;
      this.coins = 4;
      this.spriteKey = "zombie_witch";
      this.spriteFrames = 3;
    } else if (type === "crawler") {
      this.size = 18;
      this.speed = 2 + speedBonus;
      this.baseHealth = 60 + baseHealthBonus;
      this.damage = 20;
      this.color = "#FFFF00";
      this.points = 20;
      this.coins = 6;
      this.spriteKey = null;
      this.spriteFrames = 4;
    } else if (type === "slasher") {
      this.size = 32;
      this.speed = 3 + speedBonus;
      this.baseHealth = 800 + baseHealthBonus;
      this.damage = 25;
      this.color = "#FF0000";
      this.points = 25;
      this.coins = 10;
      this.spriteKey = null;
      this.spriteFrames = 4;
    } else if (type === "tank") {
      this.size = 60;
      this.speed = 4 + speedBonus;
      this.baseHealth = 1500 + baseHealthBonus;
      this.damage = 50;
      this.color = "#8B0000";
      this.points = 50;
      this.coins = 20;
      this.spriteKey = null;
      this.spriteFrames = 4;
    }

    this.health = Math.floor(this.baseHealth * healthMultiplier);
    this.maxHealth = this.health;

    this.attackCooldown = 1000;
    this.lastAttackTime = 0;

    // Sprite
    this.spriteSheet = null; // set after construction via spriteManager
    this.spriteState = new SpriteState(10, this.spriteFrames);
  }

  // Called once after construction — wire up sprite from spriteManager
  initSprite() {
    if (this.spriteKey && typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get(this.spriteKey);
    }
  }

  update(playerX, playerY) {
    let dx = playerX - this.x;
    let dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
      // Flip sprite toward player
      this.spriteState.flipX = dx < 0;
    }
  }

  display() {
    // Try sprite first
    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      this.x,
      this.y,
      1.5,
    );

    // Fallback to circle if no sprite
    if (!drawn) {
      push();
      // Hit flash: solid red
      fill(this.spriteState.hitFlashing ? color(255, 0, 0) : this.color);
      stroke(0);
      strokeWeight(2);
      circle(this.x, this.y, this.size);
      fill(255, 0, 0);
      noStroke();
      circle(this.x - 6, this.y - 5, 4);
      circle(this.x + 6, this.y - 5, 4);
      pop();
    }

    this.displayHealthBar();
  }

  displayHealthBar() {
    let barWidth = 30,
      barHeight = 4;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 8;
    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    fill(255, 0, 0);
    rect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
  }

  canAttack() {
    let now = millis();
    if (now - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = now;
      return true;
    }
    return false;
  }

  takeDamage(damage) {
    this.health -= damage;
    this.spriteState.flash(); // red flash on hit
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
