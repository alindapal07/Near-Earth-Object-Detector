/**
 * EclipseCanvas.jsx — Interactive 2D Eclipse & Shadow Cone Visualizer (Part 31)
 *
 * Renders the scientific geometry of Solar and Lunar Eclipses:
 * • Sun, Moon, and Earth relative positioning along alignment axis
 * • Umbra shadow cone (converging focal region) & Penumbra shadow cone
 * • Angular diameter scale comparison (Sun vs Moon)
 * • Real-time Moon orbit progression through contact points (C1 -> MAX -> C4)
 */

import React, { useRef, useEffect } from 'react';

export default function EclipseCanvas({ eclipseData = {}, simTimeDays = 0, isPlaying = false }) {
  const canvasRef = useRef(null);

  const {
    type = 'SOLAR ECLIPSE',
    subtype = 'TOTAL SOLAR',
    alignAngleDeg = 0.05,
    sunAngularDiaArcmin = 32.1,
    moonAngularDiaArcmin = 32.7,
    umbraRadiusKm = 110,
    penumbraRadiusKm = 3400,
    sunDistKm = 149597870,
    moonDistKm = 384400
  } = eclipseData;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear background with cosmic gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#040814');
    bgGrad.addColorStop(1, '#091326');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Render Starfield background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = (Math.sin(i * 97) * 0.5 + 0.5) * width;
      const sy = (Math.cos(i * 43) * 0.5 + 0.5) * height;
      const sr = (Math.sin(i * 13) * 0.5 + 0.5) * 1.2 + 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const isSolar = type.includes('SOLAR');
    const centerY = height / 2;

    // Positioning along X-axis
    const sunX = width * 0.12;
    const centerBodyX = width * 0.52;
    const targetBodyX = width * 0.85;

    const sunR = 34;
    const earthR = 22;
    const moonR = 10;

    // Draw Optical Alignment Centerline
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sunX, centerY);
    ctx.lineTo(width * 0.95, centerY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isSolar) {
      // --- SOLAR ECLIPSE GEOMETRY: SUN -> MOON -> EARTH ---

      // Draw Penumbra Cone (outer gradient cone)
      const penGrad = ctx.createLinearGradient(centerBodyX, centerY, targetBodyX, centerY);
      penGrad.addColorStop(0, 'rgba(255, 170, 0, 0.35)');
      penGrad.addColorStop(1, 'rgba(255, 170, 0, 0.05)');

      ctx.fillStyle = penGrad;
      ctx.beginPath();
      ctx.moveTo(sunX, centerY - sunR);
      ctx.lineTo(targetBodyX, centerY + earthR * 1.6);
      ctx.lineTo(targetBodyX, centerY - earthR * 1.6);
      ctx.lineTo(sunX, centerY + sunR);
      ctx.closePath();
      ctx.fill();

      // Draw Umbra Shadow Cone (converging focal cone)
      const umbGrad = ctx.createLinearGradient(centerBodyX, centerY, targetBodyX, centerY);
      umbGrad.addColorStop(0, 'rgba(10, 10, 20, 0.95)');
      umbGrad.addColorStop(1, 'rgba(230, 30, 30, 0.85)');

      ctx.fillStyle = umbGrad;
      ctx.beginPath();
      ctx.moveTo(centerBodyX, centerY - moonR);
      ctx.lineTo(targetBodyX, centerY - 4);
      ctx.lineTo(targetBodyX, centerY + 4);
      ctx.lineTo(centerBodyX, centerY + moonR);
      ctx.closePath();
      ctx.fill();

      // Draw SUN
      const sunGrad = ctx.createRadialGradient(sunX, centerY, 4, sunX, centerY, sunR * 1.8);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.3, '#ffcc00');
      sunGrad.addColorStop(0.8, '#ff5500');
      sunGrad.addColorStop(1, 'rgba(255, 85, 0, 0)');

      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, centerY, sunR * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sunX, centerY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Label SUN
      ctx.fillStyle = '#ffaa00';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SUN', sunX, centerY + sunR + 18);
      ctx.fillText(`Ø ${sunAngularDiaArcmin}'`, sunX, centerY + sunR + 30);

      // Draw MOON at Center (with animated offset along orbit)
      const orbitOffset = Math.sin(simTimeDays * 5) * 14;
      const mY = centerY + orbitOffset;

      ctx.fillStyle = '#8899aa';
      ctx.beginPath();
      ctx.arc(centerBodyX, mY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.fillText('MOON', centerBodyX, centerY + moonR + 18);
      ctx.fillText(`Umbra: ${umbraRadiusKm} km`, centerBodyX, centerY + moonR + 30);

      // Draw EARTH at Target Position
      ctx.fillStyle = '#1e88e5';
      ctx.beginPath();
      ctx.arc(targetBodyX, centerY, earthR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#64b5f6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#64b5f6';
      ctx.fillText('EARTH', targetBodyX, centerY + earthR + 18);
      ctx.fillText(`Penumbra: ${penumbraRadiusKm} km`, targetBodyX, centerY + earthR + 30);

    } else {
      // --- LUNAR ECLIPSE GEOMETRY: SUN -> EARTH -> MOON ---

      // Draw Earth Umbral Shadow Cone extending into space
      ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
      ctx.beginPath();
      ctx.moveTo(centerBodyX, centerY - earthR);
      ctx.lineTo(targetBodyX + 40, centerY - 6);
      ctx.lineTo(targetBodyX + 40, centerY + 6);
      ctx.lineTo(centerBodyX, centerY + earthR);
      ctx.closePath();
      ctx.fill();

      // SUN
      ctx.fillStyle = '#ffaa00';
      ctx.beginPath();
      ctx.arc(sunX, centerY, sunR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('SUN', sunX, centerY + sunR + 18);

      // EARTH
      ctx.fillStyle = '#1e88e5';
      ctx.beginPath();
      ctx.arc(centerBodyX, centerY, earthR, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText('EARTH (SHADOW SOURCE)', centerBodyX, centerY + earthR + 18);

      // MOON crossing Earth Shadow
      const mY = centerY + Math.sin(simTimeDays * 4) * 8;
      ctx.fillStyle = '#e57373'; // Blood Moon Red
      ctx.beginPath();
      ctx.arc(targetBodyX, mY, moonR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ff1744';
      ctx.fillText('MOON (IN UMBRA)', targetBodyX, centerY + moonR + 18);
    }

  }, [type, subtype, alignAngleDeg, sunAngularDiaArcmin, moonAngularDiaArcmin, umbraRadiusKm, penumbraRadiusKm, simTimeDays]);

  return (
    <div className="eclipse-canvas-wrapper" style={{ width: '100%', height: '220px', position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      <div style={{ position: 'absolute', top: '8px', left: '12px', background: 'rgba(5, 12, 24, 0.85)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.4)', fontSize: '0.72rem', fontFamily: 'monospace', color: '#00f0ff' }}>
        SIMPLIFIED ECLIPSE GEOMETRY MODEL • {subtype}
      </div>

      <div style={{ position: 'absolute', bottom: '8px', right: '12px', background: 'rgba(5, 12, 24, 0.85)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontFamily: 'monospace', color: '#ffb74d' }}>
        Alignment Angle: {alignAngleDeg}°
      </div>
    </div>
  );
}
