/**
 * WitchProjectile — green ranged attack fired by the Witch enemy.
 * On player hit: deals damage + applies 0.5s movement slow debuff.
 */
class WitchProjectile {
  constructor(x, y, targetX, targetY, damage) {
    this.x = x;
    this.y = y;
    this.damage = damage;
    this.speed = 4.5;
    this.size = 10;
    this.active = true;

    let dx = targetX - x;
    let dy = targetY - y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = dist > 0 ? (dx / dist) * this.speed : 0;
    this.vy = dist > 0 ? (dy / dist) * this.speed : 0;

    // ── Slow debuff config ────────────────────────────────────────────────
    this.slowMultiplier = 0.4; // player moves at 40% speed when slowed
    this.slowDuration = 500; // ms
    // ─────────────────────────────────────────────────────────────────────

    this.trail = [];
    this.maxTrail = 6;
  }

  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > this.maxTrail) this.trail.shift();

    this.x += this.vx;
    this.y += this.vy;

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
      noStroke();
      fill(80, 220, 80, alpha);
      circle(this.trail[i].x, this.trail[i].y, this.size * t);
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

    // Highlight
    noStroke();
    fill(180, 255, 180, 180);
    circle(
      this.x - this.size * 0.18,
      this.y - this.size * 0.18,
      this.size * 0.3,
    );

    noStroke();
  }

  // Returns true if hit. Also applies slow to player.
  checkPlayerHit(player) {
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.size / 2 + player.size / 2) {
      // Apply movement slow debuff on the player
      player.applyWitchSlow(this.slowMultiplier, this.slowDuration);
      return true;
    }
    return false;
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
