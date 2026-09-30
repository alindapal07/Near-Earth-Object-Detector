/**
 * calculationFormatter.js - Formatting & Precision Utilities for Scientific Calculations
 */

/**
 * Formats numbers into scientific notation with proper superscripts (e.g. 1.898 × 10²⁷)
 */
export function formatScientific(num, precision = 3) {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (num === 0) return '0';

  const abs = Math.abs(num);
  if (abs >= 1e4 || abs <= 1e-3) {
    const expStr = num.toExponential(precision);
    const [mantissa, exponent] = expStr.split('e');
    const expNum = parseInt(exponent, 10);
    const superscriptExp = toSuperscript(expNum);
    return `${mantissa} × 10${superscriptExp}`;
  }

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

/**
 * Converts numbers into superscript characters (-12 -> ⁻¹²)
 */
export function toSuperscript(num) {
  const map = {
    '-': '⁻', '+': '⁺', '0': '⁰', '1': '¹', '2': '²', '3': '³',
    '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
  };
  return String(num).split('').map(char => map[char] || char).join('');
}

/**
 * Converts text exponent representations like R^2 or m^3 to superscripts
 */
export function formatFormulaText(str) {
  if (!str) return '';
  return str
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^-1/g, '⁻¹')
    .replace(/\^-2/g, '⁻²');
}

/**
 * Exports clean, unformatted plain text for copying calculation traces
 */
export function formatCalculationForCopy(calc, objName) {
  if (!calc) return '';

  const lines = [
    `=== SCIENTIFIC CALCULATION TRACE ===`,
    `Target Object: ${objName || 'Celestial Body'}`,
    `Metric: ${calc.name} (${calc.symbol})`,
    `Formula: ${calc.formula}`,
    `Status: ${calc.status}`,
    `Type: ${calc.type} | Model: ${calc.model}`,
    `Source: ${calc.source}`,
    ``,
    `--- INPUTS ---`
  ];

  calc.inputs.forEach(input => {
    lines.push(`${input.symbol} (${input.name}): ${input.displayValue} ${input.unit || ''}`);
  });

  if (calc.unitConversions && calc.unitConversions.length > 0) {
    lines.push(``, `--- UNIT CONVERSIONS (SI) ---`);
    calc.unitConversions.forEach(conv => lines.push(conv));
  }

  lines.push(
    ``,
    `--- SUBSTITUTION ---`,
    calc.substitution,
    ``,
    `--- RESULT ---`,
    `Calculated Result: ${calc.displayResult} ${calc.unit || ''}`
  );

  if (calc.referenceValue !== null && calc.referenceValue !== undefined) {
    lines.push(
      `Authoritative Reference Value: ${calc.referenceValue} ${calc.unit || ''}`,
      `Difference (Δ): ${calc.referenceDiff != null ? calc.referenceDiff.toFixed(3) + '%' : 'N/A'}`,
      `Validation Status: ${calc.validMatch}`
    );
  }

  if (calc.assumptions && calc.assumptions.length > 0) {
    lines.push(``, `--- ASSUMPTIONS ---`);
    calc.assumptions.forEach(a => lines.push(`• ${a}`));
  }

  lines.push(`====================================`);
  return lines.join('\n');
}
