/**
 * ScientificDataRegistry.js — Unified Centralized Astronomical Object Registry (Part 30)
 *
 * Aggregates and normalizes ALL supported astronomical objects across Planetory:
 * • Planets & Dwarf Planets (PLANET_DATA)
 * • Natural Satellites (NATURAL_SATELLITES)
 * • Asteroids, Comets, NEOs, PHAs (spaceData catalog & feeds)
 * • Historic & Active Spacecraft (SPACECRAFT_MISSIONS)
 * • Bright Stars (BRIGHT_STARS)
 * • Constellations (CONSTELLATIONS)
 * • Celestial Events (Close approaches, eclipses, conjunctions)
 *
 * Guarantees ONE canonical object identity and scientific data model shared across
 * Solar System, Object Intelligence, Data Factory, Observatory, Comparison, and Mission Planning.
 */

import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES } from '../data/satellites';
import { SPACECRAFT_MISSIONS } from '../data/spacecraftMissions';
import { BRIGHT_STARS } from '../data/brightStars';
import { CONSTELLATIONS } from '../data/constellations';

class ScientificDataRegistry {
  constructor() {
    this.registry = new Map();
    this.searchIndex = [];
    this.isInitialized = false;
  }

  /**
   * Initializes or updates the unified registry with all celestial object sources.
   */
  initialize(externalSpaceData = {}) {
    this.registry.clear();
    this.searchIndex = [];

    // 1. Register Major Planets & Sun
    Object.values(PLANET_DATA).forEach(planet => {
      if (!planet || !planet.id) return;
      const normalized = this.normalizeObject({
        ...planet,
        type: planet.id === 'sun' ? 'STAR' : (planet.type || 'PLANET'),
        category: planet.id === 'sun' ? 'PRIMARY STAR' : (planet.category || 'TERRESTRIAL PLANET'),
        parentId: planet.id === 'sun' ? null : 'sun',
        systemId: 'SOLAR_SYSTEM',
        source: 'PLANETORY / NASA JPL',
        dataQuality: 'COMPLETE'
      });
      this.registerObject(normalized);
    });

    // 2. Register Natural Satellites (Moons)
    NATURAL_SATELLITES.forEach(moon => {
      if (!moon || !moon.id) return;
      const normalized = this.normalizeObject({
        ...moon,
        type: 'MOON',
        category: 'NATURAL SATELLITE',
        parentId: moon.parentPlanet || 'earth',
        systemId: 'SOLAR_SYSTEM',
        source: 'PLANETORY / NASA HORIZONS',
        dataQuality: 'COMPLETE'
      });
      this.registerObject(normalized);
    });

    // 3. Register Spacecraft Missions
    SPACECRAFT_MISSIONS.forEach(sc => {
      if (!sc || !sc.id) return;
      const normalized = this.normalizeObject({
        ...sc,
        type: 'SPACECRAFT',
        category: sc.category || 'ARTIFICIAL PROBE',
        parentId: 'earth',
        systemId: 'INTERPLANETARY',
        source: sc.provenance || 'NASA / JPL HORIZONS',
        dataQuality: 'COMPLETE'
      });
      this.registerObject(normalized);
    });

    // 4. Register Bright Stars
    BRIGHT_STARS.forEach(star => {
      if (!star || !star.id) return;
      const normalized = this.normalizeObject({
        id: star.id,
        name: star.name,
        type: 'STAR',
        category: `SPECTRAL CLASS ${star.spectral || 'G'}`,
        parentId: null,
        systemId: 'MILKY_WAY',
        radiusKm: (star.rSun || 1) * 696340,
        massKg: (star.mSun || 1) * 1.989e30,
        vmag: star.vmag,
        spectral: star.spectral,
        raHours: star.ra,
        decDeg: star.dec,
        distLightYears: star.distLy,
        source: 'REVISED SIMBAD / HIPPARCOS CATALOG',
        dataQuality: 'COMPLETE'
      });
      this.registerObject(normalized);
    });

    // 5. Register Constellations
    CONSTELLATIONS.forEach(c => {
      if (!c || !c.id) return;
      const normalized = this.normalizeObject({
        id: c.id,
        name: c.name,
        type: 'CONSTELLATION',
        category: 'CELESTIAL CONSTELLATION',
        parentId: null,
        systemId: 'CELESTIAL_SPHERE',
        abbreviation: c.abbr,
        starCount: c.lines ? c.lines.length * 2 : 0,
        source: 'IAU CONSTELLATION CATALOG',
        dataQuality: 'PARTIAL'
      });
      this.registerObject(normalized);
    });

    // 6. Register External NASA / JPL Asteroid & NEO Catalog
    if (externalSpaceData.catalog && Array.isArray(externalSpaceData.catalog)) {
      externalSpaceData.catalog.forEach(ast => {
        if (!ast || (!ast.id && !ast.spkid)) return;
        const id = ast.spkid || ast.id || ast.designation;
        const normalized = this.normalizeObject({
          ...ast,
          id: String(id).toLowerCase(),
          name: ast.name || ast.fullName || ast.designation || `Asteroid ${id}`,
          type: ast.isComet ? 'COMET' : 'ASTEROID',
          category: ast.pha ? 'POTENTIALLY HAZARDOUS ASTEROID' : ast.neo ? 'NEAR EARTH OBJECT' : 'MAIN BELT ASTEROID',
          parentId: 'sun',
          systemId: 'SOLAR_SYSTEM',
          source: 'NASA / JPL SBDB SERVICE',
          dataQuality: ast.a ? 'COMPLETE' : 'PARTIAL'
        });
        this.registerObject(normalized);
      });
    }

    this.isInitialized = true;
  }

