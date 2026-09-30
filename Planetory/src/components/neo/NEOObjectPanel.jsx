/**
 * NEOObjectPanel.jsx — Full NEO Scientific Intelligence Panel (Part 35)
 *
 * Tabbed panel showing all information for a selected NEO:
 * - IDENTIFICATION, PHYSICAL, ORBIT, APPROACHES, RISK, CALCULATIONS, PROVENANCE
 *
 * Data sources:
 *  - JPL SBDB (object detail, orbit, physical)
 *  - JPL CNEOS CAD (close approaches)
 *  - NASA/JPL CNEOS SENTRY (impact risk)
 *  - Planetory (orbital propagation, estimates — clearly labeled)
 *
 * Scientific rules:
 *  - Never fabricate risk data
 *  - Never claim orbit-crossing = impact risk
 *  - Always show provenance
 *  - Always label estimates vs. observations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchNEODetail, fetchSentryRisk, fetchCloseApproachesForNEO, fetchHorizonsEphemeris } from '../../api/neoApi.js';
import { formatDistance, interpretRiskStatus } from '../../utils/neoOrbitalCalc.js';
import NEORiskPanel from './NEORiskPanel.jsx';
import NEOCloseApproachTimeline from './NEOCloseApproachTimeline.jsx';
import NEOScientificCalculations from './NEOScientificCalculations.jsx';
import NEOProvenance from './NEOProvenance.jsx';

// ─── Orbit class descriptions ─────────────────────────────────────────────────

const ORBIT_CLASS_DESCRIPTIONS = {
  'Apollo': 'Earth-crossing NEO with semi-major axis ≥ 1 AU. Note: Earth-crossing ≠ impact risk.',
  'Aten': 'Earth-crossing NEO with semi-major axis < 1 AU.',
  'Amor': 'Near-Earth asteroid that approaches but does not cross Earth\'s orbit.',
  'Atira': 'NEO with orbit entirely inside Earth\'s orbit.',
  'IEO': 'Interior Earth Object — orbit entirely within Earth\'s orbit.',
  'MBA': 'Main-belt asteroid.',
  'Comet': 'Cometary orbit.',
};

// ─── Badge components ─────────────────────────────────────────────────────────

function NeoBadge({ label, color = '#00f0ff' }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.05em',
      color: '#000',
      backgroundColor: color,
      marginRight: 4
    }}>{label}</span>
  );
}

function DataField({ label, value, unit, source, note, highlight }) {
  if (value == null || value === '') value = <span style={{ color: '#555', fontStyle: 'italic' }}>NOT AVAILABLE</span>;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.06)'
    }}>
      <div style={{ color: '#8892a4', fontSize: 12, flex: '0 0 180px' }}>{label}</div>
      <div style={{ textAlign: 'right', flex: 1 }}>
        <span style={{ color: highlight ? '#00f0ff' : '#e0e8ff', fontWeight: highlight ? 700 : 400 }}>
          {value}
        </span>
        {unit && <span style={{ color: '#8892a4', fontSize: 11, marginLeft: 4 }}>{unit}</span>}
        {note && <div style={{ color: '#ffb703', fontSize: 10, marginTop: 2 }}>{note}</div>}
        {source && <div style={{ color: '#556', fontSize: 10, marginTop: 2 }}>Source: {source}</div>}
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children, badge }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(0,240,255,0.2)',
        paddingBottom: 6, marginBottom: 12
      }}>
        <span style={{ color: '#00f0ff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {title}
        </span>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton({ height = 16, width = '100%' }) {
  return (
    <div style={{
      height, width, borderRadius: 4,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
      backgroundSize: '200% 100%',
      animation: 'neo-shimmer 1.5s infinite',
      marginBottom: 8
    }} />
  );
}

// ─── Main NEOObjectPanel ──────────────────────────────────────────────────────

const TABS = [
  { id: 'identification', label: 'ID', title: 'Identification' },
  { id: 'physical', label: 'PHYS', title: 'Physical' },
  { id: 'orbit', label: 'ORBIT', title: 'Orbit' },
  { id: 'approaches', label: 'APPROACH', title: 'Earth Approaches' },
  { id: 'risk', label: 'RISK', title: 'Risk Assessment' },
  { id: 'calculations', label: 'CALC', title: 'Scientific Calculations' },
  { id: 'provenance', label: 'SOURCE', title: 'Data Provenance' },
];

export default function NEOObjectPanel({
  neoItem,
  simTimeDays,
  seekToDays,
  onRenderOrbit,
  onRenderEncounter,
  onFocusNEO,
  solarSystemRef
}) {
  const [activeTab, setActiveTab] = useState('identification');
  const [detail, setDetail] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [approachData, setApproachData] = useState(null);
  const [horizonsData, setHorizonsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedApproach, setSelectedApproach] = useState(null);

  // Load full NEO detail when item changes
  useEffect(() => {
    if (!neoItem) {
      setDetail(null); setRiskData(null); setApproachData(null);
      return;
    }

    const id = neoItem.id || neoItem.designation || neoItem.name;
    if (!id) return;

    setLoading(true);
    setErrors({});
    setDetail(null); setRiskData(null); setApproachData(null);

    const newErrors = {};

    // Fetch in parallel
    Promise.allSettled([
      fetchNEODetail(id),
      fetchSentryRisk(id),
      fetchCloseApproachesForNEO(id, { distMax: '0.5', limit: 50 }),
      fetchHorizonsEphemeris(id)
    ]).then(([detailRes, riskRes, approachRes, horizonsRes]) => {
      if (detailRes.status === 'fulfilled') setDetail(detailRes.value);
      else newErrors.detail = detailRes.reason?.message;

      if (riskRes.status === 'fulfilled') setRiskData(riskRes.value);
      else newErrors.risk = riskRes.reason?.message;

      if (approachRes.status === 'fulfilled') setApproachData(approachRes.value);
      else newErrors.approaches = approachRes.reason?.message;

      if (horizonsRes.status === 'fulfilled') setHorizonsData(horizonsRes.value);
      // Horizons failure is non-critical

      setErrors(newErrors);
      setLoading(false);
    });
  }, [neoItem?.id, neoItem?.designation]);

  // Render NEO orbit in 3D when detail loads
  useEffect(() => {
    if (!detail || !solarSystemRef?.current) return;
    solarSystemRef.current.renderNEOOrbit(detail, simTimeDays);
  }, [detail, solarSystemRef]);

  // Handle approach selection → seek time + show encounter
  const handleSelectApproach = useCallback((approach) => {
    setSelectedApproach(approach);
    if (approach?.date && seekToDays) {
      const d = new Date(approach.date);
      const j2000 = new Date('2000-01-01T12:00:00Z');
      const days = (d - j2000) / 86400000;
      seekToDays(days);
    }
    if (solarSystemRef?.current && detail) {
      solarSystemRef.current.renderEarthEncounter(detail, approach, simTimeDays);
      solarSystemRef.current.focusNEO();
    }
  }, [detail, simTimeDays, seekToDays, solarSystemRef]);

  const neo = detail || neoItem;
  const riskStatus = useMemo(() => interpretRiskStatus(riskData), [riskData]);

  // ─── Render tabs ────────────────────────────────────────────────────────────

  function renderIdentification() {
    return (
      <Section title="Object Identification">
        <DataField label="Name" value={neo?.name} highlight />
        <DataField label="Designation" value={neo?.designation || neo?.fullName} source="JPL SBDB" />
        <DataField label="Full Designation" value={neo?.fullName} />
        <DataField label="SPK-ID" value={neo?.spkid || neo?.id} source="JPL SBDB" />
        <DataField label="Object Type" value={neo?.objectType || 'ASTEROID'} />
        <DataField label="NEO Status" value={neo?.isNEO ? 'YES — Near-Earth Object' : 'NOT CLASSIFIED AS NEO'} source="JPL SBDB" />
        <DataField
          label="PHA Status"
          value={neo?.isPHA ? 'YES — Potentially Hazardous Asteroid' : 'NOT CLASSIFIED AS PHA'}
          note={neo?.isPHA ? 'PHA classification is based on orbit and size, NOT on impact probability.' : undefined}
          source="JPL SBDB"
        />
        <DataField
          label="Orbit Class"
          value={neo?.orbit?.orbitClass || neo?.orbitClass}
          note={ORBIT_CLASS_DESCRIPTIONS[neo?.orbit?.orbitClass || neo?.orbitClass]}
          source="JPL SBDB"
        />
        {neo?.discovery && (
          <>
            <DataField label="Discovery Date" value={neo.discovery.date} source="JPL SBDB" />
            <DataField label="Discovered By" value={neo.discovery.who} source="JPL SBDB" />
            <DataField label="Discovery Location" value={neo.discovery.location} source="JPL SBDB" />
          </>
        )}
        <DataField label="Last Updated" value={neo?.lastUpdated ? new Date(neo.lastUpdated).toLocaleString() : null} />
      </Section>
    );
  }

  function renderPhysical() {
    const phys = neo?.physical || {};
    const orbit = neo?.orbit;
    const H = phys.H || neo?.absoluteMagnitude;
    const diam = neo?.diameterKm || phys.diameter;
    const diamEst = neo?.diameterMinKm && neo?.diameterMaxKm;

    return (
      <Section title="Physical Properties">
        <DataField
          label="Absolute Magnitude (H)"
          value={H != null ? H.toFixed(2) : null}
          unit="mag"
          source="JPL SBDB"
        />
        <DataField
          label="Diameter (observed)"
          value={diam && neo?.diameterSource === 'OBSERVED_JPL_SBDB' ? diam.toFixed(3) : null}
          unit="km"
          source="JPL SBDB"
        />
        {neo?.diameterSource !== 'OBSERVED_JPL_SBDB' && H != null && (
          <DataField
            label="Diameter (estimated)"
            value={diam ? `${(neo.diameterMinKm || diam * 0.7).toFixed(3)} – ${(neo.diameterMaxKm || diam * 1.5).toFixed(3)}` : null}
            unit="km"
            note="ESTIMATED from H magnitude. Assumes albedo pv = 0.14 (typical). PLANETORY CALCULATION."
            source="Planetory (formula: D = 1329/√pv × 10^(-H/5))"
          />
        )}
        <DataField label="Albedo" value={phys.albedo != null ? phys.albedo.toFixed(3) : null} source="JPL SBDB" />
        <DataField label="Rotation Period" value={phys.rotPer != null ? phys.rotPer : null} unit="hours" source="JPL SBDB" />
        <DataField label="Spectral Type" value={phys.spectralType} source="JPL SBDB" />
        <DataField label="Density" value={phys.density != null ? phys.density : null} unit="g/cm³" source="JPL SBDB" />
        <DataField label="MOID (Earth)" value={orbit?.moid != null ? orbit.moid.toFixed(6) : null} unit="AU" source="JPL SBDB"
          note={orbit?.moid < 0.05 ? `≈ ${(orbit.moid * 149597870.7 / 384400).toFixed(1)} LD — Within PHA threshold` : null} />
      </Section>
    );
  }

  function renderOrbit() {
    const orb = neo?.orbit || {};
    return (
      <Section title="Orbital Elements" badge={
        <span style={{ color: '#8892a4', fontSize: 10 }}>Source: JPL SBDB | Epoch: {orb.epoch || 'N/A'}</span>
      }>
        <DataField label="Semi-Major Axis (a)" value={orb.semiMajorAxisAu?.toFixed(6)} unit="AU" source="JPL SBDB" highlight />
        <DataField label="Eccentricity (e)" value={orb.eccentricity?.toFixed(7)} source="JPL SBDB" />
        <DataField label="Inclination (i)" value={orb.inclinationDeg?.toFixed(5)} unit="°" source="JPL SBDB" />
        <DataField label="Ascending Node (Ω)" value={orb.longitudeAscendingNodeDeg?.toFixed(5)} unit="°" source="JPL SBDB" />
        <DataField label="Arg. of Periapsis (ω)" value={orb.argumentOfPeriapsisDeg?.toFixed(5)} unit="°" source="JPL SBDB" />
        <DataField label="Mean Anomaly (M₀)" value={orb.meanAnomalyDeg?.toFixed(5)} unit="°" source="JPL SBDB" />
        <DataField label="Perihelion (q)" value={orb.perihelionAu?.toFixed(6)} unit="AU" note="q = a(1−e) | Planetory" />
        <DataField label="Aphelion (Q)" value={orb.aphelionAu?.toFixed(6)} unit="AU" note="Q = a(1+e) | Planetory" />
        <DataField label="Orbital Period" value={orb.orbitalPeriodDays?.toFixed(2)} unit="days" note="T = 2π√(a³/μ☉) | Planetory" />
        <DataField label="MOID (Earth)" value={orb.moid?.toFixed(6)} unit="AU" source="JPL SBDB" />
        <DataField label="Tisserand Parameter" value={orb.tisserand?.toFixed(4)} source="JPL SBDB" />
        <DataField label="Orbit Condition Code" value={orb.conditionCode} source="JPL SBDB"
          note={orb.conditionCode <= 2 ? 'Well-determined orbit' : orb.conditionCode >= 7 ? 'Poorly determined — predictions less reliable' : null} />
        <DataField label="Observations Used" value={orb.nObservations} source="JPL SBDB" />
        <DataField label="Data Arc" value={orb.dataArc} unit="days" source="JPL SBDB" />
        <DataField label="Solution Date" value={orb.solutionDate} source="JPL SBDB" />
      </Section>
    );
  }

  function renderApproaches() {
    const approaches = approachData?.approaches || neo?.closeApproaches || [];
    return (
      <div>
        <Section title="Earth Close Approaches" badge={
          <span style={{ color: '#8892a4', fontSize: 10 }}>Source: JPL CNEOS CAD</span>
        }>
          <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: 6, fontSize: 11, color: '#8892a4', lineHeight: 1.5 }}>
            <strong style={{ color: '#00f0ff' }}>IMPORTANT:</strong> Close approach ≠ impact risk.
            An asteroid may cross Earth's orbital radius without being near Earth at the same time.
            See the RISK tab for official NASA/JPL CNEOS Sentry impact assessment.
          </div>
          {errors.approaches && (
            <div style={{ color: '#ff6b6b', fontSize: 12, padding: '8px', background: 'rgba(255,0,0,0.1)', borderRadius: 4, marginBottom: 8 }}>
              DATA UNAVAILABLE: {errors.approaches}
            </div>
          )}
          <NEOCloseApproachTimeline
            approaches={approaches}
            onSelectApproach={handleSelectApproach}
            selectedApproach={selectedApproach}
            simTimeDays={simTimeDays}
          />
        </Section>
        {horizonsData && (
          <Section title="JPL Horizons Ephemeris" badge={
            <span style={{ color: '#ffb703', fontSize: 10 }}>HIGH-PRECISION</span>
          }>
            <DataField label="Position X" value={horizonsData.position?.x?.toFixed(8)} unit="AU" source="JPL Horizons" />
            <DataField label="Position Y" value={horizonsData.position?.y?.toFixed(8)} unit="AU" source="JPL Horizons" />
            <DataField label="Position Z" value={horizonsData.position?.z?.toFixed(8)} unit="AU" source="JPL Horizons" />
            {horizonsData.velocity && <>
              <DataField label="Velocity VX" value={horizonsData.velocity?.vx?.toFixed(8)} unit="AU/day" source="JPL Horizons" />
              <DataField label="Velocity VY" value={horizonsData.velocity?.vy?.toFixed(8)} unit="AU/day" source="JPL Horizons" />
              <DataField label="Velocity VZ" value={horizonsData.velocity?.vz?.toFixed(8)} unit="AU/day" source="JPL Horizons" />
            </>}
            <div style={{ fontSize: 10, color: '#8892a4', marginTop: 8 }}>
              Epoch: {horizonsData.epoch} | Type: JPL HORIZONS HIGH-PRECISION EPHEMERIS
            </div>
          </Section>
        )}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!neoItem) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8892a4' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>☄️</div>
        <div style={{ fontSize: 14 }}>Select a NEO to view its scientific profile</div>
        <div style={{ fontSize: 11, marginTop: 6, color: '#556' }}>Data from NASA NeoWs • JPL SBDB • JPL CNEOS Sentry</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
            {neo?.name || neo?.designation || 'Unknown NEO'}
          </span>
          {neo?.isNEO && <NeoBadge label="NEO" color="#00f0ff" />}
          {neo?.isPHA && <NeoBadge label="PHA" color="#ffb703" />}
          {riskData?.sentryMonitored && <NeoBadge label="SENTRY" color="#ff8c00" />}
          {riskData?.torino >= 1 && <NeoBadge label={`TORINO ${riskData.torino}`} color="#ff3d00" />}
        </div>
        {/* Risk status summary bar */}
        <div style={{
          marginTop: 8, padding: '6px 10px', borderRadius: 4, fontSize: 11,
          background: riskStatus.level === 'NONE' ? 'rgba(0,255,136,0.1)' :
                      riskStatus.level === 'ELEVATED' ? 'rgba(255,61,0,0.15)' : 'rgba(0,140,255,0.1)',
          borderLeft: `3px solid ${riskStatus.color}`, color: riskStatus.color, fontWeight: 600
        }}>
          {riskStatus.label}
        </div>
        {/* 3D view controls */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button onClick={() => solarSystemRef?.current?.renderNEOOrbit(detail || neo, simTimeDays)}
            style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(0,240,255,0.1)', border: '1px solid #00f0ff', color: '#00f0ff', borderRadius: 4, cursor: 'pointer' }}>
            🌐 SHOW ORBIT
          </button>
          <button onClick={() => solarSystemRef?.current?.focusNEO()}
            style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', color: '#00f0ff', borderRadius: 4, cursor: 'pointer' }}>
            🎯 FOCUS
          </button>
          <button onClick={() => solarSystemRef?.current?.focusNEOOverview()}
            style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#e0e8ff', borderRadius: 4, cursor: 'pointer' }}>
            🔭 OVERVIEW
          </button>
          <button onClick={() => solarSystemRef?.current?.clearNEO()}
            style={{ fontSize: 10, padding: '3px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4', borderRadius: 4, cursor: 'pointer' }}>
            ✕ CLEAR
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, overflowX: 'auto' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', whiteSpace: 'nowrap',
              color: activeTab === tab.id ? '#00f0ff' : '#8892a4',
              borderBottom: activeTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
            {tab.id === 'risk' && riskData?.torino >= 1 && (
              <span style={{ marginLeft: 4, color: '#ff3d00' }}>⚠</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {loading && (
          <div>
            {[...Array(6)].map((_, i) => <Skeleton key={i} height={20} width={`${70 + Math.random() * 30}%`} />)}
          </div>
        )}

        {!loading && activeTab === 'identification' && renderIdentification()}
        {!loading && activeTab === 'physical' && renderPhysical()}
        {!loading && activeTab === 'orbit' && renderOrbit()}
        {!loading && activeTab === 'approaches' && renderApproaches()}
        {!loading && activeTab === 'risk' && (
          <NEORiskPanel riskData={riskData} neoName={neo?.name} loading={loading} />
        )}
        {!loading && activeTab === 'calculations' && (
          <NEOScientificCalculations neo={detail || neo} simTimeDays={simTimeDays} />
        )}
        {!loading && activeTab === 'provenance' && (
          <NEOProvenance neo={detail || neo} riskData={riskData} />
        )}
      </div>
    </div>
  );
}
