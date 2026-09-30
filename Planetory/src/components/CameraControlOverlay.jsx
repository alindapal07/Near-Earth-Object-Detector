import React from 'react';

export default function CameraControlOverlay({
  solarSystemRef,
  selectedObject,
  isFollowing,
  appMode = 'SOLAR_SYSTEM',
  onToggleFollow,
  onResetCamera
}) {
  const getCameraManager = () => {
    return solarSystemRef?.current?.engineRef?.current?.cameraManager || null;
  };

  const handleOrbit = (dTheta, dPhi) => {
    const cm = getCameraManager();
    if (cm) cm.orbit(dTheta, dPhi);
  };

  const handleZoom = (dFactor) => {
    const cm = getCameraManager();
    if (cm) cm.dolly(dFactor);
  };

  const currentCamMode = appMode === 'OBSERVATORY'
    ? 'OBSERVATORY'
    : isFollowing
    ? 'FOLLOW'
    : selectedObject
    ? 'FOCUS'
    : 'FREE';

  return (
    <div 
      className="camera-control-hud"
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Mode Status Tag Header */}
      <div className="cam-hud-header">
        <span className="cam-hud-label font-mono">NAV SYSTEM</span>
        <span className={`cam-hud-badge cam-hud-badge--${currentCamMode.toLowerCase()}`}>
          {currentCamMode}
        </span>
      </div>

      {/* Directional Pad */}
      <div className="cam-dpad-container">
        <button 
          className="cam-dpad-btn cam-dpad-up" 
          onClick={() => handleOrbit(0, -0.1)}
          title="Orbit Up (ArrowUp)"
        >
          ▲
        </button>
        <div className="cam-dpad-middle-row">
          <button 
            className="cam-dpad-btn cam-dpad-left" 
            onClick={() => handleOrbit(-0.1, 0)}
            title="Orbit Left (ArrowLeft / Q)"
          >
            ◀
          </button>
          <button 
            className="cam-dpad-btn cam-dpad-center" 
            onClick={onResetCamera}
            title="Reset Camera Overview (R / Home)"
          >
            ●
          </button>
          <button 
            className="cam-dpad-btn cam-dpad-right" 
            onClick={() => handleOrbit(0.1, 0)}
            title="Orbit Right (ArrowRight / E)"
          >
            ▶
          </button>
        </div>
        <button 
          className="cam-dpad-btn cam-dpad-down" 
          onClick={() => handleOrbit(0, 0.1)}
          title="Orbit Down (ArrowDown)"
        >
          ▼
        </button>
      </div>

      {/* Zoom & Action Controls */}
      <div className="cam-action-row">
        <button 
          className="cam-act-btn" 
          onClick={() => handleZoom(-0.15)}
          title="Zoom In (W / Scroll Up)"
        >
          ➕
        </button>
        <button 
          className="cam-act-btn" 
          onClick={() => handleZoom(0.15)}
          title="Zoom Out (S / Scroll Down)"
        >
          ➖
        </button>
        <button 
          className="cam-act-btn cam-act-btn--reset" 
          onClick={onResetCamera}
          title="Reset Camera Overview (R)"
        >
          RESET
        </button>
      </div>

      {/* Target Follow Toggle Button if object is selected */}
      {selectedObject && appMode !== 'OBSERVATORY' && (
        <button 
          className={`cam-follow-btn ${isFollowing ? 'active' : ''}`}
          onClick={() => onToggleFollow && onToggleFollow(!isFollowing)}
          title={isFollowing ? 'Lock camera tracking target' : 'Follow target in orbital motion'}
        >
          {isFollowing ? '🔒 FOLLOWING' : '🎯 FOLLOW TARGET'}
        </button>
      )}
    </div>
  );
}
