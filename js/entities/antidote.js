class Antidote {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.active = true;
    this.spawnTime = millis();
    this.lifetime = 15000; // 15 seconds before despawn

    // Sprite — single frame, no animation needed
    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1); // 1 frame, no cycling

    // Wire sprite immediately if spriteManager is ready
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("antidote");
    }

    // Bob animation (up/down float)
    this.bobOffset = 0;
    this.bobSpeed = 0.05;
    this.bobAmp = 5;
    this.bobTick = 0;
  }

  update() {
    this.bobTick += this.bobSpeed;
    this.bobOffset = Math.sin(this.bobTick) * this.bobAmp;

    if (millis() - this.spawnTime > this.lifetime) {
      this.active = false;
    }
  }

  display() {
    let drawY = this.y + this.bobOffset;

    // Shadow — ellipse on the ground, shrinks/grows with bob
    let shadowScale = map(this.bobOffset, -this.bobAmp, this.bobAmp, 1.1, 0.7);
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(this.x, this.y + 18, 28 * shadowScale, 8 * shadowScale);

    // Sprite at 0.7 scale (smaller)
    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      this.x,
      drawY,
      0.7,
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

    // Despawn warning — blink when < 3 seconds left
    let timeLeft = this.lifetime - (millis() - this.spawnTime);
    if (timeLeft < 3000 && Math.floor(millis() / 300) % 2 === 0) {
      noFill();
      stroke(255, 0, 0);
      strokeWeight(2);
      circle(this.x, drawY, this.size * 2);
    }
  }

  checkPlayerPickup(player) {
    let dx = player.x - this.x;
    let dy = player.y - this.y;
    return Math.sqrt(dx * dx + dy * dy) < this.size + player.size / 2;
  }
}
