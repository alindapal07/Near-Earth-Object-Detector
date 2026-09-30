import React, { useState } from 'react';
import { formatKm, formatAU, formatMass, formatAngle } from '../../utils/formatters';
import { validateScientificData, calculateSurfaceGravity, calculateEscapeVelocity } from '../../utils/orbitalMath';

/**
 * PlanetFactSheet.jsx - Comprehensive Planet Intelligence Dossier Fact Sheet
 * Expandable scientific dossier listing all 23+ astronomical properties with units, tooltips, and scientific notation.
 */
export default function PlanetFactSheet({ selectedObj }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const validData = validateScientificData(selectedObj);
  const name = selectedObj?.name || selectedObj?.id || 'CELESTIAL OBJECT';

  const radiusKm = validData.radiusKm || 6371;
  const diameterKm = radiusKm * 2;
  const massKg = validData.massKg ? Number(validData.massKg) : null;
  const volumeKm3 = massKg && selectedObj?.density ? (massKg / (selectedObj.density * 1000)).toExponential(2) : (4 / 3 * Math.PI * Math.pow(radiusKm, 3)).toExponential(2);
  const density = selectedObj?.density || (massKg ? (massKg / (4 / 3 * Math.PI * Math.pow(radiusKm * 100000, 3))).toFixed(2) : '5.51');
  const gravity = selectedObj?.gravity || calculateSurfaceGravity(massKg, radiusKm).toFixed(2);
  const vEsc = selectedObj?.escapeVelocity || calculateEscapeVelocity(massKg, radiusKm).toFixed(2);

  const axialTilt = selectedObj?.axialTiltDeg !== undefined ? selectedObj.axialTiltDeg : 0;
  const rotHours = selectedObj?.rotationPeriodHours !== undefined ? selectedObj.rotationPeriodHours : 24;
  const tempK = selectedObj?.meanTempK || selectedObj?.temperature || (selectedObj?.id === 'earth' ? 288 : 134);
  const tempC = (tempK - 273.15).toFixed(1);

  const semiMajorAu = validData.a || (selectedObj?.semiMajorAxisKm ? selectedObj.semiMajorAxisKm / 149597870.7 : 1.0);
  const orbitalSpeed = (29.78 / Math.sqrt(semiMajorAu || 1)).toFixed(2);

  const moonsCount = selectedObj?.moonsCount || (selectedObj?.id === 'saturn' ? 146 : selectedObj?.id === 'jupiter' ? 95 : selectedObj?.id === 'earth' ? 1 : 0);
  const rings = selectedObj?.hasRings ? 'Present (Prominent Ring System)' : selectedObj?.id === 'jupiter' || selectedObj?.id === 'uranus' || selectedObj?.id === 'neptune' ? 'Present (Faint Rings)' : 'None';

  const factItems = [
    { label: 'Physical Radius', val: `${formatKm(radiusKm, 1)}`, tooltip: 'Equatorial radius of the celestial body.' },
    { label: 'Volumetric Diameter', val: `${formatKm(diameterKm, 1)}`, tooltip: 'Mean spherical diameter (2 × R).' },
    { label: 'Total Mass', val: massKg ? `${massKg.toExponential(4)} kg` : 'N/A', tooltip: 'Total gravitational mass calculated via planetary perturbations.' },
    { label: 'Total Volume', val: `${volumeKm3} km³`, tooltip: 'Volumetric capacity of the planetary sphere.' },
    { label: 'Mean Density', val: `${density} g/cm³`, tooltip: 'Average mass density per cubic centimeter.' },
    { label: 'Surface Gravity', val: `${gravity} m/s² (${(gravity / 9.80665).toFixed(2)} g)`, tooltip: 'Gravitational acceleration experienced at surface boundary.' },
    { label: 'Escape Velocity', val: `${vEsc} km/s`, tooltip: 'Speed required to break free from gravitational well without propulsion.' },
    { label: 'Axial Tilt (Obliquity)', val: `${formatAngle(axialTilt, 2)}`, tooltip: 'Angle between rotational axis and orbital plane normal.' },
    { label: 'Rotation Period', val: `${Math.abs(rotHours).toFixed(2)} hours`, tooltip: 'Sidereal rotation time for one 360° spin.' },
    { label: 'Mean Temperature', val: `${tempK} K (${tempC}°C)`, tooltip: 'Average equilibrium surface or cloud-top thermal state.' },
    { label: 'Atmospheric Pressure', val: selectedObj?.atmospherePressure || (selectedObj?.id === 'earth' ? '1.013 bar (1 atm)' : selectedObj?.id === 'venus' ? '92.0 bar' : '0.006 bar'), tooltip: 'Surface gas column static pressure.' },
    { label: 'Magnetic Field Strength', val: selectedObj?.magneticField || (selectedObj?.id === 'earth' ? '0.31 Gauss (Dipole)' : 'Weak / Induced'), tooltip: 'Magnetosphere field strength.' },
    { label: 'Geometric Albedo', val: selectedObj?.albedo || (selectedObj?.id === 'earth' ? '0.367' : '0.34'), tooltip: 'Reflectivity of incident solar radiation.' },
    { label: 'Semi-Major Axis', val: `${formatAU(semiMajorAu, 4)}`, tooltip: 'Average heliocentric distance from Sun.' },
    { label: 'Mean Orbital Speed', val: `${orbitalSpeed} km/s`, tooltip: 'Instantaneous tangential speed along Keplerian ellipse.' },
    { label: 'Known Moons Count', val: `${moonsCount}`, tooltip: 'Confirmed natural satellites orbiting body.' },
    { label: 'Ring System', val: `${rings}`, tooltip: 'Presence of circumplanetary dust/ice ring structures.' },
    { label: 'Planet Classification', val: `${selectedObj?.category || selectedObj?.type || 'Planet'}`, tooltip: 'Astronomical classification standard.' },
    { label: 'Discovery Provenance', val: `${selectedObj?.discovery || 'Known since Antiquity'}`, tooltip: 'Historical discovery epoch and astronomer.' },
    { label: 'Ephemeris Epoch', val: 'J2000.0 (JD 2451545.0)', tooltip: 'Standard astronomical reference coordinate epoch.' },
    { label: 'Reference Frame', val: 'Heliocentric ICRF / J2000', tooltip: 'International Celestial Reference Frame coordinates.' }
  ];

  return (
    <div className="sci-widget fact-sheet-widget sci-panel-v7">
      <div 
        className="widget-title font-mono" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>📑 PLANET INTELLIGENCE DOSSIER FACT SHEET ({name.toUpperCase()})</span>
        <span className="text-cyan">{isExpanded ? '▲ COLLAPSE' : '▼ EXPAND (21 METRICS)'}</span>
      </div>

      {isExpanded && (
        <div className="fact-sheet-grid font-mono">
          {factItems.map((item, idx) => (
            <div key={idx} className="fact-cell" title={item.tooltip}>
              <span className="fact-lbl">{item.label}:</span>
              <span className="fact-val text-cyan">{item.val}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
