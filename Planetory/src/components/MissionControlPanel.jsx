/**
 * MissionControlPanel.jsx — Mission Control HUD (Part 34)
 *
 * All controls are genuinely wired:
 *  • PLAY / PAUSE / RESET / REVERSE → onTogglePause / onSetSpeed / onSeekToDays
 *  • CALCULATE & PLOT 3D  → solarSystemRef.plotMissionTrajectory()
 *  • Camera buttons       → solarSystemRef.focusMissionOverview / followSpacecraft /
 *                           focusOnObject (origin/dest)
 *  • Velocity & SOI toggles → solarSystemRef.setMissionVelocityVectors / setMissionSOI
 *  • SAVE / EXPORT JSON / CSV → SpacecraftModel helpers
 *  • CHECKPOINTS          → sc.saveCheckpoint / restoreCheckpoint + seek
 *  • ABORT / RESUME       → sc.abortMission / resumeMission
 *  • SEEK TO EVENT        → onSeekToDays
 *  • DATA TABLE row click → onSeekToDays
 *  • Graphs               → synchronized to sampledTableRows
 *  • Mission log          → filtered by type
 */

import React, { useState, useMemo, useEffect } from 'react';
import { activeSpacecraftModel } from '../engine/SpacecraftModel';
import { formatKm, formatAU } from '../utils/formatters';
import { j2000DaysToDate } from '../utils/dateUtils';
import { CONSTANTS } from '../utils/epochUtils';
import Mission2DPlotCanvas from './visualization/Mission2DPlotCanvas';

// ─── Phase engine ─────────────────────────────────────────────────────────────
function getMissionPhase(sc) {
  if (sc.state === 'ABORTED') return 'ABORTED';
  if (sc.state === 'COMPLETED') return 'COMPLETE';
  const p = sc.progressPct;
  if (p <= 0) return 'PRE-LAUNCH';
  if (p < 2)  return 'DEPARTURE';
  if (p < 10) return 'EARTH ESCAPE';
  if (p < 45) return 'HELIOCENTRIC TRANSFER';
  if (p < 55) return 'MID-COURSE';
  if (p < 90) return 'HELIOCENTRIC TRANSFER';
  if (p < 98) return 'MARS APPROACH';
  if (p < 100) return 'MARS SOI';
  return 'ARRIVAL';
}

