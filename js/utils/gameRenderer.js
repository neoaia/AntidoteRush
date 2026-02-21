class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;
  }

  renderGame(player, base) {
    base.display();

    if (this.gameState.currentAntidote !== null) {
      this.gameState.currentAntidote.display();
    }

    for (let i = 0; i < this.gameState.zombies.length; i++) {
      this.gameState.zombies[i].display();
    }

    for (let i = 0; i < this.gameState.bullets.length; i++) {
      this.gameState.bullets[i].display();
    }

    player.display();

    if (this.gameState.playerHasAntidote) {
      this.uiRenderer.drawAntidoteIndicator(player);
    }

    if (this.gameState.meleeSlashActive) {
      this.uiRenderer.drawMeleeSlash(player);
    }

    this.uiRenderer.drawAimIndicator(player);
  }
}
