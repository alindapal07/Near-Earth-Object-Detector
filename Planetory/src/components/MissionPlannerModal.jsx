import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { calculateHohmannTransfer } from '../utils/hohmannTransfer';
import { PLANET_DATA } from '../data/planets';
import { NATURAL_SATELLITES } from '../data/satellites';
import { formatKm, formatAU } from '../utils/formatters';
import { j2000DaysToDate, getDaysSinceJ2000 } from '../utils/dateUtils';
import MissionControlPanel from './MissionControlPanel';

/**
 * MissionPlannerModal.jsx  —  NASA/JPL Interplanetary Mission Planning System (Part 26)
 *
 * Features:
 *  • Full-screen translucent overlay (3D solar system stays 100% visible behind)
 *  • 3-column desktop layout: CONFIG | SVG ORBIT DIAGRAM | ANALYSIS
 *  • SVG orbit diagram: draws origin orbit, destination orbit, transfer arc, departure/arrival markers, live spacecraft dot
 *  • Interactive mission timeline scrubber (click / drag to set MET)
 *  • Scientific formula expansion cards [fx] for every calculation
 *  • Launch window quality bar + phase angle gauges
 *  • Scenario save / compare / export
 *  • Play / Pause / Reset playback wired to SimulationClock props
 *  • Full mobile & tablet responsiveness
 */

// ─── SVG Orbit Diagram ─────────────────────────────────────────────────────────
function OrbitDiagram({ transfer, progressPct, onSeek }) {
  const svgRef = useRef(null);
  const W = 340, H = 340, CX = 170, CY = 170;

  if (!transfer || !transfer.valid) {
    return (
      <div className="mp-svg-placeholder">
        <span>Configure mission parameters to visualize trajectory</span>
      </div>
    );
  }

  const AU_PX = 70; // pixels per AU

  const r1 = transfer.originRadiusAu;
  const r2 = transfer.destinationRadiusAu;
  const aT = transfer.transferSemiMajorAxisAu;
  const eT = transfer.eccentricity;

  // Scale AU → pixels (fit largest orbit)
  const maxR = Math.max(r2, aT * (1 + eT));
  const scale = (H / 2 - 16) / Math.max(maxR * AU_PX / 70, 1) * 1;
  const toS = (au) => au * AU_PX * scale;

  // Origin orbit (circle)
  const or1 = toS(r1);
  // Destination orbit (circle, approx)
  const or2 = toS(r2);
  // Transfer ellipse
  const aSvg = toS(aT);
  const bSvg = toS(aT * Math.sqrt(1 - eT * eT));
  const cSvg = toS(aT * eT); // distance from center to focus (Sun)
  // Transfer ellipse center offset so Sun is at left focus
  const ellCX = CX + cSvg; // shift ellipse right so Sun at left focus

  // Departure point = periapsis of transfer ellipse = right side
  const depX = CX + toS(r1);
  const depY = CY;

  // Arrival point = apoapsis of transfer ellipse = left side
  const arrX = CX - toS(r2);
  const arrY = CY;

  // Spacecraft along transfer ellipse
  const angle = (progressPct / 100) * Math.PI; // 0 (periapsis) → π (apoapsis)
  const rAtAngle = (aSvg * (1 - eT * eT)) / (1 + eT * Math.cos(angle));
  const scX = ellCX - rAtAngle * Math.cos(angle);
  const scY = CY - rAtAngle * Math.sin(angle);

  const handleSvgClick = (e) => {
    if (!svgRef.current || !onSeek) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - CX;
    const my = e.clientY - rect.top - CY;
    // Project click x along the bottom timeline
    const pct = Math.max(0, Math.min(100, ((mx + W / 2) / W) * 100));
    onSeek(pct);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className="mp-orbit-svg"
      onClick={handleSvgClick}
    >
      {/* Background */}
      <rect width={W} height={H} fill="rgba(2,4,14,0.0)" />

      {/* Sun */}
      <circle cx={CX} cy={CY} r={7} fill="#fff8c0" filter="url(#glow-sun)" />
      <circle cx={CX} cy={CY} r={3} fill="#ffde7a" />
      <text x={CX + 10} y={CY - 8} fill="#fff5b0" fontSize="8" fontFamily="monospace">SUN</text>

      {/* Origin orbit */}
      <circle
        cx={CX} cy={CY} r={or1}
        fill="none"
        stroke="#00f0ff"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.5"
      />

      {/* Destination orbit */}
      <circle
        cx={CX} cy={CY} r={or2}
        fill="none"
        stroke="#4fc3f7"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.4"
      />

      {/* Transfer ellipse arc (only the half from departure to arrival) */}
      <ellipse
        cx={ellCX}
        cy={CY}
        rx={aSvg}
        ry={bSvg}
        fill="none"
        stroke="#ffb703"
        strokeWidth="2"
        strokeDasharray="6 3"
        opacity="0.85"
        strokeLinecap="round"
      />

      {/* Departure marker */}
      <circle cx={depX} cy={depY} r={5} fill="#00ffaa" />
      <text x={depX + 7} y={depY - 4} fill="#00ffaa" fontSize="7" fontFamily="monospace">DEPART</text>

      {/* Arrival marker */}
      <circle cx={arrX} cy={arrY} r={5} fill="#ff6b35" />
      <text x={arrX - 38} y={arrY - 4} fill="#ff6b35" fontSize="7" fontFamily="monospace">ARRIVE</text>

      {/* Spacecraft marker */}
      <g transform={`translate(${scX},${scY})`}>
        <polygon points="0,-6 4,4 0,2 -4,4" fill="#00f0ff" opacity="0.95" />
        <circle r="3" fill="none" stroke="#00f0ff" strokeWidth="1" opacity="0.6" />
      </g>

      {/* Origin planet dot */}
      <circle cx={depX} cy={depY} r={3.5} fill="#00e5ff" opacity="0.7" />

      {/* Destination planet dot */}
      <circle cx={arrX} cy={arrY} r={4} fill="#f8961e" opacity="0.7" />

      {/* Labels */}
      <text x={CX - or1 - 18} y={CY + 4} fill="#00f0ff" fontSize="7" fontFamily="monospace"
        opacity="0.7">{transfer.origin?.toUpperCase()?.slice(0,5)}</text>
      <text x={CX - or2 - 22} y={CY - 6} fill="#4fc3f7" fontSize="7" fontFamily="monospace"
        opacity="0.7">{transfer.destination?.toUpperCase()?.slice(0,5)}</text>

      {/* Filters */}
      <defs>
        <filter id="glow-sun" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    </svg>
  );
}

