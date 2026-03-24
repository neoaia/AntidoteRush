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

    // ── Pause system ──────────────────────────────────────────────────────
    this._pauseView = "main";
    this._hoveredBtn = null;
    this._pauseBtnRects = {};
    this._pauseVolRects = {};
    this._sliderRects = {};
    this._volumeDragging = null;

    // ── Game Over panel ───────────────────────────────────────────────────
    // Phases: "off" | "waiting" | "sliding" | "visible"
    this._goPhase = "off";
    this._goDeathTime = 0; // real millis() when player died
    this._goDelay = 2000; // ms of clean-screen pause before panel appears
    this._goSlideStart = 0; // millis() when slide began
    this._goSlideDur = 700; // ms for panel to slide in
    this._goPanelY = 0; // current rendered top-y of the panel
    this._goBtnRects = {}; // clickable button regions
    this._goStats = null; // snapshot of stats at death moment
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

  onPause() {
    this._pauseView = "main";
    this._hoveredBtn = null;
    this._volumeDragging = null;
  }

  // ── Called by game.js immediately on death ────────────────────────────
  startGameOverSequence(player, roundManager, gameState) {
    this._goPhase = "waiting";
    this._goDeathTime = millis();
    // Snapshot stats at this exact moment
    this._goStats = {
      name: gameState.playerName || "???",
      round: roundManager.currentRound,
      score: gameState.score || 0,
      level: gameState.level || 1,
      zombiesKilled: gameState.zombiesKilled || 0,
      coins: gameState.coins || 0,
    };
    // Also persist to localStorage for the html game-over page if needed
    localStorage.setItem("lastRound", this._goStats.round);
    localStorage.setItem("lastScore", this._goStats.score);
    localStorage.setItem("lastCoins", this._goStats.coins);
  }

  // ── Called every draw() frame when gameState.gameOver is true ─────────
  drawGameOverScreen(player, roundManager, gameState) {
    let now = millis();

    if (this._goPhase === "waiting") {
      if (now - this._goDeathTime >= this._goDelay) {
        this._goPhase = "sliding";
        this._goSlideStart = now;
      }
      return;
    }

    if (this._goPhase === "sliding" || this._goPhase === "visible") {
      let panelW = min(520, width - 60);
      let panelH = 420;
      let panelX = width / 2 - panelW / 2;
      let panelFinalY = height / 2 - panelH / 2;

      let panelY;
      if (this._goPhase === "sliding") {
        let elapsed = now - this._goSlideStart;
        let t = min(elapsed / this._goSlideDur, 1);
        let e = 1 - Math.pow(1 - t, 3);
        panelY = -panelH + e * (panelFinalY + panelH);
        if (t >= 1) {
          this._goPhase = "visible";
          panelY = panelFinalY;
        }
      } else {
        panelY = panelFinalY;
      }

      this._goPanelY = panelY;

      noStroke();
      fill(0, 0, 0, 160);
      rect(0, 0, width, height);

      this._drawPixelWoodPanel(panelX, panelY, panelW, panelH);

      let titleY = panelY + 38;
      textSize(28);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        "GAME OVER",
        width / 2,
        titleY,
        255,
        255,
        255,
        3,
      );

      noStroke();
      fill(0, 0, 0, 80);
      rect(panelX + 16, panelY + 56, panelW - 32, 3);

      let stats = this._goStats || {};
      let statRows = [
        { label: "PLAYER", value: stats.name || "???" },
        { label: "ROUND REACHED", value: "" + (stats.round || 1) },
        { label: "SCORE", value: "" + (stats.score || 0) },
        { label: "LEVEL", value: "" + (stats.level || 1) },
        { label: "ZOMBIES KILLED", value: "" + (stats.zombiesKilled || 0) },
      ];

      let rowStartY = panelY + 76;
      let rowH = 38;
      for (let i = 0; i < statRows.length; i++) {
        let row = statRows[i];
        let rowY = rowStartY + i * rowH + rowH / 2;

        textSize(9);
        textAlign(LEFT, CENTER);
        this.drawTextWithOutline(
          row.label,
          panelX + 28,
          rowY,
          255,
          255,
          255,
          1,
        );

        textSize(12);
        textAlign(RIGHT, CENTER);
        this.drawTextWithOutline(
          row.value,
          panelX + panelW - 28,
          rowY,
          255,
          255,
          255,
          1,
        );

        if (i < statRows.length - 1) {
          noStroke();
          fill(0, 0, 0, 40);
          rect(panelX + 20, rowY + rowH / 2, panelW - 40, 2);
        }
      }

      let btnY = panelY + panelH - 88;
      let btnH = 52;
      let btnGap = 16;
      let btnW = (panelW - 56 - btnGap) / 2;
      let btn1X = panelX + 28;
      let btn2X = btn1X + btnW + btnGap;

      this._goBtnRects = {
        playAgain: { x: btn1X, y: btnY, w: btnW, h: btnH },
        title: { x: btn2X, y: btnY, w: btnW, h: btnH },
      };

      if (this._goPhase === "visible") {
        this._drawPixelWoodPanel(btn1X, btnY, btnW, btnH);
        let h1 =
          mouseX >= btn1X &&
          mouseX <= btn1X + btnW &&
          mouseY >= btnY &&
          mouseY <= btnY + btnH;
        if (h1) {
          noStroke();
          fill(255, 255, 255, 40);
          rect(btn1X + 3, btnY + 3, btnW - 6, btnH - 6);
        }
        textSize(10);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "PLAY AGAIN",
          btn1X + btnW / 2,
          btnY + btnH / 2,
          255,
          255,
          255,
          2,
        );

        this._drawPixelWoodPanel(btn2X, btnY, btnW, btnH);
        let h2 =
          mouseX >= btn2X &&
          mouseX <= btn2X + btnW &&
          mouseY >= btnY &&
          mouseY <= btnY + btnH;
        if (h2) {
          noStroke();
          fill(255, 255, 255, 40);
          rect(btn2X + 3, btnY + 3, btnW - 6, btnH - 6);
        }
        textSize(10);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "TITLE SCREEN",
          btn2X + btnW / 2,
          btnY + btnH / 2,
          255,
          255,
          255,
          2,
        );

        textSize(8);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "PLAY AGAIN KEEPS YOUR NAME",
          width / 2,
          btnY + btnH + 20,
          255,
          255,
          255,
          1,
        );
      }
    }
  }

  handleGameOverClick(mx, my) {
    if (this._goPhase !== "visible") return;

    let pa = this._goBtnRects.playAgain;
    let ti = this._goBtnRects.title;

    if (
      pa &&
      mx >= pa.x &&
      mx <= pa.x + pa.w &&
      my >= pa.y &&
      my <= pa.y + pa.h
    ) {
      if (typeof audioManager !== "undefined") audioManager.playSelect();
      localStorage.removeItem("lastRound");
      localStorage.removeItem("lastScore");
      localStorage.removeItem("lastCoins");
      localStorage.removeItem("difficulty");
      if (typeof window.fadeNavigateTo === "function") {
        window.fadeNavigateTo("../pages/menu.html?screen=difficulty");
      } else {
        window.location.href = "../pages/menu.html?screen=difficulty";
      }
      return;
    }

    if (
      ti &&
      mx >= ti.x &&
      mx <= ti.x + ti.w &&
      my >= ti.y &&
      my <= ti.y + ti.h
    ) {
      if (typeof audioManager !== "undefined") audioManager.playSelect();
      localStorage.removeItem("playerName");
      localStorage.removeItem("lastRound");
      localStorage.removeItem("lastScore");
      localStorage.removeItem("lastCoins");
      localStorage.removeItem("difficulty");
      if (typeof window.fadeNavigateTo === "function") {
        window.fadeNavigateTo("../pages/menu.html");
      } else {
        window.location.href = "../pages/menu.html";
      }
    }
  }

  pauseHandleClick(mx, my) {
    if (this._pauseView === "main") {
      for (let [id, r] of Object.entries(this._pauseBtnRects)) {
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          if (typeof audioManager !== "undefined") audioManager.playSelect();
          if (id === "volume") {
            this._pauseView = "volume";
            this._hoveredBtn = null;
            return null;
          }
          return id;
        }
      }
    } else if (this._pauseView === "volume") {
      let back = this._pauseVolRects["back"];
      if (
        back &&
        mx >= back.x &&
        mx <= back.x + back.w &&
        my >= back.y &&
        my <= back.y + back.h
      ) {
        if (typeof audioManager !== "undefined") audioManager.playSelect();
        this._pauseView = "main";
        this._hoveredBtn = null;
        return null;
      }
      for (let [key, r] of Object.entries(this._sliderRects)) {
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          this._volumeDragging = key;
          this._applySlider(key, mx);
          return null;
        }
      }
    }
    return null;
  }

  checkPauseHover(mx, my) {
    let rects =
      this._pauseView === "main" ? this._pauseBtnRects : this._pauseVolRects;
    let found = null;
    for (let [id, r] of Object.entries(rects)) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        found = id;
        break;
      }
    }
    if (found && found !== this._hoveredBtn) {
      if (typeof audioManager !== "undefined") audioManager.playHover();
    }
    this._hoveredBtn = found;
  }

  pauseHandleDrag(mx, my) {
    if (!this._volumeDragging) return;
    let r = this._sliderRects[this._volumeDragging];
    if (r) this._applySlider(this._volumeDragging, mx);
  }

  pauseHandleRelease() {
    this._volumeDragging = null;
  }

  _applySlider(key, mx) {
    let r = this._sliderRects[key];
    if (!r || typeof audioManager === "undefined") return;
    let v = Math.max(0, Math.min(1, (mx - r.trackX) / r.trackW));
    if (key === "master") audioManager.setMasterVolume(v);
    else if (key === "bgm") audioManager.setBgmVolume(v);
    else if (key === "sfx") audioManager.setSfxVolume(v);
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
      if (typeof audioManager !== "undefined") audioManager.playSelect();
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
        if (typeof audioManager !== "undefined") {
          if (success) audioManager.playSelect();
          else audioManager.playError();
        }
        return true;
      }
    }
    return true;
  }

  _getShopLayout() {
    let panelW = 460,
      panelH = 460;
    let panelX = width / 2 - panelW / 2;
    let panelY = height / 2 - panelH / 2;
    let headerH = 60;
    let contentX = panelX + 20,
      contentY = panelY + headerH + 10,
      contentW = panelW - 40;
    let keys = ["health", "stamina", "speed", "strength", "precision"];
    let itemH = 60,
      gapY = 8,
      btnRects = [];
    for (let i = 0; i < keys.length; i++) {
      let itemY = contentY + i * (itemH + gapY);
      let btnW = 120,
        btnH = 40;
      let btnX = contentX + contentW - btnW - 10;
      let btnY = itemY + itemH / 2 - btnH / 2;
      btnRects.push({
        cardX: contentX,
        cardY: itemY,
        cardW: contentW,
        cardH: itemH,
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
      });
    }
    return {
      panelX,
      panelY,
      panelW,
      panelH,
      headerH,
      btnRects,
      closeBtn: { x: panelX + panelW - 44, y: panelY + 12, w: 32, h: 32 },
    };
  }

  drawShop(roundManager, shopManager, player) {
    if (!this._shopOpen) return;
    let layout = this._getShopLayout();
    let { panelX, panelY, panelW, panelH, headerH, btnRects } = layout;
    let mx = mouseX,
      my = mouseY;

    noStroke();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);

    this._drawPixelWoodPanel(panelX, panelY, panelW, panelH);

    textSize(28);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline(
      "SHOP",
      panelX + 20,
      panelY + headerH / 2,
      255,
      255,
      255,
      2,
    );

    let sec = roundManager
      ? Math.ceil(roundManager.intermissionTimeLeft / 1000)
      : 0;
    textSize(14);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "NEXT ROUND IN " + sec + "S",
      panelX + panelW / 2 - 10,
      panelY + headerH / 2,
      255,
      255,
      255,
      1,
    );

    let coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    let coinX = panelX + panelW - 140;
    if (coinSheet && coinSheet.img) {
      push();
      imageMode(CORNER);
      image(
        coinSheet.img,
        coinX,
        panelY + headerH / 2 - 12,
        24,
        24,
        0,
        0,
        coinSheet.frameW,
        coinSheet.frameH,
      );
      pop();
      textSize(20);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        this.gameState.coins,
        coinX + 30,
        panelY + headerH / 2,
        255,
        255,
        255,
        2,
      );
    }

    let cb = layout.closeBtn;
    let cbHover =
      mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h;
    this._drawPixelWoodPanel(cb.x, cb.y, cb.w, cb.h);
    if (cbHover) {
      fill(255, 255, 255, 50);
      rect(cb.x + 2, cb.y + 2, cb.w - 4, cb.h - 4);
    }
    textSize(18);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "X",
      cb.x + cb.w / 2,
      cb.y + cb.h / 2,
      255,
      255,
      255,
      2,
    );

    fill(0, 0, 0, 80);
    rect(panelX + 16, panelY + headerH, panelW - 32, 4);

    let keys = Object.keys(shopManager.statShop);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i],
        stat = shopManager.statShop[key];
      let cost = shopManager.getStatCurrentCost(key);
      let canAfford = this.gameState.coins >= cost;
      let btn = btnRects[i];

      fill(0, 0, 0, 40);
      rect(btn.cardX, btn.cardY, btn.cardW, btn.cardH, 4);

      textSize(18);
      textAlign(LEFT, TOP);
      this.drawTextWithOutline(
        stat.label.toUpperCase(),
        btn.cardX + 14,
        btn.cardY + 12,
        255,
        255,
        255,
        2,
      );

      textSize(14);
      textAlign(LEFT, BOTTOM);
      this.drawTextWithOutline(
        "LV. " + stat.purchased,
        btn.cardX + 14,
        btn.cardY + btn.cardH - 12,
        255,
        255,
        255,
        1,
      );

      let hover =
        mx >= btn.x &&
        mx <= btn.x + btn.w &&
        my >= btn.y &&
        my <= btn.y + btn.h;
      this._drawPixelWoodPanel(btn.x, btn.y, btn.w, btn.h);

      if (!canAfford) {
        fill(0, 0, 0, 150);
        rect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4);
      } else if (hover) {
        fill(255, 255, 255, 50);
        rect(btn.x + 2, btn.y + 2, btn.w - 4, btn.h - 4);
      }

      textSize(11);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        "UPGRADE",
        btn.x + btn.w / 2,
        btn.y + btn.h / 2 - 8,
        255,
        255,
        255,
        1,
      );

      textSize(12);
      this.drawTextWithOutline(
        "¢ " + cost,
        btn.x + btn.w / 2,
        btn.y + btn.h / 2 + 8,
        255,
        255,
        255,
        1,
      );
    }

    textSize(11);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "[B] CLOSE SHOP",
      panelX + panelW / 2,
      panelY + panelH - 16,
      255,
      255,
      255,
      1,
    );
  }

  _panelH(numPlanks) {
    return numPlanks * 26 + 4;
  }

  _drawPixelWoodPanel(x, y, w, h) {
    push();
    noStroke();

    let outlineSize = 2;
    let outlineCol = color(0);
    let mainCol = color("#AB6A38");
    let highlightCol = color("#D49A59");
    let shadowCol = color("#7D4722");

    fill(outlineCol);
    let chunkY = 3;
    rect(x, y, w, h + chunkY);

    fill(mainCol);
    rect(
      x + outlineSize,
      y + outlineSize,
      w - outlineSize * 2,
      h - outlineSize * 2,
    );

    let innerX = x + outlineSize,
      innerY = y + outlineSize;
    let innerW = w - outlineSize * 2,
      innerH = h - outlineSize * 2;

    let plankSpacing = 24;
    for (
      let py = innerY + plankSpacing;
      py < innerY + innerH - 4;
      py += plankSpacing
    ) {
      fill(shadowCol);
      rect(innerX, py, innerW, outlineSize);
      fill(highlightCol);
      rect(innerX, py + outlineSize, innerW, 1);
    }

    fill(outlineCol);
    rect(innerX + 2, innerY + 2, outlineSize, outlineSize);
    rect(innerX + innerW - 4, innerY + 2, outlineSize, outlineSize);
    rect(innerX + 2, innerY + innerH - 4, outlineSize, outlineSize);
    rect(innerX + innerW - 4, innerY + innerH - 4, outlineSize, outlineSize);

    fill(highlightCol);
    rect(innerX, innerY, innerW, outlineSize);
    rect(innerX, innerY, outlineSize, innerH);

    fill(shadowCol);
    rect(innerX, innerY + innerH - outlineSize, innerW, outlineSize);
    rect(innerX + innerW - outlineSize, innerY, outlineSize, innerH);

    pop();
  }

  drawWoodPanel(x, y, w, h) {
    this._drawPixelWoodPanel(x, y, w, h);
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
    let displayText = "ROUND " + roundNum + " CLEARED!";

    textSize(86); // Pinalaki mula 72
    textAlign(CENTER, CENTER);

    fill(0, 0, 0, alpha);
    for (let ox = -5; ox <= 5; ox++) {
      for (let oy = -5; oy <= 5; oy++) {
        if (ox || oy) {
          text(displayText, width / 2 + ox, height / 2 + oy);
        }
      }
    }

    // Binalik sa kulay Green
    fill(100, 255, 120, alpha);
    text(displayText, width / 2, height / 2);
  }

  _drawCountdownCenter(sec) {
    textSize(160); // Pinalaki mula 130
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 220);
    for (let ox = -6; ox <= 6; ox++)
      for (let oy = -6; oy <= 6; oy++)
        if (ox || oy) text(sec, width / 2 + ox, height / 2 - 50 + oy);

    // Binalik yung nag-iibang kulay ng timer (Green -> Yellow -> Red)
    let c =
      sec > 8
        ? color(100, 255, 120)
        : sec > 4
          ? color(255, 220, 60)
          : color(255, 80, 80);
    fill(c);
    text(sec, width / 2, height / 2 - 50);

    textSize(28); // Pinalaki mula 24
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 200);
    for (let ox = -3; ox <= 3; ox++)
      for (let oy = -3; oy <= 3; oy++)
        if (ox || oy)
          text("[B]  OPEN SHOP", width / 2 + ox, height / 2 + 105 + oy);

    // Binalik ang kulay
    fill(255, 255, 255);
    text("[B]  OPEN SHOP", width / 2, height / 2 + 105);

    textSize(28); // Pinalaki mula 24
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 180);
    for (let ox = -3; ox <= 3; ox++)
      for (let oy = -3; oy <= 3; oy++)
        if (ox || oy)
          text("[ENTER]  START NOW", width / 2 + ox, height / 2 + 145 + oy);

    // Binalik ang kulay
    fill(255, 255, 255);
    text("[ENTER]  START NOW", width / 2, height / 2 + 145);
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

    textSize(86); // Pinalaki mula 72
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -5; ox <= 5; ox++)
      for (let oy = -5; oy <= 5; oy++)
        if (ox || oy)
          text(
            "ROUND " + this._roundStartNum,
            width / 2 + ox,
            height / 2 - 30 + oy,
          );
    fill(255, 255, 255, alpha);
    text("ROUND " + this._roundStartNum, width / 2, height / 2 - 30);

    let diffLabel = this._roundStartDiff.toUpperCase();

    // Binalik ang kulay base sa difficulty (Green = Easy, Orange = Hard, Red = Hell)
    let diffColor =
      this._roundStartDiff === "hell"
        ? color(255, 60, 60, alpha)
        : this._roundStartDiff === "hard"
          ? color(255, 180, 40, alpha)
          : color(100, 220, 100, alpha);

    textSize(36); // Pinalaki mula 28
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -3; ox <= 3; ox++)
      for (let oy = -3; oy <= 3; oy++)
        if (ox || oy) text(diffLabel, width / 2 + ox, height / 2 + 45 + oy);

    // In-apply ang difficulty color
    fill(diffColor);
    text(diffLabel, width / 2, height / 2 + 45);
  }

  static get FS_HP_TEXT() {
    return 20;
  }
  static get FS_ROUND() {
    return 22;
  }
  static get FS_ZOMBIE_COUNT() {
    return 36;
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
    let pH = 100;
    let px = 8,
      py = 8,
      pW = 390;
    this._drawPixelWoodPanel(px, py, pW, pH);

    let innerX = px + 10;
    let rightEdge = px + pW - 10;
    let iconSize = 34;
    let stIconSize = 28;
    let hBx = innerX + floor(iconSize / 2);
    let barW = rightEdge - hBx;

    let hy = py + 8;
    let hBH = 20;
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
    }

    let sy = hy + 26;
    let sBH = 16;
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
        255,
        255,
        1,
      );
    else if (player.isInBase && !player.isSprinting && sPct < 1)
      this.drawTextWithOutline(
        "RECHARGING",
        sBx + barW + 4,
        sBy + sBH / 2,
        255,
        255,
        255,
        1,
      );

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
    }

    let ey = sy + 32;
    let eBx = innerX,
      eBH = 18,
      eBy = ey + 4;
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
      "LEVEL " + this.gameState.level,
      eBx + eBW / 2,
      eBy + eBH / 2,
      255,
      255,
      255,
      2,
    );
  }

  drawScore() {
    let PLANKS = 2,
      pH = this._panelH(PLANKS);
    let pW = 160,
      px = width - pW - 8,
      py = 8;
    this._drawPixelWoodPanel(px, py, pW, pH);
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
      255,
      255,
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
    let PLANKS = 4,
      slotH = this._panelH(PLANKS),
      slotW = 110;
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
      this._drawPixelWoodPanel(x, y, slotW, slotH);
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
            maxH = slotH - 50,
            sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
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
            maxH = slotH - 42,
            sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
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
          w.name.toUpperCase(),
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
            255,
            255,
            1,
          );
        } else {
          let cx = x + slotW / 2;
          let curStr = "" + w.currentAmmo,
            sepStr = "/",
            magStr = "" + w.magSize;

          // Tinanggal ang infinity symbol (∞) pag unlimited ang ammo
          let totalStr = w.unlimited ? "" : "" + (w.totalAmmo || 0);
          let gap = w.unlimited ? 0 : 10;

          textSize(UIRenderer.FS_AMMO);
          let curW = textWidth(curStr),
            groupW = curW + textWidth(sepStr) + textWidth(magStr);
          let fullW = groupW + gap + textWidth(totalStr),
            startX = cx - fullW / 2;
          textAlign(LEFT, CENTER);
          // AMMO IS EXEMPT FROM WHITE RULE - nanatiling kulay
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

          // Id-draw lang ang reserve ammo kung hindi unlimited
          if (!w.unlimited) {
            this.drawTextWithOutline(
              totalStr,
              startX + groupW + gap,
              ammoY,
              200, // Reserve ammo nanatiling kulay
              200,
              200,
              1,
            );
          }
        }
      } else if (s.key === "melee") {
        textSize(18);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          w.name.toUpperCase(),
          x + slotW / 2,
          y + slotH - 28,
          255,
          255,
          255,
          2,
        );
      }
    }
  }

  drawRoundInfo(roundManager) {
    let ROUND_PLANKS = 1,
      ZOMBIE_PLANKS = 2;
    let roundH = this._panelH(ROUND_PLANKS);
    let zombieH = this._panelH(ZOMBIE_PLANKS);
    let panelW = 200,
      gap = 6;
    let px = width / 2 - panelW / 2,
      py1 = 8;

    this._drawPixelWoodPanel(px, py1, panelW, roundH);
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
    this._drawPixelWoodPanel(px, py2, panelW, zombieH);
    let zombiesRemaining =
      (roundManager.zombiesToSpawn || 0) + this.gameState.zombies.length;
    let skull = this.assetManager ? this.assetManager.getSkullIcon() : null;
    let rowY = py2 + zombieH / 2;

    if (skull && skull.width) {
      imageMode(CENTER);
      image(skull, width / 2 - 30, rowY, 32, 32);
      imageMode(CORNER);
    } else {
      textSize(30);
      textAlign(CENTER, CENTER);
      text("💀", width / 2 - 26, rowY);
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

      // LAHAT NG POPUPS AY PUTI NA DIN
      fill(255, 255, 255, alpha);

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
        fill(255, 255, 255, alpha);
        text(label, startX + iconSize + 4, sy);
      } else if (p.isExp) {
        let label = "+" + p.value + " EXP";
        textSize(16);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -1; ox <= 1; ox++)
          for (let oy = -1; oy <= 1; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(255, 255, 255, alpha);
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
        fill(255, 255, 255, alpha);
        text(label, sx, sy);
      } else if (p.isLevelUp) {
        let label = p.value;
        textSize(28);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -3; ox <= 3; ox++)
          for (let oy = -3; oy <= 3; oy++)
            if (ox || oy) text(label, sx + ox, sy + oy);
        fill(255, 255, 255, alpha);
        text(label, sx, sy);
      } else {
        textSize(20);
        textAlign(CENTER, CENTER);
        fill(0, 0, 0, alpha);
        for (let ox = -2; ox <= 2; ox++)
          for (let oy = -2; oy <= 2; oy++)
            if (ox || oy) text(p.value, sx + ox, sy + oy);
        fill(255, 255, 255, alpha);
        text(p.value, sx, sy);
      }
    }
  }

  drawPauseScreen() {
    noStroke();
    fill(0, 0, 0, 190);
    rect(0, 0, width, height);
    if (this._pauseView === "volume") this._drawVolumeSettings();
    else this._drawPauseMain();
  }

  _drawPauseMain() {
    let cx = width / 2;
    let btnW = 260,
      PLANKS = 2,
      pH = this._panelH(PLANKS);
    let btnX = cx - btnW / 2;
    let totalH = 3 * pH + 2 * 10;
    let startY = height / 2 - totalH / 2;

    textSize(64);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline("PAUSED", cx, startY - 50, 255, 255, 255, 5);

    let buttons = [
      { id: "resume", label: "RESUME" },
      { id: "volume", label: "VOLUME" },
      { id: "exit", label: "EXIT" },
    ];
    this._pauseBtnRects = {};

    for (let i = 0; i < buttons.length; i++) {
      let btn = buttons[i];
      let btnY = startY + i * (pH + 10);
      let isHovered =
        mouseX >= btnX &&
        mouseX <= btnX + btnW &&
        mouseY >= btnY &&
        mouseY <= btnY + pH;
      this._pauseBtnRects[btn.id] = { x: btnX, y: btnY, w: btnW, h: pH };
      this._drawPixelWoodPanel(btnX, btnY, btnW, pH);
      if (isHovered) {
        noStroke();
        fill(255, 255, 255, 50);
        rect(btnX + 2, btnY + 2, btnW - 4, pH - 4);
      }
      textSize(22);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        btn.label.toUpperCase(),
        cx,
        btnY + pH / 2,
        255,
        255,
        255,
        2,
      );
    }

    textSize(14);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "WASD | SHIFT SPRINT | R RELOAD | 1/2/3 SCROLL WEAPON",
      cx,
      height - 30,
      255,
      255,
      255,
      1,
    );
  }

  _drawVolumeSettings() {
    let cx = width / 2;
    let panelW = 380,
      PLANKS = 10,
      panelH = this._panelH(PLANKS);
    let panelX = cx - panelW / 2,
      panelY = height / 2 - panelH / 2;
    this._drawPixelWoodPanel(panelX, panelY, panelW, panelH);

    textSize(26);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "VOLUME SETTINGS",
      cx,
      panelY + 22,
      255,
      255,
      255,
      2,
    );

    noStroke();
    fill(62, 39, 35, 180);
    rect(panelX + 16, panelY + 38, panelW - 32, 2);

    let volData = [
      {
        id: "master",
        label: "MASTER",
        value:
          typeof audioManager !== "undefined"
            ? audioManager.getMasterVolume()
            : 1,
      },
      {
        id: "bgm",
        label: "BGM",
        value:
          typeof audioManager !== "undefined" ? audioManager.getBgmVolume() : 1,
      },
      {
        id: "sfx",
        label: "SFX",
        value:
          typeof audioManager !== "undefined" ? audioManager.getSfxVolume() : 1,
      },
    ];

    let labelW = 80,
      valW = 46;
    let trackW = panelW - labelW - valW - 40;
    let trackX = panelX + 20 + labelW + 6,
      trackH = 14;
    let rowGap = 50,
      firstY = panelY + 58;
    this._sliderRects = {};

    for (let i = 0; i < volData.length; i++) {
      let s = volData[i];
      let rowCY = firstY + i * rowGap;
      let trackY = rowCY - floor(trackH / 2);
      let fillW = trackW * s.value;
      let isDragging = this._volumeDragging === s.id;

      textSize(15);
      textAlign(RIGHT, CENTER);
      this.drawTextWithOutline(
        s.label.toUpperCase(),
        panelX + 20 + labelW,
        rowCY,
        255,
        255,
        255,
        1,
      );

      noFill();
      stroke(62, 39, 35);
      strokeWeight(1);
      rect(trackX, trackY, trackW, trackH, 2);
      noStroke();
      fill(20, 12, 4);
      rect(trackX + 1, trackY + 1, trackW - 2, trackH - 2, 1);

      if (fillW > 2) {
        fill(isDragging ? color(255, 200, 80) : color(200, 150, 60));
        rect(trackX + 2, trackY + 2, fillW - 2, trackH - 4, 1);
        fill(255, 220, 130, 120);
        rect(trackX + 2, trackY + 2, fillW - 2, floor((trackH - 4) * 0.45), 1);
      }

      let thumbX = constrain(trackX + fillW - 5, trackX, trackX + trackW - 10);
      fill(isDragging ? color(255, 240, 180) : color(255, 210, 100));
      rect(thumbX, trackY - 3, 10, trackH + 6, 2);

      textSize(13);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        floor(s.value * 100) + "%",
        trackX + trackW + 8,
        rowCY,
        255,
        255,
        255,
        1,
      );

      this._sliderRects[s.id] = {
        x: trackX,
        y: trackY - 8,
        w: trackW,
        h: trackH + 16,
        trackX,
        trackW,
      };
    }

    let backW = 160,
      backPlanks = 2,
      backH = this._panelH(backPlanks);
    let backX = cx - backW / 2,
      backY = panelY + panelH - backH - 12;
    let backHovered =
      mouseX >= backX &&
      mouseX <= backX + backW &&
      mouseY >= backY &&
      mouseY <= backY + backH;
    this._pauseVolRects = { back: { x: backX, y: backY, w: backW, h: backH } };
    this._drawPixelWoodPanel(backX, backY, backW, backH);
    if (backHovered) {
      noStroke();
      fill(255, 255, 255, 50);
      rect(backX + 2, backY + 2, backW - 4, backH - 4);
    }
    textSize(20);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline("< BACK", cx, backY + backH / 2, 255, 255, 255, 2);
  }

  drawMinimap(player, roundManager) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 2400;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 2400;
    let PLANKS = 4,
      mmW = 160,
      mmH = this._panelH(PLANKS);
    let mmX = width - mmW - 8,
      mmY = 8 + this._panelH(2) + 6;
    this._drawPixelWoodPanel(mmX, mmY, mmW, mmH);
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
    textSize(20);
    textAlign(CENTER, TOP);
    this.drawTextWithOutline("MAP", mmX + mmW / 2, mmY + 6, 255, 255, 255, 2);
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
