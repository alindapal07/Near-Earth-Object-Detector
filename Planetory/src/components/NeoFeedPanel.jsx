import React from 'react';

export default function NeoFeedPanel({ neoFeed, loading, error, onSelectAsteroid }) {
  if (loading) {
    return (
      <div className="sdf-panel-loading">
        <div className="spinner"></div>
        <p>Fetching real-time NASA NeoWs Feed...</p>
      </div>
    );
  }

  if (error) {
    return <div className="sdf-panel-error">⚠ {error}</div>;
  }

  if (!neoFeed || !neoFeed.feed) {
    return <div className="sdf-panel-empty">No NeoWs data available.</div>;
  }

  // Flatten feed objects across dates
  const dates = Object.keys(neoFeed.feed).sort();
  let allNeos = [];
  dates.forEach(date => {
    (neoFeed.feed[date] || []).forEach(item => {
      allNeos.push({ ...item, feedDate: date });
    });
  });

  return (
    <div className="neo-feed-panel">
      <div className="panel-header">
        <h3>🌌 NASA REAL-TIME NEO FEED (7 DAYS)</h3>
        <span className="neo-count">{neoFeed.element_count || allNeos.length} NEOs tracked</span>
      </div>

      <div className="neo-feed-list">
        {allNeos.map(item => {
          const ca = item.close_approach_data?.[0];
          const distLd = ca?.miss_distance?.lunar ? Number(ca.miss_distance.lunar).toFixed(1) : null;
          const distKm = ca?.miss_distance?.kilometers ? Math.round(Number(ca.miss_distance.kilometers)).toLocaleString() : null;
          const vel = ca?.relative_velocity?.kilometers_per_second ? Number(ca.relative_velocity.kilometers_per_second).toFixed(1) : null;
          const diamMin = item.estimated_diameter?.meters?.estimated_diameter_min ? Math.round(item.estimated_diameter.meters.estimated_diameter_min) : null;
          const diamMax = item.estimated_diameter?.meters?.estimated_diameter_max ? Math.round(item.estimated_diameter.meters.estimated_diameter_max) : null;

          return (
            <div 
              key={item.id} 
              className={`neo-card ${item.is_potentially_hazardous_asteroid ? 'neo-card--pha' : ''}`}
              onClick={() => onSelectAsteroid(item)}
            >
              <div className="neo-card-top">
                <span className="neo-name">{item.name}</span>
                {item.is_potentially_hazardous_asteroid && (
                  <span className="badge badge--pha">⚠ PHA</span>
                )}
              </div>

              <div className="neo-card-details">
                {diamMin && diamMax && (
                  <div className="neo-stat">
                    <span className="label">Est. Diameter:</span>
                    <span className="val">{diamMin}m – {diamMax}m</span>
                  </div>
                )}
                {distLd && (
                  <div className="neo-stat">
                    <span className="label">Miss Distance:</span>
                    <span className="val val--highlight">{distLd} LD ({distKm} km)</span>
                  </div>
                )}
                {vel && (
                  <div className="neo-stat">
                    <span className="label">Rel. Speed:</span>
                    <span className="val">{vel} km/s</span>
                  </div>
                )}
                {ca?.close_approach_date_full && (
                  <div className="neo-stat">
                    <span className="label">Approach Time:</span>
                    <span className="val">{ca.close_approach_date_full}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
