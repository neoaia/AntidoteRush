class WeaponPickupManager {
  constructor(gameState, canvasWidth, canvasHeight) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Spawn timing — longer intervals
    this.minWait = 15000;
    this.maxWait = 35000;
    this.nextSpawnTime = millis() + this.getRandomWait();

    // Max pickups on map at once
    this.maxPickups = 2;
  }

  getRandomWait() {
    return Math.random() * (this.maxWait - this.minWait) + this.minWait;
  }

  // Weighted random: AR=60%, Shotgun=30%, Sniper=10%
  getRandomWeaponType() {
    let roll = Math.random() * 100;
    if (roll < 60) return "rifle";
    if (roll < 90) return "shotgun";
    return "sniper";
  }

  spawn(base) {
    if (this.gameState.weaponPickups.length >= this.maxPickups) return;

    let margin = 60;
    let x, y;
    let tooClose = true;
    let attempts = 0;

    while (tooClose && attempts < 25) {
      x = Math.random() * (this.canvasWidth - margin * 2) + margin;
      y = Math.random() * (this.canvasHeight - margin * 2) + margin;
      let dx = x - (base.x + base.width / 2);
      let dy = y - (base.y + base.height / 2);
      let d = Math.sqrt(dx * dx + dy * dy);
      if (d > 150) tooClose = false;
      attempts++;
    }

    let type = this.getRandomWeaponType();
    this.gameState.weaponPickups.push(new WeaponPickup(x, y, type));
  }

  getWeaponDef(weaponType) {
    const defs = {
      shotgun: {
        name: "Shotgun",
        damage: 20, // nerfed per pellet; still hurts up close (6 pellets = up to 72 if all connect)
        range: 9999,
        aimRange: 120,
        cooldown: 500,
        magSize: 1,
        reloadTime: 500,
        pellets: 6,
        spreadAngle: 0.4,
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 1,
        totalAmmo: 16, // 16 shells total
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: false,
        isHeld: false,
      },
      rifle: {
        name: "Auto Rifle",
        damage: 18,
        range: 9999,
        aimRange: 200,
        cooldown: 80,
        magSize: 25,
        reloadTime: 2000,
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 25,
        totalAmmo: 75, // 3 mags x 25
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: true, // hold-to-fire
        isHeld: false,
      },
      sniper: {
        name: "Sniper",
        damage: 80,
        range: 9999,
        aimRange: 9999,
        cooldown: 500,
        magSize: 8,
        reloadTime: 3000,
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 8,
        totalAmmo: 16, // 2 mags x 8
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: false,
        isHeld: false,
      },
    };
    return Object.assign({}, defs[weaponType]); // return a fresh copy
  }

  equipWeapon(player, weaponType) {
    let current = player.weapons.equipped;
    let def = this.getWeaponDef(weaponType);

    // Same gun already equipped — refill ammo only
    if (current !== null && current.name === def.name) {
      current.totalAmmo = def.totalAmmo;
      current.currentAmmo = current.magSize;
      current.isReloading = false;
      current.canShoot = true;
      return;
    }

    // Equip fresh copy, auto-switch to slot 3
    player.weapons.equipped = def;
    player.currentWeapon = "equipped";
  }

  update(player, base) {
    // Spawn check
    if (millis() >= this.nextSpawnTime) {
      this.spawn(base);
      this.nextSpawnTime = millis() + this.getRandomWait();
    }

    // Update pickups
    for (let i = this.gameState.weaponPickups.length - 1; i >= 0; i--) {
      let pickup = this.gameState.weaponPickups[i];
      pickup.update();

      if (!pickup.active) {
        this.gameState.weaponPickups.splice(i, 1);
        continue;
      }

      if (pickup.checkPlayerPickup(player)) {
        this.equipWeapon(player, pickup.weaponType);
        this.gameState.weaponPickups.splice(i, 1);
      }
    }

    // Drop gun when totally out of ammo
    let eq = player.weapons.equipped;
    if (eq !== null && !eq.unlimited) {
      if (eq.totalAmmo <= 0 && eq.currentAmmo <= 0) {
        player.weapons.equipped = null;
        if (player.currentWeapon === "equipped") {
          player.currentWeapon = "handgun";
        }
      }
    }
  }

  display() {
    for (let i = 0; i < this.gameState.weaponPickups.length; i++) {
      this.gameState.weaponPickups[i].display();
    }
  }
}