export default function MissionControlPanel({
  simTimeDays,
  departureDays = 0,
  transferResult,
  onSeekToDays,
  onSeekToDate,
  isPaused,
  onTogglePause,
  onSetSpeed,
  solarSystemRef,
  originObj,
  destObj,
  onSwitchMode
}) {
  const sc = activeSpacecraftModel;

  // ── Keep spacecraft model synced ────────────────────────────────────────────
  useEffect(() => {
    if (transferResult) {
      sc.lastTransferResult = transferResult;
      sc.updateFromTransfer(simTimeDays, departureDays, transferResult);
    }
  }, [simTimeDays, departureDays, transferResult]);

  // ── Auto-plot trajectory when panel first mounts with a valid result ─────────
  useEffect(() => {
    if (transferResult?.valid && solarSystemRef?.current?.plotMissionTrajectory) {
      solarSystemRef.current.plotMissionTrajectory(transferResult);
    }
  }, []);  // only on mount

  // ── Tab state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('telemetry');

  // ── Scene toggles ────────────────────────────────────────────────────────────
  const [showVelocityVectors, setShowVelocityVectors] = useState(true);
  const [showSOI, setShowSOI] = useState(true);

  // ── Notification / modal ─────────────────────────────────────────────────────
  const [saveStatusMsg, setSaveStatusMsg]         = useState('');
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm]   = useState(false);

  // ── Maneuver form ────────────────────────────────────────────────────────────
  const [mDateOffsetDays, setMDateOffsetDays] = useState(Math.round(sc.totalDurationDays / 2));
  const [mDvVal, setMDvVal]                   = useState('0.15');
  const [mDirection, setMDirection]           = useState('PROGRADE');
  const [mNotes, setMNotes]                   = useState('Mid-Course Correction');
  const [showManeuverModal, setShowManeuverModal] = useState(false);

  // ── Scientific card expansion ────────────────────────────────────────────────
  const [openCards, setOpenCards] = useState({});

  // ── Reverse playback ─────────────────────────────────────────────────────────
  const [isReverse, setIsReverse] = useState(false);

  // ── Log filter ────────────────────────────────────────────────────────────────
  const [logFilter, setLogFilter] = useState('ALL');

  // ── Trajectory samples (DATA TABLE + GRAPHS) ──────────────────────────────────
  const sampledTableRows = useMemo(() => {
    return sc.generateSampledTableRows(departureDays);
  }, [departureDays, transferResult]);  // eslint-disable-line

  // ── FILTERED LOGS ─────────────────────────────────────────────────────────────
  const filteredLogs = useMemo(() => {
    if (logFilter === 'ALL') return sc.logs;
    return sc.logs.filter(l => l.type === logFilter);
  }, [logFilter, simTimeDays]);  // re-derive when sim advances

  // ── Mission phase ────────────────────────────────────────────────────────────
  const missionPhase = getMissionPhase(sc);

  // ── Reverse time interval ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReverse || isPaused) return;
    const interval = setInterval(() => {
      if (onSeekToDays) onSeekToDays(simTimeDays - 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, [isReverse, isPaused, simTimeDays, onSeekToDays]);

  // ── Next upcoming event ───────────────────────────────────────────────────────
  const upcomingEvent = useMemo(() => {
    const elapsed = sc.missionElapsedTimeDays;
    const events = [
      { name: `${originObj?.name || 'Earth'} Departure`, metDays: 0 },
      { name: 'Mid-Course Correction Burn', metDays: Math.round(sc.totalDurationDays * 0.5) },
      { name: 'Sphere of Influence Entry',  metDays: Math.round(sc.totalDurationDays * 0.9) },
      { name: `${destObj?.name || 'Mars'} Orbital Insertion`, metDays: sc.totalDurationDays }
    ];
    return events.find(e => e.metDays > elapsed) || events[events.length - 1];
  }, [sc.missionElapsedTimeDays, sc.totalDurationDays, originObj, destObj]);

  const daysToNextEvent = Math.max(0, Math.round(upcomingEvent.metDays - sc.missionElapsedTimeDays));

  // ════════════════════════════════════════════════════════
  // HANDLERS
  // ════════════════════════════════════════════════════════

  const handleCalculatePlot = () => {
    if (transferResult?.valid && solarSystemRef?.current?.plotMissionTrajectory) {
      solarSystemRef.current.plotMissionTrajectory(transferResult);
    }
  };

  const handleToggleVelocityVectors = (enabled) => {
    setShowVelocityVectors(enabled);
    solarSystemRef?.current?.setMissionVelocityVectors(enabled);
  };

  const handleToggleSOI = (enabled) => {
    setShowSOI(enabled);
    solarSystemRef?.current?.setMissionSOI(enabled);
  };

  const handleMissionOverview = () => {
    solarSystemRef?.current?.setFollowObject(false);
    solarSystemRef?.current?.focusMissionOverview?.();
  };

  const handleFollowSpacecraft = () => {
    solarSystemRef?.current?.followSpacecraft?.();
  };

  const handleFocusOrigin = () => {
    if (solarSystemRef?.current?.focusOnObject && originObj) {
      solarSystemRef.current.setFollowObject(false);
      solarSystemRef.current.focusOnObject(originObj.id);
    }
  };

  const handleFocusDestination = () => {
    if (solarSystemRef?.current?.focusOnObject && destObj) {
      solarSystemRef.current.setFollowObject(false);
      solarSystemRef.current.focusOnObject(destObj.id);
    }
  };

  const handlePlay = () => {
    setIsReverse(false);
    if (isPaused && onTogglePause) onTogglePause();
  };

  const handlePause = () => {
    if (!isPaused && onTogglePause) onTogglePause();
  };

  const handleReset = () => {
    setIsReverse(false);
    if (!isPaused && onTogglePause) onTogglePause();
    if (onSeekToDays) onSeekToDays(departureDays);
  };

  const handleCreateManeuver = (e) => {
    e.preventDefault();
    sc.scheduleManeuver({
      metDays: Number(mDateOffsetDays),
      dvMagnitudeKmS: parseFloat(mDvVal) || 0.1,
      direction: mDirection,
      notes: mNotes
    });
    setShowManeuverModal(false);
  };

  const handleSaveMission = () => {
    const ok = sc.saveToLocalStorage();
    setSaveStatusMsg(ok ? '✓ SAVED TO LOCAL STORAGE' : '✗ SAVE FAILED');
    setTimeout(() => setSaveStatusMsg(''), 2800);
  };

  const handleExportJSON = () => {
    const blob = new Blob([sc.exportToJSON()], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `mission_control_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const blob = new Blob([sc.exportToCSV()], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `mission_telemetry_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCheckpoint = () => {
    sc.saveCheckpoint(`Checkpoint T+${Math.round(sc.missionElapsedTimeDays)}d`);
  };

  const handleRestoreCheckpoint = (cp) => {
    sc.restoreCheckpoint(cp.id);
    if (onSeekToDays) onSeekToDays(departureDays + cp.metDays);
    setShowCheckpointModal(false);
  };

  const handleTableRowClick = (row) => {
    const targetDays = departureDays + row.metDays;
    if (onSeekToDays) onSeekToDays(targetDays);
  };

  const handleSeekToEvent = () => {
    const targetDays = departureDays + upcomingEvent.metDays;
    if (onSeekToDays) onSeekToDays(targetDays);
  };

  const handleAbort = () => {
    sc.abortMission();
    if (!isPaused && onTogglePause) onTogglePause();
    setShowAbortConfirm(false);
  };

  const toggleCard = (key) => setOpenCards(prev => ({ ...prev, [key]: !prev[key] }));

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  const phaseColors = {
    'PRE-LAUNCH': '#aaa', 'DEPARTURE': '#00ffaa', 'EARTH ESCAPE': '#00f0ff',
    'HELIOCENTRIC TRANSFER': '#64b5f6', 'MID-COURSE': '#ffb703',
    'MARS APPROACH': '#ff8a65', 'MARS SOI': '#ff6b35',
    'ARRIVAL': '#ff6b35', 'COMPLETE': '#7fff7f', 'ABORTED': '#ff4444'
  };
  const phaseColor = phaseColors[missionPhase] || '#aaa';

  return (
    <div className="mc-workspace-container" onWheel={e => e.stopPropagation()}>

      {/* ── TOP MISSION HEADER ─────────────────────────────────────────────── */}
      <div className="mc-header-bar">
        <div className="mc-header-left">
          <div className="mc-mission-badge">🚀 MISSION CONTROL MODE</div>
          <h2 className="mc-mission-title">
            {originObj?.name?.toUpperCase() || 'EARTH'} → {destObj?.name?.toUpperCase() || 'MARS'}
          </h2>
          <span className={`mc-status-tag mc-status-tag--${sc.state.toLowerCase()}`}>
            ● {sc.state}
          </span>
          <span style={{ color: phaseColor, fontSize: '0.72rem', fontFamily: 'monospace', marginLeft: '8px' }}>
            ▸ {missionPhase}
          </span>
          {saveStatusMsg && (
            <span style={{ color: '#69f0ae', fontSize: '0.75rem', marginLeft: '10px', fontFamily: 'monospace' }}>
              {saveStatusMsg}
            </span>
          )}
        </div>

        <div className="mc-header-center">
          <div className="mc-met-display">
            <span className="mc-met-lbl">MISSION ELAPSED TIME</span>
            <span className="mc-met-val">
              T+{Math.max(0, Math.floor(sc.missionElapsedTimeDays))}d&nbsp;
              {String(Math.floor((sc.missionElapsedTimeDays % 1) * 24)).padStart(2, '0')}h
            </span>
          </div>
          <div className="mc-progress-mini">
            <div className="mc-progress-bar" style={{ width: `${sc.progressPct}%` }} />
            <span className="mc-progress-text">{sc.progressPct.toFixed(1)}%</span>
          </div>
        </div>

        <div className="mc-header-right">
          <button className="mc-mode-switch-btn" onClick={onSwitchMode} title="Switch to Mission Planning">
            ⚙️ PLANNING
          </button>
          <button className="mc-btn" onClick={handleSaveMission}>💾 SAVE</button>
          <button className="mc-btn" onClick={handleExportJSON}>📥 JSON</button>
          <button className="mc-btn" onClick={handleExportCSV}>📊 CSV</button>
          <button className="mc-btn mc-btn--amber" onClick={() => setShowCheckpointModal(true)}>
            📌 CHECKPOINTS ({sc.checkpoints.length})
          </button>
          {sc.state === 'ABORTED' ? (
            <button className="mc-btn mc-btn--green" onClick={() => sc.resumeMission()}>▶ RESUME</button>
          ) : (
            <button className="mc-btn mc-btn--danger" onClick={() => setShowAbortConfirm(true)}>⛔ ABORT</button>
          )}
        </div>
      </div>

      {/* ── DEV DIAGNOSTIC OVERLAY ──────────────────────────────────────────── */}
      {import.meta.env?.DEV && (
        <div style={{
          background: 'rgba(5,15,30,0.9)', border: '1px solid #00f0ff',
          padding: '3px 10px', fontSize: '0.65rem', color: '#69f0ae',
          display: 'flex', gap: '12px', flexWrap: 'wrap', fontFamily: 'monospace'
        }}>
          <span>● ENGINE: <strong>{solarSystemRef?.current?.getEngine ? 'READY' : 'N/A'}</strong></span>
          <span>● SC POS: <strong>({sc.position.x.toFixed(2)}, {sc.position.y.toFixed(2)} AU)</strong></span>
          <span>● MET: <strong>T+{Math.round(sc.missionElapsedTimeDays)}d</strong></span>
          <span>● TRAJ PTS: <strong>{sampledTableRows.length}</strong></span>
          <span>● TRAJECTORY: <strong>{transferResult?.valid ? 'VALID' : 'NONE'}</strong></span>
          <span>● PHASE: <strong style={{ color: phaseColor }}>{missionPhase}</strong></span>
        </div>
      )}

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div className="mc-toolbar-row">
        <div className="mc-tb-group">
          <button className="mc-btn mc-btn--primary" onClick={handleCalculatePlot}
                  title="Calculate transfer trajectory and plot it in the 3D scene">
            🛰️ CALCULATE & PLOT 3D
          </button>
        </div>
        <div className="mc-tb-group">
          <button className="mc-play-btn mc-btn--green" onClick={handlePlay}>▶ PLAY</button>
          <button className="mc-play-btn" onClick={handlePause}>⏸ PAUSE</button>
          <button className={`mc-play-btn ${isReverse ? 'active' : ''}`} onClick={() => setIsReverse(v => !v)}>
            ◀◀ REV
          </button>
          <button className="mc-play-btn" onClick={handleReset}>↺ RESET</button>
        </div>
        <div className="mc-tb-group">
          {[1, 10, 100, 1000, 10000, 100000].map(s => (
            <button key={s} className="mc-speed-btn" onClick={() => onSetSpeed && onSetSpeed(s)}>{s}×</button>
          ))}
        </div>
      </div>

      {/* ── NEXT EVENT BANNER ────────────────────────────────────────────────── */}
      <div className="mc-alert-banner">
        <span className="mc-alert-pulse">🔔</span>
        <span className="mc-alert-text">
          NEXT: <strong>{upcomingEvent.name.toUpperCase()}</strong> IN T+{daysToNextEvent}d (MET {upcomingEvent.metDays}d)
        </span>
        <button className="mc-alert-btn" onClick={handleSeekToEvent}>SEEK TO EVENT</button>
      </div>

      {/* ── TIMELINE SCRUBBER ────────────────────────────────────────────────── */}
      <div className="mc-timeline-bar">
        <div className="mc-timeline-track-wrap">
          <input
            type="range" min="0" max="100" step="0.1"
            value={sc.progressPct}
            onChange={e => {
              const pct = parseFloat(e.target.value);
              const targetDays = departureDays + (pct / 100) * sc.totalDurationDays;
              if (onSeekToDate) onSeekToDate(j2000DaysToDate(targetDays));
            }}
            className="mc-timeline-slider"
          />
          <div className="mc-timeline-markers">
            <span>T+0d DEPARTURE</span>
            <span>T+{Math.round(sc.totalDurationDays * 0.25)}d CRUISE</span>
            <span>T+{Math.round(sc.totalDurationDays * 0.5)}d MID-COURSE</span>
            <span>T+{Math.round(sc.totalDurationDays * 0.75)}d APPROACH</span>
            <span>T+{Math.round(sc.totalDurationDays)}d ARRIVAL</span>
          </div>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN GRID ───────────────────────────────────────────────── */}
      <div className="mc-main-grid">

        {/* ── LEFT COLUMN: TELEMETRY / GRAPHS / DATA TABLE ────────────────────── */}
        <div className="mc-col mc-col-left">
          <div className="mc-panel-tabs">
            {['telemetry','graphs','table','log'].map(tab => (
              <button key={tab} className={`mc-tab ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}>
                {tab === 'telemetry' ? '📡 TELEMETRY'
                 : tab === 'graphs'   ? '📈 GRAPHS'
                 : tab === 'table'    ? '📋 TABLE'
                 :                      '📜 LOG'}
              </button>
            ))}
          </div>

          {/* TELEMETRY TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'telemetry' && (
            <div className="mc-scroll-body">
              {/* SOI card */}
              <div className="mc-soi-card" style={{ borderColor: sc.currentSOI.color }}>
                <span className="mc-soi-dot" style={{ background: sc.currentSOI.color }} />
                <div className="mc-soi-info">
                  <div className="mc-soi-lbl">GRAVITATIONAL REGION</div>
                  <div className="mc-soi-val">{sc.currentSOI.name}</div>
                  <div className="mc-soi-sub">Simplified Patched-Conic Model</div>
                </div>
              </div>

              {/* Live telemetry */}
              <div className="mc-card">
                <div className="mc-card-title">LIVE SPACECRAFT TELEMETRY</div>
                <div className="mc-row"><span>PHASE</span><span className="mc-val" style={{ color: phaseColor }}>{missionPhase}</span></div>
                <div className="mc-row"><span>HELIOCENTRIC POS (X,Y)</span><span className="mc-val font-mono">{sc.position.x.toFixed(3)}, {sc.position.y.toFixed(3)} AU</span></div>
                <div className="mc-row"><span>DIST FROM SUN</span><span className="mc-val">{sc.distanceFromSunAu.toFixed(3)} AU ({formatKm(sc.distanceFromSunKm)})</span></div>
                <div className="mc-row"><span>DIST FROM ORIGIN</span><span className="mc-val">{sc.distanceFromOriginAu.toFixed(3)} AU</span></div>
                <div className="mc-row"><span>DIST TO DESTINATION</span><span className="mc-val mc-val--amber">{sc.distanceToDestAu.toFixed(3)} AU</span></div>
                <div className="mc-row"><span>TRAJECTORY TRAVELED</span><span className="mc-val">{formatKm(sc.distanceTraveledKm)}</span></div>
                <div className="mc-row"><span>TRAJECTORY REMAINING</span><span className="mc-val">{formatKm(sc.distanceRemainingKm)}</span></div>
              </div>

              {/* Velocity card */}
              <div className="mc-card">
                <div className="mc-card-title">VELOCITY & DYNAMICS</div>
                <div className="mc-row"><span>ORBITAL SPEED</span><span className="mc-val mc-val--cyan">{sc.speedKmS.toFixed(2)} km/s</span></div>
                <div className="mc-row"><span>RADIAL VELOCITY</span><span className="mc-val">{sc.radialVelKmS.toFixed(2)} km/s</span></div>
                <div className="mc-row"><span>TANGENTIAL VELOCITY</span><span className="mc-val">{sc.tangentialVelKmS.toFixed(2)} km/s</span></div>
                <div className="mc-row"><span>HYPERBOLIC EXCESS V∞</span><span className="mc-val">{sc.vInfinityKmS.toFixed(2)} km/s</span></div>
              </div>

              {/* Light-time / comms */}
              <div className="mc-card">
                <div className="mc-card-title">COMMUNICATIONS</div>
                <div className="mc-row"><span>SIGNAL STATUS</span><span className="mc-val mc-val--green">● {sc.commStatus}</span></div>
                <div className="mc-row"><span>ONE-WAY LIGHT TIME</span><span className="mc-val mc-val--highlight">{(sc.lightTimeDelaySec/60).toFixed(2)} min ({sc.lightTimeDelaySec.toFixed(1)} sec)</span></div>
                <div className="mc-note">t = d / c</div>
              </div>

              {/* Expandable formula cards */}
              <div className="mc-card">
                <div className="mc-card-title">SCIENTIFIC FORMULAS [ƒx]</div>
                {[
                  { key:'speed',
                    title:'ORBITAL VELOCITY',
                    formula:'v = √(μ·(2/r − 1/a))',
                    inputs:`r = ${sc.distanceFromSunAu.toFixed(3)} AU, a ≈ 1.26 AU`,
                    result:`${sc.speedKmS.toFixed(2)} km/s` },
                  { key:'light',
                    title:'LIGHT-TIME DELAY',
                    formula:'t = d / c',
                    inputs:`d = ${(sc.distanceFromSunKm/1e6).toFixed(1)}M km`,
                    result:`${(sc.lightTimeDelaySec/60).toFixed(2)} min` }
                ].map(card => (
                  <div key={card.key} className="mc-fx-card">
                    <button className="mc-fx-btn" onClick={() => toggleCard(card.key)}>
                      <span>[ƒx] {card.title}</span><span>{openCards[card.key] ? '▲' : '▼'}</span>
                    </button>
                    {openCards[card.key] && (
                      <div className="mc-fx-body">
                        <div><code>Formula: {card.formula}</code></div>
                        <div>Inputs: {card.inputs}</div>
                        <div className="mc-fx-res">Result: {card.result}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GRAPHS TAB ────────────────────────────────────────────────────── */}
          {activeTab === 'graphs' && (
            <div className="mc-scroll-body">
              <div className="mc-card">
                <div className="mc-card-title">ORBITAL SPEED vs MET (days)</div>
                <div className="mc-graph-wrap" style={{ marginBottom: 12 }}>
                  <svg viewBox="0 0 300 100" className="mc-svg-chart">
                    <line x1="20" y1="90" x2="290" y2="90" stroke="#334466" strokeWidth="1" />
                    <line x1="20" y1="10" x2="20"  y2="90" stroke="#334466" strokeWidth="1" />
                    {/* Axis labels */}
                    <text x="22" y="100" fill="#445566" fontSize="7" fontFamily="monospace">0</text>
                    <text x="275" y="100" fill="#445566" fontSize="7" fontFamily="monospace">{sc.totalDurationDays}d</text>
                    {sampledTableRows.length > 1 && (
                      <>
                        <polyline
                          fill="none" stroke="#00f0ff" strokeWidth="2"
                          points={sampledTableRows.map((pt, i) => {
                            const x = 20 + (i / (sampledTableRows.length - 1)) * 270;
                            const y = 90 - Math.min(75, (pt.speedKmS / 40) * 75);
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                        {/* Current time indicator */}
                        {(() => {
                          const x = 20 + (sc.progressPct / 100) * 270;
                          return <line x1={x} y1="10" x2={x} y2="90" stroke="#ffb703" strokeWidth="1.5" strokeDasharray="3,2" />;
                        })()}
                      </>
                    )}
                  </svg>
                </div>

                <div className="mc-card-title" style={{ marginTop: 8 }}>DISTANCE TO DESTINATION vs MET</div>
                <div className="mc-graph-wrap">
                  <svg viewBox="0 0 300 100" className="mc-svg-chart">
                    <line x1="20" y1="90" x2="290" y2="90" stroke="#334466" strokeWidth="1" />
                    <line x1="20" y1="10" x2="20"  y2="90" stroke="#334466" strokeWidth="1" />
                    {sampledTableRows.length > 1 && (
                      <>
                        <polyline
                          fill="none" stroke="#ffb74d" strokeWidth="2"
                          points={sampledTableRows.map((pt, i) => {
                            const x = 20 + (i / (sampledTableRows.length - 1)) * 270;
                            const maxDist = Math.max(...sampledTableRows.map(r => r.rDestAu), 0.01);
                            const y = 90 - Math.min(75, (pt.rDestAu / maxDist) * 75);
                            return `${x},${y}`;
                          }).join(' ')}
                        />
                        {(() => {
                          const x = 20 + (sc.progressPct / 100) * 270;
                          return <line x1={x} y1="10" x2={x} y2="90" stroke="#ffb703" strokeWidth="1.5" strokeDasharray="3,2" />;
                        })()}
                      </>
                    )}
                  </svg>
                </div>

                <div className="mc-card-title" style={{ marginTop: 8 }}>MISSION PROGRESS (%)</div>
                <div className="mc-graph-wrap">
                  <svg viewBox="0 0 300 60" className="mc-svg-chart">
                    <line x1="20" y1="50" x2="290" y2="50" stroke="#334466" strokeWidth="1" />
                    {sampledTableRows.length > 1 && (
                      <polyline
                        fill="none" stroke="#69f0ae" strokeWidth="2"
                        points={sampledTableRows.map((pt, i) => {
                          const x = 20 + (i / (sampledTableRows.length - 1)) * 270;
                          const y = 50 - (pt.progressPct / 100) * 40;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    )}
                    {(() => {
                      const x = 20 + (sc.progressPct / 100) * 270;
                      return <line x1={x} y1="5" x2={x} y2="50" stroke="#ffb703" strokeWidth="1.5" strokeDasharray="3,2" />;
                    })()}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* DATA TABLE TAB ────────────────────────────────────────────────── */}
          {activeTab === 'table' && (
            <div className="mc-scroll-body">
              <div className="mc-card">
                <div className="mc-card-title">TRAJECTORY SAMPLES — CLICK ROW TO SEEK</div>
                <div className="mc-table-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                  <table className="mc-table">
                    <thead>
                      <tr>
                        <th>MET</th><th>DATE</th><th>X(AU)</th><th>Y(AU)</th>
                        <th>SUN</th><th>DEST</th><th>SPEED</th><th>PHASE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sampledTableRows.map(row => {
                        const isCurrentRow = Math.abs(row.metDays - sc.missionElapsedTimeDays) < (sc.totalDurationDays / 40);
                        return (
                          <tr
                            key={row.index}
                            onClick={() => handleTableRowClick(row)}
                            style={{
                              background: isCurrentRow ? 'rgba(0,240,255,0.22)' : 'transparent',
                              fontWeight: isCurrentRow ? 'bold' : 'normal',
                              cursor: 'pointer'
                            }}
                            title={`Click to seek to T+${row.metDays}d`}
                          >
                            <td className="mc-td-cyan">T+{row.metDays}d</td>
                            <td className="font-mono">{row.dateStr}</td>
                            <td>{row.xAu}</td>
                            <td>{row.yAu}</td>
                            <td>{row.rSunAu}</td>
                            <td>{row.rDestAu}</td>
                            <td className="mc-td-amber">{row.speedKmS} km/s</td>
                            <td>{row.phase}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MISSION LOG TAB ───────────────────────────────────────────────── */}
          {activeTab === 'log' && (
            <div className="mc-scroll-body">
              <div className="mc-card">
                <div className="mc-card-header">
                  <span className="mc-card-title">MISSION CHRONOLOGICAL LOG</span>
                  <select className="mc-log-select" value={logFilter} onChange={e => setLogFilter(e.target.value)}>
                    <option value="ALL">ALL LOGS</option>
                    <option value="MANEUVER">MANEUVERS</option>
                    <option value="FLYBY">FLYBYS</option>
                    <option value="WARNING">WARNINGS</option>
                    <option value="SYSTEM">SYSTEM</option>
                  </select>
                </div>
                <div className="mc-log-list">
                  {filteredLogs.length === 0
                    ? <div className="mc-empty-note">No log entries for filter: {logFilter}</div>
                    : filteredLogs.map(l => (
                        <div key={l.id} className={`mc-log-item mc-log-item--${l.type?.toLowerCase()}`}>
                          <span className="mc-log-time">{l.timestamp}</span>
                          <span className="mc-log-msg">{l.message}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER COLUMN: 2D PLOT + CAMERA CONTROL ─────────────────────────── */}
        <div className="mc-col mc-col-center">
          <div className="mc-card mc-card--flex" style={{ marginBottom: 8 }}>
            <div className="mc-card-header">
              <span className="mc-card-title">🎯 MISSION CAMERA & TARGETING</span>
            </div>
            <div className="mc-cam-grid">
              <button className="mc-cam-btn" onClick={handleMissionOverview}>🌐 MISSION OVERVIEW</button>
              <button className="mc-cam-btn mc-cam-btn--active" onClick={handleFollowSpacecraft}>🛰️ FOLLOW SPACECRAFT</button>
              <button className="mc-cam-btn" onClick={handleFocusOrigin}>
                🪐 ORIGIN ({originObj?.name || 'Earth'})
              </button>
              <button className="mc-cam-btn" onClick={handleFocusDestination}>
                🎯 DEST ({destObj?.name || 'Mars'})
              </button>
            </div>
            <div className="mc-scene-toggles">
              <label className="mc-toggle-lbl">
                <input type="checkbox" checked={showVelocityVectors}
                  onChange={e => handleToggleVelocityVectors(e.target.checked)} />
                <span>SHOW 3D VELOCITY VECTORS</span>
              </label>
              <label className="mc-toggle-lbl">
                <input type="checkbox" checked={showSOI}
                  onChange={e => handleToggleSOI(e.target.checked)} />
                <span>SHOW SOI BOUNDARY</span>
              </label>
            </div>
          </div>

          {/* 2D Canvas plot */}
          <Mission2DPlotCanvas
            originObj={originObj}
            destObj={destObj}
            simTimeDays={simTimeDays}
            transferResult={transferResult}
            showVelocityVectors={showVelocityVectors}
            showSOI={showSOI}
          />

          <div className="mc-provenance-banner">
            <div>MODEL: <strong>PATCHED-CONIC HOHMANN</strong></div>
            <div>DATA: <strong>NASA/JPL</strong></div>
            <div>PRECISION: <strong>EDUCATIONAL SIMULATION</strong></div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: MANEUVERS / SYSTEMS ───────────────────────────────── */}
        <div className="mc-col mc-col-right">
          <div className="mc-panel-tabs">
            {['maneuvers','systems'].map(tab => (
              <button key={tab}
                className={`mc-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'maneuvers' ? '🔥 MANEUVERS' : '🛠️ SYSTEMS'}
              </button>
            ))}
          </div>

          {activeTab === 'maneuvers' && (
            <div className="mc-scroll-body">
              <div className="mc-card">
                <div className="mc-card-title">DELTA-V BUDGET</div>
                <div className="mc-row"><span>REMAINING ΔV</span><span className="mc-val mc-val--green">{sc.getRemainingDeltaVBudget().toFixed(2)} km/s</span></div>
                <div className="mc-row"><span>USED ΔV</span><span className="mc-val mc-val--amber">{sc.usedDeltaVKmS.toFixed(2)} km/s</span></div>
                <div className="mc-row"><span>PROPELLANT</span><span className="mc-val">{sc.propellantMassKg.toFixed(1)} kg</span></div>
                <div className="mc-row"><span>ENGINE</span><span className="mc-val font-mono">● {sc.engineStatus}</span></div>
                <button className="mc-btn mc-btn--cyan mc-btn--full" style={{ marginTop: 8 }}
                  onClick={() => setShowManeuverModal(true)}>
                  ➕ SCHEDULE MANEUVER
                </button>
              </div>
              {sc.maneuvers.length > 0 && (
                <div className="mc-card">
                  <div className="mc-card-title">SCHEDULED MANEUVERS</div>
                  {sc.maneuvers.map(m => (
                    <div key={m.id} className="mc-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span style={{ color: '#ffb703', fontFamily: 'monospace', fontSize: '0.75rem' }}>T+{m.metDays}d — {m.direction} Δv={m.dvMagnitudeKmS.toFixed(2)} km/s</span>
                      <span style={{ color: '#aaa', fontSize: '0.7rem' }}>{m.notes}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'systems' && (
            <div className="mc-scroll-body">
              <div className="mc-card">
                <div className="mc-card-title">SPACECRAFT SUBSYSTEMS</div>
                {Object.entries(sc.subsystems).map(([sub, status]) => (
                  <div key={sub} className="mc-row">
                    <span className="tt-u">{sub.toUpperCase()}</span>
                    <span className={`mc-val mc-val--${status.toLowerCase()}`}>● {status}</span>
                  </div>
                ))}
              </div>
              <div className="mc-card">
                <div className="mc-card-title">MASS & PROPULSION</div>
                <div className="mc-row"><span>TOTAL MASS</span><span className="mc-val">{sc.massKg.toFixed(0)} kg</span></div>
                <div className="mc-row"><span>DRY MASS</span><span className="mc-val">{sc.dryMassKg.toFixed(0)} kg</span></div>
                <div className="mc-row"><span>PROPELLANT</span><span className="mc-val mc-val--green">{sc.propellantMassKg.toFixed(1)} kg</span></div>
                <div className="mc-row"><span>Isp</span><span className="mc-val">{sc.isp} s</span></div>
                <div className="mc-row"><span>THRUST</span><span className="mc-val">{sc.thrustN} N</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {/* Maneuver Scheduler Modal */}
      {showManeuverModal && (
        <div className="mp-compare-overlay" onClick={() => setShowManeuverModal(false)}>
          <div className="mp-compare-box" onClick={e => e.stopPropagation()}>
            <div className="mp-compare-header">
              <span>🔥 SCHEDULE MANEUVER</span>
              <button className="mp-close-btn" onClick={() => setShowManeuverModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateManeuver} className="mc-form">
              <div className="mc-form-row">
                <label>MET EXECUTION DAY (T+d):</label>
                <input type="number" value={mDateOffsetDays} onChange={e => setMDateOffsetDays(e.target.value)} required />
              </div>
              <div className="mc-form-row">
                <label>Δv MAGNITUDE (km/s):</label>
                <input type="number" step="0.01" value={mDvVal} onChange={e => setMDvVal(e.target.value)} required />
              </div>
              <div className="mc-form-row">
                <label>BURN DIRECTION:</label>
                <select value={mDirection} onChange={e => setMDirection(e.target.value)}>
                  <option value="PROGRADE">PROGRADE (+V)</option>
                  <option value="RETROGRADE">RETROGRADE (-V)</option>
                  <option value="NORMAL">NORMAL (+N)</option>
                  <option value="ANTI-NORMAL">ANTI-NORMAL (-N)</option>
                  <option value="RADIAL_OUT">RADIAL OUT (+R)</option>
                  <option value="RADIAL_IN">RADIAL IN (-R)</option>
                </select>
              </div>
              <div className="mc-form-row">
                <label>NOTES:</label>
                <input type="text" value={mNotes} onChange={e => setMNotes(e.target.value)} />
              </div>
              <button type="submit" className="mc-btn mc-btn--cyan mc-btn--full" style={{ marginTop: '1rem' }}>
                EXECUTE & PLOT BURN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Checkpoints Modal */}
      {showCheckpointModal && (
        <div className="mp-compare-overlay" onClick={() => setShowCheckpointModal(false)}>
          <div className="mp-compare-box" onClick={e => e.stopPropagation()}>
            <div className="mp-compare-header">
              <span>📌 SIMULATION CHECKPOINTS</span>
              <button className="mp-close-btn" onClick={() => setShowCheckpointModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <button className="mc-btn mc-btn--amber mc-btn--full" onClick={handleSaveCheckpoint}>
                ➕ SAVE NEW CHECKPOINT (T+{Math.round(sc.missionElapsedTimeDays)}d)
              </button>
              <div className="mc-cp-list" style={{ marginTop: '1rem' }}>
                {sc.checkpoints.length === 0
                  ? <div className="mc-empty-note">No checkpoints saved.</div>
                  : sc.checkpoints.map(cp => (
                      <div key={cp.id} className="mc-cp-item">
                        <div>
                          <strong>{cp.label}</strong> (T+{cp.metDays}d) — {cp.savedAt}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                          <button className="mc-btn mc-btn--green" onClick={() => handleRestoreCheckpoint(cp)}>
                            RESTORE & SEEK
                          </button>
                        </div>
                      </div>
                    ))
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Abort Confirmation Modal */}
      {showAbortConfirm && (
        <div className="mp-compare-overlay" onClick={() => setShowAbortConfirm(false)}>
          <div className="mp-compare-box" onClick={e => e.stopPropagation()}>
            <div className="mp-compare-header">
              <span style={{ color: '#ff4444' }}>⚠️ CONFIRM MISSION ABORT</span>
              <button className="mp-close-btn" onClick={() => setShowAbortConfirm(false)}>✕</button>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p>Are you sure you want to abort the current mission?</p>
              <p style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '0.5rem' }}>
                Trajectory will be preserved. Clock will pause. Mission data saved.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button className="mc-btn" onClick={() => setShowAbortConfirm(false)}>CANCEL</button>
                <button className="mc-btn mc-btn--danger" onClick={handleAbort}>CONFIRM ABORT</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