// ─── Launch Window Quality Bar ──────────────────────────────────────────────────
function LaunchWindowBar({ phaseErrorDeg }) {
  const maxError = 180;
  const quality = Math.max(0, 1 - phaseErrorDeg / maxError);
  const pct = Math.round(quality * 100);
  const color = pct > 80 ? '#00ffaa' : pct > 50 ? '#ffb703' : '#ff4444';
  const label = pct > 80 ? 'OPTIMAL' : pct > 50 ? 'ACCEPTABLE' : 'POOR';
  return (
    <div className="mp-window-bar-wrap">
      <div className="mp-window-bar-header">
        <span>LAUNCH WINDOW QUALITY</span>
        <span style={{ color }} className="mp-window-label">{label}</span>
      </div>
      <div className="mp-window-bar-track">
        <div className="mp-window-bar-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="mp-window-bar-marker" style={{ left: `${pct}%` }} title={`Current: ${pct}%`} />
      </div>
      <div className="mp-window-bar-footer">
        <span>POOR</span><span>ACCEPTABLE</span><span>OPTIMAL</span>
      </div>
      <div className="mp-window-note">
        Phase Error: <strong style={{ color }}>{phaseErrorDeg}°</strong>
        &nbsp;| Simplified launch-window estimate
      </div>
    </div>
  );
}

