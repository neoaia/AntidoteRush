class InputHandler {
  constructor(gameState, combatManager) {
    this.gameState = gameState;
    this.combatManager = combatManager;
  }

  // vx/vy = virtual cursor position (passed from game.js)
  getAimTarget(player, vx, vy) {
    let w = player.weapons[player.currentWeapon];
    if (!w) return { x: vx, y: vy };

    let aimRange = w.aimRange;
    let dx = vx - player.x;
    let dy = vy - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Virtual cursor is already radius-clamped in game.js,
    // but sniper has 9999 range so just return as-is
    if (distance > aimRange) {
      let ratio = aimRange / distance;
      return { x: player.x + dx * ratio, y: player.y + dy * ratio };
    }
    return { x: vx, y: vy };
  }

  handleKeyPressed(player, key) {
    if (this.gameState.gameOver && key === " ") {
      window.location.href = "title.html";
      return;
    }
    if (key === "1" || key === "2" || key === "3") {
      player.switchWeapon(key);
    }
  }
}
