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

// ── Frame-budget performance monitor ────────────────────────────────────────
//
// Tracks rolling average frame time. When avgDt > 20 ms (< 50 fps) the
// PERF.isLagging flag is set true, and non-essential work (e.g. zombie
// separation) can be skipped on alternate frames to recover headroom.
const PERF = {
  _samples: new Float32Array(60),
  _idx: 0,
  _filled: false,
  avgDt: 16.67,

  record(dt) {
    // Clamp: ignore stalls > 500 ms (tab hidden, debugger paused, etc.)
    this._samples[this._idx % 60] = Math.min(dt, 500);
    this._idx++;
    if (!this._filled && this._idx >= 60) this._filled = true;

    // Recompute every 60 samples
    if (this._idx % 60 === 0) {
      let sum = 0;
      const len = this._filled ? 60 : this._idx;
      for (let i = 0; i < len; i++) sum += this._samples[i];
      this.avgDt = sum / len;
    }
  },

  get fps() {
    return 1000 / this.avgDt;
  },
  get isLagging() {
    return this.avgDt > 20;
  }, // below 50 fps
};

// ── p5 lifecycle ─────────────────────────────────────────────────────────────

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
  const playerName = localStorage.getItem("playerName");
  const inputMethod = localStorage.getItem("inputMethod");
  const difficulty = localStorage.getItem("difficulty") || "easy";
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

// ── Pause / resume ───────────────────────────────────────────────────────────

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

// ── Pointer lock ─────────────────────────────────────────────────────────────

