class TitleState {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.buttons = [
      { label: "ENDLESS", mode: GAME_MODES.ENDLESS, y: 0 },
      { label: "PROGRESSIVE", mode: GAME_MODES.PROGRESSIVE, y: 0 },
    ];

    this.buttonWidth = 250;
    this.buttonHeight = 70;
  }

  enter() {
    this.buttons[0].y = height / 2 - 50;
    this.buttons[1].y = height / 2 + 50;
  }

  update() {}

  display() {
    background(COLORS.BACKGROUND);

    fill(COLORS.PRIMARY);
    textAlign(CENTER, CENTER);
    textSize(48);

    let titleX = width / 2;
    let titleY = height / 2 - 150;
    text("ANTIDOTE RUSH", titleX, titleY);

    textSize(20);
    fill(COLORS.SECONDARY);

    let playerName = this.stateManager.getPlayerData("name");
    let welcomeMessage = "Welcome, " + playerName + "!";
    let welcomeX = width / 2;
    let welcomeY = height / 2 - 100;
    text(welcomeMessage, welcomeX, welcomeY);

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
      fill(COLORS.SECONDARY);
    }

    rect(buttonX, buttonY, this.buttonWidth, this.buttonHeight, 5);

    fill(COLORS.BACKGROUND);
    textSize(24);

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
        this.stateManager.setPlayerData("gameMode", currentButton.mode);

        let isEndlessMode = currentButton.mode === GAME_MODES.ENDLESS;

        if (isEndlessMode) {
          this.stateManager.changeState(STATES.GAME);
        } else {
          this.stateManager.changeState(STATES.DIFFICULTY);
        }

        break;
      }
    }
  }

  exit() {}
}
