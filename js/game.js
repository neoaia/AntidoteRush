let gameState;
let assetManager;
let antidoteManager;
let combatManager;
let zombieManager;
let weaponPickupManager;
let uiRenderer;
let gameRenderer;
let inputHandler;

let isPaused = false;
let pointerLocked = false;
let vx = 0;
let vy = 0;

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
  let difficulty = localStorage.getItem("difficulty") || "easy";
  gameState.initialize(playerName, inputMethod, difficulty);

  gameState.player = new Player(width / 2, height / 2);
  vx = width / 2;
  vy = height / 2;

  gameState.roundManager = new RoundManager();
  gameState.roundManager.applyDifficulty(difficulty);

  gameState.base = new Base(width / 2 - 40, height / 2 - 40);

  antidoteManager = new AntidoteManager(gameState, width, height);
  combatManager = new CombatManager(gameState);
  zombieManager = new ZombieManager(gameState);
  weaponPickupManager = new WeaponPickupManager(gameState, width, height);

  uiRenderer = new UIRenderer(gameState, assetManager);
  gameRenderer = new GameRenderer(gameState, uiRenderer);
  inputHandler = new InputHandler(gameState, combatManager);

  // Round 1 start — no multiplier tick on first round
  gameState.roundManager.startRound(null);
  antidoteManager.scheduleNext();
  weaponPickupManager.applyDebugWeapon(gameState.player);

  setupPointerLock();
}

function setupPointerLock() {
  let cnv = document.querySelector("canvas");

  let lockOnFirstInteraction = function () {
    cnv.requestPointerLock();
    document.removeEventListener("keydown", lockOnFirstInteraction);
    document.removeEventListener("mousedown", lockOnFirstInteraction);
  };
  document.addEventListener("keydown", lockOnFirstInteraction);
  document.addEventListener("mousedown", lockOnFirstInteraction);

  document.addEventListener("mousemove", function (e) {
    if (!pointerLocked || isPaused) return;
    let player = gameState.player;
    let w = player.weapons[player.currentWeapon];
    let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;

    vx = constrain(vx + e.movementX, 0, width);
    vy = constrain(vy + e.movementY, 0, height);

    let dx = vx - player.x;
    let dy = vy - player.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d > aimRange) {
      vx = player.x + (dx / d) * aimRange;
      vy = player.y + (dy / d) * aimRange;
    }
  });

  document.addEventListener("pointerlockchange", function () {
    pointerLocked = document.pointerLockElement === cnv;
    if (!pointerLocked && !isPaused && !gameState.gameOver) {
      isPaused = true;
    }
  });

  cnv.addEventListener("click", function () {
    if (gameState.gameOver) return;
    if (!pointerLocked) cnv.requestPointerLock();
    if (isPaused) isPaused = false;
  });
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

  if (isPaused) {
    displayGame();
    uiRenderer.drawPauseScreen();
    return;
  }

  if (!pointerLocked) {
    let player = gameState.player;
    vx = player.x;
    vy = player.y;
  }

  updateGame();
  displayGame();
}

function updateGame() {
  let player = gameState.player;
  player.update(width, height);

  // Re-clamp vx/vy as player moves
  let w = player.weapons[player.currentWeapon];
  let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;
  let dx = vx - player.x;
  let dy = vy - player.y;
  let d = Math.sqrt(dx * dx + dy * dy);
  if (d > aimRange) {
    vx = player.x + (dx / d) * aimRange;
    vy = player.y + (dy / d) * aimRange;
  }

  if (player.mouseIsHeld) {
    let ww = player.weapons[player.currentWeapon];
    if (ww && ww.isAuto) {
      let result = player.tryAutoFire(vx, vy);
      if (result !== null)
        combatManager.handleShootResult(result, player, vx, vy);
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
      // Pass gameState so health multipliers tick on round start
      gameState.roundManager.startRound(gameState);
      gameState.roundTransitioning = false;
    }, 2000);
  }
}

function displayGame() {
  gameRenderer.renderGame(gameState.player, gameState.base, vx, vy);
  weaponPickupManager.display();
  uiRenderer.drawScorePopups();
  uiRenderer.renderAll(gameState.player, gameState.roundManager);
}

function mousePressed() {
  if (isPaused || !pointerLocked) return;
  gameState.player.mouseIsHeld = true;
  let aim = inputHandler.getAimTarget(gameState.player, vx, vy);
  combatManager.shoot(gameState.player, aim.x, aim.y);
}

function mouseReleased() {
  gameState.player.mouseIsHeld = false;
}

function mouseWheel(event) {
  if (isPaused) return false;
  gameState.player.cycleEquippedWeapon(event.delta > 0 ? 1 : -1);
  return false;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    if (gameState.gameOver) return;
    isPaused = !isPaused;
    if (isPaused) document.exitPointerLock();
    else document.querySelector("canvas").requestPointerLock();
    return;
  }
  if (isPaused) return;
  if (gameState.gameOver && key === " ") {
    window.location.href = "../pages/title.html";
    return;
  }
  if (key === "1" || key === "2" || key === "3")
    gameState.player.switchWeapon(key);
  if (key === "r" || key === "R") gameState.player.startReload();
}
