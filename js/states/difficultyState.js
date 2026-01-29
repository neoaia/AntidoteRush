class DifficultyState {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.buttons = [];

    let easyButton = {
      label: "EASY",
      difficulty: DIFFICULTIES.EASY,
      y: 0,
      color: "#00ff00",
    };
    this.buttons.push(easyButton);

    let mediumButton = {
      label: "MEDIUM",
      difficulty: DIFFICULTIES.MEDIUM,
      y: 0,
      color: "#ffff00",
    };
    this.buttons.push(mediumButton);

    let hardButton = {
      label: "HARD",
      difficulty: DIFFICULTIES.HARD,
      y: 0,
      color: "#ff0000",
    };
    this.buttons.push(hardButton);

    this.buttonWidth = 200;
    this.buttonHeight = 60;
  }

  enter() {
    this.buttons[0].y = height / 2 - 80;
    this.buttons[1].y = height / 2;
    this.buttons[2].y = height / 2 + 80;
  }

  update() {}

  display() {
    background(COLORS.BACKGROUND);

    fill(COLORS.PRIMARY);
    textAlign(CENTER, CENTER);
    textSize(36);

    let titleX = width / 2;
    let titleY = height / 2 - 160;
    text("SELECT DIFFICULTY", titleX, titleY);

    let numberOfButtons = this.buttons.length;

    for (let i = 0; i < numberOfButtons; i = i + 1) {
      let currentButton = this.buttons[i];
      this.drawButton(currentButton);
    }
  }

  drawButton(button) {
    let buttonX = width / 2 - this.buttonWidth / 2;
    let buttonY = button.y;

    let mouseIsOverButton = checkIfMouseIsOverButton(
      buttonX,
      buttonY,
      this.buttonWidth,
      this.buttonHeight,
    );

    if (mouseIsOverButton) {
      fill(COLORS.ACCENT);
    } else {
      fill(button.color);
    }

    rect(buttonX, buttonY, this.buttonWidth, this.buttonHeight, 5);

    fill(COLORS.BACKGROUND);
    textSize(22);

    let labelX = width / 2;
    let labelY = buttonY + this.buttonHeight / 2;
    text(button.label, labelX, labelY);
  }

  handleMousePressed() {
    let buttonX = width / 2 - this.buttonWidth / 2;
    let numberOfButtons = this.buttons.length;

    for (let i = 0; i < numberOfButtons; i = i + 1) {
      let currentButton = this.buttons[i];
      let buttonY = currentButton.y;

      let mouseIsOverButton = checkIfMouseIsOverButton(
        buttonX,
        buttonY,
        this.buttonWidth,
        this.buttonHeight,
      );

      if (mouseIsOverButton) {
        this.stateManager.setPlayerData("difficulty", currentButton.difficulty);
        this.stateManager.changeState(STATES.GAME);
        break;
      }
    }
  }

  exit() {}
}
