class UIRenderer {
  constructor(gameState, assetManager) {
    this.gameState = gameState;
    this.assetManager = assetManager;
  }

  // ══ FONT SIZE CONSTANTS ══════════════════════════════════════════════
  // Change any of these numbers to resize that specific element

  static get FS_HP_TEXT() {
    return 20;
  } // "100/100" inside health bar
  static get FS_ROUND() {
    return 22;
  } // "ROUND 1"
  static get FS_ZOMBIE_COUNT() {
    return 26;
  } // zombie number under skull
  static get FS_COINS() {
    return 22;
  } // coin amount top-right
  static get FS_AMMO() {
    return 22;
  } // "12/12" in weapon slot
  static get FS_WEAPON_NAME() {
    return 20;
  } // "Melee" / "EMPTY" in slot
  static get FS_HOTKEY() {
    return 14;
  } // "[1]" "[2]" "[3]" labels
  static get FS_STATUS() {
    return 12;
  } // "SPRINTING" / "RECHARGING"
  // ════════════════════════════════════════════════════════════════════

  drawTextWithOutline(txt, x, y, r, g, b, w) {
    fill(0);
    for (let ox = -w; ox <= w; ox++)
      for (let oy = -w; oy <= w; oy++)
        if (ox !== 0 || oy !== 0) text(txt, x + ox, y + oy);
    fill(r, g, b);
    text(txt, x, y);
  }

  // ── Pixel-art wooden panel ────────────────────────────────────────────────
  drawWoodPanel(x, y, w, h) {
    noStroke();
    fill(15, 8, 2);
    rect(x, y, w, h);
    fill(110, 72, 28);
    rect(x + 2, y + 2, w - 4, h - 4);
    fill(135, 90, 38);
    rect(x + 2, y + 2, w - 4, 2);
    rect(x + 2, y + 2, 2, h - 4);
    fill(55, 32, 10);
    rect(x + 2, y + h - 4, w - 4, 2);
    rect(x + w - 4, y + 2, 2, h - 4);
    let planks = 3,
      innerH = h - 4,
      plankH = innerH / planks;
    fill(55, 32, 10);
    for (let i = 1; i < planks; i++) {
      let dy = y + 2 + i * plankH;
      rect(x + 3, dy - 1, w - 6, 3);
    }
    fill(80, 50, 18);
    for (let i = 1; i < planks; i++) {
      let dy = y + 2 + i * plankH;
      rect(x + 3, dy + 2, w - 6, 1);
    }
    fill(88, 55, 18, 160);
    for (let i = 0; i < planks; i++) {
      let py2 = y + 2 + i * plankH;
      rect(x + 5, py2 + floor(plankH * 0.3), w - 10, 1);
      rect(x + 5, py2 + floor(plankH * 0.55), w - 10, 1);
      rect(x + 5, py2 + floor(plankH * 0.75), w - 10, 1);
    }
    let bolts = [
      [x + 6, y + 6],
      [x + w - 10, y + 6],
      [x + 6, y + h - 10],
      [x + w - 10, y + h - 10],
    ];
    for (let [bx2, by2] of bolts) {
      fill(10, 6, 2);
      rect(bx2, by2, 5, 5);
      fill(55, 38, 16);
      rect(bx2, by2, 4, 4);
      fill(30, 18, 6);
      rect(bx2 + 1, by2 + 1, 2, 2);
      fill(90, 62, 25);
      rect(bx2, by2, 1, 1);
    }
    noStroke();
  }

  // ── Health bar (no-op, merged) ────────────────────────────────────────────
  drawHealthBar(player) {}
  drawStaminaBar(player) {}

