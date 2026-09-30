/**
 * calculationRegistry.js - Central Registry & Filter Engine for Scientific Calculations
 */

import {
  calculateSurfaceGravity,
  calculateEscapeVelocity,
  calculateVolume,
  calculateDensity,
  calculateSurfaceArea,
  calculateCircumference,
  calculateRotationSpeed,
  calculateRelativeRadius,
  calculateRelativeMass,
  calculateRelativeVolume,
  calculateHumanWeight,
  calculateHillSphere,
  calculateSphereOfInfluence
} from './physicalCalculations';

export const CALCULATION_CATEGORIES = [
  { id: 'ALL', name: 'All Calculations' },
  { id: 'PHYSICAL', name: 'Physical Properties' },
  { id: 'ROTATION', name: 'Rotation Dynamics' },
  { id: 'COMPARATIVE', name: 'Comparative Ratios' },
  { id: 'ORBITAL', name: 'Orbital Spheres' }
];

const CALCULATION_EVALUATORS = {
  'surface-gravity': calculateSurfaceGravity,
  'escape-velocity': calculateEscapeVelocity,
  'volume': calculateVolume,
  'density': calculateDensity,
  'surface-area': calculateSurfaceArea,
  'circumference': calculateCircumference,
  'rotation-speed': calculateRotationSpeed,
  'relative-radius': calculateRelativeRadius,
  'relative-mass': calculateRelativeMass,
  'relative-volume': calculateRelativeVolume,
  'human-weight': (obj, opts) => calculateHumanWeight(obj, opts?.humanMassKg || 70),
  'hill-sphere': calculateHillSphere,
  'sphere-of-influence': calculateSphereOfInfluence
};

/**
 * Returns all applicable calculation result objects for an object
 */
export function getAllCalculationsForObject(obj, options = { humanMassKg: 70 }) {
  if (!obj) return [];

  const results = [];
  Object.keys(CALCULATION_EVALUATORS).forEach(calcId => {
    const evaluator = CALCULATION_EVALUATORS[calcId];
    try {
      const calcResult = evaluator(obj, options);
      if (calcResult) {
        results.push(calcResult);
      }
    } catch (err) {
      console.warn(`[CalculationRegistry] Error evaluating ${calcId}:`, err);
    }
  });

  return results;
}

/**
 * Evaluates a single specific calculation by ID
 */
export function getCalculationById(calcId, obj, options = { humanMassKg: 70 }) {
  const evaluator = CALCULATION_EVALUATORS[calcId];
  if (!evaluator || !obj) return null;
  try {
    return evaluator(obj, options);
  } catch (err) {
    console.warn(`[CalculationRegistry] Error evaluating ${calcId}:`, err);
    return null;
  }
}

/**
 * Filters a list of calculation results by category, search term, and status
 */
export function filterCalculations(calcList, { category = 'ALL', search = '', onlyValid = false } = {}) {
  if (!calcList || !Array.isArray(calcList)) return [];

  return calcList.filter(calc => {
    // Category filter
    if (category !== 'ALL' && calc.category !== category) {
      return false;
    }

    // Status filter
    if (onlyValid && calc.status !== 'VALID') {
      return false;
    }

    // Search query filter
    if (search && search.trim().length > 0) {
      const q = search.toLowerCase().trim();
      const matchName = calc.name.toLowerCase().includes(q);
      const matchSymbol = calc.symbol.toLowerCase().includes(q);
      const matchFormula = calc.formula.toLowerCase().includes(q);
      const matchType = calc.type.toLowerCase().includes(q);

      if (!matchName && !matchSymbol && !matchFormula && !matchType) {
        return false;
      }
    }

    return true;
  });
}
