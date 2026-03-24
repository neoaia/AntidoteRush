class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;

    // Map decoration data (built once in _initMap)
    this._mapReady = false;
    this._mapTiles = null;
    this._mapDecorations = null;

    // Spatial grids for O(1) visible-tile lookup
    this._tileGrid = null;
    this._decoGrid = null;
  }

  // ── Spatial grid helpers ────────────────────────────────────────────────

  /**
   * Build a Map<"cx,cy", item[]> from a flat array of { x, y, ... } objects.
   * @param {Array}  items
   * @param {number} cellSize - grid cell size in world pixels
   */
  _buildSpatialGrid(items, cellSize) {
    const grid = new Map();
    for (const item of items) {
      const cx = Math.floor(item.x / cellSize);
      const cy = Math.floor(item.y / cellSize);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key).push(item);
    }
    return grid;
  }

  /**
   * Return all items whose cell overlaps the AABB [x1,y1]→[x2,y2].
   * Much faster than iterating every item when the visible set is small.
   */
  _queryGrid(grid, cellSize, x1, y1, x2, y2) {
    const results = [];
    const cxMin = Math.floor(x1 / cellSize) - 1;
    const cyMin = Math.floor(y1 / cellSize) - 1;
    const cxMax = Math.floor(x2 / cellSize) + 1;
    const cyMax = Math.floor(y2 / cellSize) + 1;

    for (let cx = cxMin; cx <= cxMax; cx++) {
      for (let cy = cyMin; cy <= cyMax; cy++) {
        const bucket = grid.get(`${cx},${cy}`);
        if (bucket) for (const item of bucket) results.push(item);
      }
    }
    return results;
  }

  // ── Map initialisation (runs once) ─────────────────────────────────────

  _initMap() {
    if (this._mapReady) return;

    const W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : 3200;
    const H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : 3200;

    let seed = 42317;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };

    // ── LAYER 1: Land tiles ─────────────────────────────────────────────
    const TILE = 128;
    const landKeys = ["land01", "land02", "land03"];
    this._mapTiles = [];

    const cols = Math.ceil(W / TILE) + 1;
    const rows = Math.ceil(H / TILE) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this._mapTiles.push({
          key: landKeys[Math.floor(rand() * landKeys.length)],
          x: col * TILE,
          y: row * TILE,
        });
      }
    }

    // ── LAYER 2: Decorations ────────────────────────────────────────────
    const grassLight = ["grass_1", "grass_2", "grass_3", "grass_4"];
    const grassHeavy = ["grass_5", "grass_6", "grass_7"];
    const bushKeys = ["bush_1", "bush_2"];

    this._mapDecorations = [];

    // Clusters
    for (let c = 0; c < 250; c++) {
      const cx = rand() * W;
      const cy = rand() * H;
      const count = 4 + Math.floor(rand() * 5);
      const spread = 40 + rand() * 60;
      for (let i = 0; i < count; i++) {
        const angle = rand() * Math.PI * 2;
        const dist = rand() * spread;
        const key =
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

    // Solo scattered — light
    for (let i = 0; i < 400; i++) {
      this._mapDecorations.push({
        key: grassLight[Math.floor(rand() * grassLight.length)],
        x: rand() * W,
        y: rand() * H,
        size: 40,
        layer: 0,
      });
    }
    // Solo scattered — heavy
    for (let i = 0; i < 60; i++) {
      this._mapDecorations.push({
        key: grassHeavy[Math.floor(rand() * grassHeavy.length)],
        x: rand() * W,
        y: rand() * H,
        size: 40,
        layer: 0,
      });
    }
    // Bushes
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

    // ── Build spatial grids ─────────────────────────────────────────────
    // Cell size 256 = 2×tile size; each grid query returns ~20-60 items
    // instead of iterating all 1500+ decorations.
    this._tileGrid = this._buildSpatialGrid(this._mapTiles, 256);
    this._decoGrid = this._buildSpatialGrid(this._mapDecorations, 256);

    this._mapReady = true;
  }

  // ── Background draw (spatial-culled) ───────────────────────────────────

  drawBackground() {
    this._initMap();

    if (typeof spriteManager === "undefined") {
      const W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : width;
      const H = typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : height;
      noStroke();
      fill(72, 130, 60);
      rect(0, 0, W, H);
      return;
    }

    const cx = typeof camX !== "undefined" ? camX : 0;
    const cy = typeof camY !== "undefined" ? camY : 0;
    const vw = width;
    const vh = height;
    const margin = 128; // one extra tile of bleed so edges never pop in

    push();
    imageMode(CORNER);

    // Only fetch tiles that are actually on screen — typically ~30 vs 400+
    const visibleTiles = this._queryGrid(
      this._tileGrid,
      256,
      cx - margin,
      cy - margin,
      cx + vw + margin,
      cy + vh + margin,
    );
    for (const d of visibleTiles) {
      const sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;
      image(sheet.img, d.x, d.y, 128, 128);
    }

    // Decorations — typically ~50 vs 1500+
    const visibleDecos = this._queryGrid(
      this._decoGrid,
      256,
      cx - margin,
      cy - margin,
      cx + vw + margin,
      cy + vh + margin,
    );
    for (const d of visibleDecos) {
      const sheet = spriteManager.get(d.key);
      if (!sheet || !sheet.img) continue;
      image(sheet.img, d.x, d.y, d.size, d.size);
    }

    pop();
  }

  // ── Main render call ───────────────────────────────────────────────────

  renderGame(player, base, vx, vy, zombieManager) {
    this.drawBackground();
    base.display();

    if (this.gameState.currentAntidote !== null)
      this.gameState.currentAntidote.display();

    zombieManager.display();

    for (const b of this.gameState.bullets) b.display();

    player.display();

    if (this.gameState.playerHasAntidote)
      this.uiRenderer.drawAntidoteIndicator(player);

    if (this.gameState.meleeSlashActive) this.uiRenderer.drawMeleeSlash(player);

    this.uiRenderer.drawAimIndicator(player, vx, vy);
  }
}
