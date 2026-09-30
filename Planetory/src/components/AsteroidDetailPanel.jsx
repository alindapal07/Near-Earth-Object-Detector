import React, { useState, useEffect, useRef } from 'react';
import { fetchAsteroidDetail, fetchHorizonsPosition, searchAsteroids } from '../api/spaceApi';
import { J2000_DATE } from '../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(val, decimals = 4, unit = '') {
  if (val == null || !Number.isFinite(Number(val))) return 'N/A';
  return `${Number(val).toFixed(decimals)}${unit ? ' ' + unit : ''}`;
}

function fmtLarge(val) {
  if (val == null) return 'N/A';
  return Number(val).toLocaleString();
}

const DataRow = ({ label, value, highlight }) => (
  <div className={`detail-row ${highlight ? 'detail-row--highlight' : ''}`}>
    <span className="detail-label">{label}</span>
    <span className="detail-value">{value ?? 'N/A'}</span>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button className={`tab-btn ${active ? 'tab-btn--active' : ''}`} onClick={onClick}>
    {children}
  </button>
);

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AsteroidDetailPanel({ asteroid, simTimeDays, onClose, onFocus }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [detail, setDetail] = useState(null);
  const [horizons, setHorizons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [horizonsLoading, setHorizonsLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevId = useRef(null);

  const asteroidId = asteroid?.spkid || asteroid?.id || asteroid?.designation;

  // Fetch full detail when asteroid changes
  useEffect(() => {
    if (!asteroidId || asteroidId === prevId.current) return;
    prevId.current = asteroidId;
    setDetail(null);
    setHorizons(null);
    setError(null);
    setActiveTab('overview');

    setLoading(true);
    fetchAsteroidDetail(asteroidId)
      .then(d => {
        setDetail(d);
        if (d.error) setError(d.message);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [asteroidId]);

  // Fetch Horizons position when on 'current' tab
  useEffect(() => {
    if (activeTab !== 'current' || !asteroidId || horizons) return;
    setHorizonsLoading(true);
    fetchHorizonsPosition(asteroidId)
      .then(h => setHorizons(h))
      .catch(() => setHorizons({ error: true, message: 'JPL Horizons unavailable' }))
      .finally(() => setHorizonsLoading(false));
  }, [activeTab, asteroidId, horizons]);

  if (!asteroid) return null;

  const obj = detail || asteroid;
  const name = obj.name || obj.fullName || obj.designation || asteroidId;
  const simDate = new Date(J2000_DATE.getTime() + simTimeDays * 86400000);

  return (
    <div className="asteroid-detail-panel">
      {/* Header */}
      <div className="adp-header">
        <div>
          <h2 className="adp-name">{name}</h2>
          <div className="adp-badges">
            {obj.neo && <span className="badge badge--neo">NEO</span>}
            {obj.pha && <span className="badge badge--pha">⚠ PHA</span>}
            {obj.orbitClass && <span className="badge badge--class">{obj.orbitClass}</span>}
          </div>
        </div>
        <div className="adp-header-actions">
          {onFocus && (
            <button className="adp-btn adp-btn--focus" onClick={() => onFocus(obj)}>
              🎯 Focus
            </button>
          )}
          <button className="adp-btn adp-btn--close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Data Source */}
      <div className="adp-source">
        📡 {loading ? 'Loading from JPL SBDB...' : (obj.source || 'NASA/JPL SBDB')}
      </div>

      {/* Error */}
      {error && <div className="adp-error">⚠ {error}</div>}

      {/* Tabs */}
      <div className="adp-tabs">
        {['overview', 'orbit', 'physical', 'approaches', 'current', 'risk'].map(tab => (
          <TabButton key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab.toUpperCase()}
          </TabButton>
        ))}
      </div>

      <div className="adp-body">
        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <DataRow label="Full Name" value={obj.fullName || obj.name || name} />
            <DataRow label="Designation" value={obj.designation} />
            <DataRow label="SPK-ID" value={obj.spkid || obj.id} />
            <DataRow label="Object Type" value={loading ? '...' : (obj.orbitClass || 'Asteroid')} />
            <DataRow label="Orbit Class Code" value={obj.orbitClassCode} />
            <DataRow label="NEO" value={obj.neo ? 'YES' : 'NO'} />
            <DataRow label="PHA" value={obj.pha ? 'YES ⚠' : 'NO'} highlight={obj.pha} />
            {detail?.discovery && <>
              <div className="adp-section-title">DISCOVERY</div>
              <DataRow label="Date" value={detail.discovery.date} />
              <DataRow label="Discoverer" value={detail.discovery.who} />
              <DataRow label="Location" value={detail.discovery.location} />
            </>}
          </div>
        )}

        {/* ── ORBIT ── */}
        {activeTab === 'orbit' && (
          <div>
            <div className="adp-section-title">ORBITAL ELEMENTS</div>
            <DataRow label="Epoch" value={detail?.orbital?.epoch || 'N/A'} />
            <DataRow label="Semi-major Axis (a)" value={fmt(detail?.orbital?.a || obj.a, 6, 'AU')} />
            <DataRow label="Eccentricity (e)" value={fmt(detail?.orbital?.e || obj.e, 6)} />
            <DataRow label="Inclination (i)" value={fmt(detail?.orbital?.i || obj.i, 4, '°')} />
            <DataRow label="Lon. Asc. Node (Ω)" value={fmt(detail?.orbital?.Omega || obj.Omega, 4, '°')} />
            <DataRow label="Arg. Perihelion (ω)" value={fmt(detail?.orbital?.omega || obj.omega, 4, '°')} />
            <DataRow label="Mean Anomaly (M)" value={fmt(detail?.orbital?.M0 || obj.M0, 4, '°')} />
            <DataRow label="Perihelion (q)" value={fmt(detail?.orbital?.q || obj.q, 6, 'AU')} />
            <DataRow label="Aphelion (Q)" value={fmt(detail?.orbital?.Q, 6, 'AU')} />
            <DataRow label="Orbital Period" value={detail?.orbital?.period ? `${fmt(detail.orbital.period, 2)} days` : 'N/A'} />
            <DataRow label="Mean Motion (n)" value={detail?.orbital?.n ? `${fmt(detail.orbital.n, 6)} °/day` : 'N/A'} />
            <div className="adp-section-title">ORBIT QUALITY</div>
            <DataRow label="MOID (Earth)" value={detail?.orbital?.moid ? `${fmt(detail.orbital.moid, 6)} AU` : 'N/A'} />
            <DataRow label="Condition Code" value={detail?.orbital?.conditionCode} />
            <DataRow label="Data Arc" value={detail?.orbital?.dataArc ? `${detail.orbital.dataArc} days` : 'N/A'} />
            <DataRow label="Observations Used" value={detail?.orbital?.nObsUsed} />
            <DataRow label="Solution Date" value={detail?.orbital?.solutionDate} />
          </div>
        )}

        {/* ── PHYSICAL ── */}
        {activeTab === 'physical' && (
          <div>
            <div className="adp-section-title">PHYSICAL PARAMETERS</div>
            {loading ? <div className="adp-loading">Loading physical data...</div> : (
              detail?.physical ? <>
                <DataRow label="Abs. Magnitude (H)" value={fmt(detail.physical.H, 2)} />
                <DataRow label="Diameter" value={detail.physical.diameter ? `${fmt(detail.physical.diameter, 3)} km` : 'N/A'} />
                <DataRow label="Albedo (pV)" value={fmt(detail.physical.albedo, 3)} />
                <DataRow label="Rotation Period" value={detail.physical.rotPer ? `${fmt(detail.physical.rotPer, 3)} h` : 'N/A'} />
                <DataRow label="Spectral Type" value={detail.physical.spectralType} />
                <DataRow label="GM" value={detail.physical.gm ? `${detail.physical.gm} km³/s²` : 'N/A'} />
                <DataRow label="Density" value={detail.physical.density ? `${detail.physical.density} g/cm³` : 'N/A'} />
                <div className="adp-note">
                  Note: Physical properties are not available for all asteroids. Values sourced from JPL SBDB.
                </div>
              </> : <div className="adp-empty">Physical data not available for this object.</div>
            )}
          </div>
        )}

        {/* ── CLOSE APPROACHES ── */}
        {activeTab === 'approaches' && (
          <div>
            <div className="adp-section-title">CLOSE APPROACHES</div>
            {loading ? <div className="adp-loading">Loading...</div> :
              detail?.closeApproaches?.length > 0 ? (
                <div className="approach-table">
                  <div className="approach-header">
                    <span>Date</span><span>Body</span><span>Dist (AU)</span><span>Vel km/s</span>
                  </div>
                  {detail.closeApproaches.map((ca, i) => (
                    <div key={i} className="approach-row">
                      <span>{ca.date}</span>
                      <span>{ca.body || 'Earth'}</span>
                      <span>{ca.dist ? Number(ca.dist).toFixed(4) : 'N/A'}</span>
                      <span>{ca.vRel ? Number(ca.vRel).toFixed(2) : 'N/A'}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="adp-empty">No close approach data available.</div>
            }
          </div>
        )}

        {/* ── CURRENT STATE ── */}
        {activeTab === 'current' && (
          <div>
            <div className="adp-section-title">CURRENT SIMULATED STATE</div>
            <DataRow label="Simulation Time" value={simDate.toUTCString()} />
            {horizonsLoading && <div className="adp-loading">Querying JPL Horizons...</div>}
            {horizons && !horizons.error ? <>
              <div className="adp-section-title">JPL HORIZONS EPHEMERIS</div>
              <DataRow label="Epoch" value={horizons.epoch?.split('T')[0] || 'N/A'} />
              <DataRow label="X (AU)" value={fmt(horizons.position?.x, 6)} />
              <DataRow label="Y (AU)" value={fmt(horizons.position?.y, 6)} />
              <DataRow label="Z (AU)" value={fmt(horizons.position?.z, 6)} />
              {horizons.velocity && <>
                <DataRow label="VX (AU/day)" value={fmt(horizons.velocity?.vx, 8)} />
                <DataRow label="VY (AU/day)" value={fmt(horizons.velocity?.vy, 8)} />
                <DataRow label="VZ (AU/day)" value={fmt(horizons.velocity?.vz, 8)} />
              </>}
              <div className="adp-source-badge">📡 SOURCE: JPL Horizons (state vectors)</div>
            </> : horizons?.error ? (
              <div className="adp-error">Horizons: {horizons.message}</div>
            ) : null}
            <div className="adp-note">
              Position accuracy: Keplerian propagation from JPL orbital elements.
              For selected objects, JPL Horizons provides higher-accuracy state vectors.
            </div>
            <div className="adp-source-badge">⚠ APPROXIMATE KEPLERIAN MODEL</div>
          </div>
        )}

        {/* ── RISK ── */}
        {activeTab === 'risk' && (
          <div>
            <div className="adp-section-title">RISK ASSESSMENT</div>
            <DataRow label="NEO Status" value={obj.neo ? 'Near-Earth Object' : 'Not a NEO'} />
            <DataRow label="PHA Status" value={obj.pha ? '⚠ Potentially Hazardous' : 'Not Hazardous'} highlight={obj.pha} />
            <DataRow label="MOID (Earth)" value={detail?.orbital?.moid ? `${fmt(detail.orbital.moid, 6)} AU` : 'N/A'} />
            <div className="adp-note risk-note">
              A Potentially Hazardous Asteroid (PHA) is classified based on its orbit bringing it
              within 0.05 AU of Earth and having a diameter ≥ 140m. PHA classification does NOT
              mean an impact is predicted. Sentry impact probability data is maintained separately
              by JPL and is not displayed here.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
