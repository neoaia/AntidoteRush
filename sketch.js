let stateManager;

function setup() {
  createCanvas(800, 600);

  // Create state manager
  stateManager = new StateManager();

  // Register all states
  stateManager.registerState(
    STATES.NAME_INPUT,
    new NameInputState(stateManager),
  );
  stateManager.registerState(
    STATES.INPUT_METHOD,
    new InputMethodState(stateManager),
  );
  stateManager.registerState(STATES.TITLE, new TitleState(stateManager));
  stateManager.registerState(
    STATES.DIFFICULTY,
    new DifficultyState(stateManager),
  );
  stateManager.registerState(STATES.GAME, new GameState(stateManager));

  // Start with name input
  stateManager.changeState(STATES.NAME_INPUT);
}

function draw() {
  stateManager.update();
  stateManager.display();
}

function keyPressed() {
  stateManager.handleKeyPressed(key, keyCode);
}

function mousePressed() {
  stateManager.handleMousePressed();
}
