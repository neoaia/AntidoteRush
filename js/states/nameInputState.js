class NameInputState {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.playerName = "";
    this.maxLength = 15;
  }

  enter() {
    this.playerName = "";
  }

  update() {}

  display() {
    background(COLORS.BACKGROUND);

    fill(COLORS.PRIMARY);
    textAlign(CENTER, CENTER);
    textSize(32);

    let titleX = width / 2;
    let titleY = height / 2 - 50;
    text("ENTER YOUR NAME", titleX, titleY);

    textSize(24);
    fill(COLORS.SECONDARY);

    let nameDisplay = this.playerName + "_";
    let nameX = width / 2;
    let nameY = height / 2 + 20;
    text(nameDisplay, nameX, nameY);

    textSize(16);
    fill(150);

    let instructionX = width / 2;
    let instructionY = height / 2 + 80;
    text("Press ENTER to continue", instructionX, instructionY);
  }

  handleKeyPressed(key, keyCode) {
    let pressedEnter = keyCode === ENTER;

    if (pressedEnter) {
      let cleanedName = this.playerName.trim();
      let nameIsNotEmpty = cleanedName.length > 0;

      if (nameIsNotEmpty) {
        this.stateManager.setPlayerData("name", cleanedName);
        this.stateManager.changeState(STATES.INPUT_METHOD);
      }
    }

    let pressedBackspace = keyCode === BACKSPACE;

    if (pressedBackspace) {
      this.playerName = this.playerName.slice(0, -1);
    }

    let isPrintableCharacter = key.length === 1;
    let nameNotTooLong = this.playerName.length < this.maxLength;

    if (isPrintableCharacter && nameNotTooLong) {
      let isValidCharacter = key.match(/[a-zA-Z0-9 ]/);

      if (isValidCharacter) {
        this.playerName = this.playerName + key;
      }
    }
  }

  exit() {}
}
