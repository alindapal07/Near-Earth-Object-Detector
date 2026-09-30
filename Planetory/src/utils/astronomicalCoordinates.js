import { J2000_JD } from './dateUtils.js';

/**
 * Centralized Astronomical Coordinate Transformation & Observational Calculations (PART 29)
 * Supports:
 * • Heliocentric Ecliptic (AU)
 * • Geocentric Ecliptic (AU, Lambda, Beta)
 * • Geocentric Equatorial (RA in hours, Dec in degrees)
 * • Horizontal Alt-Az (Altitude in deg, Azimuth in deg from North)
 * • Epoch Precession (J2000 -> Date)
 * • Atmospheric Refraction (Geometric vs Apparent Altitude)
 * • Moon Phase & Illumination
 * • Observability Score & Twilight Classification
 * • Angular Separation & Conjunction/Opposition Detection
 */

export const OBLIQUITY_J2000_RAD = (23.439281 * Math.PI) / 180; // Earth ecliptic tilt

/**
 * Calculates Greenwich Mean Sidereal Time (GMST) in hours (0 to 24) for given days since J2000.
 */
export function calculateGMSTHours(simTimeDays) {
  const gmst = 18.697374558 + 24.06570982441908 * simTimeDays;
  return ((gmst % 24) + 24) % 24;
}

/**
 * Calculates Local Sidereal Time (LST) in hours (0 to 24) for observer longitude.
 */
export function calculateLSTHours(simTimeDays, longitudeDeg) {
  const gmst = calculateGMSTHours(simTimeDays);
  const lst = gmst + (longitudeDeg / 15.0);
  return ((lst % 24) + 24) % 24;
}

/**
 * Applies Approximate Astronomical Precession from J2000.0 to epoch of date.
 * Precession rate: ~50.29 arcseconds per year (0.0139696 deg/yr)
 */
export function applyPrecession(raHours, decDeg, simTimeDays) {
  const yearsSinceJ2000 = simTimeDays / 365.25;
  if (Math.abs(yearsSinceJ2000) < 0.1) {
    return { raHours, decDeg, isPrecessed: false };
  }

  const raRad = (raHours * Math.PI) / 12;
  const decRad = (decDeg * Math.PI) / 180;

  // Approximate precession constants in arcseconds per year
  const m = 46.124378 / 3600 * (Math.PI / 180);
  const n = 20.043109 / 3600 * (Math.PI / 180);

  const dra = (m + n * Math.sin(raRad) * Math.tan(decRad)) * yearsSinceJ2000;
  const ddec = (n * Math.cos(raRad)) * yearsSinceJ2000;

  let newRaRad = raRad + dra;
  if (newRaRad < 0) newRaRad += Math.PI * 2;
  const newDecRad = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, decRad + ddec));

  return {
    raHours: ((newRaRad * 12) / Math.PI) % 24,
    decDeg: (newDecRad * 180) / Math.PI,
    isPrecessed: true,
    epoch: `OF DATE (${(2000 + yearsSinceJ2000).toFixed(1)})`
  };
}

/**
 * Bennett's Atmospheric Refraction Formula
 * Calculates refraction R in arcminutes for geometric altitude h in degrees.
 */
export function calculateAtmosphericRefraction(altDeg) {
  if (altDeg < -2.0) return 0; // Deep below horizon

  const h = Math.max(-0.56, altDeg);
  // Bennett formula: R = 1.02 / tan(h + 10.3 / (h + 5.11))
  const term = h + 10.3 / (h + 5.11);
  const rArcmin = 1.02 / Math.tan((term * Math.PI) / 180);
  
  return Math.max(0, rArcmin / 60); // Return in degrees
}

/**
 * Converts Geocentric Ecliptic coordinates (x, y, z in AU) to Geocentric Equatorial (RA in hours, Dec in degrees).
 */
