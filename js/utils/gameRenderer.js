class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;
    this._mapDecorations = null;
  }

  _initMap() {
    if (this._mapDecorations) return;
    this._mapDecorations = [];

    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 3200;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 3200;

    let seed = 99371;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    // randW/randH return world coords directly
    const randW = () => rand() * W;
    const randH = () => rand() * H;

    const cluster = (
      cx,
      cy,
      spread,
      count,
      keys,
      scaleMin,
      scaleMax,
      layer,
    ) => {
      for (let i = 0; i < count; i++) {
        let angle = rand() * Math.PI * 2;
        let dist = rand() * spread;
        this._mapDecorations.push({
          key: keys[Math.floor(rand() * keys.length)],
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          scale: scaleMin + rand() * (scaleMax - scaleMin),
          layer,
        });
      }
    };

    const bigKeys = ["big01", "big02"];
    const darkKeys = ["dark01", "dark02"];
    const grassKeys = ["grass01", "grass02", "grass03", "grass04", "grass05"];
    const patchKeys = ["patch01", "patch02", "patch03", "patch04", "patch05"];

    // ── Layer 0: big dark patches ─────────────────────────────────────────
    for (let i = 0; i < 22; i++) {
      this._mapDecorations.push({
        key: bigKeys[Math.floor(rand() * bigKeys.length)],
        x: randW(),
        y: randH(),
        scale: 1.4 + rand() * 0.6,
        layer: 0,
      });
    }
    // Upper-middle big patches
    for (let i = 0; i < 8; i++) {
      this._mapDecorations.push({
        key: bigKeys[Math.floor(rand() * bigKeys.length)],
        x: W * (0.3 + rand() * 0.4),
        y: H * (rand() * 0.32),
        scale: 1.5 + rand() * 0.5,
        layer: 0,
      });
    }

    // ── Layer 1: dark grass — slightly reduced ────────────────────────────
    for (let i = 0; i < 22; i++) {
      this._mapDecorations.push({
        key: darkKeys[Math.floor(rand() * darkKeys.length)],
        x: rand(),
        y: rand(),
        scale: 0.9 + rand() * 0.5,
        layer: 1,
      });
    }
    // Upper-middle dark grass
    for (let i = 0; i < 6; i++) {
      this._mapDecorations.push({
        key: darkKeys[Math.floor(rand() * darkKeys.length)],
        x: W * (0.25 + rand() * 0.5),
        y: H * (rand() * 0.38),
        scale: 0.9 + rand() * 0.4,
        layer: 1,
      });
    }

    // ── Layer 2: grass tufts — slightly reduced ───────────────────────────
    for (let i = 0; i < 35; i++) {
      this._mapDecorations.push({
        key: grassKeys[Math.floor(rand() * grassKeys.length)],
        x: randW(),
        y: randH(),
        scale: 0.55 + rand() * 0.35,
        layer: 2,
      });
    }
    // Upper-middle grass
    for (let i = 0; i < 10; i++) {
      this._mapDecorations.push({
        key: grassKeys[Math.floor(rand() * grassKeys.length)],
        x: W * (0.2 + rand() * 0.6),
        y: H * (rand() * 0.42),
        scale: 0.55 + rand() * 0.3,
        layer: 2,
      });
    }

    // ── Layer 3: patch CLUSTERS — tight kumpol style ──────────────────────
    // General map clusters
    let clusterCenters = 70;
    for (let c = 0; c < clusterCenters; c++) {
      let cx = randW(),
        cy = randH();
      let clusterSize = 4 + Math.floor(rand() * 5);
      let spread = W * (0.02 + rand() * 0.025);
      cluster(cx, cy, spread, clusterSize, patchKeys, 0.35, 0.6, 3);
    }
    // Upper-middle clusters
    for (let c = 0; c < 20; c++) {
      let cx = W * (0.22 + rand() * 0.56);
      let cy = H * (rand() * 0.4);
      let clusterSize = 4 + Math.floor(rand() * 4);
      let spread = W * (0.02 + rand() * 0.02);
      cluster(cx, cy, spread, clusterSize, patchKeys, 0.35, 0.58, 3);
    }

    // Sort by layer
    this._mapDecorations.sort((a, b) => a.layer - b.layer);
  }

  drawBackground() {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
    let H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;

    noStroke();
    fill(72, 130, 60);
    rect(0, 0, W, H);

    if (typeof spriteManager === "undefined") return;
    this._initMap();

    for (let d of this._mapDecorations) {
      let sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;

      let dw = sheet.frameW * d.scale;
      let dh = sheet.frameH * d.scale;
      // d.x/d.y are already in world coords (set during _initMap)
      let dx = d.x - dw / 2;
      let dy = d.y - dh / 2;

      push();
      imageMode(CORNER);
      image(sheet.img, dx, dy, dw, dh, 0, 0, sheet.frameW, sheet.frameH);
      pop();
    }
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
