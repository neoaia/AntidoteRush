let gameState;
let spriteManager;

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;
let camX = 0;
let camY = 0;
let assetManager;
let antidoteManager;
let combatManager;
let zombieManager;
let weaponPickupManager;
let shopManager;
let uiRenderer;
let gameRenderer;
let inputHandler;
let audioManager;

let isPaused = false;
let pointerLocked = false;
let vx = 0;
let vy = 0;

let _intentionalUnlock = false;
let _lastEscTime = 0;
const ESC_DEBOUNCE_MS = 400;

function preload() {
  assetManager = new AssetManager();
  assetManager.preload();
  spriteManager = new SpriteManager();
  spriteManager.preload();
  audioManager = new AudioManager(); // instantiate here so it exists before setup()
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

  gameState.player = new Player(WORLD_WIDTH / 2, WORLD_HEIGHT / 2);
  gameState.roundManager = new RoundManager();
  gameState.roundManager.applyDifficulty(difficulty);
  gameState.base = new Base(WORLD_WIDTH / 2 - 40, WORLD_HEIGHT / 2 - 40);

  spriteManager.init();
  gameState.player.spriteSheet = spriteManager.get("player");
  gameState.base.initSprite();

  vx = WORLD_WIDTH / 2;
  vy = WORLD_HEIGHT / 2;

  antidoteManager = new AntidoteManager(gameState, width, height);
  combatManager = new CombatManager(gameState);
  zombieManager = new ZombieManager(gameState);
  weaponPickupManager = new WeaponPickupManager(gameState, width, height);
  shopManager = new ShopManager(gameState);
  uiRenderer = new UIRenderer(gameState, assetManager);
  gameRenderer = new GameRenderer(gameState, uiRenderer);
  inputHandler = new InputHandler(gameState, combatManager);

  gameState.roundManager.startRound(null);
  antidoteManager.scheduleNext();
  weaponPickupManager.applyDebugWeapon(gameState.player);
  uiRenderer.showRoundStart(1, difficulty);

  audioManager.init(); // init AFTER preload() has already constructed it

  setupPointerLock();
}

function _pause() {
  if (isPaused) return;
  isPaused = true;
  pauseClock.pause();
  if (typeof audioManager !== "undefined") audioManager.stopAll();
  _intentionalUnlock = true;
  document.exitPointerLock();
}

function _resume() {
  if (!isPaused) return;
  isPaused = false;
  pauseClock.resume();
  document.querySelector("canvas").requestPointerLock();
}

