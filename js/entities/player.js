class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 20;
    this.baseSpeed = 1.3;
    this.sprintSpeed = 2.6;
    this.speed = this.baseSpeed;
    this.color = "#00ff00";
    this.health = 100;
    this.maxHealth = 100;
    this.currentWeapon = "handgun";

    // Stamina — no regen delay
    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrainRate = 20;
    this.staminaRegenRate = 10;
    this.staminaRegenRateInBase = 40;
    this.isSprinting = false;
    this.isInBase = false;

    // Skill slot
    this.skillPressed = false;
    this.skillPressTime = 0;
    this.skillDisplayDuration = 800; // ms to show the indicator

    // Stat upgrade levels (for shopManager to read/write)
    this.statLevels = {
      health: 0,
      stamina: 0,
      speed: 0,
      strength: 0,
      precision: 0,
    };

    // Damage multiplier from strength upgrades
    this.damageMultiplier = 1.0;
    // Precision reduces spread / increases aim range
    this.precisionBonus = 0;

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
        unlimited: true,
        isAuto: false,
        isHeld: false,
      },
      equipped: null,
    };

    this.mouseIsHeld = false;

    // Sprite — managed by SpriteManager / SpriteRenderer
    this.spriteSheet = null; // set by spriteManager.get('player') in setup()
    this.spriteState = new SpriteState(8, 4); // animSpeed=8, totalFrames=4
  }

  update(canvasWidth, canvasHeight) {
    let moving = false;
    let newX = this.x;
    let newY = this.y;

    let shiftHeld = keyIsDown(SHIFT);
    this.isSprinting = shiftHeld && this.stamina > 0;
    this.speed = this.isSprinting ? this.sprintSpeed : this.baseSpeed;

    if (keyIsDown(87)) {
      newY -= this.speed;
      moving = true;
    }
    if (keyIsDown(83)) {
      newY += this.speed;
      moving = true;
    }
    if (keyIsDown(65)) {
      newX -= this.speed;
      moving = true;
    }
    if (keyIsDown(68)) {
      newX += this.speed;
      moving = true;
    }

    let half = this.size / 2;
    this.x = constrain(newX, half, canvasWidth - half);
    this.y = constrain(newY, half, canvasHeight - half);

    // Flip sprite based on horizontal movement
    if (keyIsDown(65)) this.spriteState.flipX = true; // A = left
    if (keyIsDown(68)) this.spriteState.flipX = false; // D = right

    // Stamina — no delay, regens immediately when not sprinting
    let dt = deltaTime / 1000;
    if (this.isSprinting && moving) {
      this.stamina = max(0, this.stamina - this.staminaDrainRate * dt);
    } else {
      let regenRate = this.isInBase
        ? this.staminaRegenRateInBase
        : this.staminaRegenRate;
      this.stamina = min(this.maxStamina, this.stamina + regenRate * dt);
    }

    if (this.stamina <= 0) {
      this.isSprinting = false;
      this.speed = this.baseSpeed;
    }

    // Weapon cooldown / reload
    let w = this.weapons[this.currentWeapon];
    if (!w) return;
    let now = millis();

    if (w.isReloading) {
      if (now - w.reloadStartTime >= w.reloadTime) {
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

    if (!w.canShoot && w.magSize !== undefined) {
      if (now - w.lastShootTime > w.cooldown) {
        if (w.currentAmmo > 0) w.canShoot = true;
        else this.startReload();
      }
    } else if (!w.canShoot && w.magSize === undefined) {
      if (now - w.lastShootTime > w.cooldown) w.canShoot = true;
    }
  }

  // Called when space is pressed
  activateSkill() {
    this.skillPressed = true;
    this.skillPressTime = millis();
    // TODO: actual skill logic goes here later
  }

  tryAutoFire(targetX, targetY) {
    let w = this.weapons[this.currentWeapon];
    if (!w || !w.isAuto || !w.canShoot || w.isReloading) return null;
    return this.shoot(targetX, targetY);
  }

  startReload() {
    let w = this.weapons[this.currentWeapon];
    if (!w || w.magSize === undefined || w.isReloading) return;
    if (w.currentAmmo === w.magSize) return;
    if (!w.unlimited && w.totalAmmo <= 0) return;
    w.isReloading = true;
    w.reloadStartTime = millis();
    w.canShoot = false;
  }

  display() {
    // Try sprite first; fall back to circle
    let drawn = SpriteRenderer.draw(
      this.spriteSheet,
      this.spriteState,
      this.x,
      this.y,
      1.5,
    );
    if (!drawn) {
      fill(this.color);
      noStroke();
      circle(this.x, this.y, this.size);
    }

    this.displayHealthBar();

    // Skill pressed indicator — fades out
    if (this.skillPressed) {
      let elapsed = millis() - this.skillPressTime;
      if (elapsed < this.skillDisplayDuration) {
        let alpha = map(elapsed, 0, this.skillDisplayDuration, 255, 0);
        let floatOff = map(elapsed, 0, this.skillDisplayDuration, 0, 20);
        fill(255, 255, 100, alpha);
        noStroke();
        textSize(11);
        textAlign(CENTER, CENTER);
        text("SKILL", this.x, this.y + this.size / 2 + 16 - floatOff);
      } else {
        this.skillPressed = false;
      }
    }
  }

  displayHealthBar() {
    let barWidth = 40,
      barHeight = 5;
    let barX = this.x - barWidth / 2;
    let barY = this.y - this.size / 2 - 10;
    fill(255, 0, 0);
    noStroke();
    rect(barX, barY, barWidth, barHeight);
    fill(0, 255, 0);
    rect(barX, barY, barWidth * (this.health / this.maxHealth), barHeight);
  }

  switchWeapon(weaponKey) {
    if (weaponKey === "1") this.currentWeapon = "melee";
    else if (weaponKey === "2") this.currentWeapon = "handgun";
    else if (weaponKey === "3" && this.weapons.equipped !== null)
      this.currentWeapon = "equipped";
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
    if (this.currentWeapon === "melee") return { type: "melee", weapon: w };
    if (w.magSize !== undefined) {
      w.currentAmmo = Math.max(0, w.currentAmmo - 1);
      if (w.currentAmmo <= 0) this.startReload();
    }
    if (w.name === "Shotgun") return { type: "shotgun", weapon: w };
    return { type: "bullet", weapon: w };
  }

  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    this.spriteState.flash(); // red flash on hit
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

// Scroll wheel weapon cycling
Player.prototype.cycleEquippedWeapon = function (direction) {
  const slots = ["melee", "handgun", "equipped"];
  let idx = slots.indexOf(this.currentWeapon);
  if (idx === -1) idx = 1;
  idx = (idx + direction + slots.length) % slots.length;
  if (slots[idx] === "equipped" && this.weapons.equipped === null) {
    idx = (idx + direction + slots.length) % slots.length;
  }
  this.currentWeapon = slots[idx];
};