  /**
   * Normalizes a raw celestial object object into canonical format.
   */
  normalizeObject(raw) {
    const id = String(raw.id || raw.spkid || raw.designation || '').toLowerCase().trim();
    const name = raw.name || raw.fullName || raw.designation || id.toUpperCase();
    
    const radiusKm = raw.radiusKm || (raw.diameterKm ? raw.diameterKm / 2 : (raw.diameter ? raw.diameter / 2 : null));
    const massKg = raw.massKg || (raw.mass ? Number(raw.mass) : null);
    
    let aAu = raw.a || raw.semiMajorAxisAu;
    if (!aAu && raw.semiMajorAxisKm) aAu = raw.semiMajorAxisKm / 149597870.7;

    const e = raw.e !== undefined && raw.e !== null ? raw.e : (raw.eccentricity !== undefined ? raw.eccentricity : 0);

    return {
      id,
      name,
      type: raw.type || 'CELESTIAL_BODY',
      category: raw.category || 'UNCLASSIFIED',
      parentId: raw.parentId || null,
      systemId: raw.systemId || 'SOLAR_SYSTEM',
      radiusKm,
      massKg,
      semiMajorAxisAu: aAu || null,
      eccentricity: e,
      inclinationDeg: raw.i || raw.inclinationDeg || 0,
      orbitalPeriodDays: raw.orbitalPeriodDays || raw.period || null,
      vmag: raw.vmag || raw.magnitude || raw.h || null,
      spectral: raw.spectral || null,
      raHours: raw.raHours || raw.ra || null,
      decDeg: raw.decDeg || raw.dec || null,
      pha: !!raw.pha,
      neo: !!raw.neo,
      source: raw.source || 'PLANETORY CENTRAL DATASET',
      dataQuality: raw.dataQuality || (radiusKm && aAu ? 'COMPLETE' : 'PARTIAL'),
      rawRef: raw
    };
  }

  registerObject(obj) {
    if (!obj || !obj.id) return;
    this.registry.set(obj.id, obj);
    
    // Fast indexing tokens for instant search
    const tokens = [
      obj.id,
      obj.name.toLowerCase(),
      obj.type.toLowerCase(),
      obj.category.toLowerCase(),
      ...(obj.rawRef?.designation ? [obj.rawRef.designation.toLowerCase()] : [])
    ];
    this.searchIndex.push({ id: obj.id, tokens });
  }

  getObject(id) {
    if (!id) return null;
    return this.registry.get(String(id).toLowerCase()) || null;
  }

  getAllObjects() {
    return Array.from(this.registry.values());
  }

