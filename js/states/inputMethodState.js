class InputMethodState {
  constructor(stateManager) {
    this.stateManager = stateManager;

    this.buttons = [];

    let mouseButton = {
      label: "MOUSE",
      method: INPUT_METHODS.MOUSE,
      y: 0,
    };
    this.buttons.push(mouseButton);

    let trackpadButton = {
      label: "TRACKPAD",
      method: INPUT_METHODS.TRACKPAD,
      y: 0,
    };
    this.buttons.push(trackpadButton);

    this.buttonWidth = 200;
    this.buttonHeight = 60;
  }

  enter() {
    this.buttons[0].y = height / 2 - 50;
    this.buttons[1].y = height / 2 + 30;
  }

  update() {}

  display() {
    background(COLORS.BACKGROUND);

    fill(COLORS.PRIMARY);
    textAlign(CENTER, CENTER);
    textSize(32);

    let titleX = width / 2;
    let titleY = height / 2 - 120;
    text("SELECT INPUT METHOD", titleX, titleY);

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
    textSize(20);

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
        this.stateManager.setPlayerData("inputMethod", currentButton.method);
        this.stateManager.changeState(STATES.TITLE);
        break;
      }
    }
  }

  exit() {}
}