export function eclipticToEquatorial(xGeo, yGeo, zGeo) {
  const dist = Math.sqrt(xGeo * xGeo + yGeo * yGeo + zGeo * zGeo);
  if (dist === 0) return { raHours: 0, decDeg: 0, dist: 0, eclipticLonDeg: 0, eclipticLatDeg: 0 };

  const lambdaRad = Math.atan2(yGeo, xGeo); // Ecliptic longitude
  const betaRad = Math.asin(Math.max(-1, Math.min(1, zGeo / dist))); // Ecliptic latitude

  const sinEps = Math.sin(OBLIQUITY_J2000_RAD);
  const cosEps = Math.cos(OBLIQUITY_J2000_RAD);

  // Equatorial declination
  const sinDec = Math.sin(betaRad) * cosEps + Math.cos(betaRad) * sinEps * Math.sin(lambdaRad);
  const decRad = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  // Equatorial right ascension
  const yEq = Math.sin(lambdaRad) * cosEps - Math.tan(betaRad) * sinEps;
  const xEq = Math.cos(lambdaRad);
  let raRad = Math.atan2(yEq, xEq);
  if (raRad < 0) raRad += Math.PI * 2;

  const raHours = (raRad * 12) / Math.PI;
  const decDeg = (decRad * 180) / Math.PI;

  let eclLonDeg = (lambdaRad * 180) / Math.PI;
  if (eclLonDeg < 0) eclLonDeg += 360;
  const eclLatDeg = (betaRad * 180) / Math.PI;

  return {
    raHours,
    decDeg,
    dist,
    eclipticLonDeg: Number(eclLonDeg.toFixed(2)),
    eclipticLatDeg: Number(eclLatDeg.toFixed(2)),
    frame: 'GEOCENTRIC_EQUATORIAL',
    epoch: 'J2000.0'
  };
}

/**
 * Converts Geocentric Equatorial (RA in hours, Dec in deg) to Local Horizontal (Alt, Az in deg).
 */
export function equatorialToHorizontal(raHours, decDeg, lstHours, latitudeDeg, applyRefraction = false) {
  const latRad = (latitudeDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;
  const raRad = (raHours * Math.PI) / 12;
  const lstRad = (lstHours * Math.PI) / 12;

  // Hour Angle HA = LST - RA
  let haRad = lstRad - raRad;

  // Altitude a
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) + Math.cos(latRad) * Math.cos(decRad) * Math.cos(haRad);
  const altRad = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const geomAltDeg = (altRad * 180) / Math.PI;

  // Azimuth A (measured clockwise from North)
  const yAz = -Math.sin(haRad);
  const xAz = Math.cos(latRad) * Math.tan(decRad) - Math.sin(latRad) * Math.cos(haRad);
  let azRad = Math.atan2(yAz, xAz);
  if (azRad < 0) azRad += Math.PI * 2;

  const azDeg = (azRad * 180) / Math.PI;

  // Apparent altitude if refraction enabled
  const refractionDeg = applyRefraction ? calculateAtmosphericRefraction(geomAltDeg) : 0;
  const apparentAltDeg = geomAltDeg + refractionDeg;

  return {
    altDeg: Number(apparentAltDeg.toFixed(2)),
    geometricAltDeg: Number(geomAltDeg.toFixed(2)),
    refractionDeg: Number(refractionDeg.toFixed(3)),
    azDeg: Number(azDeg.toFixed(2)),
    haHours: Number((((haRad * 12) / Math.PI % 24) + 24) % 24).toFixed(2),
    isAboveHorizon: apparentAltDeg >= -0.56,
    frame: 'HORIZONTAL_ALT_AZ'
  };
}

/**
 * Formats RA hours into standard astronomical format: 05h 14m 32s
 */
