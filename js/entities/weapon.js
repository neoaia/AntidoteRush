class WeaponPickup {
  constructor(x, y, weaponType) {
    this.x = x;
    this.y = y;
    this.weaponType = weaponType;
    this.size = 30;
    this.active = true;

    this.spawnTime = millis();
    this.lifetime = 10000;

    const colors = { shotgun: "#FF6600", rifle: "#00AAFF", sniper: "#AA00FF" };
    this.color = colors[weaponType] || "#FFFFFF";

    const labels = { shotgun: "SG", rifle: "AR", sniper: "SR" };
    this.label = labels[weaponType] || "?";

    // Bob
    this.bobTick = Math.random() * Math.PI * 2; // random start offset
    this.bobAmp = 4;
    this.bobSpeed = 0.05;

    // Sprite
    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1);
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("weapon_box");
    }
  }

  update() {
    this.bobTick += this.bobSpeed;
    if (millis() - this.spawnTime > this.lifetime) this.active = false;
  }

  display() {
    let elapsed = millis() - this.spawnTime;
    let timeLeft = this.lifetime - elapsed;
    let bobOffset = Math.sin(this.bobTick) * this.bobAmp;
    let drawY = this.y + bobOffset;

    // Blink when < 2s left
    let blinkSpeed = timeLeft < 2000 ? 100 : 200;
    let shouldShow = Math.floor(millis() / blinkSpeed) % 2 === 0;
    if (!shouldShow && timeLeft < 2000) {
      this._drawTimerBar(timeLeft, drawY);
      return;
    }

    // Shadow
    let shadowScale = map(bobOffset, -this.bobAmp, this.bobAmp, 1.1, 0.7);
    noStroke();
    fill(0, 0, 0, 55);
    ellipse(this.x, this.y + 18, 28 * shadowScale, 8 * shadowScale);

    // Box sprite background
    if (this.spriteSheet && this.spriteSheet.img) {
      let s = this.spriteSheet;
      let dw = s.frameW * 0.50;
      let dh = s.frameH * 0.50;
      push();
      imageMode(CORNER);
      image(
        s.img,
        this.x - dw / 2,
        drawY - dh / 2,
        dw,
        dh,
        0,
        0,
        s.frameW,
        s.frameH,
      );
      pop();
    } else {
      // Fallback rect
      stroke(0);
      strokeWeight(2);
      fill(this.color);
      rect(
        this.x - this.size / 2,
        drawY - this.size / 2,
        this.size,
        this.size,
        4,
      );
    }

    // Weapon label on top
    textSize(9);
    textAlign(CENTER, CENTER);
    noStroke();
    fill(0);
    text(this.weaponType.toUpperCase(), this.x + 1, drawY - 1);
    fill(255);
    text(this.weaponType.toUpperCase(), this.x, drawY);

    this._drawTimerBar(timeLeft, drawY);
  }

  _drawTimerBar(timeLeft, drawY) {
    let barWidth = 40,
      barHeight = 4;
    let barX = this.x - barWidth / 2;
    let barY = drawY - this.size / 2 - 10;
    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    let pct = timeLeft / this.lifetime;
    fill(
      pct > 0.5
        ? color(0, 255, 0)
        : pct > 0.25
          ? color(255, 255, 0)
          : color(255, 0, 0),
    );
    rect(barX, barY, barWidth * pct, barHeight);
  }

  checkPlayerPickup(player) {
    let dx = this.x - player.x;
    let dy = this.y - player.y;
    return Math.sqrt(dx * dx + dy * dy) < (this.size + player.size) / 2;
  }
}
