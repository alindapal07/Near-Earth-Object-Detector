import React, { useState, useEffect, useRef } from 'react';
import { detectEclipseState } from '../utils/eclipseEngine';

export default function NotificationOverlay({ simTimeDays, onSelectEvent }) {
  const [notifications, setNotifications] = useState([]);
  const dismissedRef = useRef(new Set());

  useEffect(() => {
    const eclipse = detectEclipseState(simTimeDays);
    if (eclipse.isEclipse) {
      const id = `eclipse-${eclipse.name}`;
      if (dismissedRef.current.has(id)) return;

      setNotifications(prev => {
        if (prev.some(n => n.id === id)) return prev;
        return [
          ...prev.slice(-2),
          {
            id,
            icon: '🌘',
            title: eclipse.name.toUpperCase(),
            sub: `Geometric Alignment Angle: ${eclipse.alignmentAngleDeg}°`,
            type: 'ECLIPSE',
            targetObjId: eclipse.name.includes('Lunar') ? 'moon' : 'earth',
            simTimeDays
          }
        ];
      });
    }
  }, [simTimeDays]);

  const handleDismiss = (e, id) => {
    e.stopPropagation();
    dismissedRef.current.add(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleCardClick = (n) => {
    if (onSelectEvent) {
      onSelectEvent({
        name: n.title,
        type: n.type,
        simTimeDays: n.simTimeDays,
        targetObjId: n.targetObjId,
        description: n.sub
      });
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="hud-notification-stack">
      {notifications.map(n => (
        <div 
          key={n.id} 
          className="hud-notification-card"
          onClick={() => handleCardClick(n)}
          title="Click to focus astronomical event"
        >
          <span className="n-icon">{n.icon}</span>
          <div className="n-content">
            <span className="n-title">{n.title}</span>
            <span className="n-sub font-mono">{n.sub}</span>
          </div>
          <button className="n-dismiss" onClick={(e) => handleDismiss(e, n.id)} title="Dismiss notification">✕</button>
        </div>
      ))}
    </div>
  );
}
