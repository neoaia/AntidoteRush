/**
 * PauseClock — pause-aware time source.
 *
 * pauseClock.now()            — game time (freezes while paused)
 * pauseClock.totalPausedMs()  — total real ms spent paused so far
 * pauseClock.pause()          — pause the clock
 * pauseClock.resume()         — resume the clock
 */
class PauseClock {
  constructor() {
    this._offset = 0; // total ms accumulated while paused
    this._pauseStart = null;
    this._paused = false;
  }

  pause() {
    if (this._paused) return;
    this._paused = true;
    this._pauseStart = millis();
  }

  resume() {
    if (!this._paused) return;
    this._offset += millis() - this._pauseStart;
    this._pauseStart = null;
    this._paused = false;
  }

  isPaused() {
    return this._paused;
  }

  // Game time — freezes while paused
  now() {
    if (this._paused) return this._pauseStart - this._offset;
    return millis() - this._offset;
  }

  // How many real ms have been spent paused in total
  // Used by popups: spawnTime is in millis() but lifetime should exclude pause time
  totalPausedMs() {
    if (this._paused) return this._offset + (millis() - this._pauseStart);
    return this._offset;
  }
}

var pauseClock = new PauseClock();
