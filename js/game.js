let playerName;
let inputMethod;

let player;
let obstacles = [];
let bullets = [];
let zombies = [];
let roundManager;

let score = 0;
let gameOver = false;
let roundTransitioning = false;

// Melee slash effect variables
let meleeSlashActive = false;
let meleeSlashAngle = 0;
let meleeSlashStartTime = 0;
let meleeSlashDuration = 200; // milliseconds

function setup() {
  createCanvas(1200, 650);

  playerName = localStorage.getItem("playerName");
  inputMethod = localStorage.getItem("inputMethod");

  if (!playerName) {
    playerName = "Player";
  }

  if (!inputMethod) {
    inputMethod = "mouse";
  }

  player = new Player(width / 2, height / 2, inputMethod);
  roundManager = new RoundManager();

  createObstacles();
  roundManager.startRound();
}

function createObstacles() {
  obstacles = [];

  let house1 = new Obstacle(100, 100, 80, 60, "house");
  obstacles.push(house1);

  let house2 = new Obstacle(1000, 150, 80, 60, "house");
  obstacles.push(house2);

  let car1 = new Obstacle(300, 200, 40, 60, "car");
  obstacles.push(car1);

  let car2 = new Obstacle(800, 450, 40, 60, "car");
  obstacles.push(car2);

  let barricade1 = new Obstacle(200, 550, 100, 20, "barricade");
  obstacles.push(barricade1);

  let barricade2 = new Obstacle(600, 100, 80, 20, "barricade");
  obstacles.push(barricade2);
}

function draw() {
  background(30);

  if (gameOver) {
    displayGameOver();
    return;
  }

  updateGame();
  displayGame();
  displayUI();
}

function updateGame() {
  player.update();

  // Update melee slash effect
  if (meleeSlashActive) {
    let elapsed = millis() - meleeSlashStartTime;
    if (elapsed > meleeSlashDuration) {
      meleeSlashActive = false;
    }
  }

  for (let i = 0; i < obstacles.length; i = i + 1) {
    let currentObstacle = obstacles[i];
    let isColliding = checkCollision(player, currentObstacle);

    if (isColliding) {
      resolveCollision(player, currentObstacle);
    }
  }

  let currentTime = millis();
  let spawnResult = roundManager.update(currentTime, zombies);
  if (spawnResult !== null) {
    if (spawnResult.type === "cluster") {
      // Add all zombies from the cluster
      for (let i = 0; i < spawnResult.zombies.length; i++) {
        zombies.push(spawnResult.zombies[i]);
      }
    } else {
      // Single zombie spawn
      zombies.push(spawnResult);
    }
  }

  for (let i = zombies.length - 1; i >= 0; i = i - 1) {
    let currentZombie = zombies[i];

    // Pass obstacles array to zombie update
    currentZombie.update(player.x, player.y, obstacles);

    // Check collision with obstacles
    let hitObstacle = false;
    for (let j = 0; j < obstacles.length; j = j + 1) {
      let currentObstacle = obstacles[j];
      let isZombieHittingObstacle = checkCollision(
        currentZombie,
        currentObstacle,
      );

      if (isZombieHittingObstacle) {
        resolveZombieCollision(currentZombie, currentObstacle);

        // Start wall following if not already
        if (!currentZombie.followingWall) {
          currentZombie.startFollowingWall(currentObstacle);
        }

        hitObstacle = true;
        break; // Only handle one obstacle at a time
      }
    }

    // If not hitting any obstacle and was following wall, stop after delay
    if (!hitObstacle && currentZombie.followingWall) {
      if (millis() - currentZombie.lastStuckTime > 300) {
        currentZombie.stopFollowingWall();
      }
    }

    if (!currentZombie.active) {
      score = score + currentZombie.points;
      zombies.splice(i, 1);
      continue;
    }

    let isCollidingWithPlayer = checkCollision(player, currentZombie);
    if (isCollidingWithPlayer && currentZombie.canAttack()) {
      player.takeDamage(currentZombie.damage);
    }
  }

  for (let i = bullets.length - 1; i >= 0; i = i - 1) {
    let currentBullet = bullets[i];
    currentBullet.update();

    if (!currentBullet.active) {
      bullets.splice(i, 1);
      continue;
    }

    // Check collision with obstacles
    for (let j = 0; j < obstacles.length; j = j + 1) {
      let currentObstacle = obstacles[j];
      let isBulletHittingObstacle = checkCollision(
        currentBullet,
        currentObstacle,
      );

      if (isBulletHittingObstacle) {
        currentBullet.active = false;
        break;
      }
    }

    if (!currentBullet.active) {
      bullets.splice(i, 1);
      continue;
    }

    // Check collision with zombies
    for (let j = zombies.length - 1; j >= 0; j = j - 1) {
      let currentZombie = zombies[j];
      let distance = dist(
        currentBullet.x,
        currentBullet.y,
        currentZombie.x,
        currentZombie.y,
      );

      if (distance < currentZombie.size / 2) {
        currentZombie.takeDamage(currentBullet.damage);
        currentBullet.active = false;
        break;
      }
    }
  }

  if (player.health <= 0) {
    gameOver = true;
  }

  if (roundManager.roundComplete && !roundTransitioning) {
    roundTransitioning = true;
    setTimeout(function () {
      roundManager.nextRound();
      roundManager.startRound();
      roundTransitioning = false;
    }, 2000);
  }
}