export function formatRA(raHours) {
  if (raHours == null || isNaN(raHours)) return 'N/A';
  const h = Math.floor(raHours);
  const remM = (raHours - h) * 60;
  const m = Math.floor(remM);
  const s = Math.floor((remM - m) * 60);
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

/**
 * Formats Dec degrees into standard astronomical format: +16° 30′ 12″
 */
export function formatDec(decDeg) {
  if (decDeg == null || isNaN(decDeg)) return 'N/A';
  const sign = decDeg >= 0 ? '+' : '−';
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const remM = (abs - d) * 60;
  const m = Math.floor(remM);
  const s = Math.floor((remM - m) * 60);
  return `${sign}${String(d).padStart(2, '0')}° ${String(m).padStart(2, '0')}′ ${String(s).padStart(2, '0')}″`;
}

/**
 * Calculates complete observer coordinates for an object.
 */
export function calculateObserverCoordinates(objHelioPos, earthHelioPos, simTimeDays, observer, options = {}) {
  if (!objHelioPos || !earthHelioPos) return null;

  const { epoch = 'J2000', applyRefraction = false } = options;

  // Geocentric ecliptic vector (AU)
  const xGeo = objHelioPos.x - earthHelioPos.x;
  const yGeo = objHelioPos.y - earthHelioPos.y;
  const zGeo = objHelioPos.z - earthHelioPos.z;

  const eq = eclipticToEquatorial(xGeo, yGeo, zGeo);
  
  // Apply precession if epoch OF DATE selected
  let activeRA = eq.raHours;
  let activeDec = eq.decDeg;
  if (epoch === 'OF_DATE') {
    const prec = applyPrecession(eq.raHours, eq.decDeg, simTimeDays);
    activeRA = prec.raHours;
    activeDec = prec.decDeg;
  }

  const lstHours = calculateLSTHours(simTimeDays, observer.longitudeDeg);
  const horiz = equatorialToHorizontal(activeRA, activeDec, lstHours, observer.latitudeDeg, applyRefraction);

  const geocentricDistanceAu = eq.dist;
  const geocentricDistanceKm = geocentricDistanceAu * 149597870.7;

  // Angular diameter theta = 2 * atan(R_phys / d_km) in arcseconds
  const radiusKm = objHelioPos.radiusKm || 1000;
  const angularDiameterRad = 2 * Math.atan(radiusKm / Math.max(1, geocentricDistanceKm));
  const angularDiameterArcsec = (angularDiameterRad * 180 * 3600) / Math.PI;

  return {
    raHours: activeRA,
    raFormatted: formatRA(activeRA),
    decDeg: activeDec,
    decFormatted: formatDec(activeDec),
    altDeg: horiz.altDeg,
    geometricAltDeg: horiz.geometricAltDeg,
    refractionDeg: horiz.refractionDeg,
    azDeg: horiz.azDeg,
    isAboveHorizon: horiz.isAboveHorizon,
    eclipticLonDeg: eq.eclipticLonDeg,
    eclipticLatDeg: eq.eclipticLatDeg,
    geocentricDistanceAu,
    geocentricDistanceKm,
    angularDiameterArcsec,
    lstHours,
    epochLabel: epoch === 'OF_DATE' ? 'OF DATE' : 'J2000.0',
    frame: 'HORIZONTAL_ALT_AZ'
  };
}

/**
 * Calculates Moon phase & illumination percentage from Sun-Moon-Earth geometry.
 */
export function calculateMoonPhaseGeometry(moonHelioPos, earthHelioPos, sunHelioPos = { x: 0, y: 0, z: 0 }) {
  if (!moonHelioPos || !earthHelioPos) {
    return { phasePct: 50, illuminationPct: 50, phaseName: 'FIRST QUARTER' };
  }

  // Vector Moon -> Sun
  const msX = sunHelioPos.x - moonHelioPos.x;
  const msY = sunHelioPos.y - moonHelioPos.y;
  const msZ = sunHelioPos.z - moonHelioPos.z;
  const msDist = Math.sqrt(msX * msX + msY * msY + msZ * msZ) || 1;

  // Vector Moon -> Earth
  const meX = earthHelioPos.x - moonHelioPos.x;
  const meY = earthHelioPos.y - moonHelioPos.y;
  const meZ = earthHelioPos.z - moonHelioPos.z;
  const meDist = Math.sqrt(meX * meX + meY * meY + meZ * meZ) || 1;

  // Phase angle phi = acos( (ms . me) / (|ms| * |me|) )
  const dotProduct = (msX * meX + msY * meY + msZ * meZ) / (msDist * meDist);
  const phaseAngleRad = Math.acos(Math.max(-1, Math.min(1, dotProduct)));

  // Fraction illuminated k = (1 + cos(phi)) / 2
  const illuminationFraction = (1 + Math.cos(phaseAngleRad)) / 2;
  const illuminationPct = Math.round(illuminationFraction * 100);

  // Phase classification
  let phaseName = 'FULL MOON';
  const phaseDeg = (phaseAngleRad * 180) / Math.PI;

  if (phaseDeg > 165) phaseName = 'NEW MOON';
  else if (phaseDeg > 105) phaseName = 'CRESCENT';
  else if (phaseDeg > 75) phaseName = 'QUARTER MOON';
  else if (phaseDeg > 15) phaseName = 'GIBBOUS MOON';
  else phaseName = 'FULL MOON';

  return {
    phaseAngleDeg: Number(phaseDeg.toFixed(1)),
    illuminationPct,
    phaseName
  };
}

/**
 * Calculates Twilight State (Daylight, Civil, Nautical, Astronomical, Night).
 */
export function calculateTwilightState(sunAltDeg) {
  if (sunAltDeg > 0) return { label: 'DAYLIGHT', color: '#ffea00', code: 'DAY' };
  if (sunAltDeg > -6) return { label: 'CIVIL TWILIGHT', color: '#ffb703', code: 'CIVIL' };
  if (sunAltDeg > -12) return { label: 'NAUTICAL TWILIGHT', color: '#4fc3f7', code: 'NAUTICAL' };
  if (sunAltDeg > -18) return { label: 'ASTRONOMICAL TWILIGHT', color: '#00f0ff', code: 'ASTRO' };
  return { label: 'DEEP NIGHT SKY', color: '#00ffaa', code: 'NIGHT' };
}

/**
 * Calculates Observability Score (EXCELLENT, GOOD, POOR, NOT VISIBLE).
 */
export function calculateObservabilityScore(altDeg, sunAltDeg, distAu = 1) {
  if (altDeg < 0) {
    return { score: 'NOT VISIBLE', label: 'BELOW HORIZON', color: '#ff4444' };
  }
  if (sunAltDeg > 0) {
    return { score: 'POOR', label: 'DAYLIGHT SKY', color: '#ffb703' };
  }
  if (altDeg > 30 && sunAltDeg < -12) {
    return { score: 'EXCELLENT', label: 'OPTIMAL DARK SKY', color: '#00ffaa' };
  }
  if (altDeg > 10) {
    return { score: 'GOOD', label: 'MODERATE ALTITUDE', color: '#00f0ff' };
  }
  return { score: 'POOR', label: 'LOW HORIZON OBSURITY', color: '#ffb703' };
}

/**
 * Calculates Rise, Transit, and Set UTC times.
 */
export function calculateRiseTransitSet(raHours, decDeg, simTimeDays, observer) {
  const latRad = (observer.latitudeDeg * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  const cosHa0 = (Math.sin((-0.56 * Math.PI) / 180) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  let isAlwaysAbove = false;
  let isAlwaysBelow = false;

  if (cosHa0 < -1) isAlwaysAbove = true;
  else if (cosHa0 > 1) isAlwaysBelow = true;

  const ha0Rad = (!isAlwaysAbove && !isAlwaysBelow) ? Math.acos(cosHa0) : 0;
  const ha0Hours = (ha0Rad * 12) / Math.PI;

  const gmstTransit = ((raHours - (observer.longitudeDeg / 15.0)) % 24 + 24) % 24;
  const gmst0 = calculateGMSTHours(simTimeDays);
  let transitUTCHours = ((gmstTransit - gmst0) % 24 + 24) % 24;

  const riseUTCHours = ((transitUTCHours - ha0Hours) % 24 + 24) % 24;
  const setUTCHours = ((transitUTCHours + ha0Hours) % 24 + 24) % 24;

  const formatUTCHour = (h) => {
    const hh = Math.floor(h);
    const mm = Math.floor((h - hh) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')} UTC`;
  };

  return {
    riseTime: isAlwaysBelow ? 'Never Rises' : isAlwaysAbove ? 'Circumpolar (Always Up)' : formatUTCHour(riseUTCHours),
    transitTime: formatUTCHour(transitUTCHours),
    setTime: isAlwaysBelow ? 'Never Rises' : isAlwaysAbove ? 'Circumpolar (Always Up)' : formatUTCHour(setUTCHours),
    isAlwaysAbove,
    isAlwaysBelow
  };
}

/**
 * Calculates spherical angular separation between two targets in degrees.
 */
export function calculateAngularSeparation(ra1Hours, dec1Deg, ra2Hours, dec2Deg) {
  const ra1Rad = (ra1Hours * Math.PI) / 12;
  const dec1Rad = (dec1Deg * Math.PI) / 180;
  const ra2Rad = (ra2Hours * Math.PI) / 12;
  const dec2Rad = (dec2Deg * Math.PI) / 180;

  const cosSep = Math.sin(dec1Rad) * Math.sin(dec2Rad) + Math.cos(dec1Rad) * Math.cos(dec2Rad) * Math.cos(ra1Rad - ra2Rad);
  const sepRad = Math.acos(Math.max(-1, Math.min(1, cosSep)));
  return (sepRad * 180) / Math.PI;
}
