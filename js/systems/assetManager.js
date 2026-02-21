class AssetManager {
  constructor() {
    this.gameFont = null;
    this.skullIcon = null;
    this.weaponIcons = {};
    this.bgImage = null;
  }

  preload() {
    this.gameFont = loadFont("/assets/fonts/PixelPurl.ttf");
    this.skullIcon = loadImage("/assets/skulls/skull007.png");
    this.weaponIcons.handgun = loadImage("/assets/guns/2.png");
  }

  getFont() {
    return this.gameFont;
  }

  getSkullIcon() {
    return this.skullIcon;
  }

  getWeaponIcon(weaponName) {
    return this.weaponIcons[weaponName];
  }
}
