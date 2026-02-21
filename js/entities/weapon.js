class WeaponPickup {
  constructor(x, y, weaponType) {
    this.x = x;
    this.y = y;
    this.weaponType = weaponType;
    this.size = 30;
    this.active = true;

    this.spawnTime = millis();
    this.lifetime = 10000; // 10 seconds

    // Display color per weapon type
    const colors = {
      shotgun: "#FF6600",
      rifle: "#00AAFF",
      sniper: "#AA00FF",
    };
    this.color = colors[weaponType] || "#FFFFFF";

    // Short label for display
    const labels = {
      shotgun: "SG",
      rifle: "AR",
      sniper: "SR",
    };
    this.label = labels[weaponType] || "?";
  }

  update() {
    let elapsed = millis() - this.spawnTime;
    if (elapsed > this.lifetime) {
      this.active = false;
    }
  }

  display() {
    let elapsed = millis() - this.spawnTime;
    let timeLeft = this.lifetime - elapsed;
    let blinkSpeed = 200;

    if (timeLeft < 2000) {
      blinkSpeed = 100;
    }

    let shouldShow = Math.floor(millis() / blinkSpeed) % 2 === 0;

    if (shouldShow || timeLeft > 2000) {
      // Outer ring
      stroke(0);
      strokeWeight(2);
      fill(this.color);
      rect(
        this.x - this.size / 2,
        this.y - this.size / 2,
        this.size,
        this.size,
        4,
      );

      // Label text
      fill(255);
      noStroke();
      textSize(10);
      textAlign(CENTER, CENTER);
      text(this.label, this.x, this.y);
    }

    // Timer bar
    let barWidth = 40;
    let barHeight = 4;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 10;

    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);

    let timePercent = timeLeft / this.lifetime;
    let fillColor;
    if (timePercent > 0.5) {
      fillColor = color(0, 255, 0);
    } else if (timePercent > 0.25) {
      fillColor = color(255, 255, 0);
    } else {
      fillColor = color(255, 0, 0);
    }
    fill(fillColor);
    rect(barX, barY, barWidth * timePercent, barHeight);

    // Weapon type label above bar
    fill(255);
    noStroke();
    textSize(9);
    textAlign(CENTER, BOTTOM);
    text(this.weaponType.toUpperCase(), this.x, barY - 1);
  }

  checkPlayerPickup(player) {
    let dx = this.x - player.x;
    let dy = this.y - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    let pickupRange = (this.size + player.size) / 2;
    return distance < pickupRange;
  }
}
