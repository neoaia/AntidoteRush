function checkCollision(object1, object2) {
  let obj1Left = object1.getLeft();
  let obj1Right = object1.getRight();
  let obj1Top = object1.getTop();
  let obj1Bottom = object1.getBottom();

  let obj2Left = object2.getLeft();
  let obj2Right = object2.getRight();
  let obj2Top = object2.getTop();
  let obj2Bottom = object2.getBottom();

  let isCollidingHorizontally = obj1Right > obj2Left && obj1Left < obj2Right;
  let isCollidingVertically = obj1Bottom > obj2Top && obj1Top < obj2Bottom;

  let isColliding = isCollidingHorizontally && isCollidingVertically;

  return isColliding;
}

function resolveCollision(player, obstacle) {
  let overlapLeft = player.getRight() - obstacle.getLeft();
  let overlapRight = obstacle.getRight() - player.getLeft();
  let overlapTop = player.getBottom() - obstacle.getTop();
  let overlapBottom = obstacle.getBottom() - player.getTop();

  let minOverlap = Math.min(
    overlapLeft,
    overlapRight,
    overlapTop,
    overlapBottom,
  );

  if (minOverlap === overlapLeft) {
    player.x = obstacle.getLeft() - player.size / 2;
  } else if (minOverlap === overlapRight) {
    player.x = obstacle.getRight() + player.size / 2;
  } else if (minOverlap === overlapTop) {
    player.y = obstacle.getTop() - player.size / 2;
  } else if (minOverlap === overlapBottom) {
    player.y = obstacle.getBottom() + player.size / 2;
  }
}

function resolveZombieCollision(zombie, obstacle) {
  let overlapLeft = zombie.getRight() - obstacle.getLeft();
  let overlapRight = obstacle.getRight() - zombie.getLeft();
  let overlapTop = zombie.getBottom() - obstacle.getTop();
  let overlapBottom = obstacle.getBottom() - zombie.getTop();

  let minOverlap = Math.min(
    overlapLeft,
    overlapRight,
    overlapTop,
    overlapBottom,
  );

  if (minOverlap === overlapLeft) {
    zombie.x = obstacle.getLeft() - zombie.size / 2;
  } else if (minOverlap === overlapRight) {
    zombie.x = obstacle.getRight() + zombie.size / 2;
  } else if (minOverlap === overlapTop) {
    zombie.y = obstacle.getTop() - zombie.size / 2;
  } else if (minOverlap === overlapBottom) {
    zombie.y = obstacle.getBottom() + zombie.size / 2;
  }
}
