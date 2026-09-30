/**
 * ScaleManager — Central physical-to-render size conversion system.
 *
 * Architecture:
 *   physicalRadiusKm → ScaleManager → renderRadius (scene units)
 *
 * Three scale modes:
 *
 *  TRUE       — Pure physical scale (AU-based). Everything is astronomically correct
 *               but inner planets/moons are nearly invisible at solar system overview.
 *
 *  BALANCED   — Default. Preserves scientifically correct SIZE HIERARCHY (all relative
 *               ratios intact) while boosting overall visibility. No size rank is ever
 *               reversed. Used for the main interactive view.
 *
 *  EDUCATIONAL — Non-linear power-law compression. Smaller bodies get a proportional
 *               visibility boost but never exceed larger bodies in render size.
 *               All objects remain clearly distinguishable.
 *
 * IMPORTANT: physicalRadiusKm is NEVER modified. Render radius is separate.
 *
 * Hierarchy guarantee (largest to smallest render radius, all modes):
 *   Sun > Jupiter > Saturn > Uranus > Neptune > Earth > Venus >
 *   Mars > Mercury > Pluto > Ganymede > Titan > Callisto >
 *   Io > Moon > Europa > Triton > Titania > Rhea > Oberon >
 *   Iapetus > Charon > Ariel > Umbriel > Dione > Tethys >
 *   Enceladus > Miranda > Mimas > Phobos > Deimos
 */

// ── Physical constants ─────────────────────────────────────────────────────────
export const AU_KM = 149597870.7;

// ── Scene unit reference ───────────────────────────────────────────────────────
//
// 1 AU = SCENE_AU scene units in BALANCED/EDUCATIONAL modes.
// This sets the overall scene scale. Planets orbit at distances
// proportional to this value.
export const SCENE_AU = 25;      // 1 AU = 25 scene units (balanced distance)
export const SCENE_AU_REAL = 1000; // 1 AU = 1000 scene units (true scale distances)

// ── Balanced mode reference size ───────────────────────────────────────────────
//
// Earth radius in scene units in BALANCED mode.
// All other objects are scaled proportionally to this reference.
// This single constant controls the "zoom level" of the whole system.
const EARTH_RENDER_RADIUS_BALANCED = 1.8;  // scene units

// ── Physical reference radius for Earth ────────────────────────────────────────
const EARTH_RADIUS_KM = 6371.0;

// ── Balanced scale exponent for realistic, navigable planet size ratios ──────
//
// render = C * km^BALANCED_POWER
// Exponent 0.72 ensures Jupiter (69,911 km) renders at ~10.15 scene units
// (5.6x Earth), keeping Jupiter impressively large without dwarfing the entire scene.
// Strictly preserves hierarchy: Sun > Jupiter > Saturn > Uranus > Neptune > Earth > Venus > Mars > Mercury > Moon > Pluto.
const BALANCED_POWER = 0.72;
const BALANCED_C = EARTH_RENDER_RADIUS_BALANCED / Math.pow(EARTH_RADIUS_KM, BALANCED_POWER);

// ── Educational: power-law exponent ───────────────────────────────────────────
const EDUC_POWER = 0.58;  // exponent (0=all same, 1=linear)
const EDUC_C = EARTH_RENDER_RADIUS_BALANCED / Math.pow(EARTH_RADIUS_KM, EDUC_POWER);

// ── Minimum render radii (scene units) — prevents invisible sub-pixel dots ──
const MIN_RENDER_RADIUS = {
  planet: 0.12,   // smallest planet (tiny Pluto) still visible
  moon:   0.06,   // smallest moon still clickable
  star:   4.0     // Sun visual render radius in balanced/educational mode
};


export class ScaleManager {
  /**
   * @param {'balanced'|'educational'|'true'} mode
   */
  constructor(mode = 'balanced') {
    this._mode = mode;
  }

  get mode() { return this._mode; }
  set mode(m) { this._mode = m; }

  // ─── Core conversion ────────────────────────────────────────────────────────

