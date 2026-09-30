import React from 'react';

export default function ObjectPanel({ selectedObject, onFocus, onFollow, isFollowing, onResetCamera }) {
  if (!selectedObject) return null;

  const isSun = selectedObject.id === 'sun';
  const isMoon = selectedObject.type === 'Natural Satellite' || selectedObject.parent;

  return (
    <div className="object-panel">
      <div className="adp-header">
        <div>
          <h2>{selectedObject.name?.toUpperCase() || selectedObject.id}</h2>
          <span className="badge badge--neo">{selectedObject.type || 'Celestial Body'}</span>
          {selectedObject.parent && (
            <span className="badge badge--class">Parent: {selectedObject.parent.toUpperCase()}</span>
          )}
        </div>
        <div className="adp-header-actions">
          {onFocus && (
            <button className="adp-btn adp-btn--focus" onClick={() => onFocus(selectedObject)}>
              🎯 Focus
            </button>
          )}
          {onFollow && (
            <button className={`adp-btn ${isFollowing ? 'adp-btn--focus' : ''}`} onClick={() => onFollow(!isFollowing)}>
              {isFollowing ? '🔒 Following' : '🔓 Follow'}
            </button>
          )}
        </div>
      </div>

      <div className="adp-source">
        📡 NASA / JPL Solar System Ephemeris
      </div>

      <div className="object-details">
        {selectedObject.radiusKm && (
          <div className="detail-row">
            <span>Radius:</span>
            <span>{selectedObject.radiusKm.toLocaleString()} km</span>
          </div>
        )}
        
        {selectedObject.massKg && (
          <div className="detail-row">
            <span>Mass:</span>
            <span>{selectedObject.massKg.toExponential(2)} kg</span>
          </div>
        )}
        
        {selectedObject.a !== undefined && (
          <div className="detail-row">
            <span>Semi-major Axis:</span>
            <span>{selectedObject.a.toFixed(4)} {isMoon ? 'AU (relative)' : 'AU'}</span>
          </div>
        )}

        {selectedObject.orbitalPeriodDays && (
          <div className="detail-row">
            <span>Orbital Period:</span>
            <span>{selectedObject.orbitalPeriodDays.toLocaleString()} days</span>
          </div>
        )}
        
        {selectedObject.rotationPeriodHours && (
          <div className="detail-row">
            <span>Rotation:</span>
            <span>{selectedObject.rotationPeriodHours} h</span>
          </div>
        )}

        {selectedObject.axialTiltDeg !== undefined && (
          <div className="detail-row">
            <span>Axial Tilt:</span>
            <span>{selectedObject.axialTiltDeg}°</span>
          </div>
        )}
        
        {selectedObject.moons !== undefined && (
          <div className="detail-row">
            <span>Natural Satellites:</span>
            <span>{selectedObject.moons}</span>
          </div>
        )}

        {selectedObject.discovery && (
          <>
            <div className="adp-section-title">DISCOVERY</div>
            <div className="detail-row">
              <span>Date:</span>
              <span>{selectedObject.discovery.date}</span>
            </div>
            <div className="detail-row">
              <span>Discoverer:</span>
              <span>{selectedObject.discovery.who}</span>
            </div>
          </>
        )}

        {isSun && (
          <div className="adp-note">
            The Sun is a G-type main-sequence star (G2V) comprising 99.86% of the total mass of the Solar System.
          </div>
        )}
      </div>
    </div>
  );
}
