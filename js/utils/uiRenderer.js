class UIRenderer {
  constructor(gameState, assetManager) {
    this.gameState = gameState;
    this.assetManager = assetManager;
  }

  drawTextWithOutline(txt, x, y, r, g, b, outlineWeight) {
    fill(0);
    for (let ox = -outlineWeight; ox <= outlineWeight; ox++) {
      for (let oy = -outlineWeight; oy <= outlineWeight; oy++) {
        if (ox !== 0 || oy !== 0) text(txt, x + ox, y + oy);
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

    if (healthPercent > 0.6) fill(255, 220, 0);
    else if (healthPercent > 0.3) fill(255, 140, 0);
    else fill(255, 0, 0);

    rect(x + 2, y + 27, fillWidth, barHeight - 4);

    textSize(12);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      player.health + "/" + player.maxHealth,
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

  drawStaminaBar(player) {
    let x = 20;
    let y = 83;
    let barWidth = 160;
    let barHeight = 10;

    textSize(10);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline("STAMINA", x, y + barHeight / 2, 200, 200, 200, 1);

    let labelW = 52;
    let barX = x + labelW + 4;

    noFill();
    stroke(0);
    strokeWeight(1);
    rect(barX, y, barWidth, barHeight);

    noStroke();
    fill(40, 40, 40);
    rect(barX + 1, y + 1, barWidth - 2, barHeight - 2);

    let staminaPct = player.stamina / player.maxStamina;
    let fillW = (barWidth - 2) * staminaPct;

    if (staminaPct > 0.5) fill(0, 220, 255);
    else if (staminaPct > 0.2) fill(255, 220, 0);
    else fill(255, 60, 0);

    rect(barX + 1, y + 1, fillW, barHeight - 2);

    // Flashing SPRINTING label
    if (player.isSprinting) {
      let flash = Math.floor(millis() / 250) % 2 === 0;
      if (flash) {
        textSize(9);
        textAlign(LEFT, CENTER);
        this.drawTextWithOutline(
          "SPRINTING",
          barX + barWidth + 6,
          y + barHeight / 2,
          0,
          220,
          255,
          1,
        );
      }
    }
  }

  drawWeaponSlot(player) {
    let slotSize = 100;
    let slotY = height - 120;

    let slots = [
      { key: "melee", label: "1", x: width - 360 },
      { key: "handgun", label: "2", x: width - 240 },
      { key: "equipped", label: "3", x: width - 120 },
    ];

    for (let s = 0; s < slots.length; s++) {
      let slot = slots[s];
      let x = slot.x;
      let y = slotY;
      let isActive = player.currentWeapon === slot.key;
      let w = player.weapons[slot.key];

      stroke(isActive ? color(255, 220, 0) : color(0));
      strokeWeight(isActive ? 3 : 2);
      noFill();
      rect(x, y, slotSize, slotSize);

      noStroke();
      fill(isActive ? color(80, 70, 20) : color(60, 60, 60));
      rect(x + 3, y + 3, slotSize - 6, slotSize - 6);

      if (w === null) {
        textSize(10);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "EMPTY",
          x + slotSize / 2,
          y + slotSize / 2,
          120,
          120,
          120,
          1,
        );
      } else {
        textSize(10);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          w.name,
          x + slotSize / 2,
          y + slotSize / 2 - 8,
          255,
          255,
          255,
          2,
        );

        if (w.magSize !== undefined) {
          if (w.isReloading) {
            let elapsed = millis() - w.reloadStartTime;
            let progress = Math.min(elapsed / w.reloadTime, 1);
            let barW = slotSize - 10;
            let barH = 6;
            let barX = x + 5;
            let barY2 = y + slotSize - 14;
            fill(50);
            noStroke();
            rect(barX, barY2, barW, barH);
            fill(255, 140, 0);
            rect(barX, barY2, barW * progress, barH);
            textSize(8);
            textAlign(CENTER, BOTTOM);
            this.drawTextWithOutline(
              "RELOADING...",
              x + slotSize / 2,
              y + slotSize - 16,
              255,
              200,
              0,
              1,
            );
          } else {
            textSize(11);
            textAlign(CENTER, CENTER);
            this.drawTextWithOutline(
              w.currentAmmo + " / " + w.magSize,
              x + slotSize / 2,
              y + slotSize / 2 + 10,
              255,
              220,
              100,
              2,
            );
            if (!w.unlimited) {
              textSize(9);
              textAlign(CENTER, CENTER);
              this.drawTextWithOutline(
                "+" + w.totalAmmo,
                x + slotSize / 2,
                y + slotSize / 2 + 24,
                180,
                180,
                180,
                1,
              );
            }
          }
        }
      }

      textSize(10);
      textAlign(LEFT, BOTTOM);
      this.drawTextWithOutline(
        "[" + slot.label + "]",
        x + 8,
        y + slotSize - 8,
        255,
        220,
        0,
        2,
      );
    }
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
    this.drawTextWithOutline(
      zombiesRemaining,
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
    this.drawTextWithOutline(
      "ROUND " + roundManager.currentRound + " CLEARED",
      width / 2,
      height / 2,
      0,
      255,
      0,
      4,
    );
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
    let w = player.weapons[player.currentWeapon];
    if (!w) return;

    let aimRange = w.aimRange;
    let isSniper = w.name === "Sniper";
    let isShotgun = w.name === "Shotgun";
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let distToMouse = Math.sqrt(dx * dx + dy * dy);
    let angleToMouse = Math.atan2(dy, dx);

    let aimX = mouseX;
    let aimY = mouseY;
    if (!isSniper && distToMouse > aimRange) {
      let ratio = aimRange / distToMouse;
      aimX = player.x + dx * ratio;
      aimY = player.y + dy * ratio;
    }

    push();

    if (
      player.currentWeapon === "handgun" ||
      player.currentWeapon === "equipped"
    ) {
      if (isShotgun) {
        let spreadAngle = w.spreadAngle || 0.4;
        push();
        translate(player.x, player.y);
        rotate(angleToMouse);
        noFill();
        stroke(255, 140, 0, 120);
        strokeWeight(1);
        let coneLen = 180;
        line(
          0,
          0,
          coneLen * Math.cos(-spreadAngle / 2),
          coneLen * Math.sin(-spreadAngle / 2),
        );
        line(
          0,
          0,
          coneLen * Math.cos(spreadAngle / 2),
          coneLen * Math.sin(spreadAngle / 2),
        );
        arc(0, 0, coneLen * 2, coneLen * 2, -spreadAngle / 2, spreadAngle / 2);
        pop();
      } else if (isSniper) {
        stroke(255, 0, 0, 80);
        strokeWeight(1);
        line(player.x, player.y, mouseX, mouseY);
        noStroke();
        fill(255, 0, 0, 120);
        circle(mouseX, mouseY, 8);
      } else {
        stroke(255, 0, 0, 100);
        strokeWeight(2);
        line(player.x, player.y, aimX, aimY);
        noStroke();
        fill(255, 0, 0, 150);
        circle(aimX, aimY, 8);
      }
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
      line(
        0,
        0,
        meleeRange * Math.cos(arcStart),
        meleeRange * Math.sin(arcStart),
      );
      line(0, 0, meleeRange * Math.cos(arcEnd), meleeRange * Math.sin(arcEnd));
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
    this.drawStaminaBar(player);
    this.drawWeaponSlot(player);
    this.drawRoundInfo(roundManager);
    if (roundManager.roundComplete) {
      this.drawRoundComplete(roundManager);
    }
  }
}
