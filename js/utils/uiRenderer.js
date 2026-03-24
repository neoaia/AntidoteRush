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

    // ── Pause system ────────────────────────────────────────────────────
    this._pauseView = "main";
    this._hoveredBtn = null;
    this._pauseBtnRects = {};
    this._pauseVolRects = {};
    this._sliderRects = {};
    this._volumeDragging = null;

    // ── Game Over panel ─────────────────────────────────────────────────
    this._goPhase = "off";
    this._goDeathTime = 0;
    this._goDelay = 2000;
    this._goSlideStart = 0;
    this._goSlideDur = 700;
    this._goPanelY = 0;
    this._goBtnRects = {};
    this._goStats = null;

    // ── HUD caching ─────────────────────────────────────────────────────
    // HudCache is instantiated after p5 is ready (first renderAll call)
    this._hudCache = null;

    // ── Throttled minimap ───────────────────────────────────────────────
    this._minimapBuffer = null;
    this._minimapLastDraw = 0;
    this._minimapFps = 12; // redraws per second — human eye can't tell at higher fps
  }

  // ── HUD cache lazy-init ─────────────────────────────────────────────────
  _ensureHudCache() {
    if (!this._hudCache) this._hudCache = new HudCache();
  }

  // ── Shop ────────────────────────────────────────────────────────────────
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

  // ── Game Over ───────────────────────────────────────────────────────────

  startGameOverSequence(player, roundManager, gameState) {
    this._goPhase = "waiting";
    this._goDeathTime = millis();
    this._goStats = {
      name: gameState.playerName || "???",
      round: roundManager.currentRound,
      score: gameState.score || 0,
      level: gameState.level || 1,
      zombiesKilled: gameState.zombiesKilled || 0,
      coins: gameState.coins || 0,
    };
    localStorage.setItem("lastRound", this._goStats.round);
    localStorage.setItem("lastScore", this._goStats.score);
    localStorage.setItem("lastCoins", this._goStats.coins);
  }

  drawGameOverScreen(player, roundManager, gameState) {
    const now = millis();

    if (this._goPhase === "waiting") {
      if (now - this._goDeathTime >= this._goDelay) {
        this._goPhase = "sliding";
        this._goSlideStart = now;
      }
      return;
    }

    if (this._goPhase === "sliding" || this._goPhase === "visible") {
      const panelW = min(600, width - 60);
      const panelH = 500;
      const panelX = width / 2 - panelW / 2;
      const panelFinalY = height / 2 - panelH / 2;

      let panelY;
      if (this._goPhase === "sliding") {
        const elapsed = now - this._goSlideStart;
        const t = min(elapsed / this._goSlideDur, 1);
        const e = 1 - Math.pow(1 - t, 3);
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
      fill(0, 0, 0, 180);
      rect(0, 0, width, height);
      this._drawPlainPixelWoodPanel(panelX, panelY, panelW, panelH);

      const titleY = panelY + 50;
      textSize(46);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline("GAME OVER", width / 2, titleY, 255, 70, 70, 3);

      fill(62, 39, 35, 180);
      rect(panelX + 30, panelY + 85, panelW - 60, 4);

      const stats = this._goStats || {};
      const statRows = [
        { label: "PLAYER", value: stats.name || "???" },
        { label: "ROUND REACHED", value: "" + (stats.round || 1) },
        { label: "SCORE", value: "" + (stats.score || 0) },
        { label: "LEVEL", value: "" + (stats.level || 1) },
        { label: "ZOMBIES KILLED", value: "" + (stats.zombiesKilled || 0) },
      ];

      const contentX = panelX + 30;
      const contentY = panelY + 110;
      const contentW = panelW - 60;
      const rowH = 44;

      fill(0, 0, 0, 40);
      rect(contentX, contentY, contentW, statRows.length * rowH + 10, 6);

      for (let i = 0; i < statRows.length; i++) {
        const row = statRows[i];
        const rowY = contentY + 5 + i * rowH + rowH / 2;
        textSize(22);
        textAlign(LEFT, CENTER);
        this.drawTextWithOutline(
          row.label,
          contentX + 20,
          rowY,
          255,
          255,
          255,
          2,
        );
        textSize(24);
        textAlign(RIGHT, CENTER);
        this.drawTextWithOutline(
          row.value,
          contentX + contentW - 20,
          rowY,
          255,
          220,
          100,
          2,
        );
        if (i < statRows.length - 1) {
          fill(62, 39, 35, 120);
          rect(contentX + 15, contentY + 5 + (i + 1) * rowH, contentW - 30, 2);
        }
      }

      const btnY = panelY + panelH - 95;
      const btnH = 60;
      const btnGap = 20;
      const btnW = (panelW - 60 - btnGap) / 2;
      const btn1X = panelX + 30;
      const btn2X = btn1X + btnW + btnGap;

      this._goBtnRects = {
        playAgain: { x: btn1X, y: btnY, w: btnW, h: btnH },
        title: { x: btn2X, y: btnY, w: btnW, h: btnH },
      };

      if (this._goPhase === "visible") {
        this._drawPixelWoodPanel(btn1X, btnY, btnW, btnH);
        const h1 =
          mouseX >= btn1X &&
          mouseX <= btn1X + btnW &&
          mouseY >= btnY &&
          mouseY <= btnY + btnH;
        if (h1) {
          noStroke();
          fill(255, 255, 255, 50);
          rect(btn1X + 2, btnY + 2, btnW - 4, btnH - 4);
        }
        textSize(22);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "PLAY AGAIN",
          btn1X + btnW / 2,
          btnY + btnH / 2 - 2,
          255,
          255,
          255,
          2,
        );

        this._drawPixelWoodPanel(btn2X, btnY, btnW, btnH);
        const h2 =
          mouseX >= btn2X &&
          mouseX <= btn2X + btnW &&
          mouseY >= btnY &&
          mouseY <= btnY + btnH;
        if (h2) {
          noStroke();
          fill(255, 255, 255, 50);
          rect(btn2X + 2, btnY + 2, btnW - 4, btnH - 4);
        }
        textSize(22);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "TITLE SCREEN",
          btn2X + btnW / 2,
          btnY + btnH / 2 - 2,
          255,
          255,
          255,
          2,
        );
      }
    }
  }

  handleGameOverClick(mx, my) {
    if (this._goPhase !== "visible") return;
    const pa = this._goBtnRects.playAgain;
    const ti = this._goBtnRects.title;

    if (
      pa &&
      mx >= pa.x &&
      mx <= pa.x + pa.w &&
      my >= pa.y &&
      my <= pa.y + pa.h
    ) {
      if (typeof audioManager !== "undefined") audioManager.playSelect();
      ["lastRound", "lastScore", "lastCoins", "difficulty"].forEach((k) =>
        localStorage.removeItem(k),
      );
      if (typeof window.fadeNavigateTo === "function")
        window.fadeNavigateTo("../pages/menu.html?screen=difficulty");
      else window.location.href = "../pages/menu.html?screen=difficulty";
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
      [
        "playerName",
        "lastRound",
        "lastScore",
        "lastCoins",
        "difficulty",
      ].forEach((k) => localStorage.removeItem(k));
      if (typeof window.fadeNavigateTo === "function")
        window.fadeNavigateTo("../pages/menu.html");
      else window.location.href = "../pages/menu.html";
    }
  }

  // ── Pause ───────────────────────────────────────────────────────────────

  pauseHandleClick(mx, my) {
    if (this._pauseView === "main") {
      for (const [id, r] of Object.entries(this._pauseBtnRects)) {
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
      const back = this._pauseVolRects["back"];
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
      for (const [key, r] of Object.entries(this._sliderRects)) {
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
    const rects =
      this._pauseView === "main" ? this._pauseBtnRects : this._pauseVolRects;
    let found = null;
    for (const [id, r] of Object.entries(rects)) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        found = id;
        break;
      }
    }
    if (
      found &&
      found !== this._hoveredBtn &&
      typeof audioManager !== "undefined"
    )
      audioManager.playHover();
    this._hoveredBtn = found;
  }

  pauseHandleDrag(mx, my) {
    if (!this._volumeDragging) return;
    const r = this._sliderRects[this._volumeDragging];
    if (r) this._applySlider(this._volumeDragging, mx);
  }

  pauseHandleRelease() {
    this._volumeDragging = null;
  }

  _applySlider(key, mx) {
    const r = this._sliderRects[key];
    if (!r || typeof audioManager === "undefined") return;
    const v = Math.max(0, Math.min(1, (mx - r.trackX) / r.trackW));
    if (key === "master") audioManager.setMasterVolume(v);
    else if (key === "bgm") audioManager.setBgmVolume(v);
    else if (key === "sfx") audioManager.setSfxVolume(v);
  }

  // ── Intermission / Round start ──────────────────────────────────────────

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

  // ── Shop ────────────────────────────────────────────────────────────────

  shopClick(mx, my, shopManager, player) {
    if (!this._shopOpen) return false;
    const layout = this._getShopLayout();
    const cb = layout.closeBtn;
    if (mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h) {
      this.closeShop();
      if (typeof audioManager !== "undefined") audioManager.playSelect();
      return true;
    }
    const keys = Object.keys(shopManager.statShop);
    for (let i = 0; i < keys.length; i++) {
      const btn = layout.btnRects[i];
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

  shopScroll(delta) {
    /* scroll handled by CSS overflow on the panel */
  }

  _getShopLayout() {
    const panelW = 680,
      panelH = 620;
    const panelX = width / 2 - panelW / 2;
    const panelY = height / 2 - panelH / 2;
    const headerH = 80;
    const contentX = panelX + 25,
      contentY = panelY + headerH + 10,
      contentW = panelW - 50;
    const keys = ["health", "stamina", "speed", "strength", "precision"];
    const itemH = 82,
      gapY = 14;
    const btnRects = [];

    for (let i = 0; i < keys.length; i++) {
      const itemY = contentY + i * (itemH + gapY);
      const btnW = 160,
        btnH = 52;
      const btnX = contentX + contentW - btnW - 15;
      const btnY = itemY + itemH / 2 - btnH / 2;
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
      closeBtn: { x: panelX + panelW - 55, y: panelY + 15, w: 40, h: 40 },
    };
  }

  // ── Text outline — OPTIMISED ────────────────────────────────────────────
  //
  //  Old: (2w+1)² draw calls per string (e.g. w=4 → 81 calls).
  //  New: 3 draw calls using the Canvas 2D shadow API.
  //
  //  The shadow is rendered by the GPU compositing stage — zero extra JS loops.

  drawTextWithOutline(txt, x, y, r, g, b, w) {
    const dc = drawingContext; // native Canvas2D context

    // Two diagonal shadows give a convincing full outline cheaply
    dc.save();
    dc.shadowColor = "rgba(0,0,0,0.95)";
    dc.shadowBlur = 0;
    dc.shadowOffsetX = w;
    dc.shadowOffsetY = w;
    fill(r, g, b);
    text(txt, x, y);

    dc.shadowOffsetX = -w;
    dc.shadowOffsetY = -w;
    text(txt, x, y);

    dc.restore();

    // Crisp top pass — no shadow, just the coloured text
    fill(r, g, b);
    text(txt, x, y);
  }

  // Variant that draws into a p5.Graphics buffer
  drawTextWithOutlinePG(pg, txt, x, y, r, g, b, w) {
    const dc = pg.drawingContext;
    dc.save();
    dc.shadowColor = "rgba(0,0,0,0.95)";
    dc.shadowBlur = 0;
    dc.shadowOffsetX = w;
    dc.shadowOffsetY = w;
    pg.fill(r, g, b);
    pg.text(txt, x, y);
    dc.shadowOffsetX = -w;
    dc.shadowOffsetY = -w;
    pg.text(txt, x, y);
    dc.restore();
    pg.fill(r, g, b);
    pg.text(txt, x, y);
  }

  // ── HUD panels ──────────────────────────────────────────────────────────

  drawStatBars(player) {
    this._ensureHudCache();
    const pH = 100,
      px = 8,
      py = 8,
      pW = 390;

    // Cache key — only redraws when any of these values change
    const val = {
      hp: player.health,
      maxHp: player.maxHealth,
      st: Math.floor(player.stamina),
      maxSt: player.maxStamina,
      sprinting: player.isSprinting,
      inBase: player.isInBase,
      exp: Math.floor(this.gameState.exp),
      expNext: this.gameState.expToNextLevel,
      level: this.gameState.level,
    };

    const buf = this._hudCache.get("statBars", pW, pH, val, (pg) => {
      pg.textFont(this.assetManager.getFont());
      this._drawStatBarsInto(pg, player, 0, 0, pW, pH);
    });

    image(buf, px, py);
  }

  _drawStatBarsInto(pg, player, px, py, pW, pH) {
    // Wood panel background
    this._drawPixelWoodPanelPG(pg, px, py, pW, pH);

    const innerX = px + 10;
    const rightEdge = px + pW - 10;
    const iconSize = 34;
    const stIconSize = 28;
    const hBx = innerX + Math.floor(iconSize / 2);
    const barW = rightEdge - hBx;

    // ── HP bar ────────────────────────────────────────────────────────
    const hy = py + 8;
    const hBH = 20;
    const hBy = hy + Math.floor((iconSize - hBH) / 2);
    const hPct = player.health / player.maxHealth;

    pg.noFill();
    pg.stroke(30, 15, 5);
    pg.strokeWeight(1);
    pg.rect(hBx, hBy, barW, hBH, 2);
    pg.noStroke();
    pg.fill(15, 5, 5);
    pg.rect(hBx + 1, hBy + 1, barW - 2, hBH - 2, 1);

    const hFillW = (barW - 4) * hPct;
    if (hFillW > 0) {
      pg.fill(210, 35, 35);
      pg.rect(hBx + 2, hBy + 2, hFillW, hBH - 4, 1);
      pg.fill(255, 100, 100, 140);
      pg.rect(hBx + 2, hBy + 2, hFillW, Math.floor((hBH - 4) * 0.4), 1);
      pg.fill(130, 15, 15, 120);
      pg.rect(
        hBx + 2,
        hBy + 2 + (hBH - 4) - Math.floor((hBH - 4) * 0.3),
        hFillW,
        Math.floor((hBH - 4) * 0.3),
        1,
      );
    }
    pg.noStroke();
    pg.textSize(UIRenderer.FS_HP_TEXT);
    pg.textAlign(LEFT, CENTER);
    this.drawTextWithOutlinePG(
      pg,
      player.health + "/" + player.maxHealth,
      hBx + 14,
      hBy + hBH / 2,
      255,
      255,
      255,
      2,
    );

    // Heart icon
    const heartSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_heart")
        : null;
    if (heartSheet && heartSheet.img) {
      pg.push();
      pg.imageMode(CORNER);
      pg.image(
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
      pg.pop();
    }

    // ── Stamina bar ───────────────────────────────────────────────────
    const sy = hy + 26;
    const sBH = 16;
    const sBx = hBx;
    const sBy = sy + Math.floor((stIconSize - sBH) / 2) + 2;
    const sPct = player.stamina / player.maxStamina;

    pg.noFill();
    pg.stroke(30, 25, 5);
    pg.strokeWeight(1);
    pg.rect(sBx, sBy, barW, sBH, 2);
    pg.noStroke();
    pg.fill(15, 13, 3);
    pg.rect(sBx + 1, sBy + 1, barW - 2, sBH - 2, 1);

    const sFillW = (barW - 4) * sPct;
    if (sFillW > 0) {
      pg.fill(220, 190, 15);
      pg.rect(sBx + 2, sBy + 2, sFillW, sBH - 4, 1);
      pg.fill(255, 245, 130, 140);
      pg.rect(sBx + 2, sBy + 2, sFillW, Math.floor((sBH - 4) * 0.4), 1);
      pg.fill(150, 120, 5, 120);
      pg.rect(
        sBx + 2,
        sBy + 2 + (sBH - 4) - Math.floor((sBH - 4) * 0.3),
        sFillW,
        Math.floor((sBH - 4) * 0.3),
        1,
      );
    }
    pg.noStroke();
    pg.textSize(UIRenderer.FS_STATUS);
    pg.textAlign(LEFT, CENTER);
    if (player.isSprinting && Math.floor(pauseClock.now() / 250) % 2 === 0)
      this.drawTextWithOutlinePG(
        pg,
        "SPRINTING",
        sBx + barW + 4,
        sBy + sBH / 2,
        255,
        255,
        255,
        1,
      );
    else if (player.isInBase && !player.isSprinting && sPct < 1)
      this.drawTextWithOutlinePG(
        pg,
        "RECHARGING",
        sBx + barW + 4,
        sBy + sBH / 2,
        255,
        255,
        255,
        1,
      );

    const stSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_stamina")
        : null;
    if (stSheet && stSheet.img) {
      pg.push();
      pg.imageMode(CORNER);
      pg.image(
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
      pg.pop();
    }

    // ── EXP bar ───────────────────────────────────────────────────────
    const ey = sy + 32;
    const eBx = innerX,
      eBH = 18,
      eBy = ey + 4;
    const eBW = rightEdge - eBx;
    const ePct = this.gameState.exp / this.gameState.expToNextLevel;

    pg.noFill();
    pg.stroke(20, 10, 40);
    pg.strokeWeight(1);
    pg.rect(eBx, eBy, eBW, eBH, 2);
    pg.noStroke();
    pg.fill(10, 5, 20);
    pg.rect(eBx + 1, eBy + 1, eBW - 2, eBH - 2, 1);

    const eFillW = (eBW - 4) * ePct;
    if (eFillW > 0) {
      pg.fill(100, 60, 200);
      pg.rect(eBx + 2, eBy + 2, eFillW, eBH - 4, 1);
      pg.fill(180, 140, 255, 100);
      pg.rect(eBx + 2, eBy + 2, eFillW, Math.floor((eBH - 4) * 0.4), 1);
    }
    pg.noStroke();
    pg.textSize(UIRenderer.FS_HP_TEXT);
    pg.textAlign(CENTER, CENTER);
    this.drawTextWithOutlinePG(
      pg,
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
    this._ensureHudCache();
    const PLANKS = 2,
      pH = this._panelH(PLANKS);
    const pW = 160,
      px = width - pW - 8,
      py = 8;

    const val = { coins: this.gameState.coins };
    const buf = this._hudCache.get("score", pW, pH, val, (pg) => {
      pg.textFont(this.assetManager.getFont());
      this._drawPixelWoodPanelPG(pg, 0, 0, pW, pH);

      const coinSheet =
        typeof spriteManager !== "undefined"
          ? spriteManager.get("icon_coin")
          : null;
      if (coinSheet && coinSheet.img) {
        pg.push();
        pg.imageMode(CORNER);
        pg.image(
          coinSheet.img,
          12,
          Math.floor((pH - 28) / 2),
          28,
          28,
          0,
          0,
          coinSheet.frameW,
          coinSheet.frameH,
        );
        pg.pop();
      }
      pg.textSize(UIRenderer.FS_COINS);
      pg.textAlign(LEFT, CENTER);
      this.drawTextWithOutlinePG(
        pg,
        "" + this.gameState.coins,
        46,
        pH / 2,
        255,
        255,
        255,
        2,
      );
    });

    image(buf, px, py);
  }

  drawRoundInfo(roundManager) {
    this._ensureHudCache();
    const ROUND_PLANKS = 1,
      ZOMBIE_PLANKS = 2;
    const roundH = this._panelH(ROUND_PLANKS);
    const zombieH = this._panelH(ZOMBIE_PLANKS);
    const panelW = 200,
      gap = 6;
    const px = width / 2 - panelW / 2,
      py1 = 8;

    const zombiesRemaining =
      (roundManager.zombiesToSpawn || 0) + this.gameState.zombies.length;
    const val = { round: roundManager.currentRound, zombies: zombiesRemaining };

    const totalH = roundH + gap + zombieH;
    const buf = this._hudCache.get("roundInfo", panelW, totalH, val, (pg) => {
      pg.textFont(this.assetManager.getFont());

      this._drawPixelWoodPanelPG(pg, 0, 0, panelW, roundH);
      pg.textSize(UIRenderer.FS_ROUND);
      pg.textAlign(CENTER, CENTER);
      this.drawTextWithOutlinePG(
        pg,
        "ROUND " + roundManager.currentRound,
        panelW / 2,
        roundH / 2,
        255,
        255,
        255,
        2,
      );

      this._drawPixelWoodPanelPG(pg, 0, roundH + gap, panelW, zombieH);
      const skull = this.assetManager ? this.assetManager.getSkullIcon() : null;
      const rowY = roundH + gap + zombieH / 2;
      if (skull && skull.width) {
        pg.imageMode(CENTER);
        pg.image(skull, panelW / 2 - 30, rowY, 32, 32);
        pg.imageMode(CORNER);
      }
      pg.textSize(UIRenderer.FS_ZOMBIE_COUNT);
      pg.textAlign(CENTER, CENTER);
      this.drawTextWithOutlinePG(
        pg,
        zombiesRemaining,
        panelW / 2 + 18,
        rowY,
        255,
        255,
        255,
        2,
      );
    });

    image(buf, px, py1);
  }

  // ── Minimap — throttled to _minimapFps ─────────────────────────────────

  drawMinimap(player, roundManager) {
    const now = millis();
    const mmW = 160,
      mmH = this._panelH(4);
    const mmX = width - mmW - 8,
      mmY = 8 + this._panelH(2) + 6;

    // Create (or recreate after resize)
    if (!this._minimapBuffer || this._minimapBuffer.width !== mmW) {
      if (this._minimapBuffer) this._minimapBuffer.remove();
      this._minimapBuffer = createGraphics(mmW, mmH);
      if (this.assetManager)
        this._minimapBuffer.textFont(this.assetManager.getFont());
      this._minimapLastDraw = 0; // force immediate redraw
    }

    const interval = 1000 / this._minimapFps;
    if (now - this._minimapLastDraw > interval) {
      this._minimapLastDraw = now;
      this._renderMinimapInto(
        this._minimapBuffer,
        player,
        roundManager,
        mmW,
        mmH,
      );
    }

    image(this._minimapBuffer, mmX, mmY);
  }

  _renderMinimapInto(pg, player, roundManager, mmW, mmH) {
    const W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 2400;
    const H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 2400;

    pg.clear();
    this._drawPixelWoodPanelPG(pg, 0, 0, mmW, mmH);

    const mx = 10,
      my = 10,
      mw = mmW - 20,
      mh = mmH - 20;
    pg.noStroke();
    pg.fill(40, 90, 35, 200);
    pg.rect(mx, my, mw, mh);

    const sx = mw / W,
      sy = mh / H;

    if (this.gameState.base) {
      const b = this.gameState.base;
      pg.fill(180, 160, 80, 80);
      pg.noStroke();
      pg.rect(
        mx + b.x * sx,
        my + b.y * sy,
        Math.max(4, b.width * sx),
        Math.max(4, b.height * sy),
      );
      pg.fill(100, 200, 255);
      pg.stroke(255);
      pg.strokeWeight(1);
      pg.circle(
        mx + (b.x + b.width / 2) * sx,
        my + (b.y + b.height / 2) * sy,
        6,
      );
      pg.noStroke();
    }

    pg.fill(220, 40, 40, 180);
    pg.noStroke();
    for (const z of this.gameState.zombies) {
      pg.circle(mx + z.x * sx, my + z.y * sy, 3);
    }

    if (this.gameState.currentAntidote) {
      pg.fill(80, 220, 80, 220);
      pg.noStroke();
      pg.circle(
        mx + this.gameState.currentAntidote.x * sx,
        my + this.gameState.currentAntidote.y * sy,
        4,
      );
    }

    pg.fill(0, 0, 0, 180);
    pg.noStroke();
    pg.circle(mx + player.x * sx, my + player.y * sy, 7);
    pg.fill(255, 255, 255, 240);
    pg.noStroke();
    pg.circle(mx + player.x * sx, my + player.y * sy, 5);

    pg.noFill();
    pg.stroke(80, 50, 18);
    pg.strokeWeight(1);
    pg.rect(mx, my, mw, mh);
    pg.noStroke();
    pg.textSize(20);
    pg.textAlign(CENTER, TOP);
    this.drawTextWithOutlinePG(pg, "MAP", mmW / 2, 6, 255, 255, 255, 2);
  }

  // ── Weapon slots ─────────────────────────────────────────────────────────

  drawWeaponSlot(player) {
    this._ensureHudCache();
    const PLANKS = 4,
      slotH = this._panelH(PLANKS),
      slotW = 110;
    const slotY = height - slotH - 20;
    const slots = [
      { key: "melee", x: width - 380 },
      { key: "handgun", x: width - 252 },
      { key: "equipped", x: width - 124 },
    ];

    // Build a compact cache key from weapon states
    const eq = player.weapons.equipped;
    const val = {
      current: player.currentWeapon,
      meleeName: player.weapons.melee ? player.weapons.melee.name : null,
      handgunAmmo: player.weapons.handgun
        ? player.weapons.handgun.currentAmmo
        : 0,
      handgunRld: player.weapons.handgun
        ? player.weapons.handgun.isReloading
        : false,
      handgunRldP:
        player.weapons.handgun && player.weapons.handgun.isReloading
          ? Math.floor(
              ((pauseClock.now() - player.weapons.handgun.reloadStartTime) /
                player.weapons.handgun.reloadTime) *
                20,
            )
          : 0,
      eqName: eq ? eq.name : null,
      eqAmmo: eq ? eq.currentAmmo : 0,
      eqTotal: eq ? eq.totalAmmo : 0,
      eqRld: eq ? eq.isReloading : false,
      eqRldP:
        eq && eq.isReloading
          ? Math.floor(
              ((pauseClock.now() - eq.reloadStartTime) / eq.reloadTime) * 20,
            )
          : 0,
    };

    const totalW = slots[slots.length - 1].x + slotW - slots[0].x;
    const startX = slots[0].x;

    const buf = this._hudCache.get("weaponSlots", totalW, slotH, val, (pg) => {
      pg.textFont(this.assetManager.getFont());
      for (const s of slots) {
        const localX = s.x - startX;
        this._drawWeaponSlotInto(pg, player, s.key, localX, 0, slotW, slotH);
      }
    });

    image(buf, startX, slotY);
  }

  _drawWeaponSlotInto(pg, player, slotKey, x, y, slotW, slotH) {
    const isActive = player.currentWeapon === slotKey;
    const w = player.weapons[slotKey];

    this._drawPixelWoodPanelPG(pg, x, y, slotW, slotH);

    if (isActive) {
      pg.noStroke();
      pg.fill(255, 220, 0, 50);
      pg.rect(x + 6, y + 6, slotW - 12, slotH - 12);
      pg.noFill();
      pg.stroke(255, 220, 0);
      pg.strokeWeight(2);
      pg.rect(x + 6, y + 6, slotW - 12, slotH - 12);
      pg.noStroke();
    }

    if (w === null) {
      pg.textSize(UIRenderer.FS_WEAPON_NAME);
      pg.textAlign(CENTER, CENTER);
      this.drawTextWithOutlinePG(
        pg,
        "EMPTY",
        x + slotW / 2,
        y + slotH / 2,
        255,
        255,
        255,
        2,
      );
      return;
    }

    const gunKey = w.name ? this._weaponSpriteKey(w.name) : null;
    const gunSheet =
      gunKey && typeof spriteManager !== "undefined"
        ? spriteManager.get(gunKey)
        : null;
    const isKnife = w.name === "Knife";

    if (gunSheet && gunSheet.img) {
      if (isKnife) {
        const maxW = slotW - 30,
          maxH = slotH - 50;
        const sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
        const dw = gunSheet.frameW * sc,
          dh = gunSheet.frameH * sc;
        pg.push();
        pg.translate(x + slotW / 2, y + (slotH - 24) / 2);
        pg.rotate(-0.35);
        pg.imageMode(CENTER);
        pg.image(
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
        pg.pop();
      } else {
        const maxW = slotW - 16,
          maxH = slotH - 42;
        const sc = Math.min(maxW / gunSheet.frameW, maxH / gunSheet.frameH);
        const dw = gunSheet.frameW * sc,
          dh = gunSheet.frameH * sc;
        pg.push();
        pg.imageMode(CENTER);
        pg.image(
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
        pg.pop();
      }
    } else {
      pg.textSize(UIRenderer.FS_WEAPON_NAME);
      pg.textAlign(CENTER, CENTER);
      this.drawTextWithOutlinePG(
        pg,
        w.name.toUpperCase(),
        x + slotW / 2,
        y + slotH / 2 - 12,
        255,
        255,
        255,
        2,
      );
    }

    const ammoY = y + slotH - 18;
    if (w.magSize !== undefined) {
      if (w.isReloading) {
        const progress = Math.min(
          (pauseClock.now() - w.reloadStartTime) / w.reloadTime,
          1,
        );
        const bW = slotW - 20,
          bH = 5,
          bX = x + 10,
          bY = y + slotH - 24;
        pg.noStroke();
        pg.fill(30, 20, 5);
        pg.rect(bX, bY, bW, bH);
        pg.fill(255, 140, 0);
        pg.rect(bX, bY, bW * progress, bH);
        pg.textSize(9);
        pg.textAlign(CENTER, BOTTOM);
        this.drawTextWithOutlinePG(
          pg,
          "RELOADING...",
          x + slotW / 2,
          y + slotH - 10,
          255,
          255,
          255,
          1,
        );
      } else {
        const cx = x + slotW / 2;
        const curStr = "" + w.currentAmmo;
        const sepStr = "/";
        const magStr = "" + w.magSize;
        const totalStr = w.unlimited ? "" : "" + (w.totalAmmo || 0);
        const gap = w.unlimited ? 0 : 10;
        pg.textSize(UIRenderer.FS_AMMO);
        const curW = pg.textWidth(curStr);
        const groupW = curW + pg.textWidth(sepStr) + pg.textWidth(magStr);
        const fullW = groupW + gap + pg.textWidth(totalStr);
        const startX = cx - fullW / 2;
        pg.textAlign(LEFT, CENTER);
        this.drawTextWithOutlinePG(pg, curStr, startX, ammoY, 255, 220, 50, 1);
        this.drawTextWithOutlinePG(
          pg,
          sepStr + magStr,
          startX + curW,
          ammoY,
          255,
          255,
          255,
          1,
        );
        if (!w.unlimited)
          this.drawTextWithOutlinePG(
            pg,
            totalStr,
            startX + groupW + gap,
            ammoY,
            200,
            200,
            200,
            1,
          );
      }
    } else if (slotKey === "melee") {
      pg.textSize(18);
      pg.textAlign(CENTER, CENTER);
      this.drawTextWithOutlinePG(
        pg,
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

  // ── Wood panel helpers (main canvas versions) ───────────────────────────

  _panelH(numPlanks) {
    return numPlanks * 26 + 4;
  }

  _drawPixelWoodPanel(x, y, w, h) {
    push();
    noStroke();
    const outlineSize = 2;
    fill(0);
    rect(x, y, w, h + 3);
    fill("#AB6A38");
    rect(
      x + outlineSize,
      y + outlineSize,
      w - outlineSize * 2,
      h - outlineSize * 2,
    );

    const innerX = x + outlineSize,
      innerY = y + outlineSize;
    const innerW = w - outlineSize * 2,
      innerH = h - outlineSize * 2;
    const plankSpacing = 24;
    for (
      let py = innerY + plankSpacing;
      py < innerY + innerH - 4;
      py += plankSpacing
    ) {
      fill("#7D4722");
      rect(innerX, py, innerW, outlineSize);
      fill("#D49A59");
      rect(innerX, py + outlineSize, innerW, 1);
    }
    fill("#D49A59");
    rect(innerX, innerY, innerW, outlineSize);
    rect(innerX, innerY, outlineSize, innerH);
    fill("#7D4722");
    rect(innerX, innerY + innerH - outlineSize, innerW, outlineSize);
    rect(innerX + innerW - outlineSize, innerY, outlineSize, innerH);
    pop();
  }

  _drawPlainPixelWoodPanel(x, y, w, h) {
    push();
    noStroke();
    const outlineSize = 4;
    fill(0);
    rect(x, y, w, h + 6);
    fill("#AB6A38");
    rect(
      x + outlineSize,
      y + outlineSize,
      w - outlineSize * 2,
      h - outlineSize * 2,
    );
    const innerX = x + outlineSize,
      innerY = y + outlineSize;
    const innerW = w - outlineSize * 2,
      innerH = h - outlineSize * 2;
    fill("#D49A59");
    rect(innerX, innerY, innerW, outlineSize);
    rect(innerX, innerY, outlineSize, innerH);
    fill("#7D4722");
    rect(innerX, innerY + innerH - outlineSize, innerW, outlineSize);
    rect(innerX + innerW - outlineSize, innerY, outlineSize, innerH);
    pop();
  }

  drawWoodPanel(x, y, w, h) {
    this._drawPixelWoodPanel(x, y, w, h);
  }

  // p5.Graphics variants of wood panels (used when drawing into offscreen buffers)
  _drawPixelWoodPanelPG(pg, x, y, w, h) {
    pg.push();
    pg.noStroke();
    const os = 2;
    pg.fill(0);
    pg.rect(x, y, w, h + 3);
    pg.fill(0xab, 0x6a, 0x38);
    pg.rect(x + os, y + os, w - os * 2, h - os * 2);
    const ix = x + os,
      iy = y + os,
      iw = w - os * 2,
      ih = h - os * 2;
    const ps = 24;
    for (let py = iy + ps; py < iy + ih - 4; py += ps) {
      pg.fill(0x7d, 0x47, 0x22);
      pg.rect(ix, py, iw, os);
      pg.fill(0xd4, 0x9a, 0x59);
      pg.rect(ix, py + os, iw, 1);
    }
    pg.fill(0xd4, 0x9a, 0x59);
    pg.rect(ix, iy, iw, os);
    pg.rect(ix, iy, os, ih);
    pg.fill(0x7d, 0x47, 0x22);
    pg.rect(ix, iy + ih - os, iw, os);
    pg.rect(ix + iw - os, iy, os, ih);
    pg.pop();
  }

  _drawPlainPixelWoodPanelPG(pg, x, y, w, h) {
    pg.push();
    pg.noStroke();
    const os = 4;
    pg.fill(0);
    pg.rect(x, y, w, h + 6);
    pg.fill(0xab, 0x6a, 0x38);
    pg.rect(x + os, y + os, w - os * 2, h - os * 2);
    const ix = x + os,
      iy = y + os,
      iw = w - os * 2,
      ih = h - os * 2;
    pg.fill(0xd4, 0x9a, 0x59);
    pg.rect(ix, iy, iw, os);
    pg.rect(ix, iy, os, ih);
    pg.fill(0x7d, 0x47, 0x22);
    pg.rect(ix, iy + ih - os, iw, os);
    pg.rect(ix + iw - os, iy, os, ih);
    pg.pop();
  }

  // ── Static font sizes ───────────────────────────────────────────────────
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

  // ── Hint text helper ────────────────────────────────────────────────────
  _drawHintText(prefix, btnText, suffix, cx, cy, outlineSize) {
    textAlign(LEFT, CENTER);
    const w1 = textWidth(prefix),
      w2 = textWidth(btnText),
      w3 = textWidth(suffix);
    const startX = cx - (w1 + w2 + w3) / 2;
    this.drawTextWithOutline(prefix, startX, cy, 255, 255, 255, outlineSize);
    this.drawTextWithOutline(
      btnText,
      startX + w1,
      cy,
      255,
      230,
      50,
      outlineSize,
    );
    this.drawTextWithOutline(
      suffix,
      startX + w1 + w2,
      cy,
      255,
      255,
      255,
      outlineSize,
    );
  }

  // ── World-space overlays (drawn in world coords) ────────────────────────

  drawAntidoteIndicator(player) {
    // Bobbing antidote icon above the player's head
    const bob = Math.sin(pauseClock.now() * 0.004) * 4;
    const iconY = player.y - player.size / 2 - 30 + bob;

    if (typeof spriteManager !== "undefined") {
      const sheet = spriteManager.get("antidote");
      if (sheet && sheet.img) {
        const dw = sheet.frameW * 0.6,
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
      } else {
        // Fallback circle
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
    }

    // Blinking "RETURN TO BASE" drawn in world-space directly below the player.
    // 600 ms on / 400 ms off — noticeable without being distracting.
    const blinkPeriod = 1000;
    const blinkOn = pauseClock.now() % blinkPeriod < 600;
    if (!blinkOn) return;

    const msg = "RETURN TO BASE";
    const ts = 14;
    const belowY = player.y + player.size / 2 + 26;

    push();
    textSize(ts);
    textAlign(CENTER, CENTER);

    // Drop-shadow / outline for readability over the grass
    fill(0, 0, 0, 200);
    for (let ox = -2; ox <= 2; ox++) {
      for (let oy = -2; oy <= 2; oy++) {
        if (ox === 0 && oy === 0) continue;
        text(msg, player.x + ox, belowY + oy);
      }
    }
    // Bright green main text
    fill(80, 235, 80);
    text(msg, player.x, belowY);
    pop();
  }

  drawMeleeSlash(player) {
    const elapsed = pauseClock.now() - this.gameState.meleeSlashStartTime;
    const alpha = 255 * (1 - elapsed / this.gameState.meleeSlashDuration);
    push();
    translate(player.x, player.y);
    rotate(this.gameState.meleeSlashAngle);
    const r = player.weapons.melee.range,
      s = -PI / 3,
      e = PI / 3;
    noFill();
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
    const w = player.weapons[player.currentWeapon];
    if (!w) return;
    const isSniper = w.name === "Sniper";
    const isShotgun = w.name === "Shotgun";
    const dx = vx - player.x,
      dy = vy - player.y;
    const dMouse = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    let aimX = vx,
      aimY = vy;
    if (!isSniper && dMouse > w.aimRange) {
      const r = w.aimRange / dMouse;
      aimX = player.x + dx * r;
      aimY = player.y + dy * r;
    }
    push();
    if (
      player.currentWeapon === "handgun" ||
      player.currentWeapon === "equipped"
    ) {
      if (isShotgun) {
        const spread = w.spreadAngle || 0.4;
        push();
        translate(player.x, player.y);
        rotate(angle);
        fill(255, 60, 60, 35);
        stroke(255, 60, 60, 140);
        strokeWeight(1.5);
        const cl = 180;
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
      const mr = player.weapons.melee.range,
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

  // ── Screen-space score popups ───────────────────────────────────────────

  drawScorePopupsScreenSpace(camX, camY) {
    const now = millis();
    const totalPaused = pauseClock.totalPausedMs();
    const coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;

    for (const p of this.gameState.scorePopups) {
      const pausedSinceSpawn = totalPaused - p.pausedMsAtSpawn;
      const elapsed = now - p.spawnTime - pausedSinceSpawn;
      const progress = elapsed / p.lifetime;
      const alpha = 255 * (1 - progress);
      if (alpha <= 0) continue;

      const sx = p.x - camX;
      const sy = p.y - camY - 40 * progress;
      fill(255, 255, 255, alpha);

      if (p.isCoin) {
        const iconSize = 16,
          label = "+" + p.value;
        textSize(18);
        textAlign(LEFT, CENTER);
        const tw = textWidth(label),
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
        this.drawTextWithOutline(
          label,
          startX + iconSize + 4,
          sy,
          255,
          255,
          255,
          1,
        );
      } else if (p.isExp) {
        textSize(16);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(
          "+" + p.value + " EXP",
          sx,
          sy,
          255,
          255,
          255,
          1,
        );
      } else if (p.isDamage) {
        textSize(16);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline("-" + p.value, sx, sy, 255, 255, 255, 1);
      } else if (p.isPlayerDamage) {
        textSize(20);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline("-" + p.value, sx, sy, 255, 255, 255, 2);
      } else if (p.isLevelUp) {
        textSize(28);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(p.value, sx, sy, 255, 255, 255, 3);
      } else {
        textSize(20);
        textAlign(CENTER, CENTER);
        this.drawTextWithOutline(p.value, sx, sy, 255, 255, 255, 2);
      }
    }
  }

  // ── Intermission ────────────────────────────────────────────────────────

  drawIntermissionCenter(roundNum, intermissionTimeLeft) {
    const now = pauseClock.now();
    const elapsed = now - this._interPhaseStart;

    if (this._interPhase === "cleared") {
      let alpha;
      if (elapsed < this._clearedFadeDur) {
        alpha = 255;
      } else {
        const fe = elapsed - this._clearedFadeDur;
        alpha = constrain(map(fe, 0, this._clearedFadeOut, 255, 0), 0, 255);
        if (fe >= this._clearedFadeOut) {
          this._interPhase = "countdown";
          this._interPhaseStart = now;
        }
      }
      this._drawClearedText(roundNum, alpha);
    } else if (this._interPhase === "countdown") {
      const sec = Math.ceil(intermissionTimeLeft / 1000);
      if (intermissionTimeLeft <= 0) {
        this._interPhase = "off";
        return true;
      }
      this._drawCountdownCenter(sec);
    }
    return false;
  }

  _drawClearedText(roundNum, alpha) {
    const displayText = "ROUND " + roundNum + " CLEARED!";
    textSize(86);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -5; ox <= 5; ox++)
      for (let oy = -5; oy <= 5; oy++)
        if (ox || oy) text(displayText, width / 2 + ox, height / 2 + oy);
    fill(100, 255, 120, alpha);
    text(displayText, width / 2, height / 2);
  }

  _drawCountdownCenter(sec) {
    textSize(160);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, 220);
    for (let ox = -6; ox <= 6; ox++)
      for (let oy = -6; oy <= 6; oy++)
        if (ox || oy) text(sec, width / 2 + ox, height / 2 - 50 + oy);
    const c =
      sec > 8
        ? color(100, 255, 120)
        : sec > 4
          ? color(255, 220, 60)
          : color(255, 80, 80);
    fill(c);
    text(sec, width / 2, height / 2 - 50);
    textSize(28);
    this._drawHintText(
      "PRESS ",
      "B",
      " TO OPEN SHOP",
      width / 2,
      height / 2 + 105,
      3,
    );
    this._drawHintText(
      "PRESS ",
      "ENTER",
      " TO START NOW",
      width / 2,
      height / 2 + 145,
      3,
    );
  }

  updateAndDrawRoundStart() {
    if (this._roundStartPhase === "off") return;
    const now = pauseClock.now();
    const elapsed = now - this._roundStartStart;
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

    textSize(86);
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

    const diffLabel = this._roundStartDiff.toUpperCase();
    const diffColor =
      this._roundStartDiff === "hell"
        ? color(255, 60, 60, alpha)
        : this._roundStartDiff === "hard"
          ? color(255, 180, 40, alpha)
          : color(100, 220, 100, alpha);
    textSize(36);
    textAlign(CENTER, CENTER);
    fill(0, 0, 0, alpha);
    for (let ox = -3; ox <= 3; ox++)
      for (let oy = -3; oy <= 3; oy++)
        if (ox || oy) text(diffLabel, width / 2 + ox, height / 2 + 45 + oy);
    fill(diffColor);
    text(diffLabel, width / 2, height / 2 + 45);
  }

  // ── Pause screen ─────────────────────────────────────────────────────────

  drawPauseScreen() {
    noStroke();
    fill(0, 0, 0, 190);
    rect(0, 0, width, height);
    if (this._pauseView === "volume") this._drawVolumeSettings();
    else this._drawPauseMain();
  }

  _drawPauseMain() {
    const cx = width / 2,
      btnW = 400,
      btnH = 86,
      btnX = cx - btnW / 2;
    const totalH = 3 * btnH + 2 * 20,
      startY = height / 2 - totalH / 2 + 30;

    textSize(96);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline("PAUSED", cx, startY - 100, 255, 255, 255, 6);

    const buttons = [
      { id: "resume", label: "RESUME" },
      { id: "volume", label: "VOLUME" },
      { id: "exit", label: "EXIT" },
    ];
    this._pauseBtnRects = {};

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      const btnY = startY + i * (btnH + 20);
      const isHovered =
        mouseX >= btnX &&
        mouseX <= btnX + btnW &&
        mouseY >= btnY &&
        mouseY <= btnY + btnH;
      this._pauseBtnRects[btn.id] = { x: btnX, y: btnY, w: btnW, h: btnH };
      this._drawPixelWoodPanel(btnX, btnY, btnW, btnH);
      if (isHovered) {
        noStroke();
        fill(255, 255, 255, 50);
        rect(btnX + 4, btnY + 4, btnW - 8, btnH - 8);
      }
      textSize(48);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        btn.label.toUpperCase(),
        cx,
        btnY + btnH / 2,
        255,
        255,
        255,
        4,
      );
    }
  }

  _drawVolumeSettings() {
    const cx = width / 2,
      panelW = 640,
      panelH = 500;
    const panelX = cx - panelW / 2,
      panelY = height / 2 - panelH / 2;
    this._drawPlainPixelWoodPanel(panelX, panelY, panelW, panelH);
    textSize(46);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "VOLUME SETTINGS",
      cx,
      panelY + 45,
      255,
      255,
      255,
      4,
    );

    const volData = [
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

    const labelW = 140,
      trackW = 280,
      valW = 90,
      gap = 25;
    const totalRowW = labelW + gap + trackW + gap + valW;
    const startX = panelX + (panelW - totalRowW) / 2;
    const trackX = startX + labelW + gap;
    const trackH = 24,
      rowGap = 80,
      firstY = panelY + 145;
    this._sliderRects = {};

    for (let i = 0; i < volData.length; i++) {
      const s = volData[i];
      const rowCY = firstY + i * rowGap;
      const trackY = rowCY - Math.floor(trackH / 2);
      const fillW = trackW * s.value;
      const isDrag = this._volumeDragging === s.id;

      textSize(36);
      textAlign(RIGHT, CENTER);
      this.drawTextWithOutline(
        s.label.toUpperCase(),
        startX + labelW,
        rowCY,
        255,
        255,
        255,
        3,
      );

      noFill();
      stroke(62, 39, 35);
      strokeWeight(3);
      rect(trackX, trackY, trackW, trackH, 4);
      noStroke();
      fill(20, 12, 4);
      rect(trackX + 2, trackY + 2, trackW - 4, trackH - 4, 2);
      if (fillW > 4) {
        fill(isDrag ? color(255, 200, 80) : color(200, 150, 60));
        rect(trackX + 2, trackY + 2, fillW - 4, trackH - 4, 2);
        fill(255, 220, 130, 120);
        rect(
          trackX + 2,
          trackY + 2,
          fillW - 4,
          Math.floor((trackH - 4) * 0.45),
          2,
        );
      }
      const thumbW = 18,
        thumbX = constrain(
          trackX + fillW - thumbW / 2,
          trackX,
          trackX + trackW - thumbW,
        );
      fill(isDrag ? color(255, 240, 180) : color(255, 210, 100));
      rect(thumbX, trackY - 6, thumbW, trackH + 12, 4);

      textSize(32);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        Math.floor(s.value * 100) + "%",
        trackX + trackW + gap,
        rowCY,
        255,
        255,
        255,
        3,
      );
      this._sliderRects[s.id] = {
        x: trackX,
        y: trackY - 12,
        w: trackW,
        h: trackH + 24,
        trackX,
        trackW,
      };
    }

    const backW = 320,
      backH = 80,
      backX = cx - backW / 2,
      backY = panelY + panelH - backH - 25;
    const backHovered =
      mouseX >= backX &&
      mouseX <= backX + backW &&
      mouseY >= backY &&
      mouseY <= backY + backH;
    this._pauseVolRects = { back: { x: backX, y: backY, w: backW, h: backH } };
    this._drawPixelWoodPanel(backX, backY, backW, backH);
    if (backHovered) {
      noStroke();
      fill(255, 255, 255, 50);
      rect(backX + 4, backY + 4, backW - 8, backH - 8);
    }
    textSize(42);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline("< BACK", cx, backY + backH / 2, 255, 255, 255, 4);
  }

  // ── Shop render ─────────────────────────────────────────────────────────

  drawShop(roundManager, shopManager, player) {
    if (!this._shopOpen) return;
    const layout = this._getShopLayout();
    const { panelX, panelY, panelW, panelH, headerH, btnRects } = layout;
    const mx = mouseX,
      my = mouseY;

    noStroke();
    fill(0, 0, 0, 180);
    rect(0, 0, width, height);
    this._drawPlainPixelWoodPanel(panelX, panelY, panelW, panelH);

    textSize(46);
    textAlign(LEFT, CENTER);
    this.drawTextWithOutline(
      "SHOP",
      panelX + 30,
      panelY + headerH / 2,
      255,
      255,
      255,
      3,
    );

    const sec = roundManager
      ? Math.ceil(roundManager.intermissionTimeLeft / 1000)
      : 0;
    textSize(24);
    textAlign(CENTER, CENTER);
    this.drawTextWithOutline(
      "NEXT ROUND IN " + sec + "S",
      panelX + panelW / 2 - 20,
      panelY + headerH / 2,
      255,
      255,
      255,
      2,
    );

    const coinSheet =
      typeof spriteManager !== "undefined"
        ? spriteManager.get("icon_coin")
        : null;
    const coinX = panelX + panelW - 170,
      headerCoinSize = 32;
    if (coinSheet && coinSheet.img) {
      push();
      imageMode(CORNER);
      image(
        coinSheet.img,
        coinX,
        panelY + headerH / 2 - headerCoinSize / 2,
        headerCoinSize,
        headerCoinSize,
        0,
        0,
        coinSheet.frameW,
        coinSheet.frameH,
      );
      pop();
      textSize(32);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        this.gameState.coins,
        coinX + headerCoinSize + 12,
        panelY + headerH / 2,
        255,
        255,
        255,
        3,
      );
    }

    const cb = layout.closeBtn;
    const cbHover =
      mx >= cb.x && mx <= cb.x + cb.w && my >= cb.y && my <= cb.y + cb.h;
    this._drawPixelWoodPanel(cb.x, cb.y, cb.w, cb.h);
    if (cbHover) {
      fill(255, 255, 255, 50);
      rect(cb.x + 2, cb.y + 2, cb.w - 4, cb.h - 4);
    }
    textSize(26);
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

    const keys = Object.keys(shopManager.statShop);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i],
        stat = shopManager.statShop[key];
      const cost = shopManager.getStatCurrentCost(key);
      const canAfford = this.gameState.coins >= cost;
      const btn = btnRects[i];

      fill(0, 0, 0, 40);
      rect(btn.cardX, btn.cardY, btn.cardW, btn.cardH, 6);
      textSize(28);
      textAlign(LEFT, TOP);
      this.drawTextWithOutline(
        stat.label.toUpperCase(),
        btn.cardX + 18,
        btn.cardY + 14,
        255,
        255,
        255,
        2,
      );
      textSize(18);
      textAlign(LEFT, BOTTOM);
      this.drawTextWithOutline(
        "LV. " +
          stat.purchased +
          (shopManager.isMaxLevel(keys[i]) ? " (MAX)" : ""),
        btn.cardX + 18,
        btn.cardY + btn.cardH - 12,
        255,
        255,
        255,
        2,
      );

      // Description text
      textSize(18);
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        stat.description,
        btn.cardX + 18,
        btn.cardY + 46,
        220,
        200,
        160,
        1,
      );

      const hover =
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

      textSize(18);
      textAlign(CENTER, CENTER);
      this.drawTextWithOutline(
        "UPGRADE",
        btn.x + btn.w / 2,
        btn.y + btn.h / 2 - 10,
        255,
        255,
        255,
        2,
      );

      const costText = "" + cost;
      textSize(18);
      const tw = textWidth(costText);
      const btnCoinSize = 18,
        g = 6;
      const totalW = btnCoinSize + g + tw;
      const sX = btn.x + btn.w / 2 - totalW / 2;
      const bRowY = btn.y + btn.h / 2 + 10;
      if (coinSheet && coinSheet.img) {
        push();
        imageMode(CORNER);
        image(
          coinSheet.img,
          sX,
          bRowY - btnCoinSize / 2,
          btnCoinSize,
          btnCoinSize,
          0,
          0,
          coinSheet.frameW,
          coinSheet.frameH,
        );
        pop();
      }
      textAlign(LEFT, CENTER);
      this.drawTextWithOutline(
        costText,
        sX + btnCoinSize + g,
        bRowY,
        255,
        255,
        255,
        2,
      );

      if (i < keys.length - 1) {
        fill(62, 39, 35, 180);
        rect(btn.cardX, btn.cardY + btn.cardH + 6, btn.cardW, 2);
      }
    }
  }

  // ── Weapon sprite key helper ─────────────────────────────────────────────
  _weaponSpriteKey(name) {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n === "knife") return "gun_knife";
    if (n.includes("handgun") || n.includes("pistol")) return "gun_handgun";
    if (n.includes("shotgun")) return "gun_shotgun";
    if (n.includes("sniper")) return "gun_sniper";
    if (n.includes("rifle") || n.includes("auto")) return "gun_rifle";
    return null;
  }

  // ── Unused stubs kept for API compatibility ──────────────────────────────
  drawHealthBar(player) {}
  drawStaminaBar(player) {}
  _drawWoodPanelLarge(x, y, w, h) {
    this._drawPlainPixelWoodPanel(x, y, w, h);
  }
  _drawWoodPanelMed(x, y, w, h) {
    this._drawPixelWoodPanel(x, y, w, h);
  }
  _drawBolts(x, y, w, h) {}

  // ── Main render entry ───────────────────────────────────────────────────
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
