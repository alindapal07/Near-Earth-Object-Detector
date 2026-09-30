import React from 'react';

/**
 * RadialGauge.jsx - Scientific Instrument Gauge
 * Features thin cyan/amber glowing arc, perimeter tick marks, animated needle,
 * tabular digits, and precise scientific unit formatting.
 */
export default function RadialGauge({ 
  label, 
  value, 
  min = 0, 
  max = 100, 
  unit = '', 
  color = '#00f0ff',
  secondaryText = '',
  size = 110
}) {
  const numericVal = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  const clampedVal = Math.max(min, Math.min(max, numericVal));
  const pct = (clampedVal - min) / Math.max(0.0001, max - min);

  // Gauge arc angles: -135 deg to +135 deg (270 deg span)
  const startAngle = -135;
  const endAngle = 135;
  const currentAngle = startAngle + pct * (endAngle - startAngle);

  const cx = 60;
  const cy = 60;
  const radius = 42;

  // Polar to Cartesian conversion
  const polarToCartesian = (centerX, centerY, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians)
    };
  };

  const describeArc = (x, y, r, startA, endA) => {
    const start = polarToCartesian(x, y, r, endA);
    const end = polarToCartesian(x, y, r, startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const backgroundArc = describeArc(cx, cy, radius, startAngle, endAngle);
  const activeArc = describeArc(cx, cy, radius, startAngle, currentAngle);

  // Needle tip coordinates
  const needleTip = polarToCartesian(cx, cy, radius - 8, currentAngle);

  // Tick marks (11 tick marks)
  const ticks = [];
  const totalTicks = 11;
  for (let i = 0; i < totalTicks; i++) {
    const tickPct = i / (totalTicks - 1);
    const tickAngle = startAngle + tickPct * (endAngle - startAngle);
    const outerP = polarToCartesian(cx, cy, radius + 5, tickAngle);
    const innerP = polarToCartesian(cx, cy, radius + 1, tickAngle);
    ticks.push({ x1: innerP.x, y1: innerP.y, x2: outerP.x, y2: outerP.y, key: i });
  }

  return (
    <div className="sci-widget sci-gauge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px' }}>
      <div className="gauge-label font-mono" style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '2px' }}>
        {label}
      </div>

      <div className="gauge-svg-wrap" style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%' }}>
          <defs>
            <filter id={`glow-${label.replace(/\s+/g, '')}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Perimeter Ticks */}
          {ticks.map(t => (
            <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          ))}

          {/* Track Arc */}
          <path d={backgroundArc} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" strokeLinecap="round" />

          {/* Active Value Arc */}
          <path 
            d={activeArc} 
            fill="none" 
            stroke={color} 
            strokeWidth="5" 
            strokeLinecap="round" 
            filter={`url(#glow-${label.replace(/\s+/g, '')})`}
          />

          {/* Animated Needle */}
          <line 
            x1={cx} y1={cy} 
            x2={needleTip.x} y2={needleTip.y} 
            stroke="#ffffff" 
            strokeWidth="2" 
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4" fill={color} stroke="#ffffff" strokeWidth="1" />

          {/* Center Value Text */}
          <text x={cx} y={cy + 18} textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="800" className="font-mono">
            {typeof value === 'number' ? value.toFixed(1) : (value ?? 'N/A')}
          </text>
          {unit && (
            <text x={cx} y={cy + 28} textAnchor="middle" fill={color} fontSize="8" fontWeight="700" className="font-mono">
              {unit}
            </text>
          )}
        </svg>
      </div>

      {secondaryText && (
        <div className="gauge-secondary font-mono" style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', marginTop: '-4px' }}>
          {secondaryText}
        </div>
      )}
    </div>
  );
}
