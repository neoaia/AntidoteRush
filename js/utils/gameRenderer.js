class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;
    this._mapDecorations = null;
  }

  _initMap() {
    if (this._mapDecorations) return;
    this._mapDecorations = [];

    let seed = 99371;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

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
        x: rand(),
        y: rand(),
        scale: 1.4 + rand() * 0.6,
        layer: 0,
      });
    }
    // Upper-middle big patches
    for (let i = 0; i < 8; i++) {
      this._mapDecorations.push({
        key: bigKeys[Math.floor(rand() * bigKeys.length)],
        x: 0.3 + rand() * 0.4,
        y: rand() * 0.32,
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
        x: 0.25 + rand() * 0.5,
        y: rand() * 0.38,
        scale: 0.9 + rand() * 0.4,
        layer: 1,
      });
    }

    // ── Layer 2: grass tufts — slightly reduced ───────────────────────────
    for (let i = 0; i < 35; i++) {
      this._mapDecorations.push({
        key: grassKeys[Math.floor(rand() * grassKeys.length)],
        x: rand(),
        y: rand(),
        scale: 0.55 + rand() * 0.35,
        layer: 2,
      });
    }
    // Upper-middle grass
    for (let i = 0; i < 10; i++) {
      this._mapDecorations.push({
        key: grassKeys[Math.floor(rand() * grassKeys.length)],
        x: 0.2 + rand() * 0.6,
        y: rand() * 0.42,
        scale: 0.55 + rand() * 0.3,
        layer: 2,
      });
    }

    // ── Layer 3: patch CLUSTERS — tight kumpol style ──────────────────────
    // General map clusters
    let clusterCenters = 20;
    for (let c = 0; c < clusterCenters; c++) {
      let cx = rand(),
        cy = rand();
      let clusterSize = 4 + Math.floor(rand() * 5); // 4-8 patches per cluster
      let spread = 0.03 + rand() * 0.04;
      cluster(cx, cy, spread, clusterSize, patchKeys, 0.5, 0.85, 3);
    }
    // Upper-middle clusters
    for (let c = 0; c < 8; c++) {
      let cx = 0.22 + rand() * 0.56;
      let cy = rand() * 0.4;
      let clusterSize = 4 + Math.floor(rand() * 4);
      let spread = 0.03 + rand() * 0.035;
      cluster(cx, cy, spread, clusterSize, patchKeys, 0.5, 0.8, 3);
    }

    // Sort by layer
    this._mapDecorations.sort((a, b) => a.layer - b.layer);
  }

  drawBackground() {
    noStroke();
    fill(72, 130, 60);
    rect(0, 0, width, height);

    if (typeof spriteManager === "undefined") return;
    this._initMap();

    for (let d of this._mapDecorations) {
      let sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;

      let dw = sheet.frameW * d.scale;
      let dh = sheet.frameH * d.scale;
      let dx = d.x * width - dw / 2;
      let dy = d.y * height - dh / 2;

      if (dx + dw < 0 || dx > width || dy + dh < 0 || dy > height) continue;

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
