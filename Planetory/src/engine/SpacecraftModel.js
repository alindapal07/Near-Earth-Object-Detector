/**
 * SpacecraftModel.js — Centralized Spacecraft State & Mission Engine (Part 28)
 *
 * Implements authoritative spacecraft telemetry, trajectory progress, maneuver calculation,
 * rocket equation delta-v budget, patched-conic SOI detection, light-time delay,
 * subsystem simulation status, checkpoints, and mission events log.
 */

import { CONSTANTS } from '../utils/epochUtils';
import { J2000_DATE, j2000DaysToDate } from '../utils/dateUtils';

export class SpacecraftModel {
  constructor(options = {}) {
    this.id = options.id || 'sc_active';
    this.name = options.name || 'Artemis Interplanetary Probe';
    this.missionId = options.missionId || 'mission_earth_mars';
    this.currentLeg = options.currentLeg || 1;
    this.totalLegs = options.totalLegs || 1;
    
    // Spacecraft State
    // PRE-LAUNCH | LAUNCHED | CRUISE | MANEUVER | FLYBY | ARRIVAL | ORBIT | COMPLETED | ABORTED
    this.state = options.state || 'PRE-LAUNCH';
    
    // Position vector in AU & km
    this.position = { x: 1.0, y: 0.0, z: 0.0 };
    this.positionKm = { x: 149597870.7, y: 0, z: 0 };
    this.distanceFromSunAu = 1.0;
    this.distanceFromSunKm = 149597870.7;
    this.distanceFromOriginAu = 0.0;
    this.distanceToDestAu = 0.52;
    
    // Velocity vector in km/s
    this.velocity = { vx: 0.0, vy: 29.78, vz: 0.0 };
    this.speedKmS = 29.78;
    this.radialVelKmS = 0.0;
    this.tangentialVelKmS = 29.78;
    this.vInfinityKmS = options.vInfinityKmS || 2.94;
    
    // Mass & Propulsion Model
    this.massKg = options.massKg || 1200;
    this.dryMassKg = options.dryMassKg || 500;
    this.propellantMassKg = options.propellantMassKg || 700;
    this.isp = options.isp || 320; // Specific Impulse in seconds (0 = unmodeled)
    this.engineStatus = 'OFF'; // OFF | ARMED | BURNING | COOLDOWN
    this.thrustN = options.thrustN || 450;
    
    // Delta-v budget
    this.usedDeltaVKmS = 0;
    this.initialDeltaVKmS = options.initialDeltaVKmS || 3.9;
    
    // Orientation vectors
    this.orientation = {
      forward: { x: 0, y: 1, z: 0 },
      velocityDir: { x: 0, y: 1, z: 0 },
      burnDir: null
    };
    
    // Time & Progress
    this.missionElapsedTimeDays = 0;
    this.totalDurationDays = options.totalDurationDays || 259;
    this.distanceTraveledKm = 0;
    this.distanceRemainingKm = 0;
    this.progressPct = 0;
    
    // Sphere of Influence (SOI) State
    this.currentSOI = {
      bodyId: 'sun',
      name: 'HELIOCENTRIC MODE',
      isPlanetRelative: false,
      relPosKm: { x: 0, y: 0, z: 0 },
      relVelKmS: { vx: 0, vy: 0, vz: 0 },
      soiRadiusKm: Infinity
    };
    
    // Communication & Light-Time Delay
    this.commStatus = 'CONNECTED'; // CONNECTED | DELAYED | OUT OF RANGE
    this.lightTimeDelaySec = 0;
    
    // Systems & Health Status
    this.subsystems = {
      power: 'NOMINAL',
      communication: 'NOMINAL',
      propulsion: 'NOMINAL',
      thermal: 'NOMINAL',
      navigation: 'NOMINAL',
      guidance: 'NOMINAL'
    };
    
    this.health = {
      trajectory: 'NOMINAL',
      fuel: 'NOMINAL',
      communication: 'NOMINAL',
      navigation: 'NOMINAL',
      timeline: 'NOMINAL'
    };
    
    // Collections
    this.maneuvers = options.maneuvers || [];
    this.events = options.events || [];
    this.logs = options.logs || [];
    this.checkpoints = [];
    this.telemetryHistory = []; // time-sampled telemetry points
    
    this.initDefaultLogs();
  }