  // ── Combined stat bars ────────────────────────────────────────────────────
  drawStatBars(player) {
    let px = 8,
      py = 8,
      pW = 380,
      pH = 100;
    this.drawWoodPanel(px, py, pW, pH);

    let iconSize = 32;
    let barW = pW - 58 - 16;

    // ── HEALTH ───────────────────────────────────────────────────────────
    let hy = py + 12;
    let heartSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_heart")
        : null;
    if (heartSheet && heartSheet.img) {
      push();
      imageMode(CORNER);
      image(
        heartSheet.img,
        px + 12,
        hy,
        iconSize,
        iconSize,
        0,
        0,
        heartSheet.frameW,
        heartSheet.frameH,
      );
      pop();
    } else {
      fill(220, 40, 60);
      noStroke();
      textSize(22);
      textAlign(CENTER, CENTER);
      text("♥", px + 28, hy + iconSize / 2);
    }

    let hBx = px + 52,
      hBy = hy + 2,
      hBH = iconSize - 2;
    let hPct = player.health / player.maxHealth;
    noFill();
    stroke(30, 15, 5);
    strokeWeight(2);
    rect(hBx, hBy, barW, hBH, 3);
    noStroke();
    fill(15, 5, 5);
    rect(hBx + 1, hBy + 1, barW - 2, hBH - 2, 2);
    let hFillW = (barW - 4) * hPct;
    if (hFillW > 0) {
      if (hPct > 0.5) fill(210, 35, 35);
      else if (hPct > 0.25) fill(170, 20, 20);
      else fill(130, 8, 8);
      rect(hBx + 2, hBy + 2, hFillW, hBH - 4, 2);
      fill(255, 110, 110, 80);
      rect(hBx + 2, hBy + 2, hFillW, 3, 2);
    }
    noStroke();
    textSize(UIRenderer.FS_HP_TEXT);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline(
      player.health + "/" + player.maxHealth,
      hBx + 5,
      hBy + hBH / 2,
      255,
      255,
      255,
      2,
    );

    // ── STAMINA ───────────────────────────────────────────────────────────
    let sy = py + 52;
    let stSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_stamina")
        : null;
    if (stSheet && stSheet.img) {
      push();
      imageMode(CORNER);
      image(
        stSheet.img,
        px + 14,
        sy + 4,
        iconSize - 10,
        iconSize - 10,
        0,
        0,
        stSheet.frameW,
        stSheet.frameH,
      );
      pop();
    } else {
      fill(255, 220, 50);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      text("⚡", px + 28, sy + iconSize / 2);
    }

    let sBx = px + 52,
      sBy = sy + 4,
      sBH = iconSize - 6;
    let sPct = player.stamina / player.maxStamina;
    noFill();
    stroke(30, 25, 5);
    strokeWeight(2);
    rect(sBx, sBy, barW, sBH, 3);
    noStroke();
    fill(15, 13, 3);
    rect(sBx + 1, sBy + 1, barW - 2, sBH - 2, 2);
    let sFillW = (barW - 4) * sPct;
    if (sFillW > 0) {
      if (sPct > 0.5) fill(220, 190, 15);
      else if (sPct > 0.25) fill(190, 150, 8);
      else fill(150, 100, 4);
      rect(sBx + 2, sBy + 2, sFillW, sBH - 4, 2);
      fill(255, 255, 130, 80);
      rect(sBx + 2, sBy + 2, sFillW, 3, 2);
    }
    noStroke();
    textSize(UIRenderer.FS_STATUS);
    textAlign(LEFT, CENTER);
    if (player.isSprinting && Math.floor(millis() / 250) % 2 === 0) {
      this.drawTextWithOutline(
        "SPRINTING",
        sBx + barW + 4,
        sBy + sBH / 2,
        255,
        220,
        0,
        1,
      );
    } else if (player.isInBase && !player.isSprinting && sPct < 1) {
      this.drawTextWithOutline(
        "RECHARGING",
        sBx + barW + 4,
        sBy + sBH / 2,
        100,
        255,
        180,
        1,
      );
    }
  }

