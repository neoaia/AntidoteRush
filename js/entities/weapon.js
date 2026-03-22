class WeaponPickup {
  constructor(x, y, weaponType) {
    this.x = x;
    this.y = y;
    this.weaponType = weaponType;
    this.size = 30;
    this.active = true;

    this.spawnTime = pauseClock.now();
    this.lifetime = 15000;

    // Pickup radius — weapon box sprite ~0.85 scale on a ~32px frame ≈ 27px
    // 34px covers the visible box + comfortable margin
    this.pickupRadius = 34;

    const colors = { shotgun: "#FF6600", rifle: "#00AAFF", sniper: "#AA00FF" };
    this.color = colors[weaponType] || "#FFFFFF";

    const labels = { shotgun: "SG", rifle: "AR", sniper: "SR" };
    this.label = labels[weaponType] || "?";

    this.bobTick = Math.random() * Math.PI * 2;
    this.bobAmp = 4;
    this.bobSpeed = 0.05;

    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 1);
    if (typeof spriteManager !== "undefined") {
      this.spriteSheet = spriteManager.get("weapon_box");
    }
  }

  update() {
    this.bobTick += this.bobSpeed;
    if (pauseClock.now() - this.spawnTime > this.lifetime) this.active = false;
  }

  display() {
    let elapsed = pauseClock.now() - this.spawnTime;
    let timeLeft = this.lifetime - elapsed;
    let bobOffset = Math.sin(this.bobTick) * this.bobAmp;
    let drawY = this.y + bobOffset;

    if (timeLeft < 6000) {
      let blinkSpeed = timeLeft < 3000 ? 150 : 350;
      if (Math.floor(pauseClock.now() / blinkSpeed) % 2 === 0) return;
    }

    let shadowScale = map(bobOffset, -this.bobAmp, this.bobAmp, 1.1, 0.7);
    noStroke();
    fill(0, 0, 0, 55);
    ellipse(this.x, this.y + 18, 28 * shadowScale, 8 * shadowScale);

    if (this.spriteSheet && this.spriteSheet.img) {
      let s = this.spriteSheet;
      let dw = s.frameW * 0.85,
        dh = s.frameH * 0.85;
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

    let gunKeyMap = {
      shotgun: "gun_shotgun",
      rifle: "gun_rifle",
      sniper: "gun_sniper",
      handgun: "gun_handgun",
    };
    let gunKey = gunKeyMap[this.weaponType];
    let gunSheet =
      gunKey && typeof spriteManager !== "undefined"
        ? spriteManager.get(gunKey)
        : null;
    if (gunSheet && gunSheet.img) {
      let maxW = 60,
        maxH = 30;
      let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
      let dw = gunSheet.frameW * sc,
        dh = gunSheet.frameH * sc;
      push();
      translate(this.x, drawY);
      rotate(-0.4);
      imageMode(CENTER);
      image(gunSheet.img, 0, 0, dw, dh, 0, 0, gunSheet.frameW, gunSheet.frameH);
      pop();
    } else {
      textSize(9);
      textAlign(CENTER, CENTER);
      noStroke();
      fill(0);
      text(this.weaponType.toUpperCase(), this.x + 1, drawY - 1);
      fill(255);
      text(this.weaponType.toUpperCase(), this.x, drawY);
    }
  }

  checkPlayerPickup(player) {
    let dx = this.x - player.x;
    let dy = this.y - player.y;
    let threshold = this.pickupRadius + player.size / 2;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  }
}
