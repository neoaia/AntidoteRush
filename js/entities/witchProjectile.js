/**
 * WitchProjectile — green ranged attack fired by the Witch enemy.
 * Travels in a straight line toward a target position.
 * Damages the player on contact.
 */
class WitchProjectile {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = 4.5;
    this.size = 10;
    this.active = true;

    // Direction toward target
    let dx = targetX - x;
    let dy = targetY - y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = dist > 0 ? (dx / dist) * this.speed : 0;
    this.vy = dist > 0 ? (dy / dist) * this.speed : 0;

    // Visual
    this.bobTick = 0;
    this.trail = []; // last N positions for trail effect
    this.maxTrail = 6;
  }

  update() {
    // Store trail
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;
    this.bobTick += 0.3;

    // Out of world bounds
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 2400;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 2400;
    if (this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) {
      this.active = false;
    }
  }

  display() {
    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      let t = i / this.trail.length;
      let alpha = t * 140;
      let r = this.size * 0.5 * t;
      noStroke();
      fill(80, 220, 80, alpha);
      circle(this.trail[i].x, this.trail[i].y, r * 2);
    }

    // Outer glow
    noStroke();
    fill(100, 255, 100, 60);
    circle(this.x, this.y, this.size * 2.2);

    // Core
    fill(50, 200, 50);
    stroke(20, 120, 20);
    strokeWeight(1.5);
    circle(this.x, this.y, this.size);

    // Inner highlight
    noStroke();
    fill(180, 255, 180, 180);
    circle(
      this.x - this.size * 0.18,
      this.y - this.size * 0.18,
      this.size * 0.3,
    );

    noStroke();
  }

  // Returns true if this projectile hit the player
  checkPlayerHit(player) {
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size / 2 + player.size / 2;
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
