let gameState;
let assetManager;
let antidoteManager;
let combatManager;
let zombieManager;
let weaponPickupManager;
let uiRenderer;
let gameRenderer;
let inputHandler;

function preload() {
  assetManager = new AssetManager();
  assetManager.preload();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noCursor();
  textFont(assetManager.getFont());

  gameState = new GameState();
  let playerName = localStorage.getItem("playerName");
  let inputMethod = localStorage.getItem("inputMethod");
  gameState.initialize(playerName, inputMethod);

  gameState.player = new Player(width / 2, height / 2);
  gameState.roundManager = new RoundManager();
  gameState.base = new Base(width / 2 - 40, height / 2 - 40);

  antidoteManager = new AntidoteManager(gameState, width, height);
  combatManager = new CombatManager(gameState);
  zombieManager = new ZombieManager(gameState);
  weaponPickupManager = new WeaponPickupManager(gameState, width, height);

  uiRenderer = new UIRenderer(gameState, assetManager);
  gameRenderer = new GameRenderer(gameState, uiRenderer);
  inputHandler = new InputHandler(gameState, combatManager);

  gameState.roundManager.startRound();
  antidoteManager.scheduleNext();

  // Apply debug weapon immediately (set to null in weaponPickupManager to disable)
  weaponPickupManager.applyDebugWeapon(gameState.player);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
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
  let player = gameState.player;
  player.update(width, height);

  // Hold-to-fire for auto weapons
  if (player.mouseIsHeld) {
    let w = player.weapons[player.currentWeapon];
    if (w && w.isAuto) {
      let aim = inputHandler.getAimTarget(player);
      let result = player.tryAutoFire(aim.x, aim.y);
      if (result !== null) {
        combatManager.handleShootResult(result, player, aim.x, aim.y);
      }
    }
  }

  combatManager.updateMeleeSlash();
  combatManager.updateBullets();

  antidoteManager.update(player, gameState.base);
  weaponPickupManager.update(player, gameState.base);

  zombieManager.handleRoundSpawning(gameState.roundManager);
  zombieManager.update(player);

  gameState.updateScorePopups();

  if (player.health <= 0) gameState.gameOver = true;

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
  weaponPickupManager.display();
  uiRenderer.drawScorePopups();
  uiRenderer.renderAll(gameState.player, gameState.roundManager);
}

function mousePressed() {
  gameState.player.mouseIsHeld = true;
  inputHandler.handleMousePressed(gameState.player);
}

function mouseReleased() {
  gameState.player.mouseIsHeld = false;
}

function mouseWheel(event) {
  // Scroll down = next weapon, scroll up = prev weapon
  let direction = event.delta > 0 ? 1 : -1;
  gameState.player.cycleEquippedWeapon(direction);
  // Prevent page scroll
  return false;
}

function keyPressed() {
  inputHandler.handleKeyPressed(gameState.player, key);
  if (key === "r" || key === "R") {
    gameState.player.startReload();
  }
}
