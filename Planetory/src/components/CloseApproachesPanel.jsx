import React, { useState } from 'react';

export default function CloseApproachesPanel({ approaches, loading, error, onSelectAsteroid }) {
  const [distFilter, setDistFilter] = useState(10); // in LD

  if (loading) {
    return (
      <div className="sdf-panel-loading">
        <div className="spinner"></div>
        <p>Fetching upcoming Close Approaches from JPL SBDB...</p>
      </div>
    );
  }

  if (error) {
    return <div className="sdf-panel-error">⚠ {error}</div>;
  }

  if (!approaches || approaches.length === 0) {
    return <div className="sdf-panel-empty">No upcoming close approach data found.</div>;
  }

  // Filter by maximum distance in Lunar Distances
  const filtered = approaches.filter(item => {
    if (!item.distLd) return true;
    return Number(item.distLd) <= distFilter;
  });

  return (
    <div className="close-approaches-panel">
      <div className="panel-header">
        <div>
          <h3>☄️ UPCOMING EARTH CLOSE APPROACHES</h3>
          <p className="subtitle">JPL Small-Body Database Close-Approach Data</p>
        </div>
        <div className="filter-group">
          <label>Max Distance: {distFilter} LD</label>
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={distFilter} 
            onChange={(e) => setDistFilter(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="approaches-table">
          <thead>
            <tr>
              <th>Object Designation</th>
              <th>Approach Date</th>
              <th>Dist (LD)</th>
              <th>Dist (AU)</th>
              <th>V_rel (km/s)</th>
              <th>H (mag)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const isClose = item.distLd && Number(item.distLd) < 1;
              return (
                <tr 
                  key={idx} 
                  className={`approach-row ${isClose ? 'approach-row--critical' : ''}`}
                  onClick={() => onSelectAsteroid(item)}
                >
                  <td className="col-name">
                    {item.fullName || item.des || item.name}
                    {isClose && <span className="badge badge--pha">SUB-LUNAR</span>}
                  </td>
                  <td>{item.date || item.cd}</td>
                  <td className="col-dist">
                    {item.distLd ? Number(item.distLd).toFixed(2) : 'N/A'} LD
                  </td>
                  <td>{item.dist ? Number(item.dist).toFixed(4) : 'N/A'} AU</td>
                  <td>{item.vRel ? Number(item.vRel).toFixed(2) : 'N/A'}</td>
                  <td>{item.h ? Number(item.h).toFixed(1) : 'N/A'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
