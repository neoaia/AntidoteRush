class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.speed = 1.3;
    this.color = "#00ff00";
    this.health = 100;
    this.maxHealth = 100;
    this.currentWeapon = "handgun";
    this.weapons = {
      melee: {
        name: "Melee",
        damage: 30,
        range: 50,
        aimRange: 30,
        cooldown: 500,
        canShoot: true,
        lastShootTime: 0,
      },
      handgun: {
        name: "Handgun",
        damage: 20,
        range: 9999,
        aimRange: 100,
        cooldown: 300,
        magSize: 12,
        reloadTime: 1500,
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 12,
        isReloading: false,
        reloadStartTime: 0,
        unlimited: true, // never disappears
        isAuto: false,
        isHeld: false,
      },
      equipped: null,
    };

    // Track mouse hold state for auto weapons
    this.mouseIsHeld = false;
  }

  update() {
    let newX = this.x;
    let newY = this.y;
    if (keyIsDown(87)) newY -= this.speed;
    if (keyIsDown(83)) newY += this.speed;
    if (keyIsDown(65)) newX -= this.speed;
    if (keyIsDown(68)) newX += this.speed;
    this.x = newX;
    this.y = newY;

    let w = this.weapons[this.currentWeapon];
    if (!w) return;

    let currentTime = millis();

    // Handle reload completion
    if (w.isReloading) {
      if (currentTime - w.reloadStartTime >= w.reloadTime) {
        // For limited guns, only reload what's left in totalAmmo
        if (w.unlimited) {
          w.currentAmmo = w.magSize;
        } else {
          let needed = w.magSize - w.currentAmmo;
          let canLoad = Math.min(needed, w.totalAmmo);
          w.currentAmmo += canLoad;
          w.totalAmmo -= canLoad;
        }
        w.isReloading = false;
        w.canShoot = true;
      }
      return;
    }

    // Handle cooldown recovery
    if (!w.canShoot && w.magSize !== undefined) {
      if (currentTime - w.lastShootTime > w.cooldown) {
        if (w.currentAmmo > 0) {
          w.canShoot = true;
        } else {
          this.startReload();
        }
      }
    } else if (!w.canShoot && w.magSize === undefined) {
      // Melee cooldown
      if (currentTime - w.lastShootTime > w.cooldown) {
        w.canShoot = true;
      }
    }

    // Auto fire — keep shooting if mouse held and weapon is auto
    if (this.mouseIsHeld && w.isAuto && w.canShoot && !w.isReloading) {
      // Signal that a shot should fire — handled externally via tryAutoFire()
    }
  }

  // Called every frame from game.js when mouse is held, for auto weapons
  tryAutoFire(targetX, targetY) {
    let w = this.weapons[this.currentWeapon];
    if (!w || !w.isAuto) return null;
    if (!w.canShoot || w.isReloading) return null;
    return this.shoot(targetX, targetY);
  }

  startReload() {
    let w = this.weapons[this.currentWeapon];
    if (!w || w.magSize === undefined || w.isReloading) return;
    if (w.currentAmmo === w.magSize) return; // already full
    if (!w.unlimited && w.totalAmmo <= 0) return; // no ammo left to reload from
    w.isReloading = true;
    w.reloadStartTime = millis();
    w.canShoot = false;
  }

  display() {
    fill(this.color);
    noStroke();
    circle(this.x, this.y, this.size);
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
    let w = this.weapons[this.currentWeapon];
    return w && w.canShoot && !w.isReloading;
  }

  shoot(targetX, targetY) {
    let w = this.weapons[this.currentWeapon];
    if (!w || !w.canShoot || w.isReloading) return null;

    w.canShoot = false;
    w.lastShootTime = millis();

    if (this.currentWeapon === "melee") {
      return { type: "melee", weapon: w };
    }

    // Consume ammo
    if (w.magSize !== undefined) {
      w.currentAmmo = Math.max(0, w.currentAmmo - 1);
      if (w.currentAmmo <= 0) {
        this.startReload();
      }
    }

    if (w.name === "Shotgun") {
      return { type: "shotgun", weapon: w };
    }

    return { type: "bullet", weapon: w };
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
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
