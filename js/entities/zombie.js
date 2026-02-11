class Zombie {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    if (type === "normal") {
      this.size = 20;
      this.speed = 1;
      this.health = 50;
      this.maxHealth = 50;
      this.damage = 10;
      this.color = "#00FF00";
      this.points = 10;
    } else if (type === "witch") {
      this.size = 22;
      this.speed = 1.5;
      this.health = 75;
      this.maxHealth = 75;
      this.damage = 15;
      this.color = "#FF00FF";
      this.points = 15;
    } else if (type === "crawler") {
      this.size = 18;
      this.speed = 2;
      this.health = 60;
      this.maxHealth = 60;
      this.damage = 20;
      this.color = "#FFFF00";
      this.points = 20;
    } else if (type === "slasher") {
      this.size = 32;
      this.speed = 0.8;
      this.health = 100;
      this.maxHealth = 100;
      this.damage = 25;
      this.color = "#FF0000";
      this.points = 25;
    } else if (type === "tank") {
      this.size = 60;
      this.speed = 0.5;
      this.health = 300;
      this.maxHealth = 300;
      this.damage = 50;
      this.color = "#8B0000";
      this.points = 50;
    }
    this.attackCooldown = 1000;
    this.lastAttackTime = 0;
  }
  update(playerX, playerY) {
    let dx = playerX - this.x;
    let dy = playerY - this.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      this.x = this.x + (dx / distance) * this.speed;
      this.y = this.y + (dy / distance) * this.speed;
    }
  }
  display() {
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    circle(this.x, this.y, this.size);
    fill(255, 0, 0);
    noStroke();
    circle(this.x - 6, this.y - 5, 4);
    circle(this.x + 6, this.y - 5, 4);
    this.displayHealthBar();
  }
  displayHealthBar() {
    let barWidth = 30;
    let barHeight = 4;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 8;
    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    let healthPercentage = this.health / this.maxHealth;
    fill(255, 0, 0);
    rect(barX, barY, barWidth * healthPercentage, barHeight);
  }
  canAttack() {
    let currentTime = millis();
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = currentTime;
      return true;
    }
    return false;
  }
  takeDamage(damage) {
    this.health = this.health - damage;
    if (this.health <= 0) {
      this.active = false;
    }
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
