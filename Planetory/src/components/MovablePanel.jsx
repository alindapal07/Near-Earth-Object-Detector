import React, { useState, useRef, useEffect } from 'react';
import { DOCK_ZONES } from '../hooks/useHUDLayout';

export default function MovablePanel({
  id,
  title,
  panelConfig,
  updatePanelPosition,
  togglePanelMinimize,
  togglePanelVisibility,
  bringToFront,
  isLocked,
  isEditMode,
  children,
  className = '',
  allowClose = true,
  allowMinimize = true,
  onClose = null,
  positionOptions = ['bottom-center', 'bottom-left', 'bottom-right', 'right-center', 'left-center', 'top-left', 'top-center', 'top-right', 'free']
}) {
  const panelRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [tempPos, setTempPos] = useState({ x: 0, y: 0 });
  const [activeSnapZone, setActiveSnapZone] = useState(null);
  const [showPosMenu, setShowPosMenu] = useState(false);
  const [customSize, setCustomSize] = useState({ width: null, height: null });
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef({ startX: 0, startY: 0, startWidth: 0, startHeight: 0 });

  const { isDocked = true, anchor = 'bottom-center', isMinimized = false, isVisible = true, zIndex = 1100, x, y } = panelConfig || {};

  if (!isVisible) return null;

  // Handle Resizing (Width & Height / Lengthwise)
  const handleResizePointerDown = (e) => {
    e.stopPropagation();
    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: customSize.width || rect.width,
      startHeight: customSize.height || rect.height
    };

    setIsResizing(true);
    bringToFront(id);

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleResizePointerMove = (e) => {
    if (!isResizing) return;
    e.stopPropagation();

    const deltaX = e.clientX - resizeStartRef.current.startX;
    const deltaY = e.clientY - resizeStartRef.current.startY;

    const minW = 320;
    const minH = 220;
    const maxW = Math.max(minW, window.innerWidth * 0.95);
    const maxH = Math.max(minH, window.innerHeight * 0.95);

    const newWidth = Math.max(minW, Math.min(maxW, resizeStartRef.current.startWidth + deltaX));
    const newHeight = Math.max(minH, Math.min(maxH, resizeStartRef.current.startHeight + deltaY));

    setCustomSize({ width: newWidth, height: newHeight });
  };

  const handleResizePointerUp = (e) => {
    if (!isResizing) return;
    e.stopPropagation();

    try {
      if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    setIsResizing(false);
  };

  // Handle Dragging
  const handlePointerDown = (e) => {
    if (isLocked && !isEditMode) return;
    
    // Stop event propagation to prevent Three.js camera rotation/zoom
    e.stopPropagation();
    
    // Only drag when clicking handle, title bar, or when in edit mode
    const isHandleOrHeader = e.target.closest('.panel-drag-handle') || e.target.closest('.panel-title-bar-header');
    if (!isHandleOrHeader && !isEditMode) return;

    if (!panelRef.current) return;

    const rect = panelRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setTempPos({ x: rect.left, y: rect.top });
    setIsDragging(true);
    bringToFront(id);

    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (err) {
      // Ignore if setPointerCapture fails on some targets
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !panelRef.current) return;
    e.stopPropagation();

    const pw = panelRef.current.offsetWidth || 300;
    const ph = panelRef.current.offsetHeight || 200;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Viewport safety bounds clamping
    newX = Math.max(10, Math.min(newX, vw - Math.min(pw, 100)));
    newY = Math.max(10, Math.min(newY, vh - 40));

    setTempPos({ x: newX, y: newY });

    // Snap Zone Detection (~40px threshold)
    let matchedSnap = null;
    Object.keys(DOCK_ZONES).forEach(zoneKey => {
      const zoneCoords = DOCK_ZONES[zoneKey].getCoords(vw, vh, pw, ph);
      const dx = Math.abs(newX - zoneCoords.x);
      const dy = Math.abs(newY - zoneCoords.y);
      if (dx < 40 && dy < 40) {
        matchedSnap = zoneKey;
      }
    });

    setActiveSnapZone(matchedSnap);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();

    try {
      if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    } catch (err) {}

    setIsDragging(false);

    if (activeSnapZone) {
      // Snap to dock zone
      updatePanelPosition(id, {
        isDocked: true,
        anchor: activeSnapZone,
        x: null,
        y: null
      });
      setActiveSnapZone(null);
    } else {
      // Free position
      updatePanelPosition(id, {
        isDocked: false,
        anchor: 'free',
        x: tempPos.x,
        y: tempPos.y
      });
    }
  };

  const handleSelectPosition = (posKey) => {
    setShowPosMenu(false);
    if (posKey === 'free') {
      const rect = panelRef.current?.getBoundingClientRect() || { left: 100, top: 100 };
      updatePanelPosition(id, { isDocked: false, anchor: 'free', x: rect.left, y: rect.top });
    } else {
      updatePanelPosition(id, { isDocked: true, anchor: posKey, x: null, y: null });
    }
  };

  // Determine inline styles for positioning & sizing
  let stylePosition = {};
  if (isDragging) {
    stylePosition = {
      position: 'fixed',
      left: `${tempPos.x}px`,
      top: `${tempPos.y}px`,
      transform: 'none',
      zIndex: zIndex + 500,
      transition: 'none'
    };
  } else if (!isDocked && x != null && y != null) {
    stylePosition = {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      transform: 'none',
      zIndex: zIndex
    };
  } else {
    // Docked state CSS styling based on anchor
    stylePosition = {
      zIndex: zIndex
    };
  }

  if (customSize.width) {
    stylePosition.width = `${customSize.width}px`;
    stylePosition.maxWidth = '95vw';
  }
  if (customSize.height) {
    stylePosition.height = `${customSize.height}px`;
    stylePosition.maxHeight = '95vh';
  }

  const dockedClass = isDocked && !isDragging ? `docked-${anchor}` : '';

  return (
    <>
      {/* Snap Indicator Overlay when dragging near dock */}
      {isDragging && activeSnapZone && (
        <div className={`snap-zone-indicator snap-zone-${activeSnapZone}`}>
          <div className="snap-zone-label">DOCK TO {DOCK_ZONES[activeSnapZone]?.name.toUpperCase()}</div>
        </div>
      )}

      <div
        ref={panelRef}
        className={`movable-panel ${dockedClass} ${isDragging ? 'is-dragging' : ''} ${isResizing ? 'is-resizing' : ''} ${isEditMode ? 'edit-mode' : ''} ${isLocked ? 'is-locked' : ''} ${className}`}
        style={stylePosition}
        onPointerDown={() => bringToFront(id)}
      >
        {/* Panel Title Bar */}
        <div
          className="panel-title-bar"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="panel-title-bar-header">
            {!isLocked && (
              <span className="panel-drag-handle" title="Drag to move panel" aria-label={`Move ${title} panel`}>
                ⋮⋮
              </span>
            )}
            <span className="panel-title-text">{title}</span>
            {isDocked && <span className="panel-dock-tag">{anchor.replace('-', ' ')}</span>}
            {(customSize.width || customSize.height) && (
              <span className="panel-dock-tag" style={{ color: '#ffb703' }}>RESIZED</span>
            )}
          </div>

          <div className="panel-title-actions">
            {/* Position Dropdown */}
            <div className="panel-pos-dropdown-wrapper">
              <button
                type="button"
                className="panel-action-btn pos-btn"
                title="Panel Position Menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPosMenu(!showPosMenu);
                }}
              >
                POS ▾
              </button>
              {showPosMenu && (
                <div className="panel-pos-menu" onPointerDown={(e) => e.stopPropagation()}>
                  <div className="panel-pos-menu-header">SELECT DOCK / POSITION</div>
                  {positionOptions.map((optKey) => (
                    <button
                      key={optKey}
                      type="button"
                      className={`panel-pos-item ${anchor === optKey ? 'active' : ''}`}
                      onClick={() => handleSelectPosition(optKey)}
                    >
                      {optKey === 'free' ? 'Free Floating' : DOCK_ZONES[optKey]?.name || optKey}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="panel-pos-item reset-item"
                    onClick={() => {
                      setCustomSize({ width: null, height: null });
                      handleSelectPosition(anchor);
                    }}
                  >
                    Reset Size & Dock
                  </button>
                </div>
              )}
            </div>

            {/* Minimize button */}
            {allowMinimize && (
              <button
                type="button"
                className="panel-action-btn minimize-btn"
                title={isMinimized ? 'Expand Panel' : 'Minimize Panel'}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePanelMinimize(id);
                }}
              >
                {isMinimized ? '▲' : '▼'}
              </button>
            )}

            {/* Close button */}
            {allowClose && (
              <button
                type="button"
                className="panel-action-btn close-btn"
                title="Hide Panel"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClose) {
                    onClose();
                  } else {
                    togglePanelVisibility(id);
                  }
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Panel Content (Hidden if minimized) */}
        {!isMinimized && <div className="panel-content-body">{children}</div>}

        {/* Pointer-Drag Resize Corner Handle */}
        {!isMinimized && (
          <div 
            className={`panel-resize-handle ${isResizing ? 'is-resizing' : ''}`}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            onDoubleClick={() => setCustomSize({ width: null, height: null })}
            title="Drag corner to resize width and length (Double-click to reset)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </>
  );
}