  // ── Coin panel ────────────────────────────────────────────────────────────
  drawScore() {
    let pW = 160,
      pH = 40,
      px = width - pW - 8,
      py = 8;
    this.drawWoodPanel(px, py, pW, pH);
    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    if (coinSheet && coinSheet.img) {
      push();
      imageMode(CORNER);
      image(
        coinSheet.img,
        px + 8,
        py + 4,
        30,
        30,
        0,
        0,
        coinSheet.frameW,
        coinSheet.frameH,
      );
      pop();
    }
    textSize(UIRenderer.FS_COINS);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline(
      "" + this.gameState.coins,
      px + 44,
      py + pH / 2,
      255,
      230,
      60,
      2,
    );
  }

  // ── Weapon slots ──────────────────────────────────────────────────────────
  _weaponSpriteKey(name) {
    if (!name) return null;
    let n = name.toLowerCase();
    if (n.includes("handgun") || n.includes("pistol")) return "gun_handgun";
    if (n.includes("shotgun")) return "gun_shotgun";
    if (n.includes("sniper")) return "gun_sniper";
    if (n.includes("rifle") || n.includes("auto")) return "gun_rifle";
    return null;
  }

  drawWeaponSlot(player) {
    let slotSize = 110,
      slotY = height - 128;
    let slots = [
      { key: "melee", label: "1", x: width - 380 },
      { key: "handgun", label: "2", x: width - 252 },
      { key: "equipped", label: "3", x: width - 124 },
    ];
    for (let s of slots) {
      let x = s.x,
        y = slotY;
      let isActive = player.currentWeapon === s.key;
      let w = player.weapons[s.key];

      this.drawWoodPanel(x, y, slotSize, slotSize);

      if (isActive) {
        noStroke();
        fill(255, 220, 0, 50);
        rect(x + 6, y + 6, slotSize - 12, slotSize - 12);
        noFill();
        stroke(255, 220, 0);
        strokeWeight(2);
        rect(x + 4, y + 4, slotSize - 8, slotSize - 8);
        noStroke();
      }

      if (w === null) {
        textSize(UIRenderer.FS_WEAPON_NAME);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "EMPTY",
          x + slotSize / 2,
          y + slotSize / 2,
          255,
          255,
          255,
          2,
        );
      } else {
        let gunKey = w.name ? this._weaponSpriteKey(w.name) : null;
        let gunSheet =
          gunKey && typeof spriteManager !== "undefined"
            ? spriteManager.get(gunKey)
            : null;
        if (gunSheet && !gunSheet.img) gunSheet = null;

        if (gunSheet && gunSheet.img) {
          let maxW = slotSize - 16,
            maxH = slotSize - 36;
          let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
          let dw = gunSheet.frameW * sc,
            dh = gunSheet.frameH * sc;
          push();
          imageMode(CENTER);
          image(
            gunSheet.img,
            x + slotSize / 2,
            y + (slotSize - 20) / 2,
            dw,
            dh,
            0,
            0,
            gunSheet.frameW,
            gunSheet.frameH,
          );
          pop();
        } else {
          textSize(UIRenderer.FS_WEAPON_NAME);
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
        }

        if (w.magSize !== undefined) {
          if (w.isReloading) {
            let progress = Math.min(
              (millis() - w.reloadStartTime) / w.reloadTime,
              1,
            );
            let bW = slotSize - 16,
              bH = 5,
              bX = x + 8,
              bY = y + slotSize - 16;
            noStroke();
            fill(30, 20, 5);
            rect(bX, bY, bW, bH);
            fill(255, 140, 0);
            rect(bX, bY, bW * progress, bH);
            textSize(UIRenderer.FS_HOTKEY);
            textAlign(CENTER, BOTTOM);
            this.drawTextWithOutline(
              "RELOADING...",
              x + slotSize / 2,
              y + slotSize - 18,
              255,
              200,
              0,
              1,
            );
          } else {
            textSize(UIRenderer.FS_AMMO);
            textAlign(CENTER, CENTER);
            this.drawTextWithOutline(
              w.currentAmmo + "/" + w.magSize,
              x + slotSize / 2,
              y + slotSize - 22,
              255,
              255,
              255,
              2,
            );
          }
        }
      }

      textSize(UIRenderer.FS_HOTKEY);
      textAlign(LEFT, BOTTOM);
      this.drawTextWithOutline(
        "[" + s.label + "]",
        x + 10,
        y + slotSize - 10,
        255,
        255,
        255,
        2,
      );
    }
  }

  // ── Round info ────────────────────────────────────────────────────────────
  drawRoundInfo(roundManager) {
    let panelW = 200,
      panelH = 36,
      gap = 6;
    let px = width / 2 - panelW / 2;

    let py1 = 8;
    this.drawWoodPanel(px, py1, panelW, panelH);
    textSize(UIRenderer.FS_ROUND);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "ROUND " + roundManager.currentRound,
      width / 2,
      py1 + panelH / 2,
      255,
      255,
      255,
      2,
    );

    let py2 = py1 + panelH + gap;
    this.drawWoodPanel(px, py2, panelW, panelH);
    let zombiesRemaining =
      (roundManager.zombiesToSpawn || 0) + this.gameState.zombies.length;
    let skull = this.assetManager ? this.assetManager.getSkullIcon() : null;
    let rowY = py2 + panelH / 2;
    if (skull && skull.width) {
      imageMode(CENTER);
      image(skull, width / 2 - 22, rowY, 22, 22);
      imageMode(CORNER);
    } else {
      textSize(20);
      textAlign(CENTER, CENTER);
      text("💀", width / 2 - 18, rowY);
    }
    textSize(UIRenderer.FS_ZOMBIE_COUNT);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      zombiesRemaining,
      width / 2 + 18,
      rowY,
      255,
      255,
      255,
      2,
    );
  }

  drawRoundComplete(roundManager) {
    textSize(56);
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

  drawIntermission(roundManager) {
    let sec = Math.ceil(roundManager.intermissionTimeLeft / 1000);
    noStroke();
    fill(0, 0, 0, 180);
    rect(0, 0, width, 80);
    textSize(28);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "ROUND " + roundManager.currentRound + " CLEARED",
      width / 2,
      24,
      0,
      255,
      100,
      3,
    );
    textSize(20);
    this.drawTextWithOutline(
      "Next round in " + sec + "s   [ENTER to start now]   [B to open shop]",
      width / 2,
      54,
      200,
      200,
      200,
      2,
    );
  }

  drawAntidoteIndicator(player) {
    let bob = Math.sin(millis() * 0.004) * 4;
    let iconY = player.y - player.size / 2 - 30 + bob;
    if (typeof spriteManager !== "undefined") {
      let sheet = spriteManager.get("antidote");
      if (sheet && sheet.img) {
        let dw = sheet.frameW * 0.6,
          dh = sheet.frameH * 0.6;
        push();
        imageMode(CORNER);
        image(
          sheet.img,
          player.x - dw / 2,
          iconY - dh / 2,
          dw,
          dh,
          0,
          0,
          sheet.frameW,
          sheet.frameH,
        );
        pop();
        return;
      }
    }
    fill(0, 255, 0);
    stroke(0);
    strokeWeight(2);
    circle(player.x, player.y - player.size / 2 - 20, 20);
    fill(255);
    noStroke();
    textSize(18);
    textAlign(CENTER, CENTER);
    text("+", player.x, player.y - player.size / 2 - 20);
  }

  drawMeleeSlash(player) {
    let elapsed = millis() - this.gameState.meleeSlashStartTime;
    let alpha = 255 * (1 - elapsed / this.gameState.meleeSlashDuration);
    push();
    translate(player.x, player.y);
    rotate(this.gameState.meleeSlashAngle);
    noFill();
    let r = player.weapons.melee.range,
      s = -PI / 3,
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
    let dx = vx - player.x,
      dy = vy - player.y;
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
      let mr = player.weapons.melee.range,
        as = -PI / 3,
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

  drawScorePopups() {
    let now = millis();
    for (let p of this.gameState.scorePopups) {
      let progress = (now - p.spawnTime) / p.lifetime;
      let alpha = 255 * (1 - progress);
      let floatY = p.y - 40 * progress;
      let label = p.isCoin ? p.value : "+" + p.value;
      let cr = p.isCoin ? 80 : 255,
        cg = p.isCoin ? 255 : 230,
        cb = p.isCoin ? 120 : 0;
      textSize(20);
      textAlign(CENTER, CENTER);
      fill(0, 0, 0, alpha);
      for (let ox = -2; ox <= 2; ox++)
        for (let oy = -2; oy <= 2; oy++)
          if (ox || oy) text(label, p.x + ox, floatY + oy);
      fill(cr, cg, cb, alpha);
      text(label, p.x, floatY);
    }
  }

  drawPauseScreen() {
    noStroke();
    fill(0, 0, 0, 160);
    rect(0, 0, width, height);
    textSize(64);
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
    textSize(26);
    this.drawTextWithOutline(
      "Press ESC or click to resume",
      width / 2,
      height / 2 + 20,
      200,
      200,
      200,
      3,
    );
    textSize(22);
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

  // ── Minimap ───────────────────────────────────────────────────────────────
  drawMinimap(player, roundManager) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 2400;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 2400;

    let mmW = 160,
      mmH = 120;
    let mmX = width - mmW - 8; // top right, same x as coins
    let mmY = 8 + 40 + 6; // below coins panel (coins: y=8, h=40, +6 gap)

    // Panel background
    this.drawWoodPanel(mmX, mmY, mmW, mmH);

    // Clip area — inner map surface
    let mx = mmX + 6,
      my = mmY + 6;
    let mw = mmW - 12,
      mh = mmH - 12;

    // Dark green map bg
    noStroke();
    fill(40, 90, 35, 200);
    rect(mx, my, mw, mh);

    // Scale factors
    let sx = mw / W,
      sy = mh / H;

    // Draw base
    if (this.gameState.base) {
      let bx = mx + this.gameState.base.x * sx;
      let by = my + this.gameState.base.y * sy;
      fill(180, 160, 80, 220);
      noStroke();
      rect(
        bx,
        by,
        max(4, this.gameState.base.width * sx),
        max(4, this.gameState.base.height * sy),
      );
    }

    // Draw zombies — red dots
    fill(220, 40, 40, 180);
    noStroke();
    for (let z of this.gameState.zombies) {
      let zx = mx + z.x * sx;
      let zy = my + z.y * sy;
      circle(zx, zy, 3);
    }

    // Draw antidote — yellow dot
    if (this.gameState.currentAntidote) {
      let ax = mx + this.gameState.currentAntidote.x * sx;
      let ay = my + this.gameState.currentAntidote.y * sy;
      fill(80, 220, 80, 220);
      noStroke();
      circle(ax, ay, 4);
    }

    // Draw player — white dot with outline
    let px2 = mx + player.x * sx;
    let py2 = my + player.y * sy;
    fill(0, 0, 0, 180);
    noStroke();
    circle(px2, py2, 7);
    fill(255, 255, 255, 240);
    circle(px2, py2, 5);

    // Thin border around map area
    noFill();
    stroke(80, 50, 18);
    strokeWeight(1);
    rect(mx, my, mw, mh);

    // Label
    noStroke();
    textSize(9);
    textAlign(CENTER, TOP);
    this.drawTextWithOutline("MAP", mmX + mmW / 2, mmY + 2, 255, 240, 180, 1);
    noStroke();
  }

  renderAll(player, roundManager) {
    noStroke();
    this.drawStatBars(player);
    this.drawScore();
    this.drawWeaponSlot(player);
    this.drawRoundInfo(roundManager);
    if (roundManager.roundComplete) this.drawRoundComplete(roundManager);
    this.drawMinimap(player, roundManager);
  }
}
