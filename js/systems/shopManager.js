class ShopManager {
  constructor(gameState) {
    this.gameState = gameState;

    // ── STAT SHOP ────────────────────────────────────────────────────────────
    // Each stat starts at cost 1, increases by 1 per purchase
    this.statShop = {
      health: {
        label: "Max Health",
        description: "Increasemax HP per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          player.maxHealth += 2;
          player.health = Math.min(player.health + 5, player.maxHealth);
        },
      },
      stamina: {
        label: "Max Stamina",
        description: "Increase max stamina per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          player.maxStamina += 2;
          player.stamina = Math.min(player.stamina + 5, player.maxStamina);
        },
      },
      speed: {
        label: "Move Speed",
        description: "Increase speed per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          player.baseSpeed += 0.05;
          player.sprintSpeed = player.baseSpeed * 2;
        },
      },
      strength: {
        label: "Strength",
        description: "Increase melee damage per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          // +2 flat melee damage
          if (player.weapons.melee) player.weapons.melee.damage += .5;
        },
      },
      precision: {
        label: "Precision",
        description: "Increase all bullet damage per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          player.precisionBonus += 2;
          // Apply +2 damage to all current weapons
          if (player.weapons.handgun) player.weapons.handgun.damage += .5;
          if (player.weapons.equipped) player.weapons.equipped.damage += .5;
        },
      },
    };

    this.getStatCost = (key) => {
      let s = this.statShop[key];
      return s.baseCost + s.purchased;
    };

    // ── PASSIVE SHOP ─────────────────────────────────────────────────────────
    // 10 placeholders — to be designed later
    this.passiveShop = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      label: "Passive " + (i + 1),
      description: "[Coming soon]",
      unlockCost: 15 + i * 5,
      upgradeCost: 10 + i * 3,
      unlocked: false,
      level: 0,
      apply: (player, level) => {
        /* placeholder */
      },
    }));

    // ── ACTIVE SHOP ──────────────────────────────────────────────────────────
    // 10 placeholders — to be designed later
    this.activeShop = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      label: "Active " + (i + 1),
      description: "[Coming soon]",
      unlockCost: 20 + i * 5,
      upgradeCost: 12 + i * 3,
      unlocked: false,
      level: 0,
      equipped: false,
      apply: (player, level) => {
        /* placeholder */
      },
    }));
  }

  // Returns cost of current level for a stat
  getStatCurrentCost(key) {
    let s = this.statShop[key];
    return s.baseCost + s.purchased;
  }

  buyStatUpgrade(key, player) {
    let cost = this.getStatCurrentCost(key);
    if (this.gameState.coins < cost) return false;
    this.gameState.coins -= cost;
    this.statShop[key].purchased++;
    this.statShop[key].apply(player);
    return true;
  }

  buyPassiveUnlock(id) {
    let p = this.passiveShop[id];
    if (p.unlocked) return false;
    if (this.gameState.coins < p.unlockCost) return false;
    this.gameState.coins -= p.unlockCost;
    p.unlocked = true;
    p.level = 1;
    return true;
  }

  upgradePassive(id, player) {
    let p = this.passiveShop[id];
    if (!p.unlocked) return false;
    let cost = p.upgradeCost + (p.level - 1) * 5;
    if (this.gameState.coins < cost) return false;
    this.gameState.coins -= cost;
    p.level++;
    p.apply(player, p.level);
    return true;
  }

  buyActiveUnlock(id) {
    let a = this.activeShop[id];
    if (a.unlocked) return false;
    if (this.gameState.coins < a.unlockCost) return false;
    this.gameState.coins -= a.unlockCost;
    a.unlocked = true;
    a.level = 1;
    return true;
  }

  upgradeActive(id, player) {
    let a = this.activeShop[id];
    if (!a.unlocked) return false;
    let cost = a.upgradeCost + (a.level - 1) * 5;
    if (this.gameState.coins < cost) return false;
    this.gameState.coins -= cost;
    a.level++;
    a.apply(player, a.level);
    return true;
  }

  equipActive(id, player) {
    let a = this.activeShop[id];
    if (!a.unlocked) return false;
    // Unequip all others first
    for (let act of this.activeShop) act.equipped = false;
    a.equipped = true;
    // TODO: bind to player's active skill slot
    return true;
  }
}
