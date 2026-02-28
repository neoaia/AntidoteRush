let gameState;
let spriteManager;
let assetManager;
let antidoteManager;
let combatManager;
let zombieManager;
let weaponPickupManager;
let shopManager;
let uiRenderer;
let gameRenderer;
let inputHandler;

let isPaused = false;
let isShopOpen = false;
let pointerLocked = false;
let vx = 0;
let vy = 0;

function preload() {
  assetManager = new AssetManager();
  assetManager.preload();
  spriteManager = new SpriteManager();
  spriteManager.preload();
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
  spriteManager.init(); // builds SpriteSheet objects after images loaded
  gameState.player.spriteSheet = spriteManager.get("player");
  vx = width / 2;
  vy = height / 2;

  gameState.roundManager = new RoundManager();
  gameState.roundManager.applyDifficulty(difficulty);
  gameState.base = new Base(width / 2 - 40, height / 2 - 40);

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

  setupPointerLock();

  // Move p5 canvas into the canvas wrapper div
  let cnvEl = document.querySelector("canvas");
  let wrap = document.getElementById("canvas-wrap");
  if (wrap && cnvEl) wrap.appendChild(cnvEl);
}

// Called by HTML shop's close button
function onShopClosed() {
  isShopOpen = false;
  // Re-lock pointer when shop closes
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
    if (!pointerLocked || isPaused || isShopOpen) return;
    let player = gameState.player;
    let w = player.weapons[player.currentWeapon];
    let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;

    vx = constrain(vx + e.movementX, 0, width);
    vy = constrain(vy + e.movementY, 0, height);
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
    if (!pointerLocked && !isPaused && !isShopOpen && !gameState.gameOver) {
      isPaused = true;
    }
  });

  cnv.addEventListener("click", function () {
    if (gameState.gameOver || isShopOpen) return;
    if (!pointerLocked) cnv.requestPointerLock();
    if (isPaused) isPaused = false;
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(255);

  // Update HTML HUD every frame
  if (typeof updateHUD === "function") updateHUD();

  if (gameState.gameOver) {
    // Redirecting to gameOver.html — just freeze the frame
    return;
  }

  if (isPaused) {
    displayGame();
    uiRenderer.drawPauseScreen();
    return;
  }

  if (!pointerLocked && !isShopOpen) {
    let player = gameState.player;
    vx = player.x;
    vy = player.y;
  }

  updateGame();
  displayGame();

  // Intermission banner on canvas (visible behind shop too)
  let rm = gameState.roundManager;
  if (rm.inIntermission) {
    uiRenderer.drawIntermission(rm);
    // Keep shop timer live every frame
    if (typeof tickShopUI === "function") tickShopUI();
  }
}

function updateGame() {
  let player = gameState.player;
  let rm = gameState.roundManager;

  player.update(width, height);

  // Re-clamp vx/vy as player moves
  let w = player.weapons[player.currentWeapon];
  let aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;
  let dx = vx - player.x,
    dy = vy - player.y;
  let d = Math.sqrt(dx * dx + dy * dy);
  if (d > aimRange) {
    vx = player.x + (dx / d) * aimRange;
    vy = player.y + (dy / d) * aimRange;
  }

  // Auto-fire (only when shop is closed)
  if (player.mouseIsHeld && !isShopOpen) {
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
    // Auto-open shop when intermission starts
    // (player can also press B manually)
  } else if (rm.inIntermission) {
    let done = rm.updateIntermission();
    if (done) startNextRound();
  }

  gameState.updateScorePopups();
  if (player.health <= 0 && !gameState.gameOver) {
    gameState.gameOver = true;
    // Save stats for gameOver.html
    localStorage.setItem("lastRound", gameState.roundManager.currentRound);
    localStorage.setItem("lastScore", gameState.score);
    localStorage.setItem("lastCoins", gameState.coins);
    // Redirect to game over screen
    setTimeout(() => {
      document.exitPointerLock();
      window.location.href = "../pages/game-over.html";
    }, 1200);
  }
}

function startNextRound() {
  // Close shop if open
  if (isShopOpen) {
    isShopOpen = false;
    document.getElementById("shop-overlay").classList.remove("open");
  }
  gameState.roundManager.nextRound();
  gameState.roundManager.startRound(gameState);
  // Re-lock pointer for gameplay
  document.querySelector("canvas").requestPointerLock();
}

function displayGame() {
  gameRenderer.renderGame(gameState.player, gameState.base, vx, vy);
  weaponPickupManager.display();
  uiRenderer.drawScorePopups();
  uiRenderer.renderAll(gameState.player, gameState.roundManager);
}

function mousePressed() {
  if (isShopOpen || isPaused || !pointerLocked) return;
  gameState.player.mouseIsHeld = true;
  let aim = inputHandler.getAimTarget(gameState.player, vx, vy);
  combatManager.shoot(gameState.player, aim.x, aim.y);
}

function mouseReleased() {
  gameState.player.mouseIsHeld = false;
}

function mouseWheel(event) {
  if (isPaused || isShopOpen) return false;
  gameState.player.cycleEquippedWeapon(event.delta > 0 ? 1 : -1);
  return false;
}

function keyPressed() {
  // ESC
  if (keyCode === ESCAPE) {
    if (gameState.gameOver) return;
    if (isShopOpen) {
      // Close shop
      isShopOpen = false;
      document.getElementById("shop-overlay").classList.remove("open");
      document.querySelector("canvas").requestPointerLock();
      return;
    }
    isPaused = !isPaused;
    if (isPaused) document.exitPointerLock();
    else document.querySelector("canvas").requestPointerLock();
    return;
  }

  // Space: skill
  if (
    key === " " &&
    !isPaused &&
    !isShopOpen &&
    gameState.roundManager.roundActive
  ) {
    gameState.player.activateSkill();
    return;
  }

  // B: toggle shop — only during intermission
  if ((key === "b" || key === "B") && !isPaused) {
    if (!gameState.roundManager.inIntermission) return;
    isShopOpen = !isShopOpen;
    if (isShopOpen) {
      document.exitPointerLock();
      if (typeof openShop === "function") openShop();
    } else {
      document.getElementById("shop-overlay").classList.remove("open");
      document.querySelector("canvas").requestPointerLock();
    }
    return;
  }

  // Enter: skip intermission
  if (keyCode === ENTER && gameState.roundManager.inIntermission) {
    gameState.roundManager.skipIntermission();
    return;
  }

  if (isPaused || isShopOpen) return;

  // Game over navigation is handled by gameOver.html

  if (key === "1" || key === "2" || key === "3")
    gameState.player.switchWeapon(key);
  if (key === "r" || key === "R") gameState.player.startReload();
}
