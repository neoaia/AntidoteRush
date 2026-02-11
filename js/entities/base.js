class Base {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 80;
    this.height = 80;
    this.color = "#00FFFF";
  }

  display() {
    fill(this.color);
    stroke(0);
    strokeWeight(4);
    rect(this.x, this.y, this.width, this.height);

    fill(0);
    noStroke();
    textSize(12);
    textAlign(CENTER, CENTER);
    text("BASE", this.x + this.width / 2, this.y + this.height / 2);
 
  }

  checkPlayerInside(player) {
    let playerLeft = player.getLeft();
    let playerRight = player.getRight();
    let playerTop = player.getTop();
    let playerBottom = player.getBottom();

    let baseLeft = this.x;
    let baseRight = this.x + this.width;
    let baseTop = this.y;
    let baseBottom = this.y + this.height;

    let isInsideHorizontally = playerRight > baseLeft && playerLeft < baseRight;
    let isInsideVertically = playerBottom > baseTop && playerTop < baseBottom;

    return isInsideHorizontally && isInsideVertically;
  }
}
