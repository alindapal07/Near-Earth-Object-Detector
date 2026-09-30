/**
 * Mission2DPlotCanvas.jsx — 2D Heliocentric Mission Trajectory Plot Visualizer (Part 32)
 *
 * Renders scientific 2D top-down trajectory plot:
 * • Central Sun, Origin Orbit (Earth), Destination Orbit (Mars)
 * • Transfer Trajectory Arc (Hohmann / Patched-Conic)
 * • Live Spacecraft Marker & Heading Vector
 * • Origin & Destination Body Positions
 * • Real-time progress synchronization with SimulationClock & 3D Three.js view
 */

import React, { useRef, useEffect } from 'react';
import { activeSpacecraftModel } from '../../engine/SpacecraftModel';

export default function Mission2DPlotCanvas({
  originObj,
  destObj,
  simTimeDays = 0,
  transferResult,
  showVelocityVectors = true,
  showSOI = true
}) {
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
    const maxRadius = Math.min(centerX, centerY) * 0.82;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#030814');
    bgGrad.addColorStop(1, '#071224');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius * 0.3, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, maxRadius * 0.6, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.stroke();

    const r1Au = transferResult?.originRadiusAu || 1.0;
    const r2Au = transferResult?.destinationRadiusAu || 1.524;
    const aT = transferResult?.transferSemiMajorAxisAu || ((r1Au + r2Au) / 2);
    const eT = transferResult?.eccentricity || (Math.abs(r2Au - r1Au) / (r1Au + r2Au));

    const auScale = maxRadius / Math.max(r2Au, aT * (1 + eT), 1.6);
    const r1Px = r1Au * auScale;
    const r2Px = r2Au * auScale;

    // 1. Draw SUN
    ctx.fillStyle = '#ffb703';
    ctx.shadowColor = '#ffb703';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 2. Draw Origin Orbit (Earth)
    ctx.strokeStyle = 'rgba(100, 181, 246, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, r1Px, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw Destination Orbit (Mars)
    ctx.strokeStyle = 'rgba(255, 138, 101, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, r2Px, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Draw Hohmann Transfer Ellipse Arc
    // Departure at theta = 0, Arrival at theta = PI
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const frac = i / 100;
      const theta = frac * Math.PI;
      const rEllAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(theta));
      const px = centerX + Math.cos(theta) * rEllAu * auScale;
      const py = centerY + Math.sin(theta) * rEllAu * auScale;

      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 5. Origin Planet Marker (Earth at theta = 0)
    const earthX = centerX + r1Px;
    const earthY = centerY;
    ctx.fillStyle = '#64b5f6';
    ctx.beginPath();
    ctx.arc(earthX, earthY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#90caf9';
    ctx.font = '10px monospace';
    ctx.fillText((originObj?.name || 'EARTH').toUpperCase(), earthX + 8, earthY + 3);

    // 6. Destination Planet Marker (Mars at theta = PI)
    const marsX = centerX - r2Px;
    const marsY = centerY;
    ctx.fillStyle = '#ff8a65';
    ctx.beginPath();
    ctx.arc(marsX, marsY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffab91';
    ctx.fillText((destObj?.name || 'MARS').toUpperCase(), marsX - 45, marsY + 3);

    // 7. Active Spacecraft Live Marker
    const sc = activeSpacecraftModel;
    const scFrac = Math.max(0, Math.min(1, sc.progressPct / 100));
    const scTheta = scFrac * Math.PI;
    const scRAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(scTheta));
    const scX = centerX + Math.cos(scTheta) * scRAu * auScale;
    const scY = centerY + Math.sin(scTheta) * scRAu * auScale;

    // Optional SOI Boundary Ring around Destination
    if (showSOI && scFrac > 0.85) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.arc(marsX, marsY, 22, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#00f0ff';
      ctx.font = '8px monospace';
      ctx.fillText('SOI BOUNDARY', marsX - 28, marsY - 26);
    }

    // Traveled Trajectory Sub-Arc (Cyan Glow)
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const stepsSc = Math.floor(scFrac * 100);
    for (let i = 0; i <= stepsSc; i++) {
      const frac = i / 100;
      const theta = frac * Math.PI;
      const rEllAu = (aT * (1 - eT * eT)) / (1 + eT * Math.cos(theta));
      const px = centerX + Math.cos(theta) * rEllAu * auScale;
      const py = centerY + Math.sin(theta) * rEllAu * auScale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Spacecraft Dot & Pulse Ring
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(scX, scY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(scX, scY, 8 + Math.sin(simTimeDays * 8) * 2, 0, Math.PI * 2);
    ctx.stroke();

    // 8. Velocity Vector Heading Arrow
    if (showVelocityVectors) {
      const vVx = sc.velocity.vx;
      const vVy = sc.velocity.vy;
      const vLen = Math.sqrt(vVx * vVx + vVy * vVy) || 1;
      const arrowLen = 22;
      const dirX = -vVx / vLen;
      const dirY = vVy / vLen;

      ctx.strokeStyle = '#69f0ae';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scX, scY);
      ctx.lineTo(scX + dirX * arrowLen, scY + dirY * arrowLen);
      ctx.stroke();

      ctx.fillStyle = '#69f0ae';
      ctx.font = '9px monospace';
      ctx.fillText(`v = ${sc.speedKmS.toFixed(1)} km/s`, scX + dirX * arrowLen + 4, scY + dirY * arrowLen + 3);
    }

  }, [originObj, destObj, simTimeDays, transferResult, showVelocityVectors, showSOI]);

  const sc = activeSpacecraftModel;

  return (
    <div className="mc-2d-plot-wrapper" style={{ width: '100%', height: '260px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <div style={{ position: 'absolute', top: '8px', left: '12px', background: 'rgba(5, 12, 24, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.4)', fontSize: '0.72rem', fontFamily: 'monospace', color: '#00f0ff' }}>
        2D HELIOCENTRIC TRAJECTORY PLOT
      </div>

      <div style={{ position: 'absolute', bottom: '8px', right: '12px', background: 'rgba(5, 12, 24, 0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#ffb74d' }}>
        MET T+{Math.round(sc.missionElapsedTimeDays)}d • Progress: {sc.progressPct.toFixed(1)}%
      </div>
    </div>
  );
}