function displayGame() {
  for (let i = 0; i < obstacles.length; i = i + 1) {
    obstacles[i].display();
  }

  for (let i = 0; i < zombies.length; i = i + 1) {
    zombies[i].display();
  }

  for (let i = 0; i < bullets.length; i = i + 1) {
    bullets[i].display();
  }

  player.display();

  // Draw melee slash effect AFTER player
  if (meleeSlashActive) {
    drawMeleeSlash();
  }

  drawAimIndicator();
}

function drawMeleeSlash() {
  let elapsed = millis() - meleeSlashStartTime;
  let progress = elapsed / meleeSlashDuration;

  // Fade out effect
  let alpha = 255 * (1 - progress);

  push();
  translate(player.x, player.y);
  rotate(meleeSlashAngle);

  // Draw arc slash
  noFill();
  stroke(255, 255, 255, alpha);
  strokeWeight(4);

  let slashRadius = player.weapons.melee.range;
  let startAngle = -PI / 3; // -60 degrees
  let endAngle = PI / 3; // +60 degrees

  arc(0, 0, slashRadius * 2, slashRadius * 2, startAngle, endAngle);

  // Add some slash lines for effect
  stroke(200, 200, 255, alpha * 0.7);
  strokeWeight(2);
  line(0, 0, slashRadius * cos(startAngle), slashRadius * sin(startAngle));
  line(0, 0, slashRadius * cos(endAngle), slashRadius * sin(endAngle));
  line(0, 0, slashRadius * cos(0), slashRadius * sin(0));

  pop();
}

function drawAimIndicator() {
  let aimX = mouseX;
  let aimY = mouseY;

  // Laser sight from player to cursor (for guns)
  if (
    player.currentWeapon === "handgun" ||
    player.currentWeapon === "equipped"
  ) {
    stroke(255, 0, 0, 100);
    strokeWeight(1);
    line(player.x, player.y, aimX, aimY);

    // Laser dot at cursor
    noStroke();
    fill(255, 0, 0, 150);
    circle(aimX, aimY, 8);
  }

  // AOE arc indicator for melee (follows mouse)
  if (player.currentWeapon === "melee") {
    let angleToMouse = atan2(aimY - player.y, aimX - player.x);

    push();
    translate(player.x, player.y);
    rotate(angleToMouse);

    // Draw melee arc range
    noFill();
    stroke(255, 150, 0, 120);
    strokeWeight(3);

    let meleeRange = player.weapons.melee.range;
    let arcStart = -PI / 3; // -60 degrees
    let arcEnd = PI / 3; // +60 degrees

    arc(0, 0, meleeRange * 2, meleeRange * 2, arcStart, arcEnd);

    // Draw edge lines
    stroke(255, 150, 0, 80);
    strokeWeight(1);
    line(0, 0, meleeRange * cos(arcStart), meleeRange * sin(arcStart));
    line(0, 0, meleeRange * cos(arcEnd), meleeRange * sin(arcEnd));

    pop();

    // Line from player to cursor
    stroke(255, 150, 0, 100);
    strokeWeight(1);
    line(player.x, player.y, aimX, aimY);
  }

  // Crosshair
  stroke(255, 0, 0);
  strokeWeight(2);
  noFill();
  circle(aimX, aimY, 20);

  line(aimX - 15, aimY, aimX - 5, aimY);
  line(aimX + 5, aimY, aimX + 15, aimY);
  line(aimX, aimY - 15, aimX, aimY - 5);
  line(aimX, aimY + 5, aimX, aimY + 15);
}

function displayUI() {
  drawBackButton();
  drawPlayerStats();
  drawRoundInfo();

  if (roundManager.roundComplete) {
    drawRoundComplete();
  }
}

