var SPRITE_DEFS = {
  player: {
    path: "../assets/player/player-bounce.png",
    frames: 4,
    layout: "horizontal",
  },

  zombie_normal: {
    path: "../assets/zombies/normal.png",
    frames: 3,
    layout: "horizontal",
  },
  zombie_witch: {
    path: "../assets/zombies/witch.png",
    frames: 3,
    layout: "horizontal",
  },
  zombie_crawler: {
    path: "../assets/zombies/crawler.png",
    frames: 3,
    layout: "horizontal",
  },
  zombie_slasher: {
    path: "../assets/zombies/slasher.png",
    frames: 3,
    layout: "horizontal",
  },
  antidote: {
    path: "../assets/items/antidote.png",
    frames: 1,
    layout: "horizontal",
  },
  base: { path: "../assets/base/base.png", frames: 1, layout: "horizontal" },
  weapon_box: {
    path: "../assets/items/weapon-box.png",
    frames: 1,
    layout: "horizontal",
  },

  gun_handgun: {
    path: "../assets/guns/handgun.png",
    frames: 1,
    layout: "horizontal",
  },
  gun_rifle: {
    path: "../assets/guns/rifle.png",
    frames: 1,
    layout: "horizontal",
  },
  gun_shotgun: {
    path: "../assets/guns/shotgun.png",
    frames: 1,
    layout: "horizontal",
  },
  gun_sniper: {
    path: "../assets/guns/sniper.png",
    frames: 1,
    layout: "horizontal",
  },

  // ── Land tiles (128x128) ──────────────────────────────────────────────────
  land01: {
    path: "../assets/grass/land_1.png",
    frames: 1,
    layout: "horizontal",
  },
  land02: {
    path: "../assets/grass/land_2.png",
    frames: 1,
    layout: "horizontal",
  },
  land03: {
    path: "../assets/grass/land_3.png",
    frames: 1,
    layout: "horizontal",
  },

  // ── Grass (64x64) ─────────────────────────────────────────────────────────
  grass_1: {
    path: "../assets/grass/grass_1.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_2: {
    path: "../assets/grass/grass_2.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_3: {
    path: "../assets/grass/grass_3.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_4: {
    path: "../assets/grass/grass_4.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_5: {
    path: "../assets/grass/grass_5.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_6: {
    path: "../assets/grass/grass_6.png",
    frames: 1,
    layout: "horizontal",
  },
  grass_7: {
    path: "../assets/grass/grass_7.png",
    frames: 1,
    layout: "horizontal",
  },

  // ── Bushes (128x128) ──────────────────────────────────────────────────────
  bush_1: {
    path: "../assets/grass/bush_1.png",
    frames: 1,
    layout: "horizontal",
  },
  bush_2: {
    path: "../assets/grass/bush_2.png",
    frames: 1,
    layout: "horizontal",
  },

  icon_heart: {
    path: "../assets/gui/heart.png",
    frames: 1,
    layout: "horizontal",
  },
  icon_stamina: {
    path: "../assets/gui/stamina.png",
    frames: 1,
    layout: "horizontal",
  },
  icon_coin: {
    path: "../assets/gui/coin.png",
    frames: 1,
    layout: "horizontal",
  },
};

class SpriteManager {
  constructor() {
    this._images = {};
    this._sprites = {};
  }

  preload() {
    for (let key of Object.keys(SPRITE_DEFS)) {
      let def = SPRITE_DEFS[key];
      this._images[key] = loadImage(def.path);
    }
  }

  init() {
    for (let key of Object.keys(SPRITE_DEFS)) {
      let def = SPRITE_DEFS[key];
      this._sprites[key] = new SpriteSheet(
        this._images[key],
        def.frames,
        def.layout,
      );
    }
  }

  get(key) {
    return this._sprites[key] || null;
  }
}

class SpriteSheet {
  constructor(img, frames, layout) {
    this.img = img;
    this.frames = frames;
    this.layout = layout;

    if (layout === "horizontal") {
      this.frameW = img.width / frames;
      this.frameH = img.height;
    } else {
      this.frameW = img.width;
      this.frameH = img.height / frames;
    }
  }

  sourceFor(frameIdx) {
    if (this.layout === "horizontal") {
      return { sx: frameIdx * this.frameW, sy: 0 };
    } else {
      return { sx: 0, sy: frameIdx * this.frameH };
    }
  }
}

class SpriteState {
  constructor(animSpeed = 8, totalFrames = 4) {
    this.frameIdx = 0;
    this.frameTick = 0;
    this.animSpeed = animSpeed;
    this.totalFrames = totalFrames;
    this.flipX = false;

    this.hitFlashing = false;
    this.hitFlashStart = 0;
    this.hitFlashDur = 500;
  }

  tick() {
    this.frameTick++;
    if (this.frameTick % this.animSpeed === 0) {
      this.frameIdx = (this.frameIdx + 1) % this.totalFrames;
    }
    if (this.hitFlashing && millis() - this.hitFlashStart > this.hitFlashDur) {
      this.hitFlashing = false;
    }
  }

  flash() {
    this.hitFlashing = true;
    this.hitFlashStart = millis();
  }
}

class SpriteRenderer {
  static draw(sheet, state, x, y, drawScale = 1.5) {
    if (!sheet || !sheet.img) return false;

    state.tick();

    let { sx, sy } = sheet.sourceFor(state.frameIdx);
    let dw = sheet.frameW * drawScale;
    let dh = sheet.frameH * drawScale;

    push();
    translate(x, y);

    if (state.flipX) {
      applyMatrix(-1, 0, 0, 1, 0, 0);
    }

    if (state.hitFlashing) {
      tint(255, 0, 0, 255);
    } else {
      noTint();
    }

    imageMode(CORNER);
    image(
      sheet.img,
      -dw / 2,
      -dh / 2,
      dw,
      dh,
      sx,
      sy,
      sheet.frameW,
      sheet.frameH,
    );
    noTint();
    pop();

    return true;
  }
}
