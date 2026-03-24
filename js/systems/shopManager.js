class ShopManager {
  constructor(gameState) {
    this.gameState = gameState;

    // ── STAT SHOP ─────────────────────────────────────────────────────────
    // Cost formula: baseCost + (purchased * costGrowth)
    this.statShop = {
      health: {
        label: "Max Health",
        description: "Increases max HP, restores the added amount immediately.",
        baseCost: 2,
        costGrowth: 3,
        maxLevel: Infinity, // Tinanggal na ang cap
        purchased: 0,
        apply: (player) => {
          const gainAmount = 10;
          player.maxHealth += gainAmount;
          player.health = Math.min(
            player.health + gainAmount,
            player.maxHealth,
          );
        },
      },
      stamina: {
        label: "Max Stamina",
        description: "Increases max stamina, letting you sprint longer.",
        baseCost: 2,
        costGrowth: 3,
        maxLevel: Infinity, // Tinanggal na ang cap
        purchased: 0,
        apply: (player) => {
          const staminaGain = 10;
          player.maxStamina += staminaGain;
          player.stamina = Math.min(
            player.stamina + staminaGain,
            player.maxStamina,
          );
        },
      },
      speed: {
        label: "Move Speed",
        description: "Increases base movement speed. Capped at 10 upgrades.",
        baseCost: 3,
        costGrowth: 2,
        maxLevel: 10,
        purchased: 0,
        apply: (player) => {
          const SPEED_CAP = 4.1;
          const SPRINT_CAP = SPEED_CAP * 2;
          const speedGain = 0.3;
          player.baseSpeed = Math.min(player.baseSpeed + speedGain, SPEED_CAP);
          player.sprintSpeed = Math.min(
            player.sprintSpeed + speedGain * 2,
            SPRINT_CAP,
          );
        },
      },
      strength: {
        label: "Strength",
        description: "Boosts melee knife damage.",
        baseCost: 20,
        costGrowth: 25,
        maxLevel: Infinity, // Tinanggal na ang cap
        purchased: 0,
        apply: (player) => {
          if (player.weapons.melee) player.weapons.melee.damage += 5;
        },
      },
      precision: {
        label: "Precision",
        description: "Increases all ranged weapon damage.",
        baseCost: 25,
        costGrowth: 30,
        maxLevel: Infinity, // Tinanggal na ang cap
        purchased: 0,
        apply: (player) => {
          player.precisionBonus = (player.precisionBonus || 0) + 3;
          if (player.weapons.handgun) player.weapons.handgun.damage += 3;
          if (player.weapons.equipped) player.weapons.equipped.damage += 3;
        },
      },
    };
  }

  getStatCurrentCost(statKey) {
    let statItem = this.statShop[statKey];
    return statItem.baseCost + statItem.purchased * statItem.costGrowth;
  }

  isMaxLevel(statKey) {
    let statItem = this.statShop[statKey];
    return statItem.purchased >= statItem.maxLevel;
  }

  buyStatUpgrade(statKey, player) {
    if (this.isMaxLevel(statKey)) return false;
    let currentCost = this.getStatCurrentCost(statKey);
    if (this.gameState.coins < currentCost) return false;
    this.gameState.coins -= currentCost;
    this.statShop[statKey].purchased++;
    this.statShop[statKey].apply(player);
    if (typeof audioManager !== "undefined") audioManager.playPurchase();
    return true;
  }
}
