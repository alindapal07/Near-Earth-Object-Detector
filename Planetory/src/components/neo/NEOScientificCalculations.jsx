import React, { useState } from 'react';
import { calcPerihelionLabeled, calcAphelionLabeled, calcOrbitalPeriodLabeled, calcEarthDistanceLabeled, calcEstimatedMassLabeled, calcKineticEnergyLabeled } from '../../utils/neoOrbitalCalc.js';

const NEOScientificCalculations = ({ neo, simTimeDays }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  if (!neo) return null;

  const calculations = [
    {
      id: 'perihelion', name: 'Perihelion', model: 'Keplerian Orbital Mechanics',
      calc: calcPerihelionLabeled(neo),
      formula: 'q = a(1 - e)', inputs: { a: neo.semiMajorAxis, e: neo.eccentricity }
    },
    {
      id: 'aphelion', name: 'Aphelion', model: 'Keplerian Orbital Mechanics',
      calc: calcAphelionLabeled(neo),
      formula: 'Q = a(1 + e)', inputs: { a: neo.semiMajorAxis, e: neo.eccentricity }
    },
    {
      id: 'period', name: 'Orbital Period', model: 'Keplerian Orbital Mechanics',
      calc: calcOrbitalPeriodLabeled(neo),
      formula: 'T = 2π√(a³/μ☉)', inputs: { a: neo.semiMajorAxis }
    },
    {
      id: 'earthDist', name: 'Approximate Earth Distance', model: 'PLANETORY TWO-BODY APPROXIMATION',
      calc: calcEarthDistanceLabeled(neo, simTimeDays || 0),
      formula: '|r_neo - r_earth|', inputs: { simTimeDays: simTimeDays || 0 }
    }
  ];

  if (neo.estimatedDiameterMaxKm) {
    calculations.push({
      id: 'mass', name: 'Estimated Mass', model: 'PLANETORY TWO-BODY APPROXIMATION',
      calc: calcEstimatedMassLabeled(neo), warning: 'Assumes asteroid density of 2.0 g/cm³.',
      formula: 'm = ρ * (4/3)π(d/2)³', inputs: { d: neo.estimatedDiameterMaxKm }
    });
    calculations.push({
      id: 'energy', name: 'Estimated Kinetic Energy', model: 'PLANETORY TWO-BODY APPROXIMATION',
      calc: calcKineticEnergyLabeled(neo), warning: 'Assumes impact velocity of 20 km/s.',
      formula: 'KE = (1/2)mv²', inputs: { m: 'Estimated Mass', v: '20 km/s' }
    });
  }

  const toggleExpand = (id) => setExpandedRow(expandedRow === id ? null : id);

  return (
    <div style={{ padding: '20px', background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', fontFamily: 'sans-serif' }} className="neo-scientific-calc">
      <h3 style={{ fontSize: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '16px' }}>Scientific Calculations</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {calculations.map(calc => {
          const isExpanded = expandedRow === calc.id;
          return (
            <div key={calc.id} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '6px', overflow: 'hidden'
            }}>
              <div onClick={() => toggleExpand(calc.id)} style={{
                padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
                background: isExpanded ? 'rgba(0, 240, 255, 0.05)' : 'transparent'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{calc.name}</div>
                <div style={{ fontSize: '10px', color: '#8892a4', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                  {calc.model}
                </div>
              </div>
              
              {isExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#8892a4' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>FORMULA: </span>
                    <span style={{ fontFamily: 'monospace', color: '#fff' }}>{calc.formula}</span>
                  </div>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>INPUTS: </span>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {Object.entries(calc.inputs).map(([k, v]) => (
                        <li key={k}>{k} = {typeof v === 'number' ? v.toFixed(4) : v}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>RESULT: </span>
                    <span style={{ fontSize: '14px', color: '#e0e8ff', fontWeight: 'bold' }}>{calc.calc.value} {calc.calc.unit}</span>
                  </div>

                  {calc.warning && (
                    <div style={{ color: '#ffb703', background: 'rgba(255, 183, 3, 0.1)', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>⚠️</span> {calc.warning}
                    </div>
                  )}
                  
                  <div style={{ marginTop: '12px', fontSize: '10px', textAlign: 'right' }}>
                    SOURCE: {calc.model === 'PLANETORY TWO-BODY APPROXIMATION' ? 'Planetory' : 'Standard Formula'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NEOScientificCalculations;
