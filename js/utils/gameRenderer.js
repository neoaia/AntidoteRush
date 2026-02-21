class GameRenderer {
  constructor(gameState, uiRenderer) {
    this.gameState = gameState;
    this.uiRenderer = uiRenderer;
  }

  renderGame(player, base, vx, vy) {
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