// ─── Formula Expansion Card ────────────────────────────────────────────────────
function FormulaCard({ step, isOpen, onToggle }) {
  return (
    <div className="mp-formula-card">
      <button className="mp-formula-toggle" onClick={onToggle}>
        <span className="mp-formula-tag">[ƒx] STEP {step.step}</span>
        <span className="mp-formula-title">{step.title}</span>
        <span className="mp-formula-chevron">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="mp-formula-body">
          <div className="mp-formula-row">
            <span className="mp-formula-lbl">FORMULA</span>
            <code className="mp-formula-val">{step.formula}</code>
          </div>
          <div className="mp-formula-row">
            <span className="mp-formula-lbl">INPUTS</span>
            <code className="mp-formula-val">{step.inputs}</code>
          </div>
          <div className="mp-formula-row">
            <span className="mp-formula-lbl">RESULT</span>
            <code className="mp-formula-val mp-formula-result">{step.result}</code>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Interactive Timeline ──────────────────────────────────────────────────────
function MissionTimeline({ progressPct, durationDays, departureDateStr, arrivalDateStr, onSeek }) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const computePct = useCallback((clientX) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerDown = (e) => {
    setDragging(true);
    onSeek(computePct(e.clientX));
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging) return;
    onSeek(computePct(e.clientX));
  };

  const handlePointerUp = () => setDragging(false);

  const midDays = Math.round(durationDays / 2);

  const events = [
    { pct: 0,   label: 'DEPART',      date: departureDateStr, color: '#00ffaa' },
    { pct: 25,  label: 'T+25%',       date: `MET +${Math.round(durationDays * 0.25)}d`, color: '#00e5ff' },
    { pct: 50,  label: 'MID-COURSE',  date: `MET +${midDays}d`, color: '#ffb703' },
    { pct: 75,  label: 'T+75%',       date: `MET +${Math.round(durationDays * 0.75)}d`, color: '#ff9f1c' },
    { pct: 100, label: 'ARRIVE',      date: arrivalDateStr, color: '#ff6b35' },
  ];

  return (
    <div className="mp-timeline-outer">
      <div className="mp-timeline-header">
        <span>🚀 MISSION TIMELINE</span>
        <span className="mp-timeline-met">
          MET: {Math.round((progressPct / 100) * durationDays)} / {durationDays} days
          &nbsp;({progressPct.toFixed(1)}%)
        </span>
      </div>

      {/* Event labels above track */}
      <div className="mp-timeline-events">
        {events.map(ev => (
          <div key={ev.label} className="mp-timeline-event" style={{ left: `${ev.pct}%` }}>
            <div className="mp-timeline-event-dot" style={{ background: ev.color }} />
            <div className="mp-timeline-event-label" style={{ color: ev.color }}>{ev.label}</div>
            <div className="mp-timeline-event-date">{ev.date}</div>
          </div>
        ))}
      </div>

      {/* Scrubber track */}
      <div
        ref={trackRef}
        className="mp-timeline-track"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="mp-timeline-fill" style={{ width: `${progressPct}%` }} />
        <div className="mp-timeline-thumb" style={{ left: `${progressPct}%` }}>
          <div className="mp-timeline-thumb-inner" />
        </div>
      </div>

      <div className="mp-timeline-footer">
        <span>{departureDateStr}</span>
        <span>DRAG TO SCRUB SPACECRAFT POSITION</span>
        <span>{arrivalDateStr}</span>
      </div>
    </div>
  );
}

// ─── Scenario Compare Table ────────────────────────────────────────────────────
function ScenarioCompare({ scenarios, onClose }) {
  return (
    <div className="mp-compare-overlay" onClick={onClose}>
      <div className="mp-compare-box" onClick={e => e.stopPropagation()}>
        <div className="mp-compare-header">
          <span>📊 SAVED MISSION SCENARIOS</span>
          <button className="mp-close-btn" onClick={onClose}>✕</button>
        </div>
        {scenarios.length === 0 ? (
          <div className="mp-compare-empty">No saved scenarios. Calculate and save a mission first.</div>
        ) : (
          <div className="mp-compare-scroll">
            <table className="mp-compare-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>ROUTE</th>
                  <th>TYPE</th>
                  <th>FLIGHT TIME</th>
                  <th>DEP ΔV</th>
                  <th>ARR ΔV</th>
                  <th>TOTAL ΔV</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((sc, i) => (
                  <tr key={sc.id || i}>
                    <td>{sc.name}</td>
                    <td>{sc.origin} → {sc.destination}</td>
                    <td>{(sc.type || '').replace('_', ' ')}</td>
                    <td className="mp-td-cyan">{sc.durationDays} d</td>
                    <td>{(sc.depDeltaV || 0).toFixed(2)} km/s</td>
                    <td>{(sc.arrDeltaV || 0).toFixed(2)} km/s</td>
                    <td className="mp-td-amber">{(sc.totalDeltaV || 0).toFixed(2)} km/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function MissionPlannerModal({
  isOpen,
  onClose,
  simTimeDays = 0,
  seekToDate,
  catalog = [],
  solarSystemRef,
  onSelectObject,
  isPaused,
  onTogglePause,
  onSetSpeed,
  onPlotTransfer
}) {
  if (!isOpen) return null;

  // ── 1. Unified celestial catalog ──────────────────────────────────────────
  const fullCatalog = useMemo(() => {
    const list = [
      ...Object.values(PLANET_DATA).filter(o => o.id !== 'sun'),
      ...NATURAL_SATELLITES,
      ...(catalog || [])
    ];
    return list.filter(o => o && (o.id || o.spkid));
  }, [catalog]);

  // ── 2. Mission form state ─────────────────────────────────────────────────
  const [missionName, setMissionName] = useState('Earth → Mars Transfer');
  const [originId,    setOriginId]    = useState('earth');
  const [destId,      setDestId]      = useState('mars');
  const [transferType, setTransferType] = useState('HOHMANN_TRANSFER');
  const [propulsionType, setPropulsionType] = useState('Chemical');
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch,   setDestSearch]   = useState('');

  const [departureDateStr, setDepartureDateStr] = useState(() => {
    try {
      return j2000DaysToDate(simTimeDays).toISOString().split('T')[0];
    } catch { return '2026-09-08'; }
  });

  // Flight duration (days) — synced from calculation result
  const [manualDuration, setManualDuration] = useState(null);

  // ── 3. Scenario management ────────────────────────────────────────────────
  const [savedScenarios, setSavedScenarios] = useState(() => {
    try {
      const s = localStorage.getItem('planetory_mission_scenarios');
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [showCompare, setShowCompare] = useState(false);

  // Mode: 'PLANNING' | 'MISSION_CONTROL'
  const [missionMode, setMissionMode] = useState('PLANNING');

  // ── 4. UI state ───────────────────────────────────────────────────────────
  const [openFormulas, setOpenFormulas] = useState({});
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'config' | 'orbit' (mobile)
  const [missionProgress, setMissionProgress] = useState(0); // 0–100
  // Playback status is only set by user actions (PLAY/PAUSE/RESET). NEVER set during render.
  const [playbackStatus, setPlaybackStatus] = useState('READY'); // 'READY'|'SIMULATING'|'PAUSED'

  // ── 5. Derived object lookups ─────────────────────────────────────────────
  const originObj = useMemo(() =>
    fullCatalog.find(o => (o.id || o.spkid) === originId) || fullCatalog.find(o => o.id === 'earth') || fullCatalog[0],
    [fullCatalog, originId]);

  const destObj = useMemo(() =>
    fullCatalog.find(o => (o.id || o.spkid) === destId) || fullCatalog.find(o => o.id === 'mars') || fullCatalog[1],
    [fullCatalog, destId]);

  // ── 6. Filtered dropdown lists ────────────────────────────────────────────
  const filteredOrigins = useMemo(() => {
    const q = originSearch.toLowerCase().trim();
    if (!q) return fullCatalog;
    return fullCatalog.filter(o => (o.name || o.id || '').toLowerCase().includes(q));
  }, [fullCatalog, originSearch]);

  const filteredDests = useMemo(() => {
    const q = destSearch.toLowerCase().trim();
    if (!q) return fullCatalog;
    return fullCatalog.filter(o => (o.name || o.id || '').toLowerCase().includes(q));
  }, [fullCatalog, destSearch]);

  // ── 7. Departure J2000 days ───────────────────────────────────────────────
  const departureDays = useMemo(() => {
    try {
      const [y, m, d] = departureDateStr.split('-').map(Number);
      return getDaysSinceJ2000(new Date(Date.UTC(y, m - 1, d)));
    } catch { return simTimeDays; }
  }, [departureDateStr, simTimeDays]);

  // ── 8. Transfer calculation — PURE: no setState calls allowed inside useMemo ──
  const transferResult = useMemo(() => {
    try {
      return calculateHohmannTransfer(originObj, destObj, departureDays, transferType, catalog);
    } catch (err) {
      return { valid: false, error: String(err), calculationSteps: [] };
    }
  }, [originObj, destObj, departureDays, transferType, catalog]);

  // Derive calculation status purely from result — no side effects
  const calcStatus = useMemo(() => {
    if (!transferResult) return 'CALCULATING';
    if (!transferResult.valid) return 'INVALID';
    return 'READY';
  }, [transferResult]);

  // Compose final status: playback state overrides calc state when active
  const status = (playbackStatus === 'SIMULATING' || playbackStatus === 'PAUSED')
    ? playbackStatus
    : calcStatus;

  // Flight duration — use manual override OR calculated
  const flightDurationDays = manualDuration ?? (transferResult?.durationDays || 259);

  // ── 9. Arrival date ────────────────────────────────────────────────────────
  const arrivalDateStr = useMemo(() => {
    const dep = j2000DaysToDate(departureDays);
    const arr = new Date(dep.getTime() + flightDurationDays * 86400000);
    return arr.toISOString().split('T')[0];
  }, [departureDays, flightDurationDays]);

  // ── 10. Live telemetry from SimulationClock ───────────────────────────────
  const elapsedDays   = Math.max(0, simTimeDays - departureDays);
  const calcProgress  = Math.min(100, Math.max(0, (elapsedDays / Math.max(1, flightDurationDays)) * 100));

  // Mission progress: use manual scrub OR live sim
  const displayProgress = missionProgress > 0 ? missionProgress : calcProgress;

  // Telemetry values
  const distTraveledAu = transferResult?.valid
    ? (displayProgress / 100) * (transferResult.originRadiusAu + transferResult.destinationRadiusAu)
    : 0;
  const distRemainingAu = transferResult?.valid
    ? Math.max(0, (transferResult.originRadiusAu + transferResult.destinationRadiusAu) - distTraveledAu)
    : 0;

  // ── 11. 3D scene handlers ──────────────────────────────────────────────────
  const handlePlotTrajectory = () => {
    // Use new plotMissionTrajectory API with full transferResult for accurate 3D arc
    if (solarSystemRef?.current?.plotMissionTrajectory && transferResult?.valid) {
      solarSystemRef.current.plotMissionTrajectory(transferResult);
    } else if (onPlotTransfer) {
      onPlotTransfer(originId, destId);
    }
    setPlaybackStatus('SIMULATING');
    setMissionMode('MISSION_CONTROL');
  };

  const handleFocusMission = () => {
    handlePlotTrajectory();
    // Frame full mission — Sun, Earth, Mars, trajectory
    if (solarSystemRef?.current?.focusMissionOverview) {
      solarSystemRef.current.focusMissionOverview();
    } else if (solarSystemRef?.current?.focusOnObject) {
      solarSystemRef.current.focusOnObject(originId);
    }
  };

  const handleFocusOrigin = () => {
    if (solarSystemRef?.current?.focusOnObject) solarSystemRef.current.focusOnObject(originId);
    if (onSelectObject && originObj) onSelectObject(originObj);
  };

  const handleFocusDestination = () => {
    if (solarSystemRef?.current?.focusOnObject) solarSystemRef.current.focusOnObject(destId);
    if (onSelectObject && destObj) onSelectObject(destObj);
  };

  // ── 12. Playback controls ─────────────────────────────────────────────────
  const handlePlay = () => {
    if (onTogglePause && isPaused) onTogglePause();
    setPlaybackStatus('SIMULATING');
  };
  const handlePause = () => {
    if (onTogglePause && !isPaused) onTogglePause();
    setPlaybackStatus('PAUSED');
  };
  const handleReset = () => {
    setMissionProgress(0);
    if (seekToDate) {
      try {
        const [y, m, d] = departureDateStr.split('-').map(Number);
        seekToDate(new Date(Date.UTC(y, m - 1, d)));
      } catch {}
    }
    if (onTogglePause && !isPaused) onTogglePause();
    setPlaybackStatus('READY');
  };

  // ── 13. Timeline seek ─────────────────────────────────────────────────────
  const handleSeek = (pct) => {
    setMissionProgress(pct);
    const targetDays = departureDays + (pct / 100) * flightDurationDays;
    if (seekToDate) seekToDate(j2000DaysToDate(targetDays));
  };

  // ── 14. Scenario management ───────────────────────────────────────────────
  const handleSave = () => {
    if (!transferResult?.valid) return;
    const sc = {
      id: `sc_${Date.now()}`,
      name: missionName,
      origin: originObj?.name || originId,
      destination: destObj?.name || destId,
      departureDate: departureDateStr,
      arrivalDate: arrivalDateStr,
      durationDays: flightDurationDays,
      totalDeltaV: transferResult.totalDeltaVKmS,
      depDeltaV: transferResult.departureDeltaVKmS,
      arrDeltaV: transferResult.arrivalDeltaVKmS,
      type: transferType,
      propulsion: propulsionType
    };
    const updated = [sc, ...savedScenarios.slice(0, 4)];
    setSavedScenarios(updated);
    try { localStorage.setItem('planetory_mission_scenarios', JSON.stringify(updated)); } catch {}
  };

  const handleExport = () => {
    const payload = {
      missionName,
      origin: originObj?.name,
      destination: destObj?.name,
      departureDate: departureDateStr,
      arrivalDate: arrivalDateStr,
      flightDurationDays,
      transferType,
      propulsionType,
      nasaJplProvenance: 'NASA / JPL Derived Orbital Elements',
      modelType: transferResult?.precisionLabel,
      results: {
        totalDeltaVKmS: transferResult?.totalDeltaVKmS,
        departureDeltaVKmS: transferResult?.departureDeltaVKmS,
        arrivalDeltaVKmS: transferResult?.arrivalDeltaVKmS,
        transferSemiMajorAxisAu: transferResult?.transferSemiMajorAxisAu,
        eccentricity: transferResult?.eccentricity,
        phaseAngleReqDeg: transferResult?.phaseAngleReqDeg,
        currentPhaseDeg: transferResult?.currentPhaseDeg,
        specificEnergyJPerKg: transferResult?.specificEnergyJ,
      },
      disclaimer: 'IDEALIZED HELIOCENTRIC COPLANAR MODEL — NOT AN OFFICIAL NASA MISSION PLAN'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(missionName || 'mission').replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFormula = (idx) => {
    setOpenFormulas(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusColors = {
    READY: '#00ffaa', CALCULATING: '#ffb703', SIMULATING: '#00f0ff',
    PAUSED: '#aaa', INVALID: '#ff4444', ERROR: '#ff0055', COMPLETE: '#7fff7f'
  };
  const statusColor = statusColors[status] || '#aaa';

  const windowColor = transferResult?.windowBadgeColor || '#aaa';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={`mp-backdrop ${missionMode === 'MISSION_CONTROL' ? 'mp-backdrop--mission-control' : ''}`} onClick={onClose}>
      <div className={`mp-workspace ${missionMode === 'MISSION_CONTROL' ? 'mp-workspace--mission-control' : ''}`} onClick={e => e.stopPropagation()} onWheel={e => e.stopPropagation()}>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="mp-header">
          <div className="mp-header-left">
            <span className="mp-brand-tag">🛰️ NASA/JPL INTERPLANETARY MISSION PLANNER</span>
            <input
              className="mp-mission-name-input"
              value={missionName}
              onChange={e => setMissionName(e.target.value)}
              placeholder="Mission Name..."
              maxLength={60}
            />
          </div>
          <div className="mp-header-right">
            <div className="mp-status-badge" style={{ borderColor: statusColor, color: statusColor }}>
              ● {status}
            </div>
            <div className="mp-window-badge" style={{ borderColor: windowColor, color: windowColor }}>
              {transferResult?.valid ? transferResult.status : 'NOT CONFIGURED'}
            </div>
            <button className="mp-close-btn" onClick={onClose} title="Close (Esc)">✕</button>
          </div>
        </div>

        {/* ── TOOLBAR ────────────────────────────────────────────────────── */}
        <div className="mp-toolbar">
          <div className="mp-tb-group">
            <button 
              className={`mp-btn ${missionMode === 'PLANNING' ? 'mp-btn--primary' : ''}`} 
              onClick={() => setMissionMode('PLANNING')}
            >
              ⚙️ PLANNING
            </button>
            <button 
              className={`mp-btn ${missionMode === 'MISSION_CONTROL' ? 'mp-btn--primary' : ''}`} 
              onClick={() => setMissionMode('MISSION_CONTROL')}
            >
              🚀 MISSION CONTROL
            </button>
          </div>
          <div className="mp-tb-group">
            <button className="mp-btn mp-btn--primary" onClick={handlePlotTrajectory}>
              🛰️ CALCULATE & PLOT 3D
            </button>
            <button className="mp-btn" onClick={handleFocusMission}>🔭 FOCUS MISSION</button>
            <button className="mp-btn" onClick={handleFocusOrigin}>🌍 {(originObj?.name || 'ORIGIN').toUpperCase()}</button>
            <button className="mp-btn" onClick={handleFocusDestination}>🪐 {(destObj?.name || 'DEST').toUpperCase()}</button>
          </div>
          <div className="mp-tb-group">
            <button className="mp-btn mp-btn--green" onClick={handlePlay}>▶ PLAY</button>
            <button className="mp-btn" onClick={handlePause}>Ⅱ PAUSE</button>
            <button className="mp-btn" onClick={handleReset}>↺ RESET</button>
          </div>
          <div className="mp-tb-group">
            <button className="mp-btn" onClick={handleSave} disabled={!transferResult?.valid}>💾 SAVE</button>
            {savedScenarios.length > 0 && (
              <button className="mp-btn mp-btn--amber" onClick={() => setShowCompare(true)}>
                📊 COMPARE ({savedScenarios.length})
              </button>
            )}
            <button className="mp-btn" onClick={handleExport} disabled={!transferResult?.valid}>📥 EXPORT</button>
          </div>

          {/* Mobile tab switcher */}
          <div className="mp-tab-switcher">
            {['config','orbit','analysis'].map(tab => (
              <button
                key={tab}
                className={`mp-tab-btn${activeTab === tab ? ' mp-tab-btn--active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'config' ? '⚙️' : tab === 'orbit' ? '🌐' : '📊'}
                <span>{tab.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {missionMode === 'MISSION_CONTROL' ? (
          <MissionControlPanel
            simTimeDays={simTimeDays}
            departureDays={departureDays}
            transferResult={transferResult}
            onSeekToDays={(d) => {
              if (seekToDate) seekToDate(j2000DaysToDate(d));
            }}
            onSeekToDate={seekToDate}
            isPaused={isPaused}
            onTogglePause={onTogglePause}
            onSetSpeed={onSetSpeed}
            solarSystemRef={solarSystemRef}
            originObj={originObj}
            destObj={destObj}
            onSwitchMode={() => setMissionMode('PLANNING')}
          />
        ) : (
          <>
            {/* ── MAIN 3-COLUMN PLANNING GRID ─────────────────────────────────── */}
            <div className="mp-main-grid">

          {/* LEFT: CONFIGURATION ─────────────────────────────────────────── */}
          <div className={`mp-col mp-col-config${activeTab === 'config' ? ' mp-col--mobile-active' : ''}`}>
            <div className="mp-widget">
              <div className="mp-widget-title">⚙️ MISSION CONFIGURATION</div>

              {/* Origin */}
              <div className="mp-field-group">
                <label className="mp-label">ORIGIN BODY</label>
                <input
                  className="mp-search-input"
                  placeholder="🔍 Search origin…"
                  value={originSearch}
                  onChange={e => setOriginSearch(e.target.value)}
                />
                <select className="mp-select" value={originId} onChange={e => { setOriginId(e.target.value); setOriginSearch(''); }}>
                  {filteredOrigins.map(o => (
                    <option key={o.id || o.spkid} value={o.id || o.spkid}>
                      {o.name || o.id} [{o.category || o.type || 'BODY'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="mp-field-group">
                <label className="mp-label">DESTINATION BODY</label>
                <input
                  className="mp-search-input"
                  placeholder="🔍 Search destination…"
                  value={destSearch}
                  onChange={e => setDestSearch(e.target.value)}
                />
                <select className="mp-select" value={destId} onChange={e => { setDestId(e.target.value); setDestSearch(''); }}>
                  {filteredDests.map(o => (
                    <option key={o.id || o.spkid} value={o.id || o.spkid}>
                      {o.name || o.id} [{o.category || o.type || 'BODY'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="mp-field-row">
                <div className="mp-field-group">
                  <label className="mp-label">DEPARTURE DATE</label>
                  <input
                    type="date"
                    className="mp-date-input"
                    value={departureDateStr}
                    onChange={e => {
                      setDepartureDateStr(e.target.value);
                      try {
                        const [y, m, d] = e.target.value.split('-').map(Number);
                        if (seekToDate) seekToDate(new Date(Date.UTC(y, m - 1, d)));
                      } catch {}
                    }}
                  />
                </div>
                <div className="mp-field-group">
                  <label className="mp-label">FLIGHT DURATION (d)</label>
                  <input
                    type="number"
                    className="mp-num-input"
                    value={flightDurationDays}
                    min={1}
                    onChange={e => setManualDuration(Math.max(1, Number(e.target.value) || 1))}
                  />
                </div>
              </div>

              <div className="mp-arrival-display">
                Predicted Arrival: <strong>{arrivalDateStr}</strong>
              </div>

              {/* Transfer type */}
              <div className="mp-field-row">
                <div className="mp-field-group">
                  <label className="mp-label">TRAJECTORY TYPE</label>
                  <select className="mp-select" value={transferType} onChange={e => { setTransferType(e.target.value); setManualDuration(null); }}>
                    <option value="HOHMANN_TRANSFER">Hohmann Transfer Arc</option>
                    <option value="BI_ELLIPTIC">Bi-Elliptic 3-Burn</option>
                    <option value="DIRECT_TRANSFER">Fast Direct Transfer</option>
                  </select>
                </div>
                <div className="mp-field-group">
                  <label className="mp-label">PROPULSION</label>
                  <select className="mp-select" value={propulsionType} onChange={e => setPropulsionType(e.target.value)}>
                    <option value="Chemical">Chemical Bipropellant</option>
                    <option value="Ion">Ion Low-Thrust</option>
                    <option value="Electric">Solar Electric (SEP)</option>
                    <option value="Conceptual">Nuclear Thermal</option>
                  </select>
                </div>
              </div>

              {propulsionType !== 'Chemical' && (
                <div className="mp-propulsion-note">
                  ⚠ {propulsionType} propulsion model not implemented — showing Hohmann-equivalent geometry.
                  Label: SIMPLIFIED ESTIMATE
                </div>
              )}

              {/* Orbital plane note */}
              {transferResult?.valid && (
                <div className="mp-plane-note">
                  ⓘ PLANAR HOHMANN APPROXIMATION — Orbital inclination and planetary-plane differences
                  not fully modeled. Results are idealized heliocentric coplanar estimates.
                </div>
              )}
            </div>

            {/* Live Telemetry */}
            <div className="mp-widget mp-telemetry-widget">
              <div className="mp-widget-title">📡 LIVE MISSION TELEMETRY</div>
              <div className="mp-telem-grid">
                <div className="mp-telem-cell">
                  <span className="mp-telem-lbl">ELAPSED</span>
                  <span className="mp-telem-val mp-val-cyan">{Math.round(elapsedDays)} d</span>
                </div>
                <div className="mp-telem-cell">
                  <span className="mp-telem-lbl">PROGRESS</span>
                  <span className="mp-telem-val mp-val-cyan">{displayProgress.toFixed(1)}%</span>
                </div>
                <div className="mp-telem-cell">
                  <span className="mp-telem-lbl">DIST TRAVELED</span>
                  <span className="mp-telem-val">{formatAU(distTraveledAu, 3)}</span>
                </div>
                <div className="mp-telem-cell">
                  <span className="mp-telem-lbl">DIST REMAINING</span>
                  <span className="mp-telem-val">{formatAU(distRemainingAu, 3)}</span>
                </div>
              </div>
              <div className="mp-telem-note">
                SOURCE: NASA / JPL | MODEL: {transferResult?.precisionLabel || 'IDEALIZED HELIOCENTRIC'}
              </div>
            </div>
          </div>

          {/* CENTER: SVG ORBIT DIAGRAM ──────────────────────────────────── */}
          <div className={`mp-col mp-col-orbit${activeTab === 'orbit' ? ' mp-col--mobile-active' : ''}`}>
            <div className="mp-widget mp-orbit-widget">
              <div className="mp-widget-title">🌐 TRANSFER ORBIT DIAGRAM</div>
              <OrbitDiagram
                transfer={transferResult}
                progressPct={displayProgress}
                onSeek={handleSeek}
              />
              <div className="mp-orbit-legend">
                <span className="mp-leg-item"><span style={{color:'#00f0ff'}}>──</span> {originObj?.name || 'Origin'} Orbit</span>
                <span className="mp-leg-item"><span style={{color:'#4fc3f7'}}>──</span> {destObj?.name || 'Dest'} Orbit</span>
                <span className="mp-leg-item"><span style={{color:'#ffb703'}}>- -</span> Transfer Arc</span>
                <span className="mp-leg-item"><span style={{color:'#00ffaa'}}>●</span> Departure</span>
                <span className="mp-leg-item"><span style={{color:'#ff6b35'}}>●</span> Arrival</span>
                <span className="mp-leg-item"><span style={{color:'#00f0ff'}}>▲</span> Spacecraft</span>
              </div>

              {/* Launch window bar */}
              {transferResult?.valid && (
                <LaunchWindowBar phaseErrorDeg={transferResult.phaseErrorDeg || 0} />
              )}

              {/* Phase angle gauges */}
              {transferResult?.valid && (
                <div className="mp-phase-grid">
                  <div className="mp-phase-cell">
                    <span className="mp-phase-lbl">REQUIRED PHASE φ</span>
                    <span className="mp-phase-val">{transferResult.phaseAngleReqDeg}°</span>
                  </div>
                  <div className="mp-phase-cell">
                    <span className="mp-phase-lbl">CURRENT PHASE φ</span>
                    <span className="mp-phase-val">{transferResult.currentPhaseDeg}°</span>
                  </div>
                  <div className="mp-phase-cell">
                    <span className="mp-phase-lbl">PHASE ERROR</span>
                    <span className="mp-phase-val" style={{ color: windowColor }}>{transferResult.phaseErrorDeg}°</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: ANALYSIS ────────────────────────────────────────────── */}
          <div className={`mp-col mp-col-analysis${activeTab === 'analysis' ? ' mp-col--mobile-active' : ''}`}>
            {!transferResult?.valid ? (
              <div className="mp-widget mp-invalid-banner">
                ⚠ {transferResult?.error || 'CONFIGURE MISSION PARAMETERS ABOVE'}
              </div>
            ) : (
              <>
                {/* Delta-V Cockpit */}
                <div className="mp-widget">
                  <div className="mp-widget-title">🚀 DELTA-V ANALYSIS</div>
                  <div className="mp-dv-cockpit">
                    <div className="mp-dv-cell mp-dv-cell--total">
                      <span className="mp-dv-lbl">TOTAL IDEALIZED HELIOCENTRIC ΔV</span>
                      <span className="mp-dv-val mp-val-amber">{transferResult.totalDeltaVKmS.toFixed(3)} km/s</span>
                      <span className="mp-dv-sub">Dep: {transferResult.departureDeltaVKmS.toFixed(3)} · Arr: {transferResult.arrivalDeltaVKmS.toFixed(3)} km/s</span>
                    </div>
                    <div className="mp-dv-cell">
                      <span className="mp-dv-lbl">FLIGHT TIME</span>
                      <span className="mp-dv-val mp-val-cyan">{transferResult.durationDays} DAYS</span>
                      <span className="mp-dv-sub">~{(transferResult.durationDays / 30.43).toFixed(1)} months · ~{(transferResult.durationDays / 365.25).toFixed(2)} yr</span>
                    </div>
                  </div>

                  {/* Detailed params table */}
                  <div className="mp-params-table-wrap">
                    <table className="mp-params-table">
                      <tbody>
                        <tr><td>Transfer Semi-Major Axis</td><td>{formatAU(transferResult.transferSemiMajorAxisAu, 4)}</td></tr>
                        <tr><td>Transfer Eccentricity</td><td>{transferResult.eccentricity.toFixed(4)}</td></tr>
                        <tr><td>Origin Radius r₁</td><td>{formatAU(transferResult.originRadiusAu, 4)}</td></tr>
                        <tr><td>Destination Radius r₂</td><td>{formatAU(transferResult.destinationRadiusAu, 4)}</td></tr>
                        <tr><td>Origin Circ. Velocity v₁</td><td>{transferResult.originCircularVelocityKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Dest Circ. Velocity v₂</td><td>{transferResult.destinationCircularVelocityKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Dep. Transfer Velocity</td><td>{transferResult.departureTransferVelocityKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Arr. Transfer Velocity</td><td>{transferResult.arrivalTransferVelocityKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Departure Δv</td><td className="mp-td-amber">{transferResult.departureDeltaVKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Arrival Δv</td><td className="mp-td-amber">{transferResult.arrivalDeltaVKmS.toFixed(3)} km/s</td></tr>
                        <tr><td>Specific Orbital Energy ε</td><td>{transferResult.specificEnergyJ.toExponential(3)} J/kg</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Scientific Formula Cards [fx] */}
                <div className="mp-widget">
                  <div className="mp-widget-title">📐 CALCULATION TRACE [ƒx]</div>
                  <div className="mp-formula-list">
                    {(transferResult.calculationSteps || []).map((step, idx) => (
                      <FormulaCard
                        key={step.step}
                        step={step}
                        isOpen={!!openFormulas[idx]}
                        onToggle={() => toggleFormula(idx)}
                      />
                    ))}
                  </div>
                </div>

                {/* ΔV clarification */}
                <div className="mp-widget mp-disclaimer-widget">
                  <div className="mp-widget-title">⚠ SCIENTIFIC DISCLAIMER</div>
                  <div className="mp-disclaimer-text">
                    <strong>IDEALIZED HELIOCENTRIC ΔV</strong> — Values shown are the velocity change
                    required between heliocentric circular orbits only. They do <em>not</em> include
                    Earth surface launch ΔV, gravity losses, atmospheric drag, or planetary-capture burns.
                    <br/><br/>
                    <strong>DATA PROVENANCE:</strong> Orbital elements derived from NASA / JPL Solar System Dynamics.
                    <br/>
                    <strong>MODEL:</strong> {transferResult.precisionLabel}
                    <br/>
                    <strong>STATUS:</strong> PLANETORY SCIENTIFIC SIMULATION — Not an official NASA mission plan.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── MISSION TIMELINE ─────────────────────────────────────────────── */}
        <div className="mp-timeline-section">
          <MissionTimeline
            progressPct={displayProgress}
            durationDays={flightDurationDays}
            departureDateStr={departureDateStr}
            arrivalDateStr={arrivalDateStr}
            onSeek={handleSeek}
          />
        </div>
      </>
    )}

        {/* ── SCENARIO COMPARE MODAL ───────────────────────────────────────── */}
        {showCompare && (
          <ScenarioCompare
            scenarios={savedScenarios}
            onClose={() => setShowCompare(false)}
          />
        )}
      </div>
    </div>
  );
}