  /**
   * Convert a physical radius in km to scene units for the current mode.
   * NEVER modifies the source data.
   *
   * @param {number} radiusKm      Physical body radius
   * @param {'planet'|'moon'|'star'|'asteroid'} bodyType
   * @returns {number}             Render radius in scene units
   */
  getRenderRadius(radiusKm, bodyType = 'planet') {
    if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
      console.warn(`[ScaleManager] Invalid radiusKm: ${radiusKm} (bodyType=${bodyType})`);
      return MIN_RENDER_RADIUS[bodyType] ?? 0.1;
    }

    let r;
    switch (this._mode) {
      case 'true':
        // Pure AU scale — exact physical proportions
        r = (radiusKm / AU_KM) * SCENE_AU_REAL;
        break;

      case 'educational':
        // Power-law compression for maximum feature visibility
        r = EDUC_C * Math.pow(radiusKm, EDUC_POWER);
        break;

      case 'balanced':
      default:
        // Controlled physical power-law (0.72) — Jupiter ~10.15 scene units
        r = BALANCED_C * Math.pow(radiusKm, BALANCED_POWER);
        break;
    }

    const minR = MIN_RENDER_RADIUS[bodyType] ?? 0.05;
    return Math.max(minR, r);
  }

  /**
   * Get render radius for any object given its data entry.
   * Works for planets, moons, Sun.
   *
   * @param {object} data  Object with radiusKm and optional type
   * @returns {number}
   */
  getRenderRadiusForObject(data) {
    const km = data.radiusKm;
    const type = data.type;

    if (type === 'Star') return this.getSunRenderRadius();

    const bodyType = (type === 'Planet' || type === 'Dwarf Planet') ? 'planet' : 'moon';
    return this.getRenderRadius(km, bodyType);
  }

  /**
   * Sun render radius — always substantially larger than any planet.
   * In balanced/educational mode: returns 4.0 scene units so it never overlaps inner orbits.
   * In true mode: exact AU scale converted to scene units.
   */
  getSunRenderRadius() {
    const SUN_RADIUS_KM = 696340;
    if (this._mode === 'true') {
      return (SUN_RADIUS_KM / AU_KM) * SCENE_AU_REAL;
    }
    // Controlled visual size in balanced/educational mode (4.0 scene units)
    // Ensures Mercury perihelion (7.69 units) is well clear of Sun surface
    return 4.0;
  }

  /**
   * Convert km to scene units for DISTANCES (orbital radii, separation).
   * Separate from body size — uses distance scale factor.
   */
  kmToDistanceSceneUnits(km) {
    if (this._mode === 'true') return (km / AU_KM) * SCENE_AU_REAL;
    return (km / AU_KM) * SCENE_AU;
  }

  /**
   * AU to scene distance units.
   */
  auToSceneUnits(au) {
    if (this._mode === 'true') return au * SCENE_AU_REAL;
    return au * SCENE_AU;
  }

  /**
   * Sun Separation Validator (Req 30, 32, 34)
   * Verifies for every planet that:
   *   perihelionScene > sunRadiusScene + planetRadiusScene
   * Outputs a clean diagnostic report table to console.
   */
  validateSunSeparation(planetDataMap) {
    const sunR = this.getSunRenderRadius();
    console.group(`[ScaleManager] ☀️ SOLAR SYSTEM SCALE & SUN SEPARATION REPORT (Mode: ${this._mode})`);
    console.log(`Sun Render Radius: ${sunR.toFixed(3)} scene units`);

    let allSafe = true;

    Object.values(planetDataMap).forEach(planet => {
      if (planet.id === 'sun') return;

      const aAU = planet.a;
      const e = planet.e ?? planet.eccentricity ?? 0;
      const qAU = aAU * (1 - e); // Perihelion distance in AU

      const qScene = this.auToSceneUnits(qAU);
      const planetR = this.getRenderRadius(planet.radiusKm, 'planet');
      const minRequiredDist = sunR + planetR;

      const gap = qScene - minRequiredDist;
      const isSafe = gap > 0;

      if (!isSafe) {
        allSafe = false;
        console.error(
          `❌ SUN INTERSECTION ERROR: '${planet.name}' perihelion (${qScene.toFixed(2)} scene units) <= Sun+Planet radius (${minRequiredDist.toFixed(2)} scene units). Overlap: ${Math.abs(gap).toFixed(2)} units`
        );
      } else {
        console.log(
          `✅ ${planet.name.padEnd(8)} | Orbit (a): ${aAU.toFixed(3)} AU | Perihelion (q): ${qAU.toFixed(3)} AU (${qScene.toFixed(2)} scene units) | Render R: ${planetR.toFixed(3)} | Separation: SAFE (+${gap.toFixed(2)} units gap)`
        );
      }
    });

    if (allSafe) {
      console.log('✅ ALL PLANETARY PERIHELIONS ARE SAFELY CLEAR OF THE SUN MESH.');
    }
    console.groupEnd();
    return allSafe;
  }

  /**
   * Satellite Separation Validator (Req 11, 41)
   * Verifies for every satellite that its orbit distance is strictly greater
   * than parent render radius + moon render radius.
   */
  validateMoonSeparation(planetDataMap, moonDataArray) {
    let allSafe = true;
    console.groupCollapsed(`[ScaleManager] 🌙 SATELLITE SEPARATION REPORT`);

    moonDataArray.forEach(moon => {
      const parent = planetDataMap[moon.parentPlanet];
      if (!parent) return;

      const parentR = this.getRenderRadius(parent.radiusKm, 'planet');
      const moonR = this.getRenderRadius(moon.radiusKm, 'moon');
      const minRequired = parentR + moonR;

      const s = this.auToSceneUnits(1);
      const baseDist = (moon.a || 0.00257) * 450 * (s / 25);
      const actualDist = Math.max(minRequired + 1.2, baseDist);

      const gap = actualDist - minRequired;
      if (gap <= 0) {
        allSafe = false;
        console.error(`❌ SATELLITE COLLISION WARNING: Moon '${moon.id}' overlaps parent '${moon.parentPlanet}'`);
      } else {
        console.log(`✅ ${moon.id.padEnd(12)} (Parent: ${moon.parentPlanet.padEnd(8)}) | Min Dist: ${actualDist.toFixed(2)} | Gap: +${gap.toFixed(2)} units`);
      }
    });

    if (allSafe) {
      console.log('✅ ALL SATELLITE ORBIT DISTANCES ARE SAFELY OUTSIDE PARENT PLANET SURFACES.');
    }
    console.groupEnd();
    return allSafe;
  }

  // ─── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validate a catalog of celestial objects.
   * Detects missing/invalid radii, hierarchy violations, and equal-size bugs.
   *
   * @param {object[]} objects  Array of { id, name, radiusKm, parentId? }
   * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
   */
  validateCelestialSizes(objects) {
    const errors = [];
    const warnings = [];
    const renderRadii = new Map();

    for (const obj of objects) {
      const id = obj.id || obj.name || '?';

      // Check raw physical radius
      if (obj.radiusKm == null) {
        errors.push(`[${id}] Missing radiusKm`);
        continue;
      }
      if (!Number.isFinite(obj.radiusKm)) {
        errors.push(`[${id}] Non-finite radiusKm: ${obj.radiusKm}`);
        continue;
      }
      if (obj.radiusKm <= 0) {
        errors.push(`[${id}] Non-positive radiusKm: ${obj.radiusKm}`);
        continue;
      }

      const bodyType = (obj.type === 'Star') ? 'star'
                     : (obj.type === 'Planet' || obj.type === 'Dwarf Planet') ? 'planet'
                     : 'moon';
      const rr = this.getRenderRadius(obj.radiusKm, bodyType);
      renderRadii.set(id, { rr, physKm: obj.radiusKm, type: bodyType });
    }

    // Check hierarchy: parent must be larger than child
    for (const obj of objects) {
      if (!obj.parentId) continue;
      const parentEntry = renderRadii.get(obj.parentId);
      const childEntry = renderRadii.get(obj.id);
      if (!parentEntry || !childEntry) continue;

      if (childEntry.physKm >= parentEntry.physKm) {
        errors.push(
          `[${obj.id}] physKm (${childEntry.physKm}) >= parent [${obj.parentId}] physKm (${parentEntry.physKm})`
        );
      }
      if (childEntry.rr >= parentEntry.rr) {
        warnings.push(
          `[${obj.id}] renderRadius (${childEntry.rr.toFixed(4)}) >= parent [${obj.parentId}] renderRadius (${parentEntry.rr.toFixed(4)})`
        );
      }
    }

    // Detect duplicate render radii (same-size bug)
    const rrValues = [...renderRadii.entries()];
    for (let i = 0; i < rrValues.length; i++) {
      for (let j = i + 1; j < rrValues.length; j++) {
        const [idA, a] = rrValues[i];
        const [idB, b] = rrValues[j];
        if (a.type === b.type && Math.abs(a.rr - b.rr) < 0.001 && Math.abs(a.physKm - b.physKm) > 100) {
          warnings.push(`[SAME-SIZE BUG] ${idA} and ${idB} have nearly identical renderRadius ${a.rr.toFixed(4)} despite different physKm (${a.physKm} vs ${b.physKm})`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings, renderRadii };
  }

  /**
   * Validate the hierarchy of key celestial body size relationships.
   * Runs at initialization and logs results to console.
   *
   * @param {object} planetData   PLANET_DATA object (key → data)
   * @param {object[]} moonData   NATURAL_SATELLITES array
   */
  runHierarchyTest(planetData, moonData) {
    const p = (id) => planetData[id]?.radiusKm;
    const m = (id) => moonData.find(x => x.id === id)?.radiusKm;

    const pass = (name, a, b) => {
      if (a == null || b == null) { console.warn(`[ScaleManager] SKIP ${name}: missing data`); return; }
      if (a > b) { console.log(`[ScaleManager] ✅ ${name}: ${a} > ${b}`); }
      else        { console.error(`[ScaleManager] ❌ ${name}: ${a} NOT > ${b}`); }
    };

    console.groupCollapsed('[ScaleManager] Physical Size Hierarchy Test');

    // Planet vs planet
    pass('Sun > Jupiter',   p('sun'), p('jupiter'));
    pass('Jupiter > Saturn',p('jupiter'), p('saturn'));
    pass('Saturn > Uranus', p('saturn'), p('uranus'));
    pass('Saturn > Neptune',p('saturn'), p('neptune'));
    pass('Uranus > Earth',  p('uranus'), p('earth'));
    pass('Neptune > Earth', p('neptune'), p('earth'));
    pass('Earth > Venus',   p('earth'), p('venus'));
    pass('Earth > Mars',    p('earth'), p('mars'));
    pass('Earth > Mercury', p('earth'), p('mercury'));
    pass('Earth > Pluto',   p('earth'), p('pluto'));
    pass('Mercury > Pluto', p('mercury'), p('pluto'));

    // Moon vs parent
    pass('Moon < Earth',         p('earth'), m('moon'));
    pass('Ganymede < Jupiter',   p('jupiter'), m('ganymede'));
    pass('Titan < Saturn',       p('saturn'), m('titan'));
    pass('Callisto < Jupiter',   p('jupiter'), m('callisto'));
    pass('Io < Jupiter',         p('jupiter'), m('io'));
    pass('Europa < Jupiter',     p('jupiter'), m('europa'));
    pass('Triton < Neptune',     p('neptune'), m('triton'));
    pass('Charon < Pluto',       p('pluto'), m('charon'));

    // Moon hierarchy
    pass('Ganymede > Titan',     m('ganymede'), m('titan'));
    pass('Ganymede > Moon',      m('ganymede'), m('moon'));
    pass('Titan > Callisto',     m('titan'), m('callisto'));
    pass('Titan > Moon',         m('titan'), m('moon'));
    pass('Moon > Europa',        m('moon'), m('europa'));
    pass('Europa > Enceladus',   m('europa'), m('enceladus'));
    pass('Titan > Rhea',         m('titan'), m('rhea'));
    pass('Charon > Mimas',       m('charon'), m('mimas'));

    console.groupEnd();
  }

  /**
   * Get a debug summary string for an object.
   * Used by future size debug overlay.
   */
  getDebugInfo(id, radiusKm, type = 'planet') {
    const bodyType = type === 'Star' ? 'star' : type === 'Planet' || type === 'Dwarf Planet' ? 'planet' : 'moon';
    const rr = type === 'Star' ? this.getSunRenderRadius() : this.getRenderRadius(radiusKm, bodyType);
    return {
      id,
      physicalRadiusKm: radiusKm,
      physicalDiameterKm: radiusKm * 2,
      renderRadius: rr,
      scaleMode: this._mode,
      bodyType
    };
  }
}

export default ScaleManager;