function setupPointerLock() {
  const cnv = document.querySelector("canvas");

  const lockOnFirst = function () {
    cnv.requestPointerLock();
    document.removeEventListener("keydown", lockOnFirst);
    document.removeEventListener("mousedown", lockOnFirst);
  };
  document.addEventListener("keydown", lockOnFirst);
  document.addEventListener("mousedown", lockOnFirst);

  document.addEventListener("mousemove", function (e) {
    if (!pointerLocked || isPaused || uiRenderer.isShopOpen()) return;
    const player = gameState.player;
    const w = player.weapons[player.currentWeapon];
    const aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;

    const screenVX = constrain(vx - camX + e.movementX, 0, width);
    const screenVY = constrain(vy - camY + e.movementY, 0, height);
    vx = screenVX + camX;
    vy = screenVY + camY;

    const dx = vx - player.x,
      dy = vy - player.y;
    const d = Math.sqrt(dx * dx + dy * dy);
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

// ── Window resize ────────────────────────────────────────────────────────────

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Invalidate all cached HUD buffers so they redraw at the new size
  if (uiRenderer && uiRenderer._hudCache) {
    uiRenderer._hudCache.invalidateAll();
  }
  // Minimap buffer is size-dependent — destroy and recreate on next draw
  if (uiRenderer && uiRenderer._minimapBuffer) {
    uiRenderer._minimapBuffer.remove();
    uiRenderer._minimapBuffer = null;
  }
}

// ── Draw loop ─────────────────────────────────────────────────────────────────

function draw() {
  PERF.record(deltaTime);

  if (gameState.gameOver) {
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
  const player = gameState.player;
  const rm = gameState.roundManager;

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

  const w = player.weapons[player.currentWeapon];
  const aimRange = w && w.aimRange < 9000 ? w.aimRange : 99999;
  const dx = vx - player.x,
    dy = vy - player.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > aimRange) {
    vx = player.x + (dx / d) * aimRange;
    vy = player.y + (dy / d) * aimRange;
  }

  if (player.mouseIsHeld) {
    const ww = player.weapons[player.currentWeapon];
    if (ww && ww.isAuto) {
      const result = player.tryAutoFire(vx, vy);
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

  if (player.health <= 0 && !gameState.gameOver) _triggerDeath();
}

// ── Death sequence ────────────────────────────────────────────────────────────

function _triggerDeath() {
  gameState.gameOver = true;

  localStorage.setItem("lastRound", gameState.roundManager.currentRound);
  localStorage.setItem("lastScore", gameState.score || 0);
  localStorage.setItem("lastCoins", gameState.coins);

  // ── Leaderboard ────────────────────────────────────────────────────────
  const currentRun = {
    name: gameState.playerName || "???",
    difficulty: localStorage.getItem("difficulty") || "easy",
    round: gameState.roundManager.currentRound,
    level: gameState.level || 1,
    zombiesKilled: gameState.zombiesKilled || 0,
    score: gameState.score || 0,
  };

  // Save to Supabase if available, otherwise fall back to localStorage
  if (typeof supabaseClient !== "undefined") {
    supabaseClient.upsertScore(currentRun).catch((err) => {
      console.warn("Could not save score to Supabase:", err);
      _saveLeaderboardLocally(currentRun);
    });
  } else {
    _saveLeaderboardLocally(currentRun);
  }

  _intentionalUnlock = true;
  document.exitPointerLock();
  if (typeof bgmManager !== "undefined") bgmManager.stop();
  cursor(ARROW);

  uiRenderer.startGameOverSequence(
    gameState.player,
    gameState.roundManager,
    gameState,
  );
}

function _saveLeaderboardLocally(currentRun) {
  const lb = JSON.parse(localStorage.getItem("leaderboard") || "[]");
  const existingIndex = lb.findIndex(
    (e) =>
      e.name.toUpperCase() === currentRun.name.toUpperCase() &&
      e.difficulty === currentRun.difficulty,
  );
  if (existingIndex !== -1) {
    const existing = lb[existingIndex];
    if (
      currentRun.score > existing.score ||
      (currentRun.score === existing.score && currentRun.round > existing.round)
    ) {
      lb[existingIndex] = currentRun;
    }
  } else {
    lb.push(currentRun);
  }
  localStorage.setItem("leaderboard", JSON.stringify(lb));
}

// ── Intermission / round transitions ─────────────────────────────────────────

function _endIntermission() {
  if (_preGame) {
    _preGame = false;
    startFirstRound();
  } else startNextRound();
}

function startFirstRound() {
  zombieManager.clearProjectiles();
  const difficulty = localStorage.getItem("difficulty") || "easy";
  uiRenderer.closeShop();
  gameState.roundManager.startRound(gameState);
  uiRenderer.showRoundStart(1, difficulty);
  if (typeof audioManager !== "undefined") audioManager.playRoundStart();
  document.querySelector("canvas").requestPointerLock();
}

function startNextRound() {
  zombieManager.clearProjectiles();
  const difficulty = localStorage.getItem("difficulty") || "easy";
  uiRenderer.closeShop();
  gameState.roundManager.nextRound();
  gameState.roundManager.startRound(gameState);
  uiRenderer.showRoundStart(gameState.roundManager.currentRound, difficulty);
  if (typeof audioManager !== "undefined") audioManager.playRoundStart();
  document.querySelector("canvas").requestPointerLock();
}

// ── Render ────────────────────────────────────────────────────────────────────

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

  if (!gameState.gameOver) {
    uiRenderer.drawScorePopupsScreenSpace(camX, camY);
    uiRenderer.renderAll(gameState.player, gameState.roundManager, shopManager);
    const rm = gameState.roundManager;
    if (rm.inIntermission && !uiRenderer.isShopOpen())
      uiRenderer.drawIntermissionCenter(
        rm.currentRound,
        rm.intermissionTimeLeft,
      );
  }
}

// ── Input handlers ────────────────────────────────────────────────────────────

function mousePressed() {
  if (gameState.gameOver) {
    uiRenderer.handleGameOverClick(mouseX, mouseY);
    return;
  }
  if (uiRenderer.isShopOpen()) {
    uiRenderer.shopClick(mouseX, mouseY, shopManager, gameState.player);
    return;
  }
  if (isPaused) {
    const action = uiRenderer.pauseHandleClick(mouseX, mouseY);
    if (action === "resume") _resume();
    else if (action === "exit") {
      _intentionalUnlock = true;
      document.exitPointerLock();
      if (typeof bgmManager !== "undefined") bgmManager.stop();
      if (typeof window.fadeNavigateTo === "function")
        window.fadeNavigateTo("../pages/menu.html");
      else window.location.href = "../pages/menu.html";
    }
    return;
  }
  if (!pointerLocked) return;
  gameState.player.mouseIsHeld = true;
  const aim = inputHandler.getAimTarget(gameState.player, vx, vy);
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
    const now = millis();
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
