class InputHandler {
  constructor(gameState, combatManager) {
    this.gameState = gameState;
    this.combatManager = combatManager;
  }

  handleMousePressed(player) {
    let angleToMouse = atan2(mouseY - player.y, mouseX - player.x);
    let currentWeapon = player.weapons[player.currentWeapon];
    let aimRange = currentWeapon.aimRange;
    let targetX = player.x + cos(angleToMouse) * aimRange;
    let targetY = player.y + sin(angleToMouse) * aimRange;

    this.combatManager.shoot(player, targetX, targetY);
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