  initDefaultLogs() {
    this.addLog('T+000d', 'Mission initialized. Systems nominal.', 'SYSTEM');
  }

  addLog(metStr, message, type = 'SYSTEM') {
    this.logs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: metStr,
      message,
      type // 'SYSTEM' | 'MANEUVER' | 'FLYBY' | 'WARNING'
    });
    if (this.logs.length > 200) this.logs.pop();
  }

  /**
   * Primary Telemetry Update tick from SimulationClock & Transfer Trajectory
   */
  updateFromTransfer(simTimeDays, departureDays, transferResult, planetCatalog = []) {
    if (!transferResult || !transferResult.valid) return;

    const totalDays = transferResult.durationDays || this.totalDurationDays;
    this.totalDurationDays = totalDays;

    const elapsedDays = simTimeDays - departureDays;
    this.missionElapsedTimeDays = elapsedDays;

    // Determine State & Progress Pct
    if (elapsedDays < 0) {
      this.state = 'PRE-LAUNCH';
      this.progressPct = 0;
    } else if (elapsedDays >= totalDays) {
      this.state = 'COMPLETED';
      this.progressPct = 100;
    } else {
      this.progressPct = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
      
      // Determine dynamic state based on events or progress
      if (this.state !== 'ABORTED') {
        if (this.progressPct < 2) this.state = 'LAUNCHED';
        else if (this.progressPct > 98) this.state = 'ARRIVAL';
        else {
          // Check if active flyby or maneuver at this time
          const activeEvent = this.events.find(e => Math.abs((e.metDays || 0) - elapsedDays) < 1.0);
          if (activeEvent && activeEvent.type === 'MANEUVER') this.state = 'MANEUVER';
          else if (activeEvent && activeEvent.type === 'FLYBY') this.state = 'FLYBY';
          else this.state = 'CRUISE';
        }
      }
    }

    // Trajectory Position Calculation (Hohmann Transfer Arc)
    const r1 = transferResult.originRadiusAu || 1.0;
    const r2 = transferResult.destinationRadiusAu || 1.524;
    const aT = transferResult.transferSemiMajorAxisAu || ((r1 + r2) / 2);
    const eT = transferResult.eccentricity || (Math.abs(r2 - r1) / (r1 + r2));

    // True anomaly theta along transfer arc: 0 (departure) to PI (arrival)
    const fraction = Math.max(0, Math.min(1, this.progressPct / 100));
    const theta = fraction * Math.PI;

    // Radius at theta along transfer ellipse r(theta) = a(1 - e^2) / (1 + e cos(theta))
    const rAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(theta));
    
    // Heliocentric Cartesian coords in AU
    const scX = rAu * Math.cos(theta);
    const scY = rAu * Math.sin(theta);
    const scZ = 0.0; // Coplanar approximation

    this.position = { x: scX, y: scY, z: scZ };
    this.positionKm = {
      x: scX * CONSTANTS.AU_IN_KM,
      y: scY * CONSTANTS.AU_IN_KM,
      z: scZ * CONSTANTS.AU_IN_KM
    };
    this.distanceFromSunAu = rAu;
    this.distanceFromSunKm = rAu * CONSTANTS.AU_IN_KM;

    // Distances from origin planet & destination planet
    this.distanceFromOriginAu = Math.abs(rAu - r1);
    this.distanceToDestAu = Math.max(0, Math.abs(r2 - rAu));

    // Orbital Velocity along transfer ellipse (Vis-Viva Equation: v = sqrt( GM_sun * (2/r - 1/a) ))
    // GM_sun in km^3/s^2 = 1.32712440018e11
    const muSun = 1.32712440018e11;
    const rKm = rAu * CONSTANTS.AU_IN_KM;
    const aKm = aT * CONSTANTS.AU_IN_KM;
    
    const speedKmS = Math.sqrt(Math.max(0, muSun * (2.0 / rKm - 1.0 / aKm)));
    this.speedKmS = speedKmS;

    // Velocity components (Radial & Tangential)
    // Radial vr = sqrt(mu / (a(1-e^2))) * e * sin(theta)
    const hKm = Math.sqrt(muSun * aKm * (1 - eT * eT));
    this.tangentialVelKmS = hKm / rKm;
    this.radialVelKmS = (muSun / hKm) * eT * Math.sin(theta);

    // Cartesian velocity vector
    const vx = -this.speedKmS * Math.sin(theta);
    const vy = this.speedKmS * Math.cos(theta);
    this.velocity = { vx, vy, vz: 0 };

    // Update orientation (velocity unit vector)
    if (speedKmS > 0) {
      this.orientation.velocityDir = { x: vx / speedKmS, y: vy / speedKmS, z: 0 };
      this.orientation.forward = { ...this.orientation.velocityDir };
    }

    // Curved Arc Length Trajectory Traveled (numerical integration approximation)
    // Transfer ellipse semi-minor axis b = a * sqrt(1 - e^2)
    const bT = aT * Math.sqrt(1 - eT * eT);
    // Approximate semi-perimeter of half-ellipse Ramanujan formula
    const hEll = Math.pow((aT - bT) / (aT + bT), 2);
    const totalArcAu = (Math.PI * (aT + bT) * (1 + (3 * hEll) / (10 + Math.sqrt(4 - 3 * hEll)))) / 2;
    
    this.distanceTraveledKm = fraction * totalArcAu * CONSTANTS.AU_IN_KM;
    this.distanceRemainingKm = (1 - fraction) * totalArcAu * CONSTANTS.AU_IN_KM;

    // Calculate Light-Time Delay: t = d / c (distance to Earth / observer)
    // Observer distance approximation: from Sun/Earth (rAu * AU_KM)
    const cKmS = 299792.458; // Speed of light
    const distObserverKm = rAu * CONSTANTS.AU_IN_KM;
    this.lightTimeDelaySec = distObserverKm / cKmS;

    // Sphere of Influence (SOI) Detection (Patched-Conic Model)
    this.detectSphereOfInfluence(rAu, scX, scY, planetCatalog);

    // Record time-based telemetry sampling for graphs (max 100 data points)
    if (this.telemetryHistory.length === 0 || Math.abs(elapsedDays - (this.telemetryHistory[this.telemetryHistory.length - 1]?.metDays || 0)) >= 2.0) {
      this.telemetryHistory.push({
        metDays: Math.round(elapsedDays),
        speedKmS: Number(this.speedKmS.toFixed(2)),
        distSunAu: Number(this.distanceFromSunAu.toFixed(3)),
        progressPct: Number(this.progressPct.toFixed(1))
      });
      if (this.telemetryHistory.length > 100) this.telemetryHistory.shift();
    }
  }

  /**
   * Patched-Conic Sphere of Influence (SOI) Detection
   * r_SOI = a * (m_planet / M_sun)^(2/5)
   */
  detectSphereOfInfluence(rAu, scX, scY, planetCatalog = []) {
    // Planet mass ratios relative to Sun (M_sun = 1)
    const planetSoiData = [
      { id: 'earth', name: 'EARTH SOI', massRatio: 3.003e-6, semimajorAu: 1.0, color: '#00f0ff' },
      { id: 'mars',  name: 'MARS SOI',  massRatio: 3.227e-7, semimajorAu: 1.524, color: '#ff6b35' },
      { id: 'venus', name: 'VENUS SOI', massRatio: 2.447e-6, semimajorAu: 0.723, color: '#ffb703' }
    ];

    let insidePlanetSOI = false;

    for (const p of planetSoiData) {
      // r_SOI in AU
      const rSoiAu = p.semimajorAu * Math.pow(p.massRatio, 0.4);
      const rSoiKm = rSoiAu * CONSTANTS.AU_IN_KM;

      // Distance to planet (approx coplanar radial distance)
      const distToPlanetAu = Math.abs(rAu - p.semimajorAu);

      if (distToPlanetAu <= rSoiAu) {
        this.currentSOI = {
          bodyId: p.id,
          name: `${p.name} (PLANET-CENTERED MODE)`,
          isPlanetRelative: true,
          soiRadiusKm: rSoiKm,
          distToPlanetKm: distToPlanetAu * CONSTANTS.AU_IN_KM,
          color: p.color
        };
        insidePlanetSOI = true;
        break;
      }
    }

    if (!insidePlanetSOI) {
      this.currentSOI = {
        bodyId: 'sun',
        name: 'HELIOCENTRIC MODE',
        isPlanetRelative: false,
        soiRadiusKm: Infinity,
        color: '#ffde7a'
      };
    }
  }

  /**
   * Apply Instantaneous Maneuver & Rocket Equation Delta-v Calculation
   * v_after = v_before + delta_v
   * Rocket equation: delta_v = Isp * g0 * ln(m0 / mf)
   */
  scheduleManeuver(maneuver) {
    const { metDays, dvMagnitudeKmS, direction = 'PROGRADE', notes = 'Mid-Course Correction' } = maneuver;
    const dvVal = parseFloat(dvMagnitudeKmS) || 0.01;

    // Direction unit vector calculation
    let dvVec = { vx: 0, vy: 0, vz: 0 };
    const { vx, vy } = this.velocity;
    const speed = Math.max(0.001, this.speedKmS);

    if (direction === 'PROGRADE') {
      dvVec = { vx: (vx / speed) * dvVal, vy: (vy / speed) * dvVal, vz: 0 };
    } else if (direction === 'RETROGRADE') {
      dvVec = { vx: (-vx / speed) * dvVal, vy: (-vy / speed) * dvVal, vz: 0 };
    } else if (direction === 'NORMAL') {
      dvVec = { vx: 0, vy: 0, vz: dvVal };
    } else if (direction === 'ANTI-NORMAL') {
      dvVec = { vx: 0, vy: 0, vz: -dvVal };
    } else if (direction === 'RADIAL_OUT') {
      dvVec = { vx: (vy / speed) * dvVal, vy: (-vx / speed) * dvVal, vz: 0 };
    } else if (direction === 'RADIAL_IN') {
      dvVec = { vx: (-vy / speed) * dvVal, vy: (vx / speed) * dvVal, vz: 0 };
    } else {
      dvVec = { vx: dvVal * 0.707, vy: dvVal * 0.707, vz: 0 };
    }

    // Rocket Equation Propellant Consumed Calculation (if Isp & mass available)
    let propellantConsumedKg = 0;
    if (this.isp > 0 && this.massKg > this.dryMassKg) {
      const g0 = 9.80665; // m/s^2
      const dvMS = dvVal * 1000;
      const ispMS = this.isp * g0;
      // m_final = m0 / exp(dv / (Isp * g0))
      const mFinal = this.massKg / Math.exp(dvMS / ispMS);
      propellantConsumedKg = Math.max(0, this.massKg - mFinal);

      if (propellantConsumedKg <= this.propellantMassKg) {
        this.propellantMassKg -= propellantConsumedKg;
        this.massKg -= propellantConsumedKg;
      }
    }

    this.usedDeltaVKmS += dvVal;

    const maneuverObj = {
      id: `maneuver_${Date.now()}`,
      metDays: Math.round(metDays),
      dvMagnitudeKmS: dvVal,
      dvVector: dvVec,
      direction,
      notes,
      propellantConsumedKg: Math.round(propellantConsumedKg * 10) / 10,
      postBurnSpeedKmS: Number((this.speedKmS + dvVal).toFixed(2)),
      timestamp: `T+${Math.round(metDays)}d`
    };

    this.maneuvers.push(maneuverObj);
    this.addLog(`T+${Math.round(metDays)}d`, `Maneuver performed: ${direction} Δv=${dvVal.toFixed(2)} km/s`, 'MANEUVER');

    return maneuverObj;
  }

  /**
   * Save Simulation Checkpoint
   */
  saveCheckpoint(label = 'Checkpoint') {
    const cp = {
      id: `cp_${Date.now()}`,
      label,
      metDays: Math.round(this.missionElapsedTimeDays),
      position: { ...this.position },
      velocity: { ...this.velocity },
      state: this.state,
      propellantMassKg: this.propellantMassKg,
      massKg: this.massKg,
      usedDeltaVKmS: this.usedDeltaVKmS,
      savedAt: new Date().toLocaleTimeString()
    };
    this.checkpoints.unshift(cp);
    if (this.checkpoints.length > 10) this.checkpoints.pop();
    this.addLog(`T+${Math.round(this.missionElapsedTimeDays)}d`, `Checkpoint saved: "${label}"`, 'SYSTEM');
    return cp;
  }

  /**
   * Restore Checkpoint
   */
  restoreCheckpoint(checkpointId) {
    const cp = this.checkpoints.find(c => c.id === checkpointId);
    if (!cp) return false;

    this.missionElapsedTimeDays = cp.metDays;
    this.position = { ...cp.position };
    this.velocity = { ...cp.velocity };
    this.state = cp.state;
    this.propellantMassKg = cp.propellantMassKg;
    this.massKg = cp.massKg;
    this.usedDeltaVKmS = cp.usedDeltaVKmS;

    this.addLog(`T+${Math.round(cp.metDays)}d`, `Restored checkpoint: "${cp.label}"`, 'SYSTEM');
    return true;
  }

  /**
   * Abort Mission
   */
  abortMission() {
    this.state = 'ABORTED';
    this.addLog(`T+${Math.round(this.missionElapsedTimeDays)}d`, `MISSION ABORTED by Flight Controller. Spacecraft safe mode engaged.`, 'WARNING');
  }

  /**
   * Resume Mission
   */
  resumeMission() {
    this.state = 'CRUISE';
    this.addLog(`T+${Math.round(this.missionElapsedTimeDays)}d`, `Mission resumed by Flight Controller. Telemetry restored.`, 'SYSTEM');
  }

  /**
   * Generates discrete trajectory sample rows for the DATA TABLE & GRAPHS views.
   * Computes 30-50 uniform physical trajectory sample points along the transfer arc.
   */
  generateSampledTableRows(departureDays = 0) {
    if (!this.lastTransferResult || !this.lastTransferResult.valid) {
      // Fallback generator based on current totalDurationDays
      const totalD = this.totalDurationDays || 259;
      const r1 = 1.0, r2 = 1.524;
      const aT = (r1 + r2) / 2;
      const eT = Math.abs(r2 - r1) / (r1 + r2);
      const rows = [];
      const steps = 40;

      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        const met = Math.round(frac * totalD);
        const theta = frac * Math.PI;
        const rAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(theta));
        const xAu = rAu * Math.cos(theta);
        const yAu = rAu * Math.sin(theta);
        const speed = Math.sqrt(1.3271244e11 * (2 / (rAu * CONSTANTS.AU_IN_KM) - 1 / (aT * CONSTANTS.AU_IN_KM)));
        const dDate = new Date(J2000_DATE.getTime() + (departureDays + met) * 86400000);

        let phase = 'CRUISE';
        if (frac === 0) phase = 'DEPARTURE';
        else if (frac === 1) phase = 'ARRIVAL';
        else if (frac > 0.48 && frac < 0.52) phase = 'MID-COURSE';

        rows.push({
          index: i + 1,
          metDays: met,
          dateStr: dDate.toISOString().split('T')[0],
          xAu: Number(xAu.toFixed(3)),
          yAu: Number(yAu.toFixed(3)),
          rSunAu: Number(rAu.toFixed(3)),
          rOriginAu: Number(Math.abs(rAu - r1).toFixed(3)),
          rDestAu: Number(Math.abs(r2 - rAu).toFixed(3)),
          speedKmS: Number(speed.toFixed(2)),
          progressPct: Number((frac * 100).toFixed(1)),
          phase
        });
      }
      return rows;
    }

    const tr = this.lastTransferResult;
    const totalDays = tr.durationDays || this.totalDurationDays;
    const r1 = tr.originRadiusAu || 1.0;
    const r2 = tr.destinationRadiusAu || 1.524;
    const aT = tr.transferSemiMajorAxisAu || ((r1 + r2) / 2);
    const eT = tr.eccentricity || (Math.abs(r2 - r1) / (r1 + r2));
    const muSun = 1.32712440018e11;

    const rows = [];
    const steps = 40;

    for (let i = 0; i <= steps; i++) {
      const frac = i / steps;
      const met = Math.round(frac * totalDays);
      const theta = frac * Math.PI;
      const rAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(theta));
      const xAu = rAu * Math.cos(theta);
      const yAu = rAu * Math.sin(theta);
      const rKm = rAu * CONSTANTS.AU_IN_KM;
      const aKm = aT * CONSTANTS.AU_IN_KM;
      const speed = Math.sqrt(Math.max(0, muSun * (2.0 / rKm - 1.0 / aKm)));
      const dDate = new Date(J2000_DATE.getTime() + (departureDays + met) * 86400000);

      let phase = 'CRUISE';
      if (frac === 0) phase = 'EARTH ESCAPE';
      else if (frac === 1) phase = 'MARS INSERTION';
      else if (frac > 0.48 && frac < 0.52) phase = 'MID-COURSE BURN';

      rows.push({
        index: i + 1,
        metDays: met,
        dateStr: dDate.toISOString().split('T')[0],
        xAu: Number(xAu.toFixed(3)),
        yAu: Number(yAu.toFixed(3)),
        rSunAu: Number(rAu.toFixed(3)),
        rOriginAu: Number(Math.abs(rAu - r1).toFixed(3)),
        rDestAu: Number(Math.abs(r2 - rAu).toFixed(3)),
        speedKmS: Number(speed.toFixed(2)),
        progressPct: Number((frac * 100).toFixed(1)),
        phase
      });
    }

    return rows;
  }

  /**
   * Save telemetry & mission config to localStorage
   */
  saveToLocalStorage() {
    try {
      const payload = {
        name: this.name,
        missionId: this.missionId,
        state: this.state,
        metDays: this.missionElapsedTimeDays,
        totalDurationDays: this.totalDurationDays,
        usedDeltaVKmS: this.usedDeltaVKmS,
        propellantMassKg: this.propellantMassKg,
        massKg: this.massKg,
        checkpoints: this.checkpoints,
        maneuvers: this.maneuvers,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('planetory_active_mission', JSON.stringify(payload));
      this.addLog(`T+${Math.round(this.missionElapsedTimeDays)}d`, 'Mission state saved to local storage.', 'SYSTEM');
      return true;
    } catch { return false; }
  }

  /**
   * Load telemetry & mission config from localStorage
   */
  loadFromLocalStorage() {
    try {
      const s = localStorage.getItem('planetory_active_mission');
      if (!s) return false;
      const data = JSON.parse(s);
      this.name = data.name || this.name;
      this.state = data.state || this.state;
      this.missionElapsedTimeDays = data.metDays || 0;
      this.totalDurationDays = data.totalDurationDays || 259;
      this.usedDeltaVKmS = data.usedDeltaVKmS || 0;
      this.propellantMassKg = data.propellantMassKg || this.propellantMassKg;
      this.checkpoints = data.checkpoints || [];
      this.maneuvers = data.maneuvers || [];
      this.addLog(`T+${Math.round(this.missionElapsedTimeDays)}d`, 'Restored saved mission from local storage.', 'SYSTEM');
      return true;
    } catch { return false; }
  }

  /**
   * Export Mission Telemetry & Trajectory to JSON
   */
  exportToJSON() {
    const payload = {
      missionName: this.name,
      spacecraftId: this.id,
      state: this.state,
      missionElapsedTimeDays: this.missionElapsedTimeDays,
      totalDurationDays: this.totalDurationDays,
      progressPct: this.progressPct,
      telemetry: {
        positionAu: this.position,
        positionKm: this.positionKm,
        velocityKmS: this.velocity,
        speedKmS: this.speedKmS,
        distanceFromSunAu: this.distanceFromSunAu,
        distanceFromOriginAu: this.distanceFromOriginAu,
        distanceToDestAu: this.distanceToDestAu,
        lightTimeDelaySec: this.lightTimeDelaySec
      },
      maneuvers: this.maneuvers,
      checkpoints: this.checkpoints,
      logs: this.logs,
      provenance: 'PLANETORY SCIENTIFIC MISSION CONTROL ENGINE'
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Export Mission Telemetry & Trajectory to CSV
   */
  exportToCSV() {
    const rows = this.generateSampledTableRows();
    let csv = 'MET_DAYS,DATE,X_AU,Y_AU,DIST_SUN_AU,DIST_ORIGIN_AU,DIST_DEST_AU,SPEED_KMS,PROGRESS_PCT,PHASE\n';
    rows.forEach(r => {
      csv += `${r.metDays},${r.dateStr},${r.xAu},${r.yAu},${r.rSunAu},${r.rOriginAu},${r.rDestAu},${r.speedKmS},${r.progressPct},"${r.phase}"\n`;
    });
    return csv;
  }

  /**
   * Available Delta-V budget remaining calculation
   */
  getRemainingDeltaVBudget() {
    if (this.isp > 0 && this.massKg > this.dryMassKg && this.propellantMassKg > 0) {
      const g0 = 9.80665;
      const dvMS = this.isp * g0 * Math.log(this.massKg / this.dryMassKg);
      return Math.max(0, dvMS / 1000); // in km/s
    }
    return Math.max(0, this.initialDeltaVKmS - this.usedDeltaVKmS);
  }
}

// Singleton active spacecraft instance for Mission Control
export const activeSpacecraftModel = new SpacecraftModel();