function setupPointerLock() {
  let cnv = document.querySelector("canvas");

  let lockOnFirst = function () {
    cnv.requestPointerLock();
    document.removeEventListener("keydown", lockOnFirst);
    document.removeEventListener("mousedown", lockOnFirst);
  };
  document.addEventListener("keydown", lockOnFirst);
  document.addEventListener("mousedown", lockOnFirst);

  document.addEventListener("mousemove", function (e) {
    if (!pointerLocked || isPaused || uiRenderer.isShopOpen()) return;
    let player = gameState.player;
    let w = player.weapons[player.currentWeapon];
    let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;

    let screenVX = constrain(vx - camX + e.movementX, 0, width);
    let screenVY = constrain(vy - camY + e.movementY, 0, height);
    vx = screenVX + camX;
    vy = screenVY + camY;

    let dx = vx - player.x,
      dy = vy - player.y;
    let d = Math.sqrt(dx * dx + dy * dy);
    if (d > aimRange) {
      vx = player.x + (dx / d) * aimRange;
      vy = player.y + (dy / d) * aimRange;
    }
  });

  document.addEventListener("pointerlockchange", function () {
    pointerLocked = document.pointerLockElement === cnv;

    if (!pointerLocked) {
      if (_intentionalUnlock) {
        _intentionalUnlock = false;
      } else if (!isPaused && !uiRenderer.isShopOpen() && !gameState.gameOver) {
        isPaused = true;
        pauseClock.pause();
      }
    }
  });

  cnv.addEventListener("click", function () {
    if (gameState.gameOver || uiRenderer.isShopOpen()) return;
    if (!pointerLocked) cnv.requestPointerLock();
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  if (gameState.gameOver) return;

  if (isPaused) {
    displayGame();
    uiRenderer.drawPauseScreen();
    return;
  }

  if (!pointerLocked && !uiRenderer.isShopOpen()) {
    vx = gameState.player.x;
    vy = gameState.player.y;
  }

  updateGame();
  displayGame();
}

function updateGame() {
  let player = gameState.player;
  let rm = gameState.roundManager;

  if (uiRenderer.isShopOpen()) {
    if (rm.inIntermission) {
      rm.updateIntermission();
      if (rm.intermissionTimeLeft <= 0) startNextRound();
    }
    return;
  }

  player.update(WORLD_WIDTH, WORLD_HEIGHT);

  camX = constrain(player.x - width / 2, 0, WORLD_WIDTH - width);
  camY = constrain(player.y - height / 2, 0, WORLD_HEIGHT - height);

  player.aimAngle = Math.atan2(vy - player.y, vx - player.x);

  let w = player.weapons[player.currentWeapon];
  let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;
  let dx = vx - player.x,
    dy = vy - player.y,
    d = Math.sqrt(dx * dx + dy * dy);
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

  if (rm.roundActive) {
    zombieManager.handleRoundSpawning(rm);
    zombieManager.update(player);
  } else if (rm.roundComplete && !rm.inIntermission) {
    rm.beginIntermission();
    uiRenderer.startIntermissionUI(rm.currentRound);
  } else if (rm.inIntermission) {
    rm.updateIntermission();
    if (rm.intermissionTimeLeft <= 0) startNextRound();
  }

  gameState.updateScorePopups();

  if (player.health <= 0 && !gameState.gameOver) {
    gameState.gameOver = true;
    localStorage.setItem("lastRound", gameState.roundManager.currentRound);
    localStorage.setItem("lastScore", gameState.score || 0);
    localStorage.setItem("lastCoins", gameState.coins);
    setTimeout(() => {
      _intentionalUnlock = true;
      document.exitPointerLock();
      window.location.href = "../pages/game-over.html";
    }, 1200);
  }
}

function startNextRound() {
  let difficulty = localStorage.getItem("difficulty") || "easy";
  uiRenderer.closeShop();
  gameState.roundManager.nextRound();
  gameState.roundManager.startRound(gameState);
  uiRenderer.showRoundStart(gameState.roundManager.currentRound, difficulty);
  document.querySelector("canvas").requestPointerLock();
}

function displayGame() {
  push();
  translate(-camX, -camY);
  gameRenderer.renderGame(gameState.player, gameState.base, vx, vy, zombieManager);
  weaponPickupManager.display();
  pop();

  uiRenderer.drawScorePopupsScreenSpace(camX, camY);
  uiRenderer.renderAll(gameState.player, gameState.roundManager, shopManager);

  let rm = gameState.roundManager;
  if (rm.inIntermission && !uiRenderer.isShopOpen()) {
    uiRenderer.drawIntermissionCenter(rm.currentRound, rm.intermissionTimeLeft);
  }
}

function mousePressed() {
  if (uiRenderer.isShopOpen()) {
    uiRenderer.shopClick(mouseX, mouseY, shopManager, gameState.player);
    return;
  }
  if (isPaused || !pointerLocked) return;
  gameState.player.mouseIsHeld = true;
  let aim = inputHandler.getAimTarget(gameState.player, vx, vy);
  combatManager.shoot(gameState.player, aim.x, aim.y);
}

function mouseReleased() {
  if (typeof gameState === "undefined" || !gameState.player) return;
  gameState.player.mouseIsHeld = false;
}

function mouseWheel(event) {
  if (typeof gameState === "undefined" || !gameState.player) return false;
  if (uiRenderer.isShopOpen()) {
    uiRenderer.shopScroll(event.delta);
    return false;
  }
  if (isPaused) return false;
  gameState.player.cycleEquippedWeapon(event.delta > 0 ? 1 : -1);
  return false;
}

function keyPressed() {
  if (keyCode === ESCAPE) {
    if (gameState.gameOver) return;
    let now = millis();
    if (now - _lastEscTime < ESC_DEBOUNCE_MS) return;
    _lastEscTime = now;

    if (uiRenderer.isShopOpen()) {
      uiRenderer.closeShop();
      document.querySelector("canvas").requestPointerLock();
      return;
    }

    if (isPaused) _resume();
    else _pause();
    return;
  }

  if (isPaused) return;

  if (
    key === " " &&
    !uiRenderer.isShopOpen() &&
    gameState.roundManager.roundActive
  ) {
    gameState.player.activateSkill();
    return;
  }

  if ((key === "b" || key === "B") && !uiRenderer.isShopOpen()) {
    if (!gameState.roundManager.inIntermission) return;
    _intentionalUnlock = true;
    document.exitPointerLock();
    uiRenderer.openShop();
    return;
  }

  if (
    keyCode === ENTER &&
    gameState.roundManager.inIntermission &&
    !uiRenderer.isShopOpen()
  ) {
    gameState.roundManager.skipIntermission();
    startNextRound();
    return;
  }

  if (uiRenderer.isShopOpen()) return;

  if (key === "1" || key === "2" || key === "3")
    gameState.player.switchWeapon(key);
  if (key === "r" || key === "R") gameState.player.startReload();
}
