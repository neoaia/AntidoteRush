/**
 * ObjectPool — reuse objects instead of allocating new ones every frame.
 * Eliminates garbage collection stutter from frequent new Bullet() / popup calls.
 *
 * Usage:
 *   const pool = new ObjectPool(() => new Bullet(), (b, ...args) => b.init(...args), 30);
 *   const b = pool.acquire(x, y, tx, ty, dmg, opts);
 *   pool.release(b);
 */
class ObjectPool {
  /**
   * @param {function} factory   - () => object       — creates a brand-new instance
   * @param {function} reset     - (obj, ...args) => void — re-initialises for reuse
   * @param {number}   initSize  - how many objects to pre-warm
   */
  constructor(factory, reset, initSize = 20) {
    this._factory = factory;
    this._reset = reset;
    this._pool = [];

    for (let i = 0; i < initSize; i++) {
      this._pool.push(factory());
    }
  }

  /** Pull an object from the pool (or create one) and initialise it. */
  acquire(...args) {
    const obj = this._pool.length > 0 ? this._pool.pop() : this._factory();
    this._reset(obj, ...args);
    return obj;
  }

  /** Return an object to the pool for future reuse. */
  release(obj) {
    this._pool.push(obj);
  }

  get available() {
    return this._pool.length;
  }
}
