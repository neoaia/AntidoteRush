class Bullet {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x;
    this.y = y;
    this.size = 5;
    this.speed = 10;
    this.color = "#FFFF00";
    this.active = true;
    this.damage = damage;

    let dx = targetX - x;
    let dy = targetY - y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
  }

  update() {
    this.x = this.x + this.velocityX;
    this.y = this.y + this.velocityY;

    if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
      this.active = false;
    }
  }

  display() {
    fill(this.color);
    noStroke();
    circle(this.x, this.y, this.size);
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
