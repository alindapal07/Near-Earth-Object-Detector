/**
 * NEOExplorerModal.jsx — NASA/CNEOS NEO Intelligence System Root Modal (Part 35)
 *
 * Complete end-to-end NEO detection and planetary-defense analysis system.
 *
 * Architecture:
 *  - Left panel: NEOSearchPanel (search/filter/results)
 *  - Top: NEODashboard (live stats)
 *  - Right panel: NEOObjectPanel (full intelligence)
 *  - 3D: NEOOrbitRenderer via solarSystemRef (existing scene, no new RAF)
 *
 * Data flow:
 *  NASA/JPL APIs → Backend proxy (port 3001) → neoApi.js → Components
 *
 * Constraints:
 *  - Uses existing SimulationClock (no new time system)
 *  - Uses existing Three.js scene (no new renderer)
 *  - No fabricated data
 *  - All risk data from official CNEOS/Sentry
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import NEODashboard from './neo/NEODashboard.jsx';
import NEOSearchPanel from './neo/NEOSearchPanel.jsx';
import NEOObjectPanel from './neo/NEOObjectPanel.jsx';
import NEOComparisonPanel from './neo/NEOComparisonPanel.jsx';
import { fetchNeoFeed, fetchEarthApproaches, fetchRiskSummary } from '../api/neoApi.js';

// ─── Keyframes injected once ──────────────────────────────────────────────────

const STYLE_ID = 'neo-explorer-styles';
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes neo-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes neo-pulse-ring {
      0% { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.4); opacity: 0; }
    }
    @keyframes neo-pulse-risk {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .neo-card-hover:hover {
      background: rgba(0,240,255,0.07) !important;
      border-color: rgba(0,240,255,0.3) !important;
    }
    .neo-tab-btn:hover { color: #00f0ff !important; }
    .neo-result-item:hover { background: rgba(0,240,255,0.05) !important; }
    .neo-btn:hover { background: rgba(0,240,255,0.15) !important; }
    .neo-explorer-scroll::-webkit-scrollbar { width: 4px; }
    .neo-explorer-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
    .neo-explorer-scroll::-webkit-scrollbar-thumb { background: rgba(0,240,255,0.25); border-radius: 2px; }
  `;
  document.head.appendChild(style);
}

// ─── View modes ───────────────────────────────────────────────────────────────

const VIEW_MODES = ['EXPLORER', 'COMPARISON', 'EARTH_APPROACH'];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NEOExplorerModal({
  isOpen,
  onClose,
  simTimeDays,
  seekToDays,
  seekToDate,
  isPaused,
  solarSystemRef,
  onSelectObject,
  onModeChange,
  onOpenPlanner
}) {
  // Inject CSS once
  useEffect(() => { injectStyles(); }, []);

  // Global dashboard data
  const [feedData, setFeedData] = useState(null);
  const [earthApproaches, setEarthApproaches] = useState(null);
  const [riskSummary, setRiskSummary] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState(null);
  const [dataStatus, setDataStatus] = useState('LOADING');

  // Selected NEO & view
  const [selectedNEOItem, setSelectedNEOItem] = useState(null);
  const [compareNEO, setCompareNEO] = useState(null);
  const [viewMode, setViewMode] = useState('EXPLORER');
  const [showDashboard, setShowDashboard] = useState(true);

  // Load dashboard data when opened
  useEffect(() => {
    if (!isOpen) return;

    setDashLoading(true);
    setDashError(null);

    Promise.allSettled([
      fetchNeoFeed(),
      fetchEarthApproaches({ distMax: '0.1', limit: 100 }),
      fetchRiskSummary(50)
    ]).then(([feedRes, approachRes, riskRes]) => {
      let hasData = false;

      if (feedRes.status === 'fulfilled') {
        setFeedData(feedRes.value);
        hasData = true;
      }
      if (approachRes.status === 'fulfilled') {
        setEarthApproaches(approachRes.value);
        hasData = true;
      }
      if (riskRes.status === 'fulfilled') {
        setRiskSummary(riskRes.value);
        hasData = true;
      }

      const anyFromCache = [feedRes, approachRes, riskRes]
        .filter(r => r.status === 'fulfilled')
        .some(r => r.value?.fromCache);

      setDataStatus(hasData ? (anyFromCache ? 'CACHED' : 'LIVE') : 'UNAVAILABLE');

      if (!hasData) {
        setDashError('Unable to load data from NASA/JPL APIs. Check server connection.');
      }
      setDashLoading(false);
    });
  }, [isOpen]);

  // Clear 3D NEO orbit when modal closes
  useEffect(() => {
    if (!isOpen && solarSystemRef?.current) {
      solarSystemRef.current.clearNEO();
    }
  }, [isOpen, solarSystemRef]);

  const handleSelectNEO = useCallback((item) => {
    setSelectedNEOItem(item);
    setViewMode('EXPLORER');
  }, []);

  const handleCompareNEO = useCallback((item) => {
    setCompareNEO(item);
    setViewMode('COMPARISON');
  }, []);

  const handleSendToMission = useCallback(() => {
    if (selectedNEOItem && onOpenPlanner) {
      onOpenPlanner(selectedNEOItem);
    }
  }, [selectedNEOItem, onOpenPlanner]);

  if (!isOpen) return null;

  // ─── Data status badge ────────────────────────────────────────────────────

  const statusColor = dataStatus === 'LIVE' ? '#00ff88' : dataStatus === 'CACHED' ? '#ffb703' : '#ff3d00';
  const statusLabel = dataStatus === 'LIVE' ? '● LIVE' : dataStatus === 'CACHED' ? '◎ CACHED' : '✕ UNAVAILABLE';

  // ─── Layout ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif"
    }}>
      {/* Modal container */}
      <div style={{
        margin: '12px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(2,4,14,0.97)',
        border: '1px solid rgba(0,240,255,0.2)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(0,240,255,0.08), 0 40px 100px rgba(0,0,0,0.8)'
      }}>
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(0,240,255,0.04)',
          borderBottom: '1px solid rgba(0,240,255,0.15)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>☄️</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
                  NEO INTELLIGENCE SYSTEM
                </div>
                <div style={{ fontSize: 10, color: '#8892a4', marginTop: 1 }}>
                  NASA NeoWs • JPL SBDB • JPL CNEOS CAD • NASA/JPL CNEOS Sentry • JPL Horizons
                </div>
              </div>
            </div>
            {/* Data status */}
            <div style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 10,
              color: statusColor, background: `${statusColor}15`,
              border: `1px solid ${statusColor}40`, fontWeight: 700
            }}>
              {statusLabel}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* View mode tabs */}
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="neo-tab-btn"
                style={{
                  padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                  color: viewMode === mode ? '#00f0ff' : '#556',
                  borderBottom: viewMode === mode ? '1px solid #00f0ff' : '1px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                {mode === 'EXPLORER' ? '🔭 EXPLORER' : mode === 'COMPARISON' ? '⚖ COMPARE' : '🌍 ENCOUNTER'}
              </button>
            ))}
            <button
              onClick={() => setShowDashboard(v => !v)}
              style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#8892a4', fontSize: 10, cursor: 'pointer' }}
            >
              {showDashboard ? '▲ STATS' : '▼ STATS'}
            </button>
            {selectedNEOItem && (
              <button
                onClick={handleSendToMission}
                style={{ padding: '4px 10px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 4, color: '#00f0ff', fontSize: 10, cursor: 'pointer', fontWeight: 700 }}
              >
                🚀 MISSION DESIGN
              </button>
            )}
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#e0e8ff', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── DASHBOARD STRIP ────────────────────────────────────────────── */}
        {showDashboard && (
          <div style={{ flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <NEODashboard
              feedData={feedData}
              earthApproaches={earthApproaches}
              riskSummary={riskSummary}
              loading={dashLoading}
            />
            {dashError && (
              <div style={{ padding: '6px 16px', fontSize: 11, color: '#ff6b6b', background: 'rgba(255,0,0,0.06)' }}>
                ⚠ {dashError}
              </div>
            )}
          </div>
        )}

        {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: Search panel */}
          <div style={{
            width: 340, flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <NEOSearchPanel
              onSelectNEO={handleSelectNEO}
              selectedNEOId={selectedNEOItem?.id || selectedNEOItem?.designation}
            />
          </div>

          {/* Right: Main content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {viewMode === 'EXPLORER' && (
              <NEOObjectPanel
                neoItem={selectedNEOItem}
                simTimeDays={simTimeDays}
                seekToDays={seekToDays}
                solarSystemRef={solarSystemRef}
              />
            )}
            {viewMode === 'COMPARISON' && (
              <NEOComparisonPanel
                neoA={selectedNEOItem}
                neoB={compareNEO}
              />
            )}
            {viewMode === 'EARTH_APPROACH' && selectedNEOItem && (
              <div style={{ padding: 20, color: '#8892a4', textAlign: 'center', marginTop: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🌍</div>
                <div style={{ color: '#00f0ff', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>EARTH ENCOUNTER VIEW</div>
                <div style={{ fontSize: 12 }}>
                  Select a close approach from the APPROACHES tab to visualize the Earth encounter in 3D.
                </div>
                <button
                  onClick={() => setViewMode('EXPLORER')}
                  style={{ marginTop: 16, padding: '8px 16px', background: 'rgba(0,240,255,0.1)', border: '1px solid #00f0ff', color: '#00f0ff', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                >
                  → OPEN OBJECT PANEL
                </button>
              </div>
            )}
            {!selectedNEOItem && viewMode !== 'EARTH_APPROACH' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8892a4', gap: 10 }}>
                <div style={{ fontSize: 48 }}>☄️</div>
                <div style={{ fontSize: 15, color: '#e0e8ff' }}>NASA/CNEOS Near-Earth Object System</div>
                <div style={{ fontSize: 12, maxWidth: 400, textAlign: 'center', lineHeight: 1.6 }}>
                  Search for asteroids and comets in the left panel.
                  Select an object to view its scientific profile, orbital data, close approaches, and official NASA/JPL risk assessment.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {['99942 Apophis', '101955 Bennu', '2024 YR4', '1998 KY26'].map(name => (
                    <button
                      key={name}
                      onClick={() => setSelectedNEOItem({ name, designation: name })}
                      style={{ padding: '5px 12px', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.2)', borderRadius: 4, color: '#00f0ff', cursor: 'pointer', fontSize: 11 }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#334', marginTop: 8 }}>
                  Data: NASA NeoWs • JPL SBDB • JPL CNEOS Sentry • JPL Horizons
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div style={{
          padding: '6px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 10, color: '#334', flexShrink: 0
        }}>
          <div>
            ⚠ Planetory orbital propagation is a TWO-BODY APPROXIMATION and is NOT equivalent to NASA/JPL high-precision orbit determination.
            Official impact risk data is sourced exclusively from NASA/JPL CNEOS Sentry.
          </div>
          <div style={{ whiteSpace: 'nowrap', marginLeft: 16 }}>
            SIM: J2000+{simTimeDays?.toFixed(1)}d
          </div>
        </div>
      </div>
    </div>
  );
}
