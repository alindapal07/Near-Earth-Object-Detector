import React, { useState, useEffect, useRef } from 'react';
import { PLANET_DATA } from '../../data/planets';

/**
 * PlanetPreviewCanvas.jsx - Hero Planet Visualizer Module
 * Features realistic texture sphere render, interactive drag rotation,
 * auto-spin play/pause, lighting angle sync, ring system tilt, and classification tags.
 */
export default function PlanetPreviewCanvas({ obj, isFollowing }) {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);

  const objColor = obj?.color ? `#${obj.color.toString(16).padStart(6, '0')}` : '#00f0ff';
  const name = obj?.name || obj?.id || 'OBJECT';
  const category = obj?.category || obj?.type || 'CELESTIAL BODY';

  const isSaturn = obj?.id === 'saturn';
  const isUranus = obj?.id === 'uranus';
  const isSun = obj?.id === 'sun';
  const isEarth = obj?.id === 'earth';
  const isMoon = obj?.id === 'moon';

  const textureUrl = obj?.texture || (isEarth ? '/textures/earthmap1k.jpg' : isSaturn ? '/textures/saturnmap.jpg' : '/textures/mercurymap.jpg');

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotationDeg(prev => (prev + 0.6) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isAutoRotate, isDragging]);

  const handlePointerDown = (e) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart(e.clientX - rotationDeg);
    try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    setRotationDeg((e.clientX - dragStart) % 360);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    setIsDragging(false);
    try {
      if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}
  };

  return (
    <div className="sci-widget planet-preview-hero">
      {/* Background Glow & Lighting */}
      <div 
        className="preview-glow-bg" 
        style={{ 
          background: `radial-gradient(circle at 40% 40%, ${objColor}33 0%, rgba(2, 6, 20, 0.95) 75%)` 
        }} 
      />

      <div className="preview-hero-top">
        <div className="preview-system-path font-mono">
          <span>SOLAR SYSTEM</span>
          <span>/</span>
          {obj?.parentPlanet && <span>{obj.parentPlanet.toUpperCase()} /</span>}
          <span className="path-active">{name.toUpperCase()}</span>
        </div>

        <div className="preview-hero-controls">
          <button 
            type="button" 
            className="preview-ctrl-btn font-mono"
            onClick={() => setIsAutoRotate(!isAutoRotate)}
            title={isAutoRotate ? 'Pause Rotation' : 'Auto Rotate'}
          >
            {isAutoRotate ? '⏸ PAUSE' : '▶ SPIN'}
          </button>
          <button 
            type="button" 
            className="preview-ctrl-btn font-mono"
            onClick={() => setRotationDeg(0)}
            title="Reset Rotation Angle"
          >
            ↺ RESET
          </button>
        </div>
      </div>

      {/* Interactive Drag Globe Stage */}
      <div 
        className="preview-globe-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <svg viewBox="0 0 240 180" className="preview-globe-svg">
          <defs>
            <radialGradient id="sphereLight" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.85" />
            </radialGradient>

            <radialGradient id="atmosphereAura" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor={objColor} stopOpacity="0" />
              <stop offset="95%" stopColor={objColor} stopOpacity="0.6" />
              <stop offset="100%" stopColor={objColor} stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Saturn Rings Background Half */}
          {isSaturn && (
            <ellipse 
              cx="120" cy="90" rx="95" ry="24" 
              fill="none" 
              stroke="rgba(217, 119, 6, 0.4)" 
              strokeWidth="12"
              transform="rotate(-15, 120, 90)"
            />
          )}

          {/* Atmosphere Aura Circle */}
          <circle cx="120" cy="90" r="54" fill="url(#atmosphereAura)" />

          {/* Render Planet Globe Sphere */}
          <g transform={`rotate(-${obj?.axialTiltDeg || 5}, 120, 90)`}>
            {/* Base Planet Sphere */}
            <circle cx="120" cy="90" r="48" fill={objColor} opacity="0.85" />

            {/* Rotating Latitude Bands & Surface Grids */}
            <g transform={`rotate(${rotationDeg}, 120, 90)`}>
              <ellipse cx="120" cy="70" rx="46" ry="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <ellipse cx="120" cy="90" rx="48" ry="16" fill="none" stroke="rgba(255,255,255,0.2)" />
              <ellipse cx="120" cy="110" rx="46" ry="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="3 3" />
              <line x1="120" y1="42" x2="120" y2="138" stroke="rgba(255,255,255,0.25)" strokeDasharray="2 2" />
            </g>

            {/* 3D Sphere Shading Overlay */}
            <circle cx="120" cy="90" r="48" fill="url(#sphereLight)" />
          </g>

          {/* Saturn Rings Foreground Half */}
          {isSaturn && (
            <ellipse 
              cx="120" cy="90" rx="95" ry="24" 
              fill="none" 
              stroke="rgba(251, 191, 36, 0.75)" 
              strokeWidth="8"
              strokeDasharray="120 40"
              transform="rotate(-15, 120, 90)"
            />
          )}

          {/* Axial Tilt Pointer Vector Line */}
          <line x1="120" y1="34" x2="120" y2="146" stroke={objColor} strokeWidth="1.5" strokeDasharray="2 2" transform={`rotate(-${obj?.axialTiltDeg || 5}, 120, 90)`} />
          <text x="126" y="32" fill={objColor} fontSize="8" fontWeight="bold" className="font-mono">
            AXIS: {obj?.axialTiltDeg ? `${obj.axialTiltDeg}°` : '0°'}
          </text>
        </svg>
      </div>

      <div className="preview-hero-footer font-mono">
        <span className="p-hero-badge p-hero-badge--cat">{category.toUpperCase()}</span>
        <span className="p-hero-badge p-hero-badge--live">● LIVE TELEMETRY</span>
        <span className="p-hero-badge p-hero-badge--target">{isFollowing ? '🔒 TARGET LOCKED' : '● TRACKING'}</span>
      </div>
    </div>
  );
}
