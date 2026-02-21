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

  // ── TOP-LEFT HUD ──────────────────────────────────────────────────────────
  // Layout (y positions):
  //   y=14        player name
  //   y=30..62    health bar (32px tall including border)
  //   y=68..82    stamina bar (14px)
  //   y=88        score text

  drawHealthBar(player) {
    let x = 14;
    let y = 14;
    let barW = 260;
    let barH = 26;

    // Player name
    textSize(14);
    textAlign(LEFT, BOTTOM);
    this.drawTextWithOutline(this.gameState.playerName, x, y, 255, 255, 255, 3);

    // Bar border
    noFill();
    stroke(0);
    strokeWeight(2);
    rect(x, y + 2, barW, barH);

    // Bar background
    noStroke();
    fill(50, 50, 50);
    rect(x + 2, y + 4, barW - 4, barH - 4);

    // Bar fill
    let pct = player.health / player.maxHealth;
    if (pct > 0.6) fill(255, 220, 0);
    else if (pct > 0.3) fill(255, 140, 0);
    else fill(255, 0, 0);
    rect(x + 2, y + 4, (barW - 4) * pct, barH - 4);

    // HP text centred in bar
    textSize(11);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      player.health + "/" + player.maxHealth,
      x + barW / 2,
      y + 2 + barH / 2,
      255,
      255,
      255,
      2,
    );
  }

  drawStaminaBar(player) {
    let x = 14;
    let y = 46; // directly below health bar (14 + 2 + 26 + 4 gap)
    let barW = 260;
    let barH = 12;

    // Label
    textSize(9);
    textAlign(LEFT, CENTER);
    fill(180, 180, 180);
    noStroke();
    text("STAM", x, y + barH / 2);

    let labelW = 30;
    let bX = x + labelW + 4;
    let bW = barW - labelW - 4;

    // Border
    noFill();
    stroke(0);
    strokeWeight(1);
    rect(bX, y, bW, barH);

    // Background
    noStroke();
    fill(40, 40, 40);
    rect(bX + 1, y + 1, bW - 2, barH - 2);

    // Fill
    let pct = player.stamina / player.maxStamina;
    if (pct > 0.5) fill(0, 220, 255);
    else if (pct > 0.2) fill(255, 220, 0);
    else fill(255, 60, 0);
    rect(bX + 1, y + 1, (bW - 2) * pct, barH - 2);

    // "SPRINTING" flash
    if (player.isSprinting) {
      if (Math.floor(millis() / 250) % 2 === 0) {
        textSize(8);
        textAlign(LEFT, CENTER);
        this.drawTextWithOutline(
          "SPRINTING",
          bX + bW + 6,
          y + barH / 2,
          0,
          220,
          255,
          1,
        );
      }
    }

    // "IN BASE" boost indicator
    if (player.isInBase && !player.isSprinting && pct < 1) {
      textSize(8);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        "RECHARGING",
        bX + bW + 6,
        y + barH / 2,
        100,
        255,
        180,
        1,
      );
    }
  }

  drawScore() {
    let x = 14;
    let y = 64;
    textSize(13);
    textAlign(LEFT, TOP);
    this.drawTextWithOutline(
      "SCORE: " + this.gameState.score,
      x,
      y,
      255,
      255,
      255,
      2,
    );
    // Coin display right of score
    this.drawTextWithOutline(
      "\u00a2 " + this.gameState.coins,
      x + 185,
      y,
      255,
      220,
      0,
      2,
    );
  }

  // ── WEAPON SLOTS ─────────────────────────────────────────────────────────
  drawWeaponSlot(player) {
    let slotSize = 100;
    let slotY = height - 120;

    let slots = [
      { key: "melee", label: "1", x: width - 360 },
      { key: "handgun", label: "2", x: width - 240 },
      { key: "equipped", label: "3", x: width - 120 },
    ];

    for (let s of slots) {
      let x = s.x;
      let y = slotY;
      let isActive = player.currentWeapon === s.key;
      let w = player.weapons[s.key];

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
            let progress = Math.min(
              (millis() - w.reloadStartTime) / w.reloadTime,
              1,
            );
            let bW = slotSize - 10,
              bH = 6;
            let bX = x + 5,
              bY = y + slotSize - 14;
            fill(50);
            noStroke();
            rect(bX, bY, bW, bH);
            fill(255, 140, 0);
            rect(bX, bY, bW * progress, bH);
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
        "[" + s.label + "]",
        x + 8,
        y + slotSize - 8,
        255,
        220,
        0,
        2,
      );
    }
  }

  // ── ROUND INFO ───────────────────────────────────────────────────────────
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
    let cW = 160,
      cH = 40;

    noFill();
    stroke(0);
    strokeWeight(2);
    rect(x - cW / 2, zombieY, cW, cH);
    noStroke();
    fill(60, 60, 60);
    rect(x - cW / 2 + 2, zombieY + 2, cW - 4, cH - 4);

    let skull = this.assetManager.getSkullIcon();
    if (skull) {
      imageMode(CENTER);
      image(skull, x - 45, zombieY + cH / 2, 28, 28);
      imageMode(CORNER);
    }

    textSize(20);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      zombiesRemaining,
      x + 25,
      zombieY + cH / 2,
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

  // ── WORLD-SPACE OVERLAYS ─────────────────────────────────────────────────
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
    let alpha = 255 * (1 - elapsed / this.gameState.meleeSlashDuration);
    push();
    translate(player.x, player.y);
    rotate(this.gameState.meleeSlashAngle);
    noFill();
    let r = player.weapons.melee.range;
    let s = -PI / 3,
      e = PI / 3;
    stroke(255, 255, 255, alpha);
    strokeWeight(2);
    arc(0, 0, r * 2, r * 2, s, e);
    stroke(200, 200, 255, alpha * 0.7);
    strokeWeight(2);
    line(0, 0, r * cos(s), r * sin(s));
    line(0, 0, r * cos(e), r * sin(e));
    line(0, 0, r * cos(0), r * sin(0));
    pop();
  }

  drawAimIndicator(player, vx, vy) {
    let w = player.weapons[player.currentWeapon];
    if (!w) return;

    let isSniper = w.name === "Sniper";
    let isShotgun = w.name === "Shotgun";
    let dx = vx - player.x;
    let dy = vy - player.y;
    let dMouse = Math.sqrt(dx * dx + dy * dy);
    let angle = Math.atan2(dy, dx);
    let aimX = vx,
      aimY = vy;

    if (!isSniper && dMouse > w.aimRange) {
      let r = w.aimRange / dMouse;
      aimX = player.x + dx * r;
      aimY = player.y + dy * r;
    }

    push();
    if (
      player.currentWeapon === "handgun" ||
      player.currentWeapon === "equipped"
    ) {
      if (isShotgun) {
        let spread = w.spreadAngle || 0.4;
        push();
        translate(player.x, player.y);
        rotate(angle);
        noFill();
        stroke(255, 140, 0, 120);
        strokeWeight(1);
        let cl = 180;
        line(0, 0, cl * Math.cos(-spread / 2), cl * Math.sin(-spread / 2));
        line(0, 0, cl * Math.cos(spread / 2), cl * Math.sin(spread / 2));
        arc(0, 0, cl * 2, cl * 2, -spread / 2, spread / 2);
        pop();
      } else if (isSniper) {
        stroke(255, 0, 0, 80);
        strokeWeight(1);
        line(player.x, player.y, vx, vy);
        noStroke();
        fill(255, 0, 0, 120);
        circle(vx, vy, 8);
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
      rotate(angle);
      noFill();
      stroke(255, 150, 0, 120);
      strokeWeight(2);
      let mr = player.weapons.melee.range;
      let as = -PI / 3,
        ae = PI / 3;
      arc(0, 0, mr * 2, mr * 2, as, ae);
      stroke(255, 150, 0, 80);
      strokeWeight(1);
      line(0, 0, mr * Math.cos(as), mr * Math.sin(as));
      line(0, 0, mr * Math.cos(ae), mr * Math.sin(ae));
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

  // ── SCORE POPUPS ─────────────────────────────────────────────────────────
  drawScorePopups() {
    let now = millis();
    for (let p of this.gameState.scorePopups) {
      let progress = (now - p.spawnTime) / p.lifetime;
      let alpha = 255 * (1 - progress);
      let floatY = p.y - 40 * progress;

      let label = p.isCoin ? p.value : "+" + p.value;
      // Coin popups are cyan, score popups are yellow
      let cr = p.isCoin ? 80 : 255;
      let cg = p.isCoin ? 255 : 230;
      let cb = p.isCoin ? 120 : 0;

      textSize(14);
      textAlign(CENTER, CENTER);
      fill(0, 0, 0, alpha);
      for (let ox = -2; ox <= 2; ox++)
        for (let oy = -2; oy <= 2; oy++)
          if (ox !== 0 || oy !== 0) text(label, p.x + ox, floatY + oy);
      fill(cr, cg, cb, alpha);
      text(label, p.x, floatY);
    }
  }

  // ── PAUSE SCREEN ─────────────────────────────────────────────────────────
  drawPauseScreen() {
    // Dark overlay
    noStroke();
    fill(0, 0, 0, 160);
    rect(0, 0, width, height);

    textSize(56);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "PAUSED",
      width / 2,
      height / 2 - 40,
      255,
      255,
      255,
      5,
    );

    textSize(20);
    this.drawTextWithOutline(
      "Press ESC or click to resume",
      width / 2,
      height / 2 + 20,
      200,
      200,
      200,
      3,
    );
    textSize(16);
    this.drawTextWithOutline(
      "WASD to move  |  Shift to sprint  |  R to reload  |  1/2/3 or scroll to switch weapon",
      width / 2,
      height / 2 + 58,
      160,
      160,
      160,
      2,
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────────────────────
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
      "Press SPACE to return to menu",
      width / 2,
      height / 2 + 130,
      255,
      255,
      255,
      3,
    );
  }

  // ── MAIN RENDER ──────────────────────────────────────────────────────────
  renderAll(player, roundManager) {
    noStroke();
    this.drawHealthBar(player);
    this.drawStaminaBar(player);
    this.drawScore();
    this.drawWeaponSlot(player);
    this.drawRoundInfo(roundManager);
    if (roundManager.roundComplete) this.drawRoundComplete(roundManager);
  }
}
