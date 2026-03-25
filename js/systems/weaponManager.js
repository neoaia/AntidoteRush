class WeaponPickupManager {
  constructor(gameState, canvasWidth, canvasHeight) {
    this.gameState = gameState;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.minWait = 15000;
    this.maxWait = 35000;
    this.nextSpawnTime = pauseClock.now() + this.getRandomWait();
    this.maxPickups = 2;

    this.unsafeZones = [
      { x: 0, y: 0, w: 340, h: 110 },
      { x: canvasWidth / 2 - 100, y: 0, w: 200, h: 100 },
      { x: canvasWidth - 380, y: canvasHeight - 130, w: 380, h: 130 },
    ];

    this.debugWeapon = "null"; // Set to null for normal gameplay
  }

  getRandomWait() {
    return Math.random() * (this.maxWait - this.minWait) + this.minWait;
  }

  getRandomWeaponType() {
    let roll = Math.random() * 100;
    if (roll < 60) return "rifle";
    if (roll < 90) return "shotgun";
    return "sniper";
  }

  isInUnsafeZone(x, y) {
    for (let z of this.unsafeZones) {
      if (x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h) return true;
    }
    return false;
  }

  spawn(base) {
    if (this.gameState.weaponPickups.length >= this.maxPickups) return;
    let W = typeof WORLD_WIDTH !== "undefined" ? WORLD_WIDTH : this.canvasWidth;
    let H =
      typeof WORLD_HEIGHT !== "undefined" ? WORLD_HEIGHT : this.canvasHeight;
    let player = this.gameState.player;

    let spawnRadius = 450,
      minDist = 120;
    let x,
      y,
      valid = false,
      attempts = 0;

    while (!valid && attempts < 40) {
      let angle = Math.random() * Math.PI * 2;
      let dist = minDist + Math.random() * (spawnRadius - minDist);
      x = player.x + Math.cos(angle) * dist;
      y = player.y + Math.sin(angle) * dist;
      x = Math.max(50, Math.min(W - 50, x));
      y = Math.max(50, Math.min(H - 50, y));
      let dx = x - (base.x + base.width / 2);
      let dy = y - (base.y + base.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) > 120) valid = true;
      attempts++;
    }
    this.gameState.weaponPickups.push(
      new WeaponPickup(x, y, this.getRandomWeaponType()),
    );
  }

  getWeaponDef(weaponType) {
    const defs = {
      shotgun: {
        name: "Shotgun",
        damage: 12,
        range: 9999,
        aimRange: 120,
        cooldown: 500,
        magSize: 1,
        reloadTime: 500,
        reloadDelay: 400,
        pellets: 6,
        spreadAngle: 0.4,
        piercing: true,
        maxPierce: 7,
        pierceDamageFalloff: 0.5,
        bulletSize: 4,
        bulletSpeed: 10,
        bulletColor: "#cc4400",
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 1,
        totalAmmo: 16,
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: false,
        isHeld: false,
        knockback: 14,
        recoil: 0.3,
        fireMoveSlowMultiplier: 0.45,
      },
      rifle: {
        name: "Auto Rifle",
        damage: 18,
        range: 9999,
        aimRange: 200,
        cooldown: 80,
        magSize: 25,
        reloadTime: 2000,
        piercing: false,
        maxPierce: 0,
        bulletSize: 5,
        bulletSpeed: 12,
        bulletColor: "#594e1e",
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 25,
        totalAmmo: 75,
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: true,
        isHeld: false,
        knockback: 4,
        recoil: 0.06,
        fireMoveSlowMultiplier: 0.7,
      },
      sniper: {
        name: "Sniper",
        damage: 80,
        range: 9999,
        aimRange: 9999,
        cooldown: 500,
        magSize: 8,
        reloadTime: 3000,
        piercing: true,
        maxPierce: 4,
        pierceDamageFalloff: 0.65,
        bulletSize: 6,
        bulletSpeed: 18,
        bulletColor: "#ffe066",
        canShoot: true,
        lastShootTime: 0,
        currentAmmo: 8,
        totalAmmo: 16,
        isReloading: false,
        reloadStartTime: 0,
        unlimited: false,
        isAuto: false,
        isHeld: false,
        knockback: 20,
        recoil: 0.45,
        fireMoveSlowMultiplier: 0.2,
      },
    };
    return Object.assign({}, defs[weaponType]);
  }

  equipWeapon(player, weaponType) {
    let current = player.weapons.equipped;
    let def = this.getWeaponDef(weaponType);
    if (current !== null && current.name === def.name) {
      current.totalAmmo = def.totalAmmo;
      current.currentAmmo = current.magSize;
      current.isReloading = false;
      current.canShoot = true;
      // ── new ──
      if (typeof audioManager !== "undefined") audioManager.playEquip();
      return;
    }
    player.weapons.equipped = def;
    player.currentWeapon = "equipped";
    // ── new ──
    if (typeof audioManager !== "undefined") audioManager.playEquip();
  }

  applyDebugWeapon(player) {
    if (this.debugWeapon !== null) this.equipWeapon(player, this.debugWeapon);
  }

  update(player, base) {
    if (pauseClock.now() >= this.nextSpawnTime) {
      this.spawn(base);
      this.nextSpawnTime = pauseClock.now() + this.getRandomWait();
    }

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

    let eq = player.weapons.equipped;
    if (
      eq !== null &&
      !eq.unlimited &&
      eq.totalAmmo <= 0 &&
      eq.currentAmmo <= 0
    ) {
      player.weapons.equipped = null;
      if (player.currentWeapon === "equipped") player.currentWeapon = "handgun";
    }
  }

  display() {
    for (let pickup of this.gameState.weaponPickups) pickup.display();
  }
}
