class Antidote {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.color = "#1e4a59";
    this.active = true;

    this.spawnTime = millis();
    this.lifetime = 8000;
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
      fill(this.color);
      stroke(0);
      strokeWeight(3);
      circle(this.x, this.y, this.size);

      fill(255);
      noStroke();
      textSize(16);
      textAlign(CENTER, CENTER);
      text("+", this.x, this.y);
    }

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
  }

  checkPlayerPickup(player) {
    let dx = this.x - player.x;
    let dy = this.y - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    let pickupRange = (this.size + player.size) / 2;

    return distance < pickupRange;
  }
}
