/**
 * hohmannTransfer.js - NASA/JPL Interplanetary Mission Trajectory Engine (Part 26)
 * Computes departure delta-v (Δv1), arrival delta-v (Δv2), total idealized heliocentric delta-v,
 * travel duration, required & current phase angles, launch window status, bi-elliptic transfer,
 * specific orbital energy, and 3D transfer trajectory arc points.
 */

import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES } from '../data/satellites';
import { CONSTANTS } from './epochUtils';
import { validateScientificData } from './orbitalMath';

/**
 * Calculates complete Interplanetary Mission Trajectory parameters between two celestial bodies.
 * @param {string|Object} originObj - Origin body ID or object
 * @param {string|Object} destObj - Destination body ID or object
 * @param {number} simTimeDays - Departure date in J2000 days
 * @param {string} transferType - 'HOHMANN_TRANSFER' | 'BI_ELLIPTIC' | 'DIRECT_TRANSFER' | 'CUSTOM_DEPARTURE'
 * @param {Array} catalog - Full celestial catalog
 * @returns {Object} Mission calculation result & status
 */
export function calculateHohmannTransfer(
  originObj = 'earth',
  destObj = 'mars',
  simTimeDays = 0,
  transferType = 'HOHMANN_TRANSFER',
  catalog = []
) {
  const fullList = [...Object.values(PLANET_DATA), ...NATURAL_SATELLITES, ...(catalog || [])];

  const p1 = typeof originObj === 'object' 
    ? originObj 
    : fullList.find(p => (p.id || p.spkid || '').toString().toLowerCase() === originObj.toString().toLowerCase()) || PLANET_DATA['earth'];

  const p2 = typeof destObj === 'object'
    ? destObj
    : fullList.find(p => (p.id || p.spkid || '').toString().toLowerCase() === destObj.toString().toLowerCase()) || PLANET_DATA['mars'];

  // 1. Input Validation Guards
  if (!p1 || !p2) {
    return {
      status: 'INVALID',
      error: 'Missing celestial object data for origin or destination.',
      valid: false
    };
  }

  const id1 = p1.spkid || p1.id;
  const id2 = p2.spkid || p2.id;
  if (id1 === id2) {
    return {
      status: 'INVALID',
      error: 'Origin and Destination cannot be the same celestial body.',
      valid: false
    };
  }

  // 2. Extract Validated Physical & Orbital Parameters
  const data1 = validateScientificData(p1);
  const data2 = validateScientificData(p2);

  const r1Au = data1.a || (p1.semiMajorAxisKm ? p1.semiMajorAxisKm / CONSTANTS.AU_IN_KM : 1.0);
  const r2Au = data2.a || (p2.semiMajorAxisKm ? p2.semiMajorAxisKm / CONSTANTS.AU_IN_KM : 1.524);

  const r1Km = r1Au * CONSTANTS.AU_IN_KM;
  const r2Km = r2Au * CONSTANTS.AU_IN_KM;

  const mu = CONSTANTS.GM_SUN;

  // 3. Hohmann & Transfer Geometry Calculations
  let aTransferAu = (r1Au + r2Au) / 2;
  let aTransferKm = aTransferAu * CONSTANTS.AU_IN_KM;
  let eTransfer = Math.abs(r2Au - r1Au) / (r2Au + r1Au);

  // Circular velocities at origin and destination (km/s)
  const v1 = Math.sqrt(mu / Math.max(1, r1Km));
  const v2 = Math.sqrt(mu / Math.max(1, r2Km));

  let vDep = 0;
  let vArr = 0;
  let deltaV1 = 0;
  let deltaV2 = 0;
  let tSec = 0;

  if (transferType === 'BI_ELLIPTIC') {
    // Bi-Elliptic Transfer with intermediate apoapsis r_b (e.g., 2.5 * max(r1, r2))
    const rBKm = Math.max(r1Km, r2Km) * 2.5;
    const a1Km = (r1Km + rBKm) / 2;
    const a2Km = (r2Km + rBKm) / 2;

    const vDep1 = Math.sqrt(mu * (2 / r1Km - 1 / a1Km));
    const vArr1 = Math.sqrt(mu * (2 / rBKm - 1 / a1Km));
    const vDep2 = Math.sqrt(mu * (2 / rBKm - 1 / a2Km));
    const vArr2 = Math.sqrt(mu * (2 / r2Km - 1 / a2Km));

    deltaV1 = Math.abs(vDep1 - v1) + Math.abs(vDep2 - vArr1);
    deltaV2 = Math.abs(v2 - vArr2);
    tSec = Math.PI * (Math.sqrt(Math.pow(a1Km, 3) / mu) + Math.sqrt(Math.pow(a2Km, 3) / mu));
    aTransferKm = a1Km;
    aTransferAu = a1Km / CONSTANTS.AU_IN_KM;
  } else if (transferType === 'DIRECT_TRANSFER') {
    // Fast Direct Transfer (1.2x energy speedup)
    aTransferKm = (r1Km + r2Km) * 0.55;
    aTransferAu = aTransferKm / CONSTANTS.AU_IN_KM;
    eTransfer = Math.abs(r2Au - r1Au) / (r2Au + r1Au) * 1.15;

    vDep = Math.sqrt(mu * (2 / r1Km - 1 / aTransferKm));
    vArr = Math.sqrt(mu * (2 / r2Km - 1 / aTransferKm));
    deltaV1 = Math.abs(vDep - v1) * 1.25;
    deltaV2 = Math.abs(v2 - vArr) * 1.15;
    tSec = Math.PI * Math.sqrt(Math.pow(aTransferKm, 3) / mu) * 0.75;
  } else {
    // Standard Hohmann Transfer
    vDep = Math.sqrt(mu * (2 / r1Km - 1 / aTransferKm));
    vArr = Math.sqrt(mu * (2 / r2Km - 1 / aTransferKm));
    deltaV1 = Math.abs(vDep - v1);
    deltaV2 = Math.abs(v2 - vArr);
    tSec = Math.PI * Math.sqrt(Math.pow(aTransferKm, 3) / mu);
  }

  const totalDeltaV = deltaV1 + deltaV2;
  const durationDays = tSec / 86400;

  // 4. Target Required Phase Angle phi_req (deg)
  const w2 = Math.sqrt(mu / Math.pow(r2Km, 3)); // Target angular velocity rad/s
  const phaseAngleRad = Math.PI - (w2 * tSec);
  let phaseAngleDeg = (phaseAngleRad * 180 / Math.PI) % 360;
  if (phaseAngleDeg < 0) phaseAngleDeg += 360;

  // Current Target Phase Angle calculation based on simTimeDays
  const period1Days = p1.orbitalPeriodDays || 365.25;
  const period2Days = p2.orbitalPeriodDays || 686.98;

  const nu1Deg = (((simTimeDays / period1Days) * 360) % 360 + 360) % 360;
  const nu2Deg = (((simTimeDays / period2Days) * 360) % 360 + 360) % 360;

  let currentPhaseDeg = (nu2Deg - nu1Deg + 360) % 360;
  const phaseErrorDeg = Math.abs((currentPhaseDeg - phaseAngleDeg + 180) % 360 - 180);

  let windowStatus = 'OPTIMAL';
  let windowBadgeColor = '#00ffaa';
  if (phaseErrorDeg > 20) {
    windowStatus = 'NOT CURRENTLY OPTIMAL';
    windowBadgeColor = '#ff3d00';
  } else if (phaseErrorDeg > 8) {
    windowStatus = 'ACCEPTABLE';
    windowBadgeColor = '#ffb703';
  }

  // Specific Orbital Energy (J/kg)
  const specificEnergyJ = -mu / (2 * aTransferKm);

  // 5. Generate 3D Transfer Arc Points (0 to pi half-ellipse)
  const points = [];
  const numSteps = 60;
  const rad1 = ((p1.omegaDeg || 0) * Math.PI) / 180;

  for (let i = 0; i <= numSteps; i++) {
    const theta = (i / numSteps) * Math.PI; // Arc from origin to destination
    const rCurrent = (aTransferAu * (1 - eTransfer * eTransfer)) / (1 + eTransfer * Math.cos(theta));
    const xUnrotated = rCurrent * Math.cos(theta);
    const yUnrotated = rCurrent * Math.sin(theta);

    const x = xUnrotated * Math.cos(rad1) - yUnrotated * Math.sin(rad1);
    const y = xUnrotated * Math.sin(rad1) + yUnrotated * Math.cos(rad1);

    points.push({ x, y, z: 0 });
  }

  // 6. Calculation Step-by-Step Details Array [fx]
  const calculationSteps = [
    {
      step: 1,
      title: 'Transfer Semi-Major Axis',
      formula: 'a_transfer = (r1 + r2) / 2',
      inputs: `r1 = ${r1Au.toFixed(3)} AU (${r1Km.toLocaleString()} km), r2 = ${r2Au.toFixed(3)} AU (${r2Km.toLocaleString()} km)`,
      result: `${aTransferAu.toFixed(4)} AU (${aTransferKm.toLocaleString()} km)`
    },
    {
      step: 2,
      title: 'Departure Burn Δv1',
      formula: 'Δv1 = |v_transfer1 - v_circular1| = |√(μ(2/r1 - 1/a)) - √(μ/r1)|',
      inputs: `v_circular1 = ${v1.toFixed(2)} km/s, v_transfer1 = ${vDep.toFixed(2)} km/s`,
      result: `${deltaV1.toFixed(2)} km/s`
    },
    {
      step: 3,
      title: 'Arrival Burn Δv2',
      formula: 'Δv2 = |v_circular2 - v_transfer2| = |√(μ/r2) - √(μ(2/r2 - 1/a))|',
      inputs: `v_circular2 = ${v2.toFixed(2)} km/s, v_transfer2 = ${vArr.toFixed(2)} km/s`,
      result: `${deltaV2.toFixed(2)} km/s`
    },
    {
      step: 4,
      title: 'Total Idealized Heliocentric Δv',
      formula: 'Δv_total = Δv1 + Δv2',
      inputs: `Δv1 = ${deltaV1.toFixed(2)} km/s, Δv2 = ${deltaV2.toFixed(2)} km/s`,
      result: `${totalDeltaV.toFixed(2)} km/s`
    },
    {
      step: 5,
      title: 'Transfer Duration t',
      formula: 't_transfer = π * √(a_transfer³ / μ)',
      inputs: `a = ${aTransferKm.toLocaleString()} km, μ = ${mu.toExponential(4)}`,
      result: `${Math.round(durationDays)} Days (~${(durationDays / 30.43).toFixed(1)} Months)`
    }
  ];

  return {
    valid: true,
    status: windowStatus,
    windowBadgeColor,
    origin: p1.name || p1.id,
    originId: p1.id || p1.spkid,
    destination: p2.name || p2.id,
    destinationId: p2.id || p2.spkid,
    originRadiusAu: r1Au,
    destinationRadiusAu: r2Au,
    transferSemiMajorAxisAu: aTransferAu,
    transferSemiMajorAxisKm: aTransferKm,
    eccentricity: eTransfer,
    originCircularVelocityKmS: v1,
    destinationCircularVelocityKmS: v2,
    departureTransferVelocityKmS: vDep,
    arrivalTransferVelocityKmS: vArr,
    departureDeltaVKmS: deltaV1,
    arrivalDeltaVKmS: deltaV2,
    totalDeltaVKmS: totalDeltaV,
    durationDays: Math.round(durationDays),
    phaseAngleReqDeg: Number(phaseAngleDeg.toFixed(1)),
    currentPhaseDeg: Number(currentPhaseDeg.toFixed(1)),
    phaseErrorDeg: Number(phaseErrorDeg.toFixed(1)),
    specificEnergyJ,
    trajectoryPoints: points,
    calculationSteps,
    type: transferType,
    precisionLabel: 'IDEALIZED HELIOCENTRIC COPLANAR MODEL (NASA/JPL DERIVED DATA)'
  };
}

