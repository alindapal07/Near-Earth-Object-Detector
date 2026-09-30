/**
 * AlignmentCanvas.jsx — Top-down 2D Heliocentric Alignment Analyzer Canvas (Part 31)
 *
 * Renders top-down 2D Solar System planetary positions, orbits, connecting angle vectors,
 * and highlighted angular sector with alignment score calculation.
 */

import React, { useRef, useEffect } from 'react';
import { celestialEventEngine } from '../../engine/CelestialEventEngine';

export default function AlignmentCanvas({ planetIds = ['mercury', 'venus', 'earth', 'mars', 'jupiter'], simTimeDays = 0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.85;

    // Background
    ctx.fillStyle = '#040814';
    ctx.fillRect(0, 0, width, height);

    // Compute Alignment State
    const alignment = celestialEventEngine.analyzeAlignment(planetIds, simTimeDays);

    // Draw SUN
    ctx.fillStyle = '#ffaa00';
    ctx.shadowColor = '#ffaa00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Orbit radiuses mapping (normalized visual scaling)
    const orbitScaleMap = {
      mercury: maxRadius * 0.2,
      venus: maxRadius * 0.35,
      earth: maxRadius * 0.5,
      mars: maxRadius * 0.65,
      jupiter: maxRadius * 0.82,
      saturn: maxRadius * 0.95
    };

    const colorMap = {
      mercury: '#b0bec5',
      venus: '#ffe082',
      earth: '#64b5f6',
      mars: '#ff8a65',
      jupiter: '#ffd54f',
      saturn: '#ce93d8'
    };

    // Draw Orbits
    Object.entries(orbitScaleMap).forEach(([id, r]) => {
      ctx.strokeStyle = planetIds.includes(id) ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = planetIds.includes(id) ? 1.5 : 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Longitude Vectors & Planets
    alignment.longitudes.forEach(({ id, name, lonDeg }) => {
      const rad = (lonDeg * Math.PI) / 180;
      const r = orbitScaleMap[id] || maxRadius * 0.5;
      const px = centerX + Math.cos(rad) * r;
      const py = centerY + Math.sin(rad) * r;

      // Connecting Vector Line from Sun
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Planet Marker
      const pColor = colorMap[id] || '#ffffff';
      ctx.fillStyle = pColor;
      ctx.shadowColor = pColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px monospace';
      ctx.textAlign = px > centerX ? 'left' : 'right';
      ctx.fillText(`${name.toUpperCase()} (${lonDeg.toFixed(0)}°)`, px > centerX ? px + 8 : px - 8, py + 3);
    });

  }, [planetIds, simTimeDays]);

  const alignment = celestialEventEngine.analyzeAlignment(planetIds, simTimeDays);

  return (
    <div className="alignment-canvas-wrapper" style={{ width: '100%', height: '220px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <div style={{ position: 'absolute', top: '8px', left: '12px', background: 'rgba(5, 12, 24, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.4)', fontSize: '0.72rem', fontFamily: 'monospace', color: '#00f0ff' }}>
        2D HELIOCENTRIC ALIGNMENT ANALYZER
      </div>

      <div style={{ position: 'absolute', bottom: '8px', right: '12px', background: 'rgba(5, 12, 24, 0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#69f0ae' }}>
        Sector: {alignment.angularSpreadDeg}° • Score: {alignment.alignmentScore}%
      </div>
    </div>
  );
}
