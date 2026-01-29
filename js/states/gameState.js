class GameState {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  enter() {}

  update() {}

  display() {
    background(30);

    fill(255);
    textAlign(CENTER, CENTER);
    textSize(48);

    let mainTextX = width / 2;
    let mainTextY = height / 2;
    text("THIS IS THE GAME", mainTextX, mainTextY);

    textSize(20);

    let playerName = this.stateManager.getPlayerData("name");
    let nameText = "Player: " + playerName;
    let nameX = width / 2;
    let nameY = height / 2 + 60;
    text(nameText, nameX, nameY);

    let inputMethod = this.stateManager.getPlayerData("inputMethod");
    let inputText = "Input: " + inputMethod;
    let inputX = width / 2;
    let inputY = height / 2 + 90;
    text(inputText, inputX, inputY);

    let gameMode = this.stateManager.getPlayerData("gameMode");
    let modeText = "Mode: " + gameMode;
    let modeX = width / 2;
    let modeY = height / 2 + 120;
    text(modeText, modeX, modeY);

    let difficulty = this.stateManager.getPlayerData("difficulty");
    let hasDifficulty = difficulty !== null;

    if (hasDifficulty) {
      let difficultyText = "Difficulty: " + difficulty;
      let difficultyX = width / 2;
      let difficultyY = height / 2 + 150;
      text(difficultyText, difficultyX, difficultyY);
    }
  }

  handleKeyPressed(key, keyCode) {}

  handleMousePressed() {}

  exit() {}
}
