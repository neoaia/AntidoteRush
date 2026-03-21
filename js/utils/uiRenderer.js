class UIRenderer {
  constructor(gameState, assetManager) {
    this.gameState = gameState;
    this.assetManager = assetManager;
  }

  static get FS_HP_TEXT() {
    return 20;
  }
  static get FS_ROUND() {
    return 22;
  }
  static get FS_ZOMBIE_COUNT() {
    return 26;
  }
  static get FS_COINS() {
    return 22;
  }
  static get FS_AMMO() {
    return 18;
  }
  static get FS_WEAPON_NAME() {
    return 20;
  }
  static get FS_HOTKEY() {
    return 11;
  }
  static get FS_STATUS() {
    return 12;
  }

  drawTextWithOutline(txt, x, y, r, g, b, w) {
    fill(0);
    for (let ox = -w; ox <= w; ox++)
      for (let oy = -w; oy <= w; oy++)
        if (ox !== 0 || oy !== 0) text(txt, x + ox, y + oy);
    fill(r, g, b);
    text(txt, x, y);
  }

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

  drawHealthBar(player) {}
  drawStaminaBar(player) {}

  drawStatBars(player) {
    let px = 8,
      py = 8,
      pW = 380,
      pH = 130;
    this.drawWoodPanel(px, py, pW, pH);
    let iconSize = 32,
      barW = pW - 58 - 16;

    // Health
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

    // Stamina
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
    if (player.isSprinting && Math.floor(millis() / 250) % 2 === 0)
      this.drawTextWithOutline(
        "SPRINTING",
        sBx + barW + 4,
        sBy + sBH / 2,
        255,
        220,
        0,
        1,
      );
    else if (player.isInBase && !player.isSprinting && sPct < 1)
      this.drawTextWithOutline(
        "RECHARGING",
        sBx + barW + 4,
        sBy + sBH / 2,
        100,
        255,
        180,
        1,
      );

    // EXP bar
    let ey = py + 92;
    let eBx = px + 14,
      eBy = ey + 4,
      eBH = 18,
      eBW = pW - 28;
    let ePct = this.gameState.exp / this.gameState.expToNextLevel;
    noFill();
    stroke(20, 10, 40);
    strokeWeight(2);
    rect(eBx, eBy, eBW, eBH, 3);
    noStroke();
    fill(10, 5, 20);
    rect(eBx + 1, eBy + 1, eBW - 2, eBH - 2, 2);
    let eFillW = (eBW - 4) * ePct;
    if (eFillW > 0) {
      fill(100, 60, 200);
      rect(eBx + 2, eBy + 2, eFillW, eBH - 4, 2);
      fill(180, 140, 255, 100);
      rect(eBx + 2, eBy + 2, eFillW, 4, 2);
    }
    noStroke();
    textSize(11);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "Level " + this.gameState.level,
      eBx + eBW / 2,
      eBy + eBH / 2,
      220,
      200,
      255,
      1,
    );
  }

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

  _weaponSpriteKey(name) {
    if (!name) return null;
    let n = name.toLowerCase();
    if (n === "knife") return "gun_knife";
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

      // Hotkey number — upper right, no brackets
      textSize(UIRenderer.FS_HOTKEY);
      textAlign(RIGHT, TOP);
      this.drawTextWithOutline(
        s.label,
        x + slotSize - 8,
        y + 8,
        255,
        220,
        100,
        1,
      );

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
        continue;
      }

      let gunKey = w.name ? this._weaponSpriteKey(w.name) : null;
      let gunSheet =
        gunKey && typeof spriteManager !== "undefined"
          ? spriteManager.get(gunKey)
          : null;
      if (!gunSheet || !gunSheet.img) gunSheet = null;

      let isKnife = w.name === "Knife";

      if (gunSheet && gunSheet.img) {
        if (isKnife) {
          // ── Knife in hotbar: smaller + slanted like weapon box ────────
          // Target display size — knife is wide, so constrain to slot width
          let maxW = slotSize - 60; // smaller max width
          let maxH = slotSize - 50; // smaller max height
          let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
          let dw = gunSheet.frameW * sc;
          let dh = gunSheet.frameH * sc;

          push();
          translate(x + slotSize / 2, y + (slotSize - 24) / 2);
          rotate(-0.35); // slant ~20 degrees, same style as weapon box
          imageMode(CENTER);
          image(
            gunSheet.img,
            0,
            0,
            dw,
            dh,
            0,
            0,
            gunSheet.frameW,
            gunSheet.frameH,
          );
          pop();
        } else {
          // ── Other guns: standard display ──────────────────────────────
          let maxW = slotSize - 16,
            maxH = slotSize - 42;
          let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
          let dw = gunSheet.frameW * sc,
            dh = gunSheet.frameH * sc;
          push();
          imageMode(CENTER);
          image(
            gunSheet.img,
            x + slotSize / 2,
            y + (slotSize - 30) / 2,
            dw,
            dh,
            0,
            0,
            gunSheet.frameW,
            gunSheet.frameH,
          );
          pop();
        }
      } else {
        textSize(UIRenderer.FS_WEAPON_NAME);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          w.name,
          x + slotSize / 2,
          y + slotSize / 2 - 12,
          255,
          255,
          255,
          2,
        );
      }

      // Ammo / label at bottom
      if (w.magSize !== undefined) {
        let ammoY = y + slotSize - 18;
        if (w.isReloading) {
          let progress = Math.min(
            (millis() - w.reloadStartTime) / w.reloadTime,
            1,
          );
          let bW = slotSize - 16,
            bH = 5,
            bX = x + 8,
            bY = y + slotSize - 24;
          noStroke();
          fill(30, 20, 5);
          rect(bX, bY, bW, bH);
          fill(255, 140, 0);
          rect(bX, bY, bW * progress, bH);
          textSize(9);
          textAlign(CENTER, BOTTOM);
          this.drawTextWithOutline(
            "RELOADING...",
            x + slotSize / 2,
            y + slotSize - 10,
            255,
            200,
            0,
            1,
          );
        } else {
          let cx = x + slotSize / 2;
          textSize(UIRenderer.FS_AMMO);
          textAlign(CENTER, CENTER);
          let curStr = "" + w.currentAmmo;
          let sepStr = "/";
          let magStr = "" + w.magSize;
          let totalStr = w.unlimited ? "∞" : "" + (w.totalAmmo || 0);
          let curW = textWidth(curStr);
          let sepW = textWidth(sepStr);
          let magW = textWidth(magStr);
          let totalW = textWidth(totalStr);
          let groupW = curW + sepW + magW;
          let fullW = groupW + 10 + totalW;
          let startX = cx - fullW / 2;
          noStroke();
          fill(255, 220, 50);
          textAlign(LEFT, CENTER);
          text(curStr, startX, ammoY);
          fill(200, 200, 200);
          text(sepStr + magStr, startX + curW, ammoY);
          fill(160, 160, 160);
          text(totalStr, startX + groupW + 10, ammoY);
        }
      } else if (s.key === "melee") {
        // Knife label
        textSize(13);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          w.name,
          x + slotSize / 2,
          y + slotSize - 18,
          220,
          200,
          160,
          1,
        );
      }
    }
  }

  drawRoundInfo(roundManager) {
    let panelW = 200,
      panelH = 36,
      gap = 6,
      px = width / 2 - panelW / 2;
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
    stroke(255, 60, 60, alpha);
    strokeWeight(2);
    arc(0, 0, r * 2, r * 2, s, e);
    stroke(255, 120, 120, alpha * 0.7);
    strokeWeight(1);
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
        fill(255, 60, 60, 35);
        stroke(255, 60, 60, 140);
        strokeWeight(1.5);
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
      let mr = player.weapons.melee.range,
        as = -PI / 3,
        ae = PI / 3;
      fill(255, 60, 60, 45);
      stroke(255, 60, 60, 160);
      strokeWeight(1.5);
      arc(0, 0, mr * 2, mr * 2, as, ae);
      stroke(255, 60, 60, 100);
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
    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    for (let p of this.gameState.scorePopups) {
      let progress = (now - p.spawnTime) / p.lifetime;
      let alpha = 255 * (1 - progress);
      let floatY = p.y - 40 * progress;
      if (p.isCoin) {
        let iconSize = 16,
          label = "+" + p.value;
        textSize(18);
        textAlign(LEFT, CENTER);
        let tw = textWidth(label),
          total = iconSize + 4 + tw,
          startX = p.x - total / 2;
        if (coinSheet && coinSheet.img) {
          push();
          imageMode(CORNER);
          tint(255, alpha);
          image(
            coinSheet.img,
            startX,
            floatY - iconSize / 2,
            iconSize,
            iconSize,
            0,
            0,
            coinSheet.frameW,
            coinSheet.frameH,
          );
          noTint();
          pop();
        }
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, startX + iconSize + 4 + ox, floatY + oy);
        fill(255, 220, 50, alpha);
        text(label, startX + iconSize + 4, floatY);
      } else if (p.isExp) {
        let label = "+" + p.value + " EXP";
        textSize(16);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, p.x + ox, floatY + oy);
        fill(80, 160, 255, alpha);
        text(label, p.x, floatY);
      } else if (p.isDamage) {
        let label = "-" + p.value;
        textSize(16);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, p.x + ox, floatY + oy);
        fill(255, 255, 255, alpha);
        text(label, p.x, floatY);
      } else if (p.isPlayerDamage) {
        let label = "-" + p.value;
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -2; ox <= 2; ox++)
          for (let oy = -2; oy <= 2; oy++)
            if (ox || oy) text(label, p.x + ox, floatY + oy);
        fill(255, 60, 60, alpha);
        text(label, p.x, floatY);
      } else {
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -2; ox <= 2; ox++)
          for (let oy = -2; oy <= 2; oy++)
            if (ox || oy) text(p.value, p.x + ox, floatY + oy);
        fill(255, 230, 0, alpha);
        text(p.value, p.x, floatY);
      }
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

  drawMinimap(player, roundManager) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 2400;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 2400;
    let mmW = 160,
      mmH = 120,
      mmX = width - mmW - 8,
      mmY = 8 + 40 + 6;
    this.drawWoodPanel(mmX, mmY, mmW, mmH);
    let mx = mmX + 6,
      my = mmY + 6,
      mw = mmW - 12,
      mh = mmH - 12;
    noStroke();
    fill(40, 90, 35, 200);
    rect(mx, my, mw, mh);
    let sx = mw / W,
      sy = mh / H;
    if (this.gameState.base) {
      fill(180, 160, 80, 220);
      noStroke();
      rect(
        mx + this.gameState.base.x * sx,
        my + this.gameState.base.y * sy,
        max(4, this.gameState.base.width * sx),
        max(4, this.gameState.base.height * sy),
      );
    }
    fill(220, 40, 40, 180);
    noStroke();
    for (let z of this.gameState.zombies)
      circle(mx + z.x * sx, my + z.y * sy, 3);
    if (this.gameState.currentAntidote) {
      fill(80, 220, 80, 220);
      noStroke();
      circle(
        mx + this.gameState.currentAntidote.x * sx,
        my + this.gameState.currentAntidote.y * sy,
        4,
      );
    }
    fill(0, 0, 0, 180);
    noStroke();
    circle(mx + player.x * sx, my + player.y * sy, 7);
    fill(255, 255, 255, 240);
    circle(mx + player.x * sx, my + player.y * sy, 5);
    noFill();
    stroke(80, 50, 18);
    strokeWeight(1);
    rect(mx, my, mw, mh);
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
