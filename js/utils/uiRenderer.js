class UIRenderer {
  constructor(gameState, assetManager) {
    this.gameState = gameState;
    this.assetManager = assetManager;
  }

  drawTextWithOutline(txt, x, y, r, g, b, outlineWeight) {
    fill(0);
    for (let ox = -outlineWeight; ox <= outlineWeight; ox++) {
      for (let oy = -outlineWeight; oy <= outlineWeight; oy++) {
        if (ox !== 0 || oy !== 0) {
          text(txt, x + ox, y + oy);
        }
      }
    }
    fill(r, g, b);
    text(txt, x, y);
  }

  drawHealthBar(player) {
    let x = 20;
    let y = 20;
    let barWidth = 300;
    let barHeight = 28;

    textSize(16);
    textAlign(LEFT, TOP);
    this.drawTextWithOutline(this.gameState.playerName, x, y, 255, 255, 255, 3);

    noFill();
    stroke(0);
    strokeWeight(2);
    rect(x, y + 25, barWidth, barHeight);

    noStroke();
    fill(50, 50, 50);
    rect(x + 2, y + 27, barWidth - 4, barHeight - 4);

    let healthPercent = player.health / player.maxHealth;
    let fillWidth = (barWidth - 4) * healthPercent;

    if (healthPercent > 0.6) {
      fill(255, 220, 0);
    } else if (healthPercent > 0.3) {
      fill(255, 140, 0);
    } else {
      fill(255, 0, 0);
    }

    rect(x + 2, y + 27, fillWidth, barHeight - 4);

    textSize(12);
    textAlign(CENTER, CENTER);
    let healthText = player.health + "/" + player.maxHealth;
    this.drawTextWithOutline(
      healthText,
      x + barWidth / 2,
      y + 40,
      255,
      255,
      255,
      2,
    );

    textSize(14);
    textAlign(LEFT, TOP);
    this.drawTextWithOutline(
      "SCORE: " + this.gameState.score,
      x,
      y + 60,
      255,
      255,
      255,
      2,
    );
  }

  drawWeaponSlot(player) {
    let x = width - 120;
    let y = height - 120;
    let slotSize = 100;

    noFill();
    stroke(0);
    strokeWeight(2);
    rect(x, y, slotSize, slotSize);

    noStroke();
    fill(60, 60, 60);
    rect(x + 3, y + 3, slotSize - 6, slotSize - 6);

    let weaponIcon = this.assetManager.getWeaponIcon(player.currentWeapon);
    if (weaponIcon) {
      imageMode(CENTER);
      image(weaponIcon, x + slotSize / 2, y + slotSize / 2, 100, 70);
      imageMode(CORNER);
    } else {
      textSize(10);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        player.weapons[player.currentWeapon].name,
        x + slotSize / 2,
        y + slotSize / 2,
        255,
        255,
        255,
        2,
      );
    }

    textSize(10);
    textAlign(LEFT, BOTTOM);
    let keyNum =
      player.currentWeapon === "melee"
        ? "1"
        : player.currentWeapon === "handgun"
          ? "2"
          : "3";
    this.drawTextWithOutline(
      "[" + keyNum + "]",
      x + 8,
      y + slotSize - 8,
      255,
      220,
      0,
      2,
    );
  }

  drawRoundInfo(roundManager) {
    let x = width / 2;
    let y = 20;

    textSize(24);
    textAlign(CENTER, TOP);
    this.drawTextWithOutline(
      "ROUND " + roundManager.currentRound,
      x,
      y,
      255,
      255,
      255,
      3,
    );

    let zombieY = y + 35;
    let totalZombiesInRound =
      roundManager.zombiesToSpawn + roundManager.zombiesAlive;
    let zombiesRemaining =
      roundManager.zombiesToSpawn + this.gameState.zombies.length;

    let counterWidth = 160;
    let counterHeight = 40;
    noFill();
    stroke(0);
    strokeWeight(2);
    rect(x - counterWidth / 2, zombieY, counterWidth, counterHeight);

    noStroke();
    fill(60, 60, 60);
    rect(
      x - counterWidth / 2 + 2,
      zombieY + 2,
      counterWidth - 4,
      counterHeight - 4,
    );

    let skullIcon = this.assetManager.getSkullIcon();
    if (skullIcon) {
      imageMode(CENTER);
      image(skullIcon, x - 45, zombieY + counterHeight / 2, 28, 28);
      imageMode(CORNER);
    }

    textSize(20);
    textAlign(CENTER, CENTER);
    let countText = zombiesRemaining;
    this.drawTextWithOutline(
      countText,
      x + 25,
      zombieY + counterHeight / 2,
      255,
      220,
      0,
      3,
    );
  }

  drawRoundComplete(roundManager) {
    textSize(48);
    textAlign(CENTER, CENTER);
    let completeText = "ROUND " + roundManager.currentRound + " CLEARED";
    this.drawTextWithOutline(completeText, width / 2, height / 2, 0, 255, 0, 4);
  }

  drawAntidoteIndicator(player) {
    fill(0, 255, 0);
    stroke(0);
    strokeWeight(2);
    circle(player.x, player.y - player.size / 2 - 20, 20);

    fill(255);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text("+", player.x, player.y - player.size / 2 - 20);

    fill(0, 255, 0);
    textSize(10);
    text("RETURN TO BASE", player.x, player.y - player.size / 2 - 35);
  }

  drawMeleeSlash(player) {
    let elapsed = millis() - this.gameState.meleeSlashStartTime;
    let progress = elapsed / this.gameState.meleeSlashDuration;
    let alpha = 255 * (1 - progress);

    push();
    translate(player.x, player.y);
    rotate(this.gameState.meleeSlashAngle);
    noFill();
    stroke(255, 255, 255, alpha);
    strokeWeight(2);
    let slashRadius = player.weapons.melee.range;
    let startAngle = -PI / 3;
    let endAngle = PI / 3;
    arc(0, 0, slashRadius * 2, slashRadius * 2, startAngle, endAngle);
    stroke(200, 200, 255, alpha * 0.7);
    strokeWeight(2);
    line(0, 0, slashRadius * cos(startAngle), slashRadius * sin(startAngle));
    line(0, 0, slashRadius * cos(endAngle), slashRadius * sin(endAngle));
    line(0, 0, slashRadius * cos(0), slashRadius * sin(0));
    pop();
  }

  drawAimIndicator(player) {
    let currentWeapon = player.weapons[player.currentWeapon];
    let maxAimRange = currentWeapon.aimRange;
    let angleToMouse = atan2(mouseY - player.y, mouseX - player.x);
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let distanceToMouse = sqrt(dx * dx + dy * dy);
    let aimX = mouseX;
    let aimY = mouseY;

    if (distanceToMouse > maxAimRange) {
      let ratio = maxAimRange / distanceToMouse;
      aimX = player.x + dx * ratio;
      aimY = player.y + dy * ratio;
    }

    push();

    if (
      player.currentWeapon === "handgun" ||
      player.currentWeapon === "equipped"
    ) {
      stroke(255, 0, 0, 100);
      strokeWeight(2);
      line(player.x, player.y, aimX, aimY);
      noStroke();
      fill(255, 0, 0, 150);
      circle(aimX, aimY, 8);
    }

    if (player.currentWeapon === "melee") {
      push();
      translate(player.x, player.y);
      rotate(angleToMouse);
      noFill();
      stroke(255, 150, 0, 120);
      strokeWeight(2);
      let meleeRange = player.weapons.melee.range;
      let arcStart = -PI / 3;
      let arcEnd = PI / 3;
      arc(0, 0, meleeRange * 2, meleeRange * 2, arcStart, arcEnd);
      stroke(255, 150, 0, 80);
      strokeWeight(1);
      line(0, 0, meleeRange * cos(arcStart), meleeRange * sin(arcStart));
      line(0, 0, meleeRange * cos(arcEnd), meleeRange * sin(arcEnd));
      pop();
    }

    stroke(255, 0, 0);
    strokeWeight(2);
    noFill();
    circle(aimX, aimY, 20);
    line(aimX - 15, aimY, aimX - 5, aimY);
    line(aimX + 5, aimY, aimX + 15, aimY);
    line(aimX, aimY - 15, aimX, aimY - 5);
    line(aimX, aimY + 5, aimX, aimY + 15);
    pop();
  }

  drawGameOver(roundManager) {
    background(0);

    textSize(64);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "GAME OVER",
      width / 2,
      height / 2 - 50,
      255,
      0,
      0,
      5,
    );

    textSize(32);
    this.drawTextWithOutline(
      "Final Score: " + this.gameState.score,
      width / 2,
      height / 2 + 20,
      255,
      255,
      255,
      3,
    );
    this.drawTextWithOutline(
      "Round Reached: " + roundManager.currentRound,
      width / 2,
      height / 2 + 70,
      255,
      255,
      255,
      3,
    );

    textSize(20);
    this.drawTextWithOutline(
      "Click SPACE to menu",
      width / 2,
      height / 2 + 130,
      255,
      255,
      255,
      3,
    );
  }

  renderAll(player, roundManager) {
    noStroke();
    this.drawHealthBar(player);
    this.drawWeaponSlot(player);
    this.drawRoundInfo(roundManager);

    if (roundManager.roundComplete) {
      this.drawRoundComplete(roundManager);
    }
  }
}
