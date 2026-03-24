var SPRITE_DEFS = {
  player: {
    path: "../assets/player/player-bounce.png",
    frames: 4,
    layout: "horizontal",
  },
  player_walk: {
    path: "../assets/player/player-walk.png",
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
  gun_knife: {
    path: "../assets/guns/knife.png",
    frames: 1,
    layout: "horizontal",
  },
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
      this._images[key] = loadImage(SPRITE_DEFS[key].path);
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
    if (this.layout === "horizontal")
      return { sx: frameIdx * this.frameW, sy: 0 };
    return { sx: 0, sy: frameIdx * this.frameH };
  }
}

/**
 * SpriteState — UPDATED to use delta-time animation.
 *
 * animFps  = target animation frames-per-second (was "animSpeed" raw frame counter).
 * tick(dt) = call with deltaTime in ms; frame advances independently of display FPS.
 */
class SpriteState {
  constructor(animFps = 8, totalFrames = 4) {
    this.frameIdx = 0;
    this._accumMs = 0;
    this.animFps = animFps; // frames per second, NOT p5 frames
    this.totalFrames = totalFrames;
    this.flipX = false;

    this.hitFlashing = false;
    this.hitFlashStart = 0;
    this.hitFlashDur = 500;
  }

  /**
   * Advance animation by dtMs milliseconds.
   * @param {number} dtMs - elapsed ms this frame (use p5's deltaTime)
   */
  tick(dtMs) {
    // Guard against huge dt spikes (tab was hidden, etc.)
    const safeDt = Math.min(dtMs, 100);
    const msPerFrame = 1000 / this.animFps;

    this._accumMs += safeDt;
    while (this._accumMs >= msPerFrame) {
      this._accumMs -= msPerFrame;
      this.frameIdx = (this.frameIdx + 1) % this.totalFrames;
    }

    if (
      this.hitFlashing &&
      pauseClock.now() - this.hitFlashStart > this.hitFlashDur
    ) {
      this.hitFlashing = false;
    }
  }

  flash() {
    this.hitFlashing = true;
    this.hitFlashStart = pauseClock.now();
  }
}

class SpriteRenderer {
  /**
   * Draw a sprite onto the canvas (or a p5.Graphics if pg is provided).
   *
   * @param {SpriteSheet}  sheet
   * @param {SpriteState}  state
   * @param {number}       x, y
   * @param {number}       drawScale
   * @param {number}       [dtMs]   - override deltaTime; if omitted uses p5 deltaTime
   * @param {p5.Graphics}  [pg]     - target graphics buffer; null = main canvas
   */
  static draw(sheet, state, x, y, drawScale = 1.5, dtMs, pg) {
    if (!sheet || !sheet.img) return false;

    // Advance animation with delta-time
    state.tick(dtMs !== undefined ? dtMs : deltaTime);

    const { sx, sy } = sheet.sourceFor(state.frameIdx);
    const dw = sheet.frameW * drawScale;
    const dh = sheet.frameH * drawScale;

    const target = pg || window; // p5 globals are on window in global mode

    if (pg) {
      pg.push();
      pg.translate(x, y);
      if (state.flipX) pg.applyMatrix(-1, 0, 0, 1, 0, 0);
      if (state.hitFlashing) pg.tint(255, 0, 0, 255);
      else pg.noTint();
      pg.imageMode(CORNER);
      pg.image(
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
      pg.noTint();
      pg.pop();
    } else {
      push();
      translate(x, y);
      if (state.flipX) applyMatrix(-1, 0, 0, 1, 0, 0);
      if (state.hitFlashing) tint(255, 0, 0, 255);
      else noTint();
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
    }

    return true;
  }
}
