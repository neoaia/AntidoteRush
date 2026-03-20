class Base {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;

    // Sprite — single frame 128x128, drawn centered on base rect center
    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1);

    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("base");
    }
  }

  // Wire sprite after spriteManager.init() — called from game.js setup
  initSprite() {
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("base");
    }
  }

  display() {
    let cx = this.x + this.width / 2;
    let cy = this.y + this.height / 2;

    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      cx,
      cy,
      1.5, // 128 * 1.5 = 192px on screen
    );

    if (!drawn) {
      // Fallback rect
      fill(100, 200, 100, 180);
      stroke(0, 180, 0);
      strokeWeight(2);
      rect(this.x, this.y, this.width, this.height, 4);
      fill(255);
      noStroke();
      textSize(10);
      textAlign(CENTER, CENTER);
      text("BASE", cx, cy);
    }
  }

  checkPlayerInside(player) {
    return (
      player.x > this.x &&
      player.x < this.x + this.width &&
      player.y > this.y &&
      player.y < this.y + this.height
    );
  }
}
