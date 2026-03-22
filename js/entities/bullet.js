class Bullet {
  constructor(x, y, targetX, targetY, damage, options = {}) {
    this.x = x;
    this.y = y;
    this.size = options.size || 5;
    this.speed = options.speed || 10;
    this.color = options.color || "#594e1e";
    this.active = true;
    this.damage = damage;

    // Knockback to apply to zombie on hit
    this.knockback = options.knockback || 0;

    // Piercing
    this.piercing = options.piercing || false;
    this.maxPierce = options.maxPierce || 0;
    this.pierceCount = 0;
    this.pierceDamageFalloff = options.pierceDamageFalloff || 0.6;
    this.hitZombies = new Set();

    let dx = targetX - x;
    let dy = targetY - y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    this.velocityX = (dx / distance) * this.speed;
    this.velocityY = (dy / distance) * this.speed;
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;

    let bW = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let bH = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
    if (this.x < 0 || this.x > bW || this.y < 0 || this.y > bH) {
      this.active = false;
    }
  }

  display() {
    stroke(0);
    strokeWeight(2);
    fill(255, 220, 0);
    circle(this.x, this.y, this.size);
  }

  onHitZombie(zombie) {
    if (this.hitZombies.has(zombie)) return null;
    this.hitZombies.add(zombie);

    let dmg =
      this.damage * Math.pow(this.pierceDamageFalloff, this.pierceCount);
    this.pierceCount++;

    if (!this.piercing || this.pierceCount > this.maxPierce) {
      this.active = false;
    }

    return dmg;
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
