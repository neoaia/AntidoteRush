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
    this.currentWeapon = "melee";

    this.stamina = 100;
    this.maxStamina = 100;
    this.staminaDrainRate = 20;
    this.staminaRegenRate = 10;
    this.staminaRegenRateInBase = 40;
    this.isSprinting = false;
    this.isInBase = false;

    this._sprintLocked = false;
    this._shiftWasHeld = false;

    this.skillPressed = false;
    this.skillPressTime = 0;
    this.skillDisplayDuration = 800;

    this.statLevels = {
      health: 0,
      stamina: 0,
      speed: 0,
      strength: 0,
      precision: 0,
    };
    this.damageMultiplier = 1.0;
    this.precisionBonus = 0;

    this._kbX = 0;
    this._kbY = 0;
    this._kbDecay = 0.75;
    this._recoilOffset = 0;
    this._recoilDecay = 0.72;
    this._fireSlow = 1.0;
    this._fireSlowDecay = 0.8;

    this._knifeSwinging = false;
    this._knifeSwingStart = 0;
    this._knifeSwingDur = 220;
    this._gameState = null;

    this.weapons = {
      melee: {
        name: "Knife",
        damage: 30,
        range: 50,
        aimRange: 30,
        cooldown: 500,
        canShoot: true,
        lastShootTime: 0,
        knockback: 8,
        recoil: 0.12,
        fireMoveSlowMultiplier: 0.4,
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
        knockback: 3,
        recoil: 0.08,
        fireMoveSlowMultiplier: 0.85,
      },
      equipped: null,
    };

    this.mouseIsHeld = false;
    this.aimAngle = 0;
    this.spriteSheet = null;
    this.spriteState = new SpriteState(8, 4);
  }

  applyKnockback(kbX, kbY) {
    this._kbX = kbX;
    this._kbY = kbY;
  }
  applyRecoil(r) {
    this._recoilOffset = r;
  }
  applyFireSlow(m) {
    this._fireSlow = m;
  }

  triggerKnifeSwing() {
    this._knifeSwinging = true;
    this._knifeSwingStart = pauseClock.now();
  }

  update(canvasWidth, canvasHeight) {
    let moving = false,
      newX = this.x,
      newY = this.y;

    let shiftHeld = keyIsDown(SHIFT);
    if (!shiftHeld) this._sprintLocked = false;
    this.isSprinting = shiftHeld && !this._sprintLocked && this.stamina > 0;
    this._shiftWasHeld = shiftHeld;

    let baseSpd = this.isSprinting ? this.sprintSpeed : this.baseSpeed;
    this.speed = baseSpd * this._fireSlow;

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

    newX += this._kbX;
    newY += this._kbY;
    this._kbX *= this._kbDecay;
    this._kbY *= this._kbDecay;
    if (Math.abs(this._kbX) < 0.05) this._kbX = 0;
    if (Math.abs(this._kbY) < 0.05) this._kbY = 0;

    this._fireSlow += (1.0 - this._fireSlow) * (1 - this._fireSlowDecay);
    if (this._fireSlow > 0.995) this._fireSlow = 1.0;
    this._recoilOffset *= this._recoilDecay;
    if (Math.abs(this._recoilOffset) < 0.001) this._recoilOffset = 0;

    if (
      this._knifeSwinging &&
      pauseClock.now() - this._knifeSwingStart > this._knifeSwingDur
    ) {
      this._knifeSwinging = false;
    }

    let half = this.size / 2;
    this.x = constrain(newX, half, canvasWidth - half);
    this.y = constrain(newY, half, canvasHeight - half);

    if (keyIsDown(65)) this.spriteState.flipX = true;
    if (keyIsDown(68)) this.spriteState.flipX = false;

    let dt = deltaTime / 1000;
    if (this.isSprinting && moving) {
      this.stamina = max(0, this.stamina - this.staminaDrainRate * dt);
      if (this.stamina <= 0) {
        this._sprintLocked = true;
        this.isSprinting = false;
      }
    } else {
      let regenRate = this.isInBase
        ? this.staminaRegenRateInBase
        : this.staminaRegenRate;
      this.stamina = min(this.maxStamina, this.stamina + regenRate * dt);
    }

    let w = this.weapons[this.currentWeapon];
    if (!w) return;
    let now = pauseClock.now();

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

  activateSkill() {
    this.skillPressed = true;
    this.skillPressTime = pauseClock.now();
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
    w.reloadStartTime = pauseClock.now();
    w.canShoot = false;
  }

  display() {
    noStroke();
    fill(0, 0, 0, 80);
    ellipse(this.x, this.y + 24, 32, 10);
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
    this._drawHeldWeapon();
    if (this.skillPressed) {
      let elapsed = pauseClock.now() - this.skillPressTime;
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

  _drawHeldWeapon() {
    let w = this.weapons[this.currentWeapon];
    if (!w) return;
    if (typeof spriteManager === "undefined") return;
    let keyMap = {
      Knife: "gun_knife",
      Handgun: "gun_handgun",
      "Auto Rifle": "gun_rifle",
      Shotgun: "gun_shotgun",
      Sniper: "gun_sniper",
    };
    let sprKey = keyMap[w.name];
    if (!sprKey) return;
    let sheet = spriteManager.get(sprKey);
    if (!sheet || !sheet.img) return;
    let isKnife = w.name === "Knife";
    push();
    translate(this.x, this.y);
    if (isKnife) {
      let sc = 0.18,
        dw = sheet.frameW * sc,
        dh = sheet.frameH * sc;
      let swingAngle;
      if (this._knifeSwinging) {
        let t = Math.min(
          (pauseClock.now() - this._knifeSwingStart) / this._knifeSwingDur,
          1,
        );
        let eased = 1 - Math.pow(1 - t, 2);
        swingAngle = this.aimAngle + map(eased, 0, 1, -PI / 2.5, PI / 2.5);
      } else {
        swingAngle = this.aimAngle - PI / 10;
      }
      rotate(swingAngle);
      scale(-1, 1);
      if (Math.abs(swingAngle) > Math.PI / 2) scale(1, -1);
      imageMode(CENTER);
      let offsetX = -(this.size / 2 + dw * 0.35);
      image(sheet.img, offsetX, 0, dw, dh, 0, 0, sheet.frameW, sheet.frameH);
    } else {
      let sc = 0.9,
        dw = sheet.frameW * sc,
        dh = sheet.frameH * sc;
      let recoilAng = this.aimAngle + Math.PI;
      translate(
        Math.cos(recoilAng) * this._recoilOffset * 8,
        Math.sin(recoilAng) * this._recoilOffset * 8,
      );
      rotate(this.aimAngle);
      if (Math.abs(this.aimAngle) > Math.PI / 2) scale(1, -1);
      imageMode(CENTER);
      image(
        sheet.img,
        this.size / 2 + 2,
        5,
        dw,
        dh,
        0,
        0,
        sheet.frameW,
        sheet.frameH,
      );
    }
    pop();
  }

  displayHealthBar() {
    let barWidth = 40,
      barHeight = 5,
      barX = this.x - barWidth / 2,
      barY = this.y - this.size / 2 - 10;
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
    w.lastShootTime = pauseClock.now();
    if (this.currentWeapon === "melee") return { type: "melee", weapon: w };
    if (w.magSize !== undefined) {
      w.currentAmmo = Math.max(0, w.currentAmmo - 1);
      if (w.currentAmmo <= 0) this.startReload();
    }
    if (w.name === "Shotgun") return { type: "shotgun", weapon: w };
    return { type: "bullet", weapon: w };
  }

  takeDamage(damage, gameState) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    this.spriteState.flash();
    let gs = gameState || this._gameState;
    if (gs) {
      let offsetX = (Math.random() - 0.5) * 16;
      gs.spawnPlayerDamagePopup(
        this.x + offsetX,
        this.y - this.size / 2 - 14,
        damage,
      );
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

Player.prototype.cycleEquippedWeapon = function (direction) {
  const slots = ["melee", "handgun", "equipped"];
  let idx = slots.indexOf(this.currentWeapon);
  if (idx === -1) idx = 1;
  idx = (idx + direction + slots.length) % slots.length;
  if (slots[idx] === "equipped" && this.weapons.equipped === null)
    idx = (idx + direction + slots.length) % slots.length;
  this.currentWeapon = slots[idx];
};
