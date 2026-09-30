import { J2000_DATE, J2000_JD, getDaysSinceJ2000, j2000DaysToDate, dateToJulianDate } from '../utils/dateUtils.js';

/**
 * Single Authoritative Simulation Clock Engine (PART 8)
 * Manages simulation time (days since J2000 & Julian Date), speed multiplier (-1e6x to +1e6x),
 * modes (LIVE, PAUSED, FORWARD, REVERSE), and frame-rate independent delta time updates.
 */
export default class SimulationClock {
  constructor() {
    this.simTimeDays = getDaysSinceJ2000(new Date());
    this.speedMultiplier = 1; // Negative = Reverse mode, Positive = Forward mode
    this.isPaused = false;
    this.isLive = false;
    this.lastRealTime = performance.now();
  }

  setLive(live) {
    this.isLive = live;
    if (live) {
      this.isPaused = false;
      this.speedMultiplier = 1;
      this.syncToCurrentTime();
    }
  }

  syncToCurrentTime() {
    this.simTimeDays = getDaysSinceJ2000(new Date());
  }

  setPaused(paused) {
    this.isPaused = paused;
    if (paused) this.isLive = false;
    this.lastRealTime = performance.now();
  }

  setSpeed(speed) {
    this.speedMultiplier = speed;
    this.isLive = false;
    this.isPaused = false;
  }

  setSimTimeDays(days) {
    this.simTimeDays = Number(days);
    this.isLive = false;
  }

  setDate(date) {
    this.simTimeDays = getDaysSinceJ2000(date);
    this.isLive = false;
  }

  setJulianDate(jd) {
    this.simTimeDays = Number(jd) - J2000_JD;
    this.isLive = false;
  }

  getSimDate() {
    return j2000DaysToDate(this.simTimeDays);
  }

  getJulianDate() {
    return dateToJulianDate(this.getSimDate());
  }

  update() {
    const now = performance.now();
    const deltaMs = now - this.lastRealTime;
    this.lastRealTime = now;

    if (this.isLive) {
      this.syncToCurrentTime();
    } else if (!this.isPaused) {
      // Delta time based time propagation:
      // speedMultiplier = 1 means 1 simulation day per 1 real second
      // Negative speedMultiplier = reverse time propagation
      const deltaSec = deltaMs / 1000;
      this.simTimeDays += deltaSec * this.speedMultiplier;
    }

    return this.simTimeDays;
  }
}

