class InputHandler {
  constructor(gameState, combatManager) {
    this.gameState = gameState;
    this.combatManager = combatManager;
  }

  getAimTarget(player) {
    let w = player.weapons[player.currentWeapon];
    if (!w) return { x: mouseX, y: mouseY };

    let aimRange = w.aimRange;
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > aimRange) {
      let ratio = aimRange / distance;
      return {
        x: player.x + dx * ratio,
        y: player.y + dy * ratio,
      };
    }

    return { x: mouseX, y: mouseY };
  }

  handleMousePressed(player) {
    let aim = this.getAimTarget(player);
    this.combatManager.shoot(player, aim.x, aim.y);
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