  /**
   * Fast global scientific search across all categories with prefix & token matching.
   */
  search(queryStr = '', options = {}) {
    const q = queryStr.toLowerCase().trim();
    const { category = 'ALL', limit = 100 } = options;

    let items = Array.from(this.registry.values());

    if (category && category !== 'ALL') {
      items = items.filter(o => o.type === category || (category === 'NEO' && o.neo));
    }

    if (!q) return items.slice(0, limit);

    return items.filter(o => {
      const matchName = o.name.toLowerCase().includes(q);
      const matchId = o.id.includes(q);
      const matchType = o.type.toLowerCase().includes(q);
      const matchCategory = o.category.toLowerCase().includes(q);
      return matchName || matchId || matchType || matchCategory;
    }).slice(0, limit);
  }

  /**
   * Powerful Multi-criteria Filter Engine
   */
  filter(criteria = {}) {
    const {
      types = [],
      parentIds = [],
      minRadiusKm,
      maxRadiusKm,
      minMassKg,
      maxMassKg,
      minDistanceAu,
      maxDistanceAu,
      minEccentricity,
      maxEccentricity,
      dataQuality = [],
      phaOnly = false,
      neoOnly = false
    } = criteria;

    return Array.from(this.registry.values()).filter(o => {
      if (types.length > 0 && !types.includes(o.type)) return false;
      if (parentIds.length > 0 && (!o.parentId || !parentIds.includes(o.parentId))) return false;
      if (phaOnly && !o.pha) return false;
      if (neoOnly && !o.neo) return false;

      if (minRadiusKm != null && (o.radiusKm == null || o.radiusKm < minRadiusKm)) return false;
      if (maxRadiusKm != null && (o.radiusKm == null || o.radiusKm > maxRadiusKm)) return false;

      if (minMassKg != null && (o.massKg == null || o.massKg < minMassKg)) return false;
      if (maxMassKg != null && (o.massKg == null || o.massKg > maxMassKg)) return false;

      if (minDistanceAu != null && (o.semiMajorAxisAu == null || o.semiMajorAxisAu < minDistanceAu)) return false;
      if (maxDistanceAu != null && (o.semiMajorAxisAu == null || o.semiMajorAxisAu > maxDistanceAu)) return false;

      if (minEccentricity != null && (o.eccentricity == null || o.eccentricity < minEccentricity)) return false;
      if (maxEccentricity != null && (o.eccentricity == null || o.eccentricity > maxEccentricity)) return false;

      if (dataQuality.length > 0 && !dataQuality.includes(o.dataQuality)) return false;

      return true;
    });
  }

  /**
   * Computes dataset scientific analytics (count, largest, smallest, avg radius, avg period).
   */
  computeDatasetAnalytics(dataset = []) {
    if (!dataset || dataset.length === 0) {
      return { count: 0, largest: null, smallest: null, avgRadiusKm: 0, avgPeriodDays: 0 };
    }

    let largest = null;
    let smallest = null;
    let totalRadius = 0;
    let radiusCount = 0;
    let totalPeriod = 0;
    let periodCount = 0;

    dataset.forEach(o => {
      if (o.radiusKm != null && o.radiusKm > 0) {
        totalRadius += o.radiusKm;
        radiusCount++;
        if (!largest || o.radiusKm > largest.radiusKm) largest = o;
        if (!smallest || o.radiusKm < smallest.radiusKm) smallest = o;
      }
      if (o.orbitalPeriodDays != null && o.orbitalPeriodDays > 0) {
        totalPeriod += o.orbitalPeriodDays;
        periodCount++;
      }
    });

    return {
      count: dataset.length,
      largestName: largest ? `${largest.name} (${Math.round(largest.radiusKm)} km)` : 'N/A',
      smallestName: smallest ? `${smallest.name} (${Math.round(smallest.radiusKm)} km)` : 'N/A',
      avgRadiusKm: radiusCount > 0 ? Math.round(totalRadius / radiusCount) : 0,
      avgPeriodDays: periodCount > 0 ? Number((totalPeriod / periodCount).toFixed(1)) : 0
    };
  }
}

export const scientificDataRegistry = new ScientificDataRegistry();
