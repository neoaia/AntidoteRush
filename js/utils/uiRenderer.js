class UIRenderer {
  constructor(gameState, assetManager) {
    this.gameState = gameState;
    this.assetManager = assetManager;

    this._shopOpen = false;

    this._interPhase = "off";
    this._interPhaseStart = 0;
    this._clearedFadeDur = 1400;
    this._clearedFadeOut = 700;
    this._interRoundNum = 1;

    this._roundStartPhase = "off";
    this._roundStartStart = 0;
    this._roundStartFadeIn = 600;
    this._roundStartFadeOut = 800;
    this._roundStartHold = 1000;
    this._roundStartNum = 1;
    this._roundStartDiff = "easy";
  }

  openShop() {
    this._shopOpen = true;
    cursor(ARROW);
  }
  closeShop() {
    this._shopOpen = false;
    noCursor();
  }
  isShopOpen() {
    return this._shopOpen;
  }

  startIntermissionUI(roundNum) {
    this._interPhase = "cleared";
    this._interPhaseStart = pauseClock.now();
    this._interRoundNum = roundNum;
  }

  startPreGameUI() {
    this._interPhase = "countdown";
    this._interPhaseStart = pauseClock.now();
    this._interRoundNum = 1;
  }

  showRoundStart(roundNum, difficulty) {
    this._roundStartPhase = "fadein";
    this._roundStartStart = pauseClock.now();
    this._roundStartNum = roundNum;
    this._roundStartDiff = difficulty || "easy";
  }

  shopClick(mx, my, shopManager, player) {
    if (!this._shopOpen) return false;
    let layout = this._getShopLayout();
    let cb = layout.closeBtn;
    if (mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
      this.closeShop();
      return true;
    }
    let keys = Object.keys(shopManager.statShop);
    for (let i = 0; i < keys.length; i++) {
      let btn = layout.btnRects[i];
      if (!btn) continue;
      if (
        mx >= btn.x &&
        mx <= btn.x + btn.w &&
        my >= btn.y &&
        my <= btn.y + btn.h
      ) {
        const success = shopManager.buyStatUpgrade(keys[i], player);
        if (!success && typeof audioManager !== "undefined")
          audioManager.playError();
        return true;
      }
    }
    return true;
  }

  _getShopLayout() {
    let panelW = min(780, width * 0.9);
    let panelH = min(560, height * 0.86);
    let panelX = width / 2 - panelW / 2;
    let panelY = height / 2 - panelH / 2;
    let headerH = 72,
      footerH = 36,
      cols = 2;
    let contentX = panelX + 20,
      contentY = panelY + headerH + 14;
    let contentW = panelW - 40,
      contentH = panelH - headerH - footerH - 14;
    let gapX = 12,
      gapY = 12;
    let cardW = (contentW - gapX) / cols;
    let cardH = (contentH - gapY * 2) / 3;
    let keys = ["health", "stamina", "speed", "strength", "precision"];
    let btnRects = [];
    for (let i = 0; i < keys.length; i++) {
      let col = i % cols,
        row = Math.floor(i / cols);
      let cardX =
        i === 4
          ? contentX + contentW / 2 - cardW / 2
          : contentX + col * (cardW + gapX);
      let cardY = contentY + row * (cardH + gapY);
      let btnW = cardW - 24,
        btnH = 44;
      btnRects.push({
        x: cardX + 12,
        y: cardY + cardH - btnH - 10,
        w: btnW,
        h: btnH,
        cardX,
        cardY,
        cardW,
        cardH,
      });
    }
    return {
      panelX,
      panelY,
      panelW,
      panelH,
      headerH,
      footerH,
      contentX,
      contentY,
      contentW,
      contentH,
      cardW,
      cardH,
      gapX,
      gapY,
      btnRects,
      closeBtn: {
        x: panelX + panelW - 56,
        y: panelY + headerH / 2 - 20,
        w: 42,
        h: 40,
      },
    };
  }

  drawShop(roundManager, shopManager, player) {
    if (!this._shopOpen) return;
    let layout = this._getShopLayout();
    let {
      panelX,
      panelY,
      panelW,
      panelH,
      headerH,
      contentX,
      contentY,
      contentW,
      contentH,
      cardW,
      cardH,
      gapX,
      gapY,
      btnRects,
    } = layout;
    let mx = mouseX,
      my = mouseY;

    noStroke();
    fill(0, 0, 0, 200);
    rect(0, 0, width, height);
    fill(0, 0, 0, 120);
    rect(panelX + 7, panelY + 7, panelW, panelH, 10);
    this._drawWoodPanelLarge(panelX, panelY, panelW, panelH);
    fill(30, 18, 6, 220);
    noStroke();
    rect(panelX + 4, panelY + 4, panelW - 8, headerH - 4, 6, 6, 0, 0);
    fill(80, 50, 18);
    rect(panelX + 4, panelY + headerH - 2, panelW - 8, 3);

    textSize(28);
    textAlign(LEFT, CENTER);
    noStroke();
    fill(255, 200, 50);
    text("SHOP", panelX + 22, panelY + headerH / 2);

    let sec = roundManager
      ? Math.ceil(roundManager.intermissionTimeLeft / 1000)
      : 0;
    textSize(18);
    textAlign(CENTER, CENTER);
    fill(sec <= 5 ? color(255, 90, 90) : color(220, 220, 200));
    text(
      "NEXT ROUND IN  " + sec + "s",
      panelX + panelW / 2,
      panelY + headerH / 2,
    );

    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    let coinX = panelX + panelW - 170;
    if (coinSheet && coinSheet.img) {
      push();
      imageMode(CORNER);
      image(
        coinSheet.img,
        coinX,
        panelY + headerH / 2 - 15,
        30,
        30,
        0,
        0,
        coinSheet.frameW,
        coinSheet.frameH,
      );
      pop();
      textSize(22);
      textAlign(LEFT, CENTER);
      fill(255, 220, 60);
      text(this.gameState.coins, coinX + 36, panelY + headerH / 2);
    }

    let cb = layout.closeBtn;
    let cbHover =
      mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h;
    fill(cbHover ? color(220, 60, 60) : color(140, 30, 30));
    noStroke();
    rect(cb.x, cb.y, cb.w, cb.h, 5);
    textSize(16);
    textAlign(CENTER, CENTER);
    fill(255);
    text("X", cb.x + cb.w / 2, cb.y + cb.h / 2);

    let keys = Object.keys(shopManager.statShop);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i],
        stat = shopManager.statShop[key];
      let cost = shopManager.getStatCurrentCost(key),
        canAfford = this.gameState.coins >= cost;
      let btn = btnRects[i];
      this._drawWoodPanelMed(btn.cardX, btn.cardY, btn.cardW, btn.cardH);
      textSize(20);
      textAlign(LEFT, TOP);
      noStroke();
      fill(255, 230, 160);
      text(stat.label.toUpperCase(), btn.cardX + 14, btn.cardY + 12);
      textSize(13);
      fill(180, 160, 120);
      textAlign(LEFT, TOP);
      text(stat.description, btn.cardX + 14, btn.cardY + 38);
      textSize(13);
      fill(200, 160, 80);
      textAlign(LEFT, TOP);
      text("Lv. " + stat.purchased, btn.cardX + 14, btn.cardY + 58);
      let maxPips = 10,
        pip = min(stat.purchased, maxPips);
      for (let p = 0; p < pip; p++) {
        fill(180, 130, 60);
        rect(btn.cardX + 14 + p * 11, btn.cardY + 76, 9, 9, 2);
      }
      let hover =
        mx >= btn.x &&
        mx <= btn.x + btn.w &&
        my >= btn.y &&
        my <= btn.y + btn.h;
      if (canAfford) fill(hover ? color(60, 160, 40) : color(38, 105, 22));
      else fill(50, 38, 18);
      noStroke();
      rect(btn.x, btn.y, btn.w, btn.h, 6);
      fill(255, 255, 255, canAfford ? 22 : 8);
      rect(btn.x + 2, btn.y + 2, btn.w - 4, 10, 4);
      noFill();
      stroke(canAfford ? color(80, 160, 50) : color(70, 55, 30));
      strokeWeight(1.5);
      rect(btn.x, btn.y, btn.w, btn.h, 6);
      noStroke();
      textSize(14);
      textAlign(CENTER, CENTER);
      fill(canAfford ? color(200, 255, 180) : color(120, 100, 70));
      text("UPGRADE", btn.x + btn.w / 2, btn.y + btn.h / 2 - 9);
      textSize(14);
      fill(canAfford ? color(255, 220, 50) : color(110, 90, 55));
      text("¢ " + cost, btn.x + btn.w / 2, btn.y + btn.h / 2 + 10);
    }
    textSize(12);
    textAlign(CENTER, CENTER);
    fill(120, 90, 50);
    text("[B] close shop", panelX + panelW / 2, panelY + panelH - 18);
  }

  // ── Returns computed pixel height for a given numPlanks ──────────────────
  _panelH(numPlanks) {
    return numPlanks * 26 + 4; // fixedPlankH=26, outlineSize*2=4
  }

  // ── Pixel wood panel — numPlanks drives height ────────────────────────────
  _drawPixelWoodPanel(x, y, w, numPlanks) {
    push();
    noStroke();

    let outlineSize = 2;
    let fixedPlankH = 26;
    let h = numPlanks * fixedPlankH + outlineSize * 2;

    let outlineCol = color("#3E2723");
    let mainCol = color("#AB6A38");
    let highlightCol = color("#D49A59");
    let shadowCol = color("#7D4722");

    fill(outlineCol);
    rect(x + outlineSize, y, w - outlineSize * 2, h);
    rect(x, y + outlineSize, w, h - outlineSize * 2);

    fill(mainCol);
    rect(
      x + outlineSize,
      y + outlineSize,
      w - outlineSize * 2,
      h - outlineSize * 2,
    );

    let insideX = x + outlineSize;
    let insideY = y + outlineSize;
    let insideW = w - outlineSize * 2;
    let py = insideY;

    for (let i = 0; i < numPlanks; i++) {
      let px = insideX,
        pw = insideW;

      fill(highlightCol);
      rect(px, py, pw, outlineSize);
      rect(px, py + outlineSize, outlineSize, fixedPlankH - outlineSize);

      fill(shadowCol);
      rect(px, py + fixedPlankH - outlineSize, pw, outlineSize);
      rect(px + pw - outlineSize, py, outlineSize, fixedPlankH - outlineSize);

      fill(shadowCol);
      rect(
        px + outlineSize * 2,
        py + outlineSize * 2,
        outlineSize,
        outlineSize * 2,
      );
      rect(
        px + outlineSize * 3,
        py + outlineSize * 2,
        outlineSize,
        outlineSize,
      );
      rect(
        px + outlineSize * 2,
        py + fixedPlankH - outlineSize * 4,
        outlineSize,
        outlineSize * 2,
      );
      rect(
        px + outlineSize * 3,
        py + fixedPlankH - outlineSize * 3,
        outlineSize,
        outlineSize,
      );
      rect(
        px + pw - outlineSize * 3,
        py + outlineSize * 2,
        outlineSize,
        outlineSize * 2,
      );
      rect(
        px + pw - outlineSize * 4,
        py + outlineSize * 2,
        outlineSize,
        outlineSize,
      );
      rect(
        px + pw - outlineSize * 3,
        py + fixedPlankH - outlineSize * 4,
        outlineSize,
        outlineSize * 2,
      );
      rect(
        px + pw - outlineSize * 4,
        py + fixedPlankH - outlineSize * 3,
        outlineSize,
        outlineSize,
      );

      py += fixedPlankH;
    }

    pop();
  }

  drawWoodPanel(x, y, w, h) {
    // Legacy: convert pixel height to nearest numPlanks
    let numPlanks = max(1, Math.round((h - 4) / 26));
    this._drawPixelWoodPanel(x, y, w, numPlanks);
  }

  _drawWoodPanelLarge(x, y, w, h) {
    noStroke();
    fill(12, 8, 2);
    rect(x, y, w, h, 8);
    fill(88, 55, 18);
    rect(x + 3, y + 3, w - 6, h - 6, 6);
    fill(110, 72, 28);
    rect(x + 5, y + 5, w - 10, h - 10, 5);
    fill(80, 50, 15, 80);
    for (let i = 1; i < 6; i++) {
      let dy = y + 5 + i * ((h - 10) / 6);
      rect(x + 6, dy, w - 12, 2);
    }
    noFill();
    stroke(60, 38, 10);
    strokeWeight(2);
    rect(x + 3, y + 3, w - 6, h - 6, 6);
    noStroke();
    this._drawBolts(x, y, w, h);
  }

  _drawWoodPanelMed(x, y, w, h) {
    noStroke();
    fill(10, 6, 2);
    rect(x, y, w, h, 5);
    fill(95, 60, 22);
    rect(x + 2, y + 2, w - 4, h - 4, 4);
    fill(115, 76, 30);
    rect(x + 3, y + 3, w - 6, h - 6, 3);
    fill(75, 46, 14, 60);
    for (let i = 1; i < 3; i++) {
      let dy = y + 3 + i * ((h - 6) / 3);
      rect(x + 4, dy, w - 8, 2);
    }
    noFill();
    stroke(55, 34, 10);
    strokeWeight(1);
    rect(x + 2, y + 2, w - 4, h - 4, 4);
    noStroke();
  }

  _drawBolts(x, y, w, h) {
    let positions = [
      [x + 10, y + 10],
      [x + w - 17, y + 10],
      [x + 10, y + h - 17],
      [x + w - 17, y + h - 17],
    ];
    for (let [bx, by] of positions) {
      fill(8, 5, 1);
      rect(bx, by, 7, 7, 1);
      fill(50, 32, 10);
      rect(bx + 1, by + 1, 5, 5, 1);
      fill(25, 15, 4);
      rect(bx + 2, by + 2, 3, 3, 1);
      fill(80, 55, 20);
      rect(bx + 1, by + 1, 2, 2);
    }
    noStroke();
  }

  drawIntermissionCenter(roundNum, intermissionTimeLeft) {
    let now = pauseClock.now(),
      elapsed = now - this._interPhaseStart;
    if (this._interPhase === "cleared") {
      let alpha;
      if (elapsed < this._clearedFadeDur) {
        alpha = 255;
      } else {
        let fe = elapsed - this._clearedFadeDur;
        alpha = constrain(map(fe, 0, this._clearedFadeOut, 255, 0), 0, 255);
        if (fe >= this._clearedFadeOut) {
          this._interPhase = "countdown";
          this._interPhaseStart = now;
        }
      }
      this._drawClearedText(roundNum, alpha);
    } else if (this._interPhase === "countdown") {
      let sec = Math.ceil(intermissionTimeLeft / 1000);
      if (intermissionTimeLeft <= 0) {
        this._interPhase = "off";
        return true;
      }
      this._drawCountdownCenter(sec);
    }
    return false;
  }

  _drawClearedText(roundNum, alpha) {
    textSize(72);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -4; ox <= 4; ox++)
      for (let oy = -4; oy <= 4; oy++)
        if (ox || oy)
          text(
            "ROUND " + roundNum + " CLEARED!",
            width / 2 + ox,
            height / 2 + oy,
          );
    fill(100, 255, 120, alpha);
    text("ROUND " + roundNum + " CLEARED!", width / 2, height / 2);
  }

  _drawCountdownCenter(sec) {
    textSize(130);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 220);
    for (let ox = -5; ox <= 5; ox++)
      for (let oy = -5; oy <= 5; oy++)
        if (ox || oy) text(sec, width / 2 + ox, height / 2 - 40 + oy);
    let c =
      sec > 8
        ? color(100, 255, 120)
        : sec > 4
          ? color(255, 220, 60)
          : color(255, 80, 80);
    fill(c);
    text(sec, width / 2, height / 2 - 40);
    textSize(24);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 200);
    for (let ox = -2; ox <= 2; ox++)
      for (let oy = -2; oy <= 2; oy++)
        if (ox || oy)
          text("[B]  Open Shop", width / 2 + ox, height / 2 + 95 + oy);
    fill(220, 210, 180);
    text("[B]  Open Shop", width / 2, height / 2 + 95);
    textSize(20);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 180);
    for (let ox = -2; ox <= 2; ox++)
      for (let oy = -2; oy <= 2; oy++)
        if (ox || oy)
          text("[ENTER]  Start Now", width / 2 + ox, height / 2 + 130 + oy);
    fill(180, 200, 160);
    text("[ENTER]  Start Now", width / 2, height / 2 + 130);
  }

  updateAndDrawRoundStart() {
    if (this._roundStartPhase === "off") return;
    let now = pauseClock.now(),
      elapsed = now - this._roundStartStart;
    let alpha = 0;
    if (this._roundStartPhase === "fadein") {
      alpha = constrain(
        map(elapsed, 0, this._roundStartFadeIn, 0, 255),
        0,
        255,
      );
      if (elapsed >= this._roundStartFadeIn) {
        this._roundStartPhase = "hold";
        this._roundStartStart = now;
      }
    } else if (this._roundStartPhase === "hold") {
      alpha = 255;
      if (elapsed >= this._roundStartHold) {
        this._roundStartPhase = "fadeout";
        this._roundStartStart = now;
      }
    } else if (this._roundStartPhase === "fadeout") {
      alpha = constrain(
        map(elapsed, 0, this._roundStartFadeOut, 255, 0),
        0,
        255,
      );
      if (elapsed >= this._roundStartFadeOut) {
        this._roundStartPhase = "off";
        return;
      }
    }
    textSize(72);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -4; ox <= 4; ox++)
      for (let oy = -4; oy <= 4; oy++)
        if (ox || oy)
          text(
            "ROUND " + this._roundStartNum,
            width / 2 + ox,
            height / 2 - 20 + oy,
          );
    fill(255, 255, 255, alpha);
    text("ROUND " + this._roundStartNum, width / 2, height / 2 - 20);
    let diffLabel = this._roundStartDiff.toUpperCase();
    let diffColor =
      this._roundStartDiff === "hell"
        ? color(255, 60, 60, alpha)
        : this._roundStartDiff === "hard"
          ? color(255, 180, 40, alpha)
          : color(100, 220, 100, alpha);
    textSize(28);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -2; ox <= 2; ox++)
      for (let oy = -2; oy <= 2; oy++)
        if (ox || oy) text(diffLabel, width / 2 + ox, height / 2 + 40 + oy);
    fill(diffColor);
    text(diffLabel, width / 2, height / 2 + 40);
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
    return 24;
  }
  static get FS_WEAPON_NAME() {
    return 24;
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

  drawHealthBar(player) {}
  drawStaminaBar(player) {}

  drawStatBars(player) {
    // 5 planks = 5*26+4 = 134px
    let PLANKS = 5;
    let pH = this._panelH(PLANKS);
    let px = 8,
      py = 8,
      pW = 390;
    this._drawPixelWoodPanel(px, py, pW, PLANKS);

    let innerX = px + 10;
    let rightEdge = px + pW - 10;
    let iconSize = 38;
    let stIconSize = 30;

    // Bar x overlaps icon by 10px
    let hBx = innerX + floor(iconSize / 2);

    let barW = rightEdge - hBx;

    // ── Health bar (drawn first, icon on top) ─────────────────────────────
    let hy = py + 12;
    let hBH = 22;
    let hBy = hy + floor((iconSize - hBH) / 2);
    let hPct = player.health / player.maxHealth;

    noFill();
    stroke(30, 15, 5);
    strokeWeight(1);
    rect(hBx, hBy, barW, hBH, 2);
    noStroke();
    fill(15, 5, 5);
    rect(hBx + 1, hBy + 1, barW - 2, hBH - 2, 1);
    let hFillW = (barW - 4) * hPct;
    if (hFillW > 0) {
      fill(210, 35, 35);
      rect(hBx + 2, hBy + 2, hFillW, hBH - 4, 1);
      fill(255, 100, 100, 140);
      rect(hBx + 2, hBy + 2, hFillW, floor((hBH - 4) * 0.4), 1);
      let hShadeH = floor((hBH - 4) * 0.3);
      fill(130, 15, 15, 120);
      rect(hBx + 2, hBy + 2 + (hBH - 4) - hShadeH, hFillW, hShadeH, 1);
    }
    noStroke();
    textSize(UIRenderer.FS_HP_TEXT);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline(
      player.health + "/" + player.maxHealth,
      hBx + 14,
      hBy + hBH / 2,
      255,
      255,
      255,
      2,
    );

    // ── Heart icon (on top of bar) ────────────────────────────────────────
    let heartSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_heart")
        : null;
    if (heartSheet && heartSheet.img) {
      push();
      imageMode(CORNER);
      image(
        heartSheet.img,
        innerX,
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
      text("♥", innerX + iconSize / 2, hy + iconSize / 2);
    }

    // ── Stamina bar (drawn first, icon on top) ────────────────────────────
    let sy = hy + iconSize + 2;
    let sBH = 18;
    let sBx = hBx;
    let sBy = sy + floor((stIconSize - sBH) / 2) + 2;
    let sPct = player.stamina / player.maxStamina;

    noFill();
    stroke(30, 25, 5);
    strokeWeight(1);
    rect(sBx, sBy, barW, sBH, 2);
    noStroke();
    fill(15, 13, 3);
    rect(sBx + 1, sBy + 1, barW - 2, sBH - 2, 1);
    let sFillW = (barW - 4) * sPct;
    if (sFillW > 0) {
      fill(220, 190, 15);
      rect(sBx + 2, sBy + 2, sFillW, sBH - 4, 1);
      fill(255, 245, 130, 140);
      rect(sBx + 2, sBy + 2, sFillW, floor((sBH - 4) * 0.4), 1);
      let sShadeH = floor((sBH - 4) * 0.3);
      fill(150, 120, 5, 120);
      rect(sBx + 2, sBy + 2 + (sBH - 4) - sShadeH, sFillW, sShadeH, 1);
    }
    noStroke();
    textSize(UIRenderer.FS_STATUS);
    textAlign(LEFT, CENTER);
    if (player.isSprinting && Math.floor(pauseClock.now() / 250) % 2 === 0)
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

    // ── Stamina icon (on top of bar) ──────────────────────────────────────
    let stSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_stamina")
        : null;
    if (stSheet && stSheet.img) {
      push();
      imageMode(CORNER);
      image(
        stSheet.img,
        innerX + 8,
        sy + 4,
        stIconSize - 4,
        stIconSize - 4,
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
      text("⚡", innerX + stIconSize / 2, sy + stIconSize / 2);
    }

    // ── EXP bar ───────────────────────────────────────────────────────────
    let ey = sy + stIconSize + 6;
    let eBx = innerX;
    let eBH = 22;
    let eBy = ey;
    let eBW = rightEdge - eBx;
    let ePct = this.gameState.exp / this.gameState.expToNextLevel;

    noFill();
    stroke(20, 10, 40);
    strokeWeight(1);
    rect(eBx, eBy, eBW, eBH, 2);
    noStroke();
    fill(10, 5, 20);
    rect(eBx + 1, eBy + 1, eBW - 2, eBH - 2, 1);
    let eFillW = (eBW - 4) * ePct;
    if (eFillW > 0) {
      fill(100, 60, 200);
      rect(eBx + 2, eBy + 2, eFillW, eBH - 4, 1);
      fill(180, 140, 255, 100);
      rect(eBx + 2, eBy + 2, eFillW, floor((eBH - 4) * 0.4), 1);
    }
    noStroke();
    textSize(UIRenderer.FS_HP_TEXT);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "Level " + this.gameState.level,
      eBx + eBW / 2,
      eBy + eBH / 2,
      220,
      200,
      255,
      2,
    );
  }

  drawScore() {
    // 2 planks = 56px
    let PLANKS = 2;
    let pH = this._panelH(PLANKS); // 56
    let pW = 160,
      px = width - pW - 8,
      py = 8;
    this._drawPixelWoodPanel(px, py, pW, PLANKS);

    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    if (coinSheet && coinSheet.img) {
      push();
      imageMode(CORNER);
      image(
        coinSheet.img,
        px + 12,
        py + floor((pH - 28) / 2),
        28,
        28,
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
      px + 46,
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
    // 4 planks = 108px tall, 110px wide
    let PLANKS = 4;
    let slotH = this._panelH(PLANKS); // 108
    let slotW = 110;
    let slotY = height - slotH - 20;
    let slots = [
      { key: "melee", x: width - 380 },
      { key: "handgun", x: width - 252 },
      { key: "equipped", x: width - 124 },
    ];
    for (let s of slots) {
      let x = s.x,
        y = slotY,
        isActive = player.currentWeapon === s.key,
        w = player.weapons[s.key];
      this._drawPixelWoodPanel(x, y, slotW, PLANKS);

      if (isActive) {
        noStroke();
        fill(255, 220, 0, 50);
        rect(x + 6, y + 6, slotW - 12, slotH - 12);
        noFill();
        stroke(255, 220, 0);
        strokeWeight(2);
        rect(x + 6, y + 6, slotW - 12, slotH - 12);
        noStroke();
      }

      if (w === null) {
        textSize(UIRenderer.FS_WEAPON_NAME);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "EMPTY",
          x + slotW / 2,
          y + slotH / 2,
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
          let maxW = slotW - 30,
            maxH = slotH - 50;
          let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
          let dw = gunSheet.frameW * sc,
            dh = gunSheet.frameH * sc;
          push();
          translate(x + slotW / 2, y + (slotH - 24) / 2);
          rotate(-0.35);
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
          let maxW = slotW - 16,
            maxH = slotH - 42;
          let sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
          let dw = gunSheet.frameW * sc,
            dh = gunSheet.frameH * sc;
          push();
          imageMode(CENTER);
          image(
            gunSheet.img,
            x + slotW / 2,
            y + (slotH - 30) / 2,
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
          x + slotW / 2,
          y + slotH / 2 - 12,
          255,
          255,
          255,
          2,
        );
      }

      let ammoY = y + slotH - 18;
      if (w.magSize !== undefined) {
        if (w.isReloading) {
          let progress = Math.min(
            (pauseClock.now() - w.reloadStartTime) / w.reloadTime,
            1,
          );
          let bW = slotW - 20,
            bH = 5,
            bX = x + 10,
            bY = y + slotH - 24;
          noStroke();
          fill(30, 20, 5);
          rect(bX, bY, bW, bH);
          fill(255, 140, 0);
          rect(bX, bY, bW * progress, bH);
          textSize(9);
          textAlign(CENTER, BOTTOM);
          this.drawTextWithOutline(
            "RELOADING...",
            x + slotW / 2,
            y + slotH - 10,
            255,
            200,
            0,
            1,
          );
        } else {
          let cx = x + slotW / 2;
          let curStr = "" + w.currentAmmo;
          let sepStr = "/";
          let magStr = "" + w.magSize;
          let totalStr = w.unlimited ? "∞" : "" + (w.totalAmmo || 0);
          textSize(UIRenderer.FS_AMMO);
          let curW = textWidth(curStr);
          let groupW = curW + textWidth(sepStr) + textWidth(magStr);
          let fullW = groupW + 10 + textWidth(totalStr);
          let startX = cx - fullW / 2;
          textAlign(LEFT, CENTER);
          this.drawTextWithOutline(curStr, startX, ammoY, 255, 220, 50, 1);
          this.drawTextWithOutline(
            sepStr + magStr,
            startX + curW,
            ammoY,
            255,
            255,
            255,
            1,
          );
          this.drawTextWithOutline(
            totalStr,
            startX + groupW + 10,
            ammoY,
            200,
            200,
            200,
            1,
          );
        }
      } else if (s.key === "melee") {
        textSize(18);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          w.name,
          x + slotW / 2,
          y + slotH - 28,
          220,
          200,
          160,
          2,
        );
      }
    }
  }

  drawRoundInfo(roundManager) {
    // Round panel: 2 planks = 56px
    // Zombie panel: 2 planks = 56px
    let ROUND_PLANKS = 1;
    let ZOMBIE_PLANKS = 2;
    let roundH = this._panelH(ROUND_PLANKS); // 56
    let zombieH = this._panelH(ZOMBIE_PLANKS); // 56
    let panelW = 200,
      gap = 6;
    let px = width / 2 - panelW / 2;
    let py1 = 8;

    this._drawPixelWoodPanel(px, py1, panelW, ROUND_PLANKS);
    textSize(UIRenderer.FS_ROUND);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "ROUND " + roundManager.currentRound,
      width / 2,
      py1 + roundH / 2,
      255,
      255,
      255,
      2,
    );

    let py2 = py1 + roundH + gap;
    this._drawPixelWoodPanel(px, py2, panelW, ZOMBIE_PLANKS);
    let zombiesRemaining =
      (roundManager.zombiesToSpawn || 0) + this.gameState.zombies.length;
    let skull = this.assetManager ? this.assetManager.getSkullIcon() : null;
    let rowY = py2 + zombieH / 2;
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

  drawAntidoteIndicator(player) {
    let bob = Math.sin(pauseClock.now() * 0.004) * 4;
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
    let elapsed = pauseClock.now() - this.gameState.meleeSlashStartTime;
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
    let isSniper = w.name === "Sniper",
      isShotgun = w.name === "Shotgun";
    let dx = vx - player.x,
      dy = vy - player.y;
    let dMouse = Math.sqrt(dx * dx + dy * dy),
      angle = Math.atan2(dy, dx);
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

  drawScorePopupsScreenSpace(camX, camY) {
    let now = millis(),
      totalPaused = pauseClock.totalPausedMs();
    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;

    for (let p of this.gameState.scorePopups) {
      let pausedSinceSpawn = totalPaused - p.pausedMsAtSpawn;
      let elapsed = now - p.spawnTime - pausedSinceSpawn;
      let progress = elapsed / p.lifetime;
      let alpha = 255 * (1 - progress);
      if (alpha <= 0) continue;
      let sx = p.x - camX,
        sy = p.y - camY - 40 * progress;

      if (p.isCoin) {
        let iconSize = 16,
          label = "+" + p.value;
        textSize(18);
        textAlign(LEFT, CENTER);
        let tw = textWidth(label),
          total = iconSize + 4 + tw,
          startX = sx - total / 2;
        if (coinSheet && coinSheet.img) {
          push();
          imageMode(CORNER);
          tint(255, alpha);
          image(
            coinSheet.img,
            startX,
            sy - iconSize / 2,
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
            if (ox || oy) text(label, startX + iconSize + 4 + ox, sy + oy);
        fill(255, 220, 50, alpha);
        text(label, startX + iconSize + 4, sy);
      } else if (p.isExp) {
        let label = "+" + p.value + " EXP";
        textSize(16);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(80, 160, 255, alpha);
        text(label, sx, sy);
      } else if (p.isDamage) {
        let label = "-" + p.value;
        textSize(16);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(255, 255, 255, alpha);
        text(label, sx, sy);
      } else if (p.isPlayerDamage) {
        let label = "-" + p.value;
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -2; ox <= 2; ox++)
          for (let oy = -2; oy <= 2; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(255, 60, 60, alpha);
        text(label, sx, sy);
      } else if (p.isLevelUp) {
        let label = p.value;
        textSize(28);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -3; ox <= 3; ox++)
          for (let oy = -3; oy <= 3; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(255, 220, 50, alpha);
        text(label, sx, sy);
      } else {
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -2; ox <= 2; ox++)
          for (let oy = -2; oy <= 2; oy++)
            if (ox || oy) text(p.value, sx + ox, sy + oy);
        fill(255, 230, 0, alpha);
        text(p.value, sx, sy);
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
      "Press ESC to resume",
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

    // 4 planks = 108px
    let PLANKS = 4;
    let mmW = 160;
    let mmH = this._panelH(PLANKS); // 108
    let mmX = width - mmW - 8;
    // sits below score panel: score is 2 planks = 56px
    let mmY = 8 + this._panelH(2) + 6; // 8+56+6 = 70

    this._drawPixelWoodPanel(mmX, mmY, mmW, PLANKS);

    let mx = mmX + 10,
      my = mmY + 10,
      mw = mmW - 20,
      mh = mmH - 20;
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

    textSize(12);
    textAlign(CENTER, TOP);
    this.drawTextWithOutline("MAP", mmX + mmW / 2, mmY + 4, 255, 240, 180, 1);
    noStroke();
  }

  renderAll(player, roundManager, shopManager) {
    noStroke();
    this.drawStatBars(player);
    this.drawScore();
    this.drawWeaponSlot(player);
    this.drawRoundInfo(roundManager);
    this.drawMinimap(player, roundManager);
    this.updateAndDrawRoundStart();
    if (this._shopOpen) this.drawShop(roundManager, shopManager, player);
  }
}
