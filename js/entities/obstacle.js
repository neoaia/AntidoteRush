class Obstacle {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;

    if (type === "house") {
      this.color = "#8B4513";
    } else if (type === "car") {
      this.color = "#FF0000";
    } else if (type === "barricade") {
      this.color = "#FFD700";
    } else {
      this.color = "#666666";
    }
  }

  display() {
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.height);

    if (this.type === "house") {
      fill(100);
      rect(this.x + 10, this.y + 10, 20, 25);
      rect(this.x + this.width - 30, this.y + 10, 20, 25);
    }

    if (this.type === "car") {
      fill(50);
      rect(this.x + 5, this.y + 10, 10, 10);
      rect(this.x + this.width - 15, this.y + 10, 10, 10);
    }

    if (this.type === "barricade") {
      stroke(0);
      strokeWeight(3);
      line(this.x, this.y, this.x + this.width, this.y + this.height);
      line(this.x + this.width, this.y, this.x, this.y + this.height);
    }
  }

  getLeft() {
    return this.x;
  }

  getRight() {
    return this.x + this.width;
  }

  getTop() {
    return this.y;
  }

  getBottom() {
    return this.y + this.height;
  }
}
