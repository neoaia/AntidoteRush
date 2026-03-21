class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;
    this._mapDecorations = null;
    this._mapTiles = null;
  }

  _initMap() {
    if (this._mapTiles && this._mapDecorations) return;

    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 3200;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 3200;

    let seed = 42317;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    // ── LAYER 1: Land tiles ───────────────────────────────────────────────
    const TILE = 128;
    const landKeys = ["land01", "land02", "land03"];
    this._mapTiles = [];

    let cols = Math.ceil(W / TILE) + 1;
    let rows = Math.ceil(H / TILE) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this._mapTiles.push({
          key: landKeys[Math.floor(rand() * landKeys.length)],
          x: col * TILE,
          y: row * TILE,
        });
      }
    }

    // ── LAYER 2: Decorations ──────────────────────────────────────────────
    // grass_1-4 = light/thin tufts (majority)
    const grassLight = ["grass_1", "grass_2", "grass_3", "grass_4"];
    // grass_5-7 = thick/heavy (sparse)
    const grassHeavy = ["grass_5", "grass_6", "grass_7"];
    const bushKeys = ["bush_1", "bush_2"];

    this._mapDecorations = [];

    // Clusters — mostly grass_1-4, bihira lang mag-appear ang 5-7
    for (let c = 0; c < 250; c++) {
      let cx = rand() * W;
      let cy = rand() * H;
      let count = 4 + Math.floor(rand() * 5);
      let spread = 40 + rand() * 60;
      for (let i = 0; i < count; i++) {
        let angle = rand() * Math.PI * 2;
        let dist = rand() * spread;
        // 85% chance light grass, 15% heavy
        let key =
          rand() < 0.85
            ? grassLight[Math.floor(rand() * grassLight.length)]
            : grassHeavy[Math.floor(rand() * grassHeavy.length)];
        this._mapDecorations.push({
          key,
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          size: 40,
          layer: 0,
        });
      }
    }

    // Solo scattered — 400 light, 60 heavy
    for (let i = 0; i < 400; i++) {
      this._mapDecorations.push({
        key: grassLight[Math.floor(rand() * grassLight.length)],
        x: rand() * W,
        y: rand() * H,
        size: 40,
        layer: 0,
      });
    }
    for (let i = 0; i < 60; i++) {
      this._mapDecorations.push({
        key: grassHeavy[Math.floor(rand() * grassHeavy.length)],
        x: rand() * W,
        y: rand() * H,
        size: 40,
        layer: 0,
      });
    }

    // Bushes — sparse, scattered
    for (let i = 0; i < 35; i++) {
      this._mapDecorations.push({
        key: bushKeys[Math.floor(rand() * bushKeys.length)],
        x: rand() * W,
        y: rand() * H,
        size: 80,
        layer: 1,
      });
    }

    this._mapDecorations.sort((a, b) => a.layer - b.layer);
  }

  drawBackground() {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;

    if (typeof spriteManager === "undefined") {
      noStroke();
      fill(72, 130, 60);
      rect(0, 0, W, H);
      return;
    }

    this._initMap();

    let cx = typeof camX !== "undefined" ? camX : 0;
    let cy = typeof camY !== "undefined" ? camY : 0;
    let vw = width;
    let vh = height;

    push();
    imageMode(CORNER);

    const TILE = 128;
    for (let d of this._mapTiles) {
      if (d.x + TILE < cx || d.x > cx + vw) continue;
      if (d.y + TILE < cy || d.y > cy + vh) continue;
      let sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;
      image(sheet.img, d.x, d.y, TILE, TILE);
    }

    for (let d of this._mapDecorations) {
      if (d.x + d.size < cx || d.x > cx + vw) continue;
      if (d.y + d.size < cy || d.y > cy + vh) continue;
      let sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;
      image(sheet.img, d.x, d.y, d.size, d.size);
    }

    pop();
  }

  renderGame(player, base, vx, vy) {
    this.drawBackground();
    base.display();

    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.display();
    }

    for (let z of this.gameState.zombies) z.display();
    for (let b of this.gameState.bullets) b.display();

    player.display();

    if (this.gameState.playerHasAntidote) {
      this.uiRenderer.drawAntidoteIndicator(player);
    }
    if (this.gameState.meleeSlashActive) {
      this.uiRenderer.drawMeleeSlash(player);
    }

    this.uiRenderer.drawAimIndicator(player, vx, vy);
  }
}
