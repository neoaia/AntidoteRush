let gameState;
let assetManager;
let antidoteManager;
let combatManager;
let zombieManager;
let uiRenderer;
let gameRenderer;
let inputHandler;

function preload() {
  assetManager = new AssetManager();
  assetManager.preload();
}

function setup() {
  createCanvas(1100, 600);
  noCursor();
  textFont(assetManager.getFont());

  // Initialize game state
  gameState = new GameState();
  let playerName = localStorage.getItem("playerName");
  let inputMethod = localStorage.getItem("inputMethod");
  gameState.initialize(playerName, inputMethod);

  // Initialize game entities
  gameState.player = new Player(width / 2, height / 2);
  gameState.roundManager = new RoundManager();
  gameState.base = new Base(width / 2 - 40, height / 2 - 40);

  // Initialize managers
  antidoteManager = new AntidoteManager(gameState, width, height);
  combatManager = new CombatManager(gameState);
  zombieManager = new ZombieManager(gameState);

  // Initialize renderers
  uiRenderer = new UIRenderer(gameState, assetManager);
  gameRenderer = new GameRenderer(gameState, uiRenderer);

  // Initialize input handler
  inputHandler = new InputHandler(gameState, combatManager);

  // Start the game
  gameState.roundManager.startRound();
  antidoteManager.scheduleNext();
}

function draw() {
  background(255);

  if (gameState.gameOver) {
    uiRenderer.drawGameOver(gameState.roundManager);
    return;
  }

  updateGame();
  displayGame();
}

function updateGame() {
  gameState.player.update();

  combatManager.updateMeleeSlash();
  combatManager.updateBullets();

  antidoteManager.update(gameState.player, gameState.base);

  zombieManager.handleRoundSpawning(gameState.roundManager);
  zombieManager.update(gameState.player);

  if (gameState.player.health <= 0) {
    gameState.gameOver = true;
  }

  if (gameState.roundManager.roundComplete && !gameState.roundTransitioning) {
    gameState.roundTransitioning = true;
    setTimeout(function () {
      gameState.roundManager.nextRound();
      gameState.roundManager.startRound();
      gameState.roundTransitioning = false;
    }, 2000);
  }
}

function displayGame() {
  gameRenderer.renderGame(gameState.player, gameState.base);
  uiRenderer.renderAll(gameState.player, gameState.roundManager);
}

function mousePressed() {
  inputHandler.handleMousePressed(gameState.player);
}

function keyPressed() {
  inputHandler.handleKeyPressed(gameState.player, key);
}
