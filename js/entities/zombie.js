class Zombie {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;

    if (type === "normal") {
      this.size = 25;
      this.speed = 1;
      this.health = 50;
      this.maxHealth = 50;
      this.damage = 10;
      this.color = "#00FF00";
      this.points = 10;
    } else if (type === "witch") {
      this.size = 28;
      this.speed = 1.5;
      this.health = 75;
      this.maxHealth = 75;
      this.damage = 15;
      this.color = "#FF00FF";
      this.points = 15;
    } else if (type === "crawler") {
      this.size = 22;
      this.speed = 2;
      this.health = 60;
      this.maxHealth = 60;
      this.damage = 20;
      this.color = "#FFFF00";
      this.points = 20;
    } else if (type === "slasher") {
      this.size = 32;
      this.speed = 0.8;
      this.health = 100;
      this.maxHealth = 100;
      this.damage = 25;
      this.color = "#FF0000";
      this.points = 25;
    }
    else if (type === "tank") {
      this.size = 60;
      this.speed = 1;
      this.health = 500;
      this.maxHealth = 300;
      this.damage = 50;
      this.color = "#FF0000";
      this.points = 50;
    }

    this.attackCooldown = 1000;
    this.lastAttackTime = 0;

    // Wall following / pathfinding
    this.followingWall = false;
    this.wallFollowDirection = 1; // 1 = clockwise, -1 = counter-clockwise
    this.currentObstacle = null;
    this.lastStuckTime = 0;
  }

  update(playerX, playerY, obstacles) {
    let dx = playerX - this.x;
    let dy = playerY - this.y;
    let distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

    if (distanceToPlayer > 0) {
      let targetDirX = dx / distanceToPlayer;
      let targetDirY = dy / distanceToPlayer;

      let moveX = 0;
      let moveY = 0;

      if (this.followingWall && this.currentObstacle) {
        // Check if we have clear path to player now
        if (this.hasClearPathToPlayer(playerX, playerY, obstacles)) {
          this.followingWall = false;
          this.currentObstacle = null;
          moveX = targetDirX;
          moveY = targetDirY;
        } else {
          // Check if we're at a corner
          if (this.isAtCorner()) {
            // JUMP away from obstacle by 1.5x body size
            let wallDirection = this.getWallFollowDirection(
              targetDirX,
              targetDirY,
            );
            moveX = wallDirection.x * (this.size * 3); // Size + half of size
            moveY = wallDirection.y * (this.size * 3);

            // Apply the jump
            this.x = this.x + moveX;
            this.y = this.y + moveY;
            return; // Skip normal movement this frame
          } else {
            // Follow the wall normally
            let wallDirection = this.getWallFollowDirection(
              targetDirX,
              targetDirY,
            );
            moveX = wallDirection.x;
            moveY = wallDirection.y;
          }
        }
      } else {
        // Normal movement towards player
        moveX = targetDirX;
        moveY = targetDirY;
      }

      this.x = this.x + moveX * this.speed;
      this.y = this.y + moveY * this.speed;
    }
  }

  isAtCorner() {
    if (!this.currentObstacle) return false;

    let obs = this.currentObstacle;
    let corners = [
      { x: obs.getLeft(), y: obs.getTop() },
      { x: obs.getRight(), y: obs.getTop() },
      { x: obs.getRight(), y: obs.getBottom() },
      { x: obs.getLeft(), y: obs.getBottom() },
    ];

    // Check if zombie is close to any corner
    for (let i = 0; i < corners.length; i++) {
      let dist = Math.sqrt(
        (this.x - corners[i].x) * (this.x - corners[i].x) +
          (this.y - corners[i].y) * (this.y - corners[i].y),
      );

      if (dist < this.size * 0.5) {
        return true;
      }
    }

    return false;
  }

  getWallFollowDirection(targetDirX, targetDirY) {
    // Get perpendicular direction (tangent to wall)
    let perpX = -targetDirY * this.wallFollowDirection;
    let perpY = targetDirX * this.wallFollowDirection;

    // Mix some forward movement with wall following
    let mixedX = targetDirX * 0.2 + perpX * 0.8;
    let mixedY = targetDirY * 0.2 + perpY * 0.8;

    // Normalize
    let length = Math.sqrt(mixedX * mixedX + mixedY * mixedY);
    if (length > 0) {
      mixedX = mixedX / length;
      mixedY = mixedY / length;
    }

    return { x: mixedX, y: mixedY };
  }

  hasClearPathToPlayer(playerX, playerY, obstacles) {
    // Simple raycast check - sample points along line to player
    let steps = 5;
    for (let i = 1; i <= steps; i++) {
      let t = i / steps;
      let checkX = this.x + (playerX - this.x) * t;
      let checkY = this.y + (playerY - this.y) * t;

      // Check if this point is inside any obstacle
      for (let j = 0; j < obstacles.length; j++) {
        let obs = obstacles[j];
        if (
          checkX > obs.getLeft() &&
          checkX < obs.getRight() &&
          checkY > obs.getTop() &&
          checkY < obs.getBottom()
        ) {
          return false; // Path blocked
        }
      }
    }
    return true; // Clear path!
  }

  startFollowingWall(obstacle) {
    this.followingWall = true;
    this.currentObstacle = obstacle;
    this.lastStuckTime = millis();

    // Determine which direction to follow wall
    // Check which side of obstacle we're on
    let obstacleCenterX = (obstacle.getLeft() + obstacle.getRight()) / 2;
    let obstacleCenterY = (obstacle.getTop() + obstacle.getBottom()) / 2;

    let relativeX = this.x - obstacleCenterX;
    let relativeY = this.y - obstacleCenterY;

    // Use cross product to determine clockwise or counter-clockwise
    if (relativeX * relativeY > 0) {
      this.wallFollowDirection = 1; // Clockwise
    } else {
      this.wallFollowDirection = -1; // Counter-clockwise
    }
  }

  stopFollowingWall() {
    this.followingWall = false;
    this.currentObstacle = null;
  }

  display() {
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    circle(this.x, this.y, this.size);

    fill(255, 0, 0);
    noStroke();
    circle(this.x - 6, this.y - 5, 4);
    circle(this.x + 6, this.y - 5, 4);

    this.displayHealthBar();

    // Debug: show if following wall
    // if (this.followingWall) {
    //   fill(255, 255, 0);
    //   textAlign(CENTER, CENTER);
    //   text("WALL", this.x, this.y - this.size);
    // }
  }

  displayHealthBar() {
    let barWidth = 30;
    let barHeight = 4;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 8;

    fill(50);
    noStroke();
    rect(barX, barY, barWidth, barHeight);

    let healthPercentage = this.health / this.maxHealth;
    fill(255, 0, 0);
    rect(barX, barY, barWidth * healthPercentage, barHeight);
  }

  canAttack() {
    let currentTime = millis();
    if (currentTime - this.lastAttackTime > this.attackCooldown) {
      this.lastAttackTime = currentTime;
      return true;
    }
    return false;
  }

  takeDamage(damage) {
    this.health = this.health - damage;
    if (this.health <= 0) {
      this.active = false;
    }
  }

  getLeft() {
    return this.x - this.size / 2;
  }

  getRight() {
    return this.x + this.size / 2;
  }

  getTop() {
    return this.y - this.size / 2;
  }

  getBottom() {
    return this.y + this.size / 2;
  }
}
