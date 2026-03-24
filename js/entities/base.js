class Base {
  constructor(x, y) {
    // DITO MO ILAGAY YUNG NAKUHA MONG OFFSET PARA SA COLLISION BOX
    // Try mo muna yung nakuha mong -70 at -50, kapag baligtad ang punta ng yellow box, gawin mong positive (70 at 50)
    let boxOffsetX = -70;
    let boxOffsetY = -50;

    // I-mo-move natin yung mismong Collision Box (Yellow Zone)
    this.x = x + boxOffsetX;
    this.y = y + boxOffsetY;
    this.width = 230;
    this.height = 230;

    // Kinukuha natin yung original na gitna para DITO i-drawing yung sprite.
    // Ibig sabihin, NAKAPAKO LANG YUNG IMAGE KUNG NASAAN SIYA KANINA!
    this.spriteCX = x + 230 / 2;
    this.spriteCY = y + 230 / 2;

    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1);

    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("base");
    }
  }

  initSprite() {
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("base");
    }
  }

  display() {
    let drawn = false;

    // --- DITO MO I-ADJUST YUNG PICTURE (IMAGE) ---
    // Lakihan mo 'to (e.g., 100, 500) para i-usog ang picture sa WORLD
    // Positive = Pakanan / Pababa
    // Negative = Pakaliwa / Pataas
    let adjustX = -70;
    let adjustY = -50;
    // --------------------------------------------

    if (this.spriteSheet && typeof SpriteRenderer !== "undefined") {
      drawn = SpriteRenderer.draw(
        this.spriteSheet,
        this.spriteState,
        this.spriteCX + adjustX, // Dito natin idadagdag yung usog
        this.spriteCY + adjustY,
        1.4,
      );
    }

    if (!drawn) {
      // ... (itutuloy lang yung fallback rect code mo dito)
      fill(100, 200, 100, 180);
      stroke(0, 180, 0);
      strokeWeight(2);
      rect(this.x, this.y, this.width, this.height, 4);
      fill(255);
      noStroke();
      textSize(10);
      textAlign(CENTER, CENTER);
      text("BASE", this.x + this.width / 2, this.y + this.height / 2);
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
