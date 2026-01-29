class StateManager {
  constructor() {
    this.currentState = null;
    this.states = {};

    this.playerData = {
      name: "",
      inputMethod: null,
      gameMode: null,
      difficulty: null,
    };
  }

  registerState(stateName, stateInstance) {
    this.states[stateName] = stateInstance;
  }

  changeState(stateName) {
    if (this.currentState && this.currentState.exit) {
      this.currentState.exit();
    }

    this.currentState = this.states[stateName];

    if (this.currentState && this.currentState.enter) {
      this.currentState.enter();
    }
  }

  update() {
    if (this.currentState && this.currentState.update) {
      this.currentState.update();
    }
  }

  display() {
    if (this.currentState && this.currentState.display) {
      this.currentState.display();
    }
  }

  handleKeyPressed(key, keyCode) {
    if (this.currentState && this.currentState.handleKeyPressed) {
      this.currentState.handleKeyPressed(key, keyCode);
    }
  }

  handleMousePressed() {
    if (this.currentState && this.currentState.handleMousePressed) {
      this.currentState.handleMousePressed();
    }
  }

  setPlayerData(key, value) {
    this.playerData[key] = value;
  }

  getPlayerData(key) {
    return this.playerData[key];
  }
}
