class ShopManager {
  constructor(gameState) {
    this.gameState = gameState;

    // ── STAT SHOP ─────────────────────────────────────────────────────────
    // Cost formula: baseCost + (purchased * costGrowth)
    // So first upgrade costs baseCost, second costs baseCost + costGrowth, etc.
    this.statShop = {
      health: {
        label: "Max Health",
        description:
          "Increases max HP, restores the added amount immediately.",
        baseCost: 2,
        costGrowth: 1, // cost rises by 1 coin each purchase
        maxLevel: 20,
        purchased: 0,
        apply: (player) => {
          const gain = 15;
          player.maxHealth += gain;
          player.health = Math.min(player.health + gain, player.maxHealth);
        },
      },
      stamina: {
        label: "Max Stamina",
        description:
          "Increases max stamina, letting you sprint longer.",
        baseCost: 2,
        costGrowth: 1,
        maxLevel: 15,
        purchased: 0,
        apply: (player) => {
          player.maxStamina += 12;
          player.stamina = Math.min(player.stamina + 12, player.maxStamina);
        },
      },
      speed: {
        label: "Move Speed",
        description: "Increases base movement speed. Capped at 10 upgrades.",
        baseCost: 3,
        costGrowth: 2, // gets expensive faster so player can't spam it
        maxLevel: 10,
        purchased: 0,
        apply: (player) => {
          const SPEED_CAP = 2.6; // absolute ceiling for base speed
          const SPRINT_CAP = SPEED_CAP * 2;
          const gain = 0.08;
          player.baseSpeed = Math.min(player.baseSpeed + gain, SPEED_CAP);
          player.sprintSpeed = Math.min(
            player.sprintSpeed + gain * 2,
            SPRINT_CAP,
          );
        },
      },
      strength: {
        label: "Strength",
        description:
          "Boosts melee knife damage.",
        baseCost: 2,
        costGrowth: 1,
        maxLevel: 15,
        purchased: 0,
        apply: (player) => {
          if (player.weapons.melee) player.weapons.melee.damage += 5;
        },
      },
      precision: {
        label: "Precision",
        description:
          "Increases all ranged weapon damage.",
        baseCost: 2,
        costGrowth: 1,
        maxLevel: 15,
        purchased: 0,
        apply: (player) => {
          player.precisionBonus = (player.precisionBonus || 0) + 3;
          if (player.weapons.handgun) player.weapons.handgun.damage += 3;
          if (player.weapons.equipped) player.weapons.equipped.damage += 3;
        },
      },
    };
  }

  getStatCurrentCost(key) {
    let s = this.statShop[key];
    return s.baseCost + s.purchased * s.costGrowth;
  }

  isMaxLevel(key) {
    let s = this.statShop[key];
    return s.purchased >= s.maxLevel;
  }

  buyStatUpgrade(key, player) {
    if (this.isMaxLevel(key)) return false;
    let cost = this.getStatCurrentCost(key);
    if (this.gameState.coins < cost) return false;
    this.gameState.coins -= cost;
    this.statShop[key].purchased++;
    this.statShop[key].apply(player);
    if (typeof audioManager !== "undefined") audioManager.playPurchase();
    return true;
  }
}
