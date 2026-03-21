class Antidote {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.active = true;
    this.spawnTime = pauseClock.now();
    this.lifetime = 15000;

    // Pickup radius — generous enough to feel good without feeling inaccurate
    // Sprite renders at ~0.85 scale on a ~32px frame ≈ 27px wide
    // Pickup at ~30px from center covers the visible item + a little margin
    this.pickupRadius = 30;

    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1);
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("antidote");
    }

    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.bobAmp = 5;
    this.bobTick = 0;
  }

  update() {
    this.bobTick += this.bobSpeed;
    this.bobOffset = Math.sin(this.bobTick) * this.bobAmp;
    if (pauseClock.now() - this.spawnTime > this.lifetime) {
      this.active = false;
    }
  }

  display() {
    let drawY = this.y + this.bobOffset;
    let timeLeft = this.lifetime - (pauseClock.now() - this.spawnTime);

    if (timeLeft < 6000) {
      let blinkSpeed = timeLeft < 3000 ? 150 : 350;
      if (Math.floor(pauseClock.now() / blinkSpeed) % 2 === 0) return;
    }

    let shadowScale = map(this.bobOffset, -this.bobAmp, this.bobAmp, 1.1, 0.7);
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(this.x, this.y + 18, 28 * shadowScale, 8 * shadowScale);

    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      this.x,
      drawY,
      0.85,
    );
    if (!drawn) {
      fill(0, 255, 0);
      stroke(0);
      strokeWeight(2);
      circle(this.x, drawY, this.size);
      fill(255);
      noStroke();
      textSize(10);
      textAlign(CENTER, CENTER);
      text("+", this.x, drawY);
    }
  }

  checkPlayerPickup(player) {
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    // Use pickupRadius + half player size for a generous but fair pickup zone
    let threshold = this.pickupRadius + player.size / 2;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
}
