class Player {
  constructor(x, y, inputMethod) {
    this.x = x;
    this.y = y;
    this.size = 30;
    this.speed = 3;
    this.color = "#00ff00";
    this.inputMethod = inputMethod;

    this.health = 100;
    this.maxHealth = 100;

    this.currentWeapon = "handgun"; // CHANGED: Default to handgun instead of melee
    this.weapons = {
      melee: {
        name: "Melee",
        damage: 30,
        range: 50,
        cooldown: 500,
        canShoot: true,
        lastShootTime: 0,
      },
      handgun: {
        name: "Handgun",
        damage: 20,
        range: 9999,
        cooldown: 300,
        canShoot: true,
        lastShootTime: 0,
      },
      equipped: null,
    };
  }

  update() {
    let newX = this.x;
    let newY = this.y;

    if (keyIsDown(87)) {
      newY = newY - this.speed;
    }
    if (keyIsDown(83)) {
      newY = newY + this.speed;
    }
    if (keyIsDown(65)) {
      newX = newX - this.speed;
    }
    if (keyIsDown(68)) {
      newX = newX + this.speed;
    }

    this.x = newX;
    this.y = newY;

    let currentTime = millis();
    let currentWeaponData = this.weapons[this.currentWeapon];
    if (
      currentWeaponData &&
      currentTime - currentWeaponData.lastShootTime > currentWeaponData.cooldown
    ) {
      currentWeaponData.canShoot = true;
    }
  }

  display() {
    fill(this.color);
    noStroke();
    circle(this.x, this.y, this.size);

    fill(0);
    circle(this.x - 7, this.y - 5, 5);
    circle(this.x + 7, this.y - 5, 5);

    fill(255, 0, 0);
    arc(this.x, this.y + 3, 15, 10, 0, PI);

    this.displayHealthBar();
  }

  displayHealthBar() {
    let barWidth = 40;
    let barHeight = 5;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 10;

    fill(255, 0, 0);
    noStroke();
    rect(barX, barY, barWidth, barHeight);

    let healthPercentage = this.health / this.maxHealth;
    fill(0, 255, 0);
    rect(barX, barY, barWidth * healthPercentage, barHeight);
  }

  switchWeapon(weaponKey) {
    if (weaponKey === "1") {
      this.currentWeapon = "melee";
    } else if (weaponKey === "2") {
      this.currentWeapon = "handgun";
    } else if (weaponKey === "3" && this.weapons.equipped !== null) {
      this.currentWeapon = "equipped";
    }
  }

  canShoot() {
    let currentWeaponData = this.weapons[this.currentWeapon];
    return currentWeaponData && currentWeaponData.canShoot;
  }

  shoot(targetX, targetY) {
    let currentWeaponData = this.weapons[this.currentWeapon];

    if (currentWeaponData && currentWeaponData.canShoot) {
      currentWeaponData.canShoot = false;
      currentWeaponData.lastShootTime = millis();

      if (this.currentWeapon === "melee") {
        return { type: "melee", weapon: currentWeaponData };
      } else {
        return { type: "bullet", weapon: currentWeaponData };
      }
    }

    return null;
  }

  takeDamage(damage) {
    this.health = this.health - damage;
    if (this.health < 0) {
      this.health = 0;
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
