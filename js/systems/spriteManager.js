/**
 * SpriteManager — central registry for all game sprites.
 *
 * Usage:
 *   // In game.js preload():
 *   spriteManager = new SpriteManager();
 *   spriteManager.preload();
 *
 *   // In game.js setup():
 *   spriteManager.init();          // wires sprites to entities
 *
 * Adding a new sprite:
 *   1. Add an entry to SPRITE_DEFS below.
 *   2. Call spriteManager.get('key') anywhere to retrieve the p5.Image.
 *   3. Use SpriteRenderer.draw() to render it cleanly.
 */

const SPRITE_DEFS = {
  // key:  { path, frames, layout }
  // layout: 'horizontal' (frames side by side) | 'vertical' (frames stacked)
  player: {
    path: "../assets/player/player-bounce.png",
    frames: 4,
    layout: "horizontal",
  },

  // ── Add future sprites here ───────────────────────────────────────────────
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
};

class SpriteManager {
  constructor() {
    this._images = {}; // key → p5.Image (raw)
    this._sprites = {}; // key → SpriteSheet (parsed)
  }

  // Call in p5 preload() — loads all images
  preload() {
    for (let key of Object.keys(SPRITE_DEFS)) {
      let def = SPRITE_DEFS[key];
      this._images[key] = loadImage(def.path);
    }
  }

  // Call in p5 setup() — builds SpriteSheet objects once images are loaded
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

  // Returns a SpriteSheet by key
  get(key) {
    return this._sprites[key] || null;
  }
}

// ── SpriteSheet ───────────────────────────────────────────────────────────────
// Holds metadata for one sprite sheet and tracks per-entity animation state.
// Entities don't store frame state here — they store their own SpriteState.

class SpriteSheet {
  constructor(img, frames, layout) {
    this.img = img;
    this.frames = frames;
    this.layout = layout; // 'horizontal' | 'vertical'

    if (layout === "horizontal") {
      this.frameW = img.width / frames;
      this.frameH = img.height;
    } else {
      this.frameW = img.width;
      this.frameH = img.height / frames;
    }
  }

  // Returns source {sx, sy} for a given frame index
  sourceFor(frameIdx) {
    if (this.layout === "horizontal") {
      return { sx: frameIdx * this.frameW, sy: 0 };
    } else {
      return { sx: 0, sy: frameIdx * this.frameH };
    }
  }
}

// ── SpriteState ───────────────────────────────────────────────────────────────
// Each entity that wants animation creates one of these.
// Keeps track of frameIdx and frameTick independently per entity.

class SpriteState {
  constructor(animSpeed = 8, totalFrames = 4) {
    this.frameIdx = 0;
    this.frameTick = 0;
    this.animSpeed = animSpeed;
    this.totalFrames = totalFrames;
    this.flipX = false;

    // Hit flash
    this.hitFlashing = false;
    this.hitFlashStart = 0;
    this.hitFlashDur = 500; // ms
  }

  tick() {
    this.frameTick++;
    if (this.frameTick % this.animSpeed === 0) {
      this.frameIdx = (this.frameIdx + 1) % this.totalFrames;
    }
    // Auto-clear flash
    if (this.hitFlashing && millis() - this.hitFlashStart > this.hitFlashDur) {
      this.hitFlashing = false;
    }
  }

  flash() {
    this.hitFlashing = true;
    this.hitFlashStart = millis();
  }
}

// ── SpriteRenderer ────────────────────────────────────────────────────────────
// Static helper — call this from any entity's display() method.

class SpriteRenderer {
  /**
   * draw(sheet, state, x, y, scale)
   *   sheet  — SpriteSheet from spriteManager.get('key')
   *   state  — SpriteState owned by the entity
   *   x, y   — center position on canvas
   *   scale  — display scale multiplier (e.g. 1.5)
   */
  static draw(sheet, state, x, y, drawScale = 1.5) {
    if (!sheet || !sheet.img) return false;

    state.tick();

    let { sx, sy } = sheet.sourceFor(state.frameIdx);
    let dw = sheet.frameW * drawScale;
    let dh = sheet.frameH * drawScale;

    push();
    translate(x, y);

    if (state.flipX) {
      applyMatrix(-1, 0, 0, 1, 0, 0); // mirror horizontally
    }

    // Hit flash: solid red tint for full duration
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
