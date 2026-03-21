// checkCollision uses getLeft/Right/Top/Bottom from each entity.
// Zombies now expose a rect hitbox (hitW x hitH) via these getters,
// so AABB collision works correctly for player-zombie contact too.

function checkCollision(object1, object2) {
  let isCollidingHorizontally =
    object1.getRight() > object2.getLeft() &&
    object1.getLeft() < object2.getRight();
  let isCollidingVertically =
    object1.getBottom() > object2.getTop() &&
    object1.getTop() < object2.getBottom();
  return isCollidingHorizontally && isCollidingVertically;
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

  if (minOverlap === overlapLeft)
    player.x = obstacle.getLeft() - player.size / 2;
  else if (minOverlap === overlapRight)
    player.x = obstacle.getRight() + player.size / 2;
  else if (minOverlap === overlapTop)
    player.y = obstacle.getTop() - player.size / 2;
  else if (minOverlap === overlapBottom)
    player.y = obstacle.getBottom() + player.size / 2;
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

  if (minOverlap === overlapLeft)
    zombie.x = obstacle.getLeft() - zombie.size / 2;
  else if (minOverlap === overlapRight)
    zombie.x = obstacle.getRight() + zombie.size / 2;
  else if (minOverlap === overlapTop)
    zombie.y = obstacle.getTop() - zombie.size / 2;
  else if (minOverlap === overlapBottom)
    zombie.y = obstacle.getBottom() + zombie.size / 2;
}
