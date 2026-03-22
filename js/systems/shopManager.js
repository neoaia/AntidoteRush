class ShopManager {
  constructor(gameState) {
    this.gameState = gameState;

    // ── STAT SHOP ─────────────────────────────────────────────────────────
    this.statShop = {
      health: {
        label: "Max Health",
        description: "Increase max HP per upgrade",
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
          player.baseSpeed += 0.01;
          player.sprintSpeed = player.baseSpeed * 2;
        },
      },
      strength: {
        label: "Strength",
        description: "Increase melee damage per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          if (player.weapons.melee) player.weapons.melee.damage += 0.5;
        },
      },
      precision: {
        label: "Precision",
        description: "Increase all bullet damage per upgrade",
        baseCost: 1,
        purchased: 0,
        apply: (player) => {
          player.precisionBonus += 2;
          if (player.weapons.handgun) player.weapons.handgun.damage += 0.5;
          if (player.weapons.equipped) player.weapons.equipped.damage += 0.5;
        },
      },
    };
  }

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
}
