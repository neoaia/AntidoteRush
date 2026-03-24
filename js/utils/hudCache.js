/**
 * HudCache — Renders HUD panels to offscreen p5.Graphics buffers.
 * Buffers are only redrawn when their underlying data changes.
 * This cuts per-frame text draw calls from hundreds to near zero.
 */
class HudCache {
  constructor() {
    // Each entry: { buffer: p5.Graphics, dirty: bool, lastVal: any }
    this._buffers = {};
  }

  /**
   * Get or create a buffer slot.
   * @param {string} key     - Unique ID for this HUD element
   * @param {number} w       - Buffer width in pixels
   * @param {number} h       - Buffer height in pixels
   * @param {*}      val     - Current value to compare against cached value
   * @param {function} drawFn - (pg) => void — draws into the p5.Graphics pg
   * @returns {p5.Graphics}
   */
  get(key, w, h, val, drawFn) {
    let entry = this._buffers[key];

    // Create buffer if it doesn't exist yet
    if (!entry) {
      entry = {
        buffer: createGraphics(w, h),
        dirty: true,
        lastVal: undefined,
        w,
        h,
      };
      this._buffers[key] = entry;
    }

    // Resize if dimensions changed (e.g. window resize)
    if (entry.w !== w || entry.h !== h) {
      entry.buffer.remove();
      entry.buffer = createGraphics(w, h);
      entry.w = w;
      entry.h = h;
      entry.dirty = true;
    }

    // Only re-render if value changed
    const valStr = JSON.stringify(val);
    if (entry.dirty || entry.lastVal !== valStr) {
      entry.buffer.clear();
      drawFn(entry.buffer);
      entry.lastVal = valStr;
      entry.dirty = false;
    }

    return entry.buffer;
  }

  /** Force a specific buffer to redraw next frame */
  invalidate(key) {
    if (this._buffers[key]) this._buffers[key].dirty = true;
  }

  /** Invalidate all buffers (e.g. after window resize) */
  invalidateAll() {
    for (let k of Object.keys(this._buffers)) {
      this._buffers[k].dirty = true;
    }
  }

  /** Free GPU memory for buffers you no longer need */
  remove(key) {
    if (this._buffers[key]) {
      this._buffers[key].buffer.remove();
      delete this._buffers[key];
    }
  }

  destroy() {
    for (let k of Object.keys(this._buffers)) this.remove(k);
  }
}
