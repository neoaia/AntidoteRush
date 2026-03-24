let gameState;
let spriteManager;

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 2400;
let camX = 0,
  camY = 0;
let assetManager, antidoteManager, combatManager, zombieManager;
let weaponPickupManager, shopManager, uiRenderer, gameRenderer, inputHandler;
let audioManager, bgmManager;

let isPaused = false;
let pointerLocked = false;
let vx = 0,
  vy = 0;

let _preGame = true;
let _intentionalUnlock = false;
let _lastEscTime = 0;
const ESC_DEBOUNCE_MS = 400;

function preload() {
  assetManager = new AssetManager();
  assetManager.preload();
  spriteManager = new SpriteManager();
  spriteManager.preload();
  audioManager = new AudioManager();
  bgmManager = new BgmManager();
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
  gameState.player.walkSpriteSheet = spriteManager.get("player_walk");
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

  gameState.roundManager.beginIntermission();
  uiRenderer.startPreGameUI();
  antidoteManager.scheduleNext();
  weaponPickupManager.applyDebugWeapon(gameState.player);

  audioManager.init();
  bgmManager.init();
  bgmManager.playIngame();

  setupPointerLock();
}

function _pause() {
  if (isPaused) return;
  isPaused = true;
  pauseClock.pause();
  if (typeof bgmManager !== "undefined") bgmManager.pause();
  if (typeof audioManager !== "undefined") audioManager.stopAll();
  if (typeof uiRenderer !== "undefined") uiRenderer.onPause();
  cursor(ARROW);
  _intentionalUnlock = true;
  document.exitPointerLock();
}

function _resume() {
  if (!isPaused) return;
  isPaused = false;
  pauseClock.resume();
  if (typeof bgmManager !== "undefined") bgmManager.resume();
  noCursor();
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
      dy = vy - player.y,
      d = Math.sqrt(dx * dx + dy * dy);
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
        _pause();
      }
    }
  });

  cnv.addEventListener("click", function () {
    if (gameState.gameOver || uiRenderer.isShopOpen()) return;
    if (!pointerLocked && !isPaused) cnv.requestPointerLock();
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  if (gameState.gameOver) {
    // Still render the world frozen in the background while dead
    displayGame();
    uiRenderer.drawGameOverScreen(
      gameState.player,
      gameState.roundManager,
      gameState,
    );
    return;
  }
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
      if (rm.intermissionTimeLeft <= 0) _endIntermission();
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
    zombieManager.clearProjectiles();
  } else if (rm.inIntermission) {
    rm.updateIntermission();
    if (rm.intermissionTimeLeft <= 0) _endIntermission();
  }

  gameState.updateScorePopups();

  if (player.health <= 0 && !gameState.gameOver) {
    _triggerDeath();
  }
}

function _triggerDeath() {
  gameState.gameOver = true;

  // Save run stats for the in-game panel and for game-over.html if needed
  localStorage.setItem("lastRound", gameState.roundManager.currentRound);
  localStorage.setItem("lastScore", gameState.score || 0);
  localStorage.setItem("lastCoins", gameState.coins);

  // Release pointer lock and stop BGM
  _intentionalUnlock = true;
  document.exitPointerLock();
  if (typeof bgmManager !== "undefined") bgmManager.stop();
  cursor(ARROW);

  // Tell uiRenderer to start the 2s delay → panel slide-down sequence
  uiRenderer.startGameOverSequence(
    gameState.player,
    gameState.roundManager,
    gameState,
  );
}

function _endIntermission() {
  if (_preGame) {
    _preGame = false;
    startFirstRound();
  } else {
    startNextRound();
  }
}

function startFirstRound() {
  zombieManager.clearProjectiles();
  let difficulty = localStorage.getItem("difficulty") || "easy";
  uiRenderer.closeShop();
  gameState.roundManager.startRound(gameState);
  uiRenderer.showRoundStart(1, difficulty);
  if (typeof audioManager !== "undefined") audioManager.playRoundStart();
  document.querySelector("canvas").requestPointerLock();
}

function startNextRound() {
  zombieManager.clearProjectiles();
  let difficulty = localStorage.getItem("difficulty") || "easy";
  uiRenderer.closeShop();
  gameState.roundManager.nextRound();
  gameState.roundManager.startRound(gameState);
  uiRenderer.showRoundStart(gameState.roundManager.currentRound, difficulty);
  if (typeof audioManager !== "undefined") audioManager.playRoundStart();
  document.querySelector("canvas").requestPointerLock();
}

function displayGame() {
  push();
  translate(-camX, -camY);
  gameRenderer.renderGame(
    gameState.player,
    gameState.base,
    vx,
    vy,
    zombieManager,
  );
  weaponPickupManager.display();
  pop();

  // Don't draw normal HUD when game is over — panel handles everything
  if (!gameState.gameOver) {
    uiRenderer.drawScorePopupsScreenSpace(camX, camY);
    uiRenderer.renderAll(gameState.player, gameState.roundManager, shopManager);
    let rm = gameState.roundManager;
    if (rm.inIntermission && !uiRenderer.isShopOpen())
      uiRenderer.drawIntermissionCenter(
        rm.currentRound,
        rm.intermissionTimeLeft,
      );
  }
}

function mousePressed() {
  // Game over panel button clicks
  if (gameState.gameOver) {
    uiRenderer.handleGameOverClick(mouseX, mouseY);
    return;
  }

  if (uiRenderer.isShopOpen()) {
    uiRenderer.shopClick(mouseX, mouseY, shopManager, gameState.player);
    return;
  }
  if (isPaused) {
    let action = uiRenderer.pauseHandleClick(mouseX, mouseY);
    if (action === "resume") {
      _resume();
    } else if (action === "exit") {
      _intentionalUnlock = true;
      document.exitPointerLock();
      if (typeof bgmManager !== "undefined") bgmManager.stop();
      if (typeof window.fadeNavigateTo === "function") {
        window.fadeNavigateTo("../pages/menu.html");
      } else {
        window.location.href = "../pages/menu.html";
      }
    }
    return;
  }
  if (!pointerLocked) return;
  gameState.player.mouseIsHeld = true;
  let aim = inputHandler.getAimTarget(gameState.player, vx, vy);
  combatManager.shoot(gameState.player, aim.x, aim.y);
}

function mouseReleased() {
  if (typeof gameState === "undefined" || !gameState.player) return;
  gameState.player.mouseIsHeld = false;
  if (isPaused) uiRenderer.pauseHandleRelease();
}

function mouseMoved() {
  if (isPaused && !uiRenderer.isShopOpen())
    uiRenderer.checkPauseHover(mouseX, mouseY);
}

function mouseDragged() {
  if (isPaused) uiRenderer.pauseHandleDrag(mouseX, mouseY);
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
    _endIntermission();
    return;
  }
  if (uiRenderer.isShopOpen()) return;
  if (key === "1" || key === "2" || key === "3")
    gameState.player.switchWeapon(key);
  if (key === "r" || key === "R") gameState.player.startReload();
}