function drawBackButton() {
  let buttonX = 20;
  let buttonY = 20;
  let buttonWidth = 180;
  let buttonHeight = 40;

  let mouseIsOver =
    mouseX > buttonX &&
    mouseX < buttonX + buttonWidth &&
    mouseY > buttonY &&
    mouseY < buttonY + buttonHeight;

  if (mouseIsOver) {
    fill(255, 107, 107);
  } else {
    fill(100);
  }

  noStroke();
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);

  fill(255);
  textSize(14);
  textAlign(LEFT, CENTER);
  text("← BACK TO MENU", buttonX + 10, buttonY + buttonHeight / 2);
}

function drawPlayerStats() {
  fill(255);
  textSize(16);
  textAlign(LEFT, TOP);

  text("Player: " + playerName, 20, 70);
  text("Health: " + player.health + "/" + player.maxHealth, 20, 95);
  text("Score: " + score, 20, 120);
  text("Weapon: " + player.weapons[player.currentWeapon].name, 20, 145);

  textSize(12);
  fill(200);
  text("1=Melee 2=Handgun 3=Equipped", 20, 170);
}

function drawRoundInfo() {
  fill(255);
  textSize(20);
  textAlign(CENTER, TOP);
  text("ROUND " + roundManager.currentRound, width / 2, 20);

  textSize(14);
  text(
    "Zombies: " +
      roundManager.zombiesAlive +
      " | Spawning: " +
      roundManager.zombiesToSpawn,
    width / 2,
    50,
  );
}

function drawRoundComplete() {
  fill(0, 200);

  fill(0, 255, 0);
  textSize(48);
  textAlign(CENTER, CENTER);
  text(
    "ROUND " + roundManager.currentRound + " CLEARED",
    width / 2,
    height / 2,
  );
}

function displayGameOver() {
  background(0);

  fill(255, 0, 0);
  textSize(64);
  textAlign(CENTER, CENTER);
  text("GAME OVER", width / 2, height / 2 - 50);

  fill(255);
  textSize(32);
  text("Final Score: " + score, width / 2, height / 2 + 20);
  text(
    "Round Reached: " + roundManager.currentRound,
    width / 2,
    height / 2 + 70,
  );

  textSize(20);
  text("Click to return to menu", width / 2, height / 2 + 130);
}

function mousePressed() {
  if (gameOver) {
    window.location.href = "title.html";
    return;
  }

  let buttonX = 20;
  let buttonY = 20;
  let buttonWidth = 180;
  let buttonHeight = 40;

  let clickedBackButton =
    mouseX > buttonX &&
    mouseX < buttonX + buttonWidth &&
    mouseY > buttonY &&
    mouseY < buttonY + buttonHeight;

  if (clickedBackButton) {
    localStorage.clear();
    window.location.href = "name-input.html";
    return;
  }

  if (inputMethod === "mouse") {
    shoot();
  }
}

function keyPressed() {
  if (key === "1" || key === "2" || key === "3") {
    player.switchWeapon(key);
  }

  if (inputMethod === "trackpad") {
    if (keyCode === 32) {
      shoot();
    }
  }
}

function shoot() {
  let shootResult = player.shoot(mouseX, mouseY);

  if (shootResult !== null) {
    if (shootResult.type === "bullet") {
      let bullet = new Bullet(
        player.x,
        player.y,
        mouseX,
        mouseY,
        shootResult.weapon.damage,
      );
      bullets.push(bullet);
    } else if (shootResult.type === "melee") {
      // Trigger melee slash effect
      meleeSlashActive = true;
      meleeSlashStartTime = millis();
      meleeSlashAngle = atan2(mouseY - player.y, mouseX - player.x);

      meleeAttack(shootResult.weapon, meleeSlashAngle);
    }
  }
}

function meleeAttack(weapon, attackAngle) {
  let arcAngle = PI / 3; // 60 degrees each side = 120 degree total arc

  for (let i = zombies.length - 1; i >= 0; i = i - 1) {
    let currentZombie = zombies[i];

    // Check distance from player to zombie center
    let distance = dist(player.x, player.y, currentZombie.x, currentZombie.y);

    // Add zombie radius to effective range so edge hits count
    let effectiveRange = weapon.range + currentZombie.size / 2;

    if (distance < effectiveRange) {
      // Check if zombie is within the arc angle
      let angleToZombie = atan2(
        currentZombie.y - player.y,
        currentZombie.x - player.x,
      );
      let angleDiff = angleToZombie - attackAngle;

      // Normalize angle difference to -PI to PI range
      while (angleDiff > PI) angleDiff -= TWO_PI;
      while (angleDiff < -PI) angleDiff += TWO_PI;

      // Check if within arc (60 degrees = PI/3 on each side)
      if (abs(angleDiff) <= arcAngle) {
        currentZombie.takeDamage(weapon.damage);
      }
    }
  }
}
