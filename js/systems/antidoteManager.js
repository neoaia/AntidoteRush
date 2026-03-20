class AntidoteManager {
  constructor(gameState, canvasWidth, canvasHeight) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // UI safe zones — don't spawn under HUD
    // Top-left: health/stamina panel (~340x110)
    // Top-center: round info (~200x80)
    // Bottom-right: weapon slots (~380x120)
    this.unsafeZones = [
      { x: 0, y: 0, w: 340, h: 110 }, // top-left HUD
      { x: canvasWidth / 2 - 100, y: 0, w: 200, h: 100 }, // top-center round info
      { x: canvasWidth - 380, y: canvasHeight - 130, w: 380, h: 130 }, // bottom-right weapon slots
    ];
  }

  isInUnsafeZone(x, y) {
    for (let z of this.unsafeZones) {
      if (x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return true;
    }
    return false;
  }

  scheduleNext() {
    let minWait = 3000;
    let maxWait = 10000;
    this.gameState.nextAntidoteSpawnTime =
      millis() + Math.random() * (maxWait - minWait) + minWait;
    this.gameState.antidoteCanSpawn = true;
  }

  spawn(base) {
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : this.canvasWidth;
    let H =
      typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : this.canvasHeight;
    let player = this.gameState.player;

    // Spawn within camera view vicinity of player (200-450px away)
    let spawnRadius = 400;
    let minDist = 150;
    let x, y;
    let valid = false;
    let attempts = 0;

    while (!valid && attempts < 40) {
      let angle = Math.random() * Math.PI * 2;
      let dist = minDist + Math.random() * (spawnRadius - minDist);
      x = player.x + Math.cos(angle) * dist;
      y = player.y + Math.sin(angle) * dist;

      // Clamp to world bounds
      x = Math.max(50, Math.min(W - 50, x));
      y = Math.max(50, Math.min(H - 50, y));

      // Not too close to base
      let dbx = x - (base.x + base.width / 2);
      let dby = y - (base.y + base.height / 2);
      if (Math.sqrt(dbx * dbx + dby * dby) > 100) valid = true;
      attempts++;
    }

    this.gameState.currentAntidote = new Antidote(x, y);
  }

  update(player, base) {
    // Check if player is inside base (for stamina regen boost)
    player.isInBase = base.checkPlayerInside(player);

    // Spawn check
    if (
      this.gameState.currentAntidote === null &&
      this.gameState.antidoteCanSpawn
    ) {
      if (millis() >= this.gameState.nextAntidoteSpawnTime) {
        this.spawn(base, player);
        this.gameState.antidoteCanSpawn = false;
      }
    }

    // Update existing antidote
    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.update();

      if (!this.gameState.currentAntidote.active) {
        this.gameState.currentAntidote = null;
        this.scheduleNext();
      } else if (
        !this.gameState.playerHasAntidote &&
        this.gameState.currentAntidote.checkPlayerPickup(player)
      ) {
        this.gameState.playerHasAntidote = true;
        this.gameState.currentAntidote = null;
      }
    }

    // Delivery to base
    if (this.gameState.playerHasAntidote && base.checkPlayerInside(player)) {
      let points = 30;
      this.gameState.increaseScore(points);
      // Popup above the base center
      this.gameState.spawnScorePopup(base.x + base.width / 2, base.y, points);

      player.health = Math.min(player.maxHealth, player.health + 20);
      this.gameState.playerHasAntidote = false;
      this.scheduleNext();
    }
  }

  display() {
    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.display();
    }
  }
}
