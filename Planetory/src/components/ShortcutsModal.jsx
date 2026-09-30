import React from 'react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Toggle Play / Pause Simulation' },
    { key: 'B', desc: 'Expand / Minimize Bottom Flight Console & Timeline' },
    { key: 'I', desc: 'Toggle Immersive Mode (HUD Overlay Off)' },
    { key: 'C', desc: 'Toggle Clean View (Hide Panels & Labels)' },
    { key: 'O', desc: 'Toggle Planetary & Satellite Orbit Lines' },
    { key: 'L', desc: 'Toggle Natural Satellites / Moons Visibility' },
    { key: 'M', desc: 'Cycle View Mode (Solar System → Observatory → Mission)' },
    { key: 'F', desc: 'Focus Camera on Selected Celestial Object' },
    { key: 'R / Home', desc: 'Reset Camera to Solar System Overview' },
    { key: '] / +', desc: 'Increase Simulation Speed Multiplier' },
    { key: '[ / -', desc: 'Decrease Simulation Speed Multiplier' },
    { key: 'Ctrl + K / Cmd + K', desc: 'Open Universal Celestial Search' },
    { key: 'Esc', desc: 'Close Active Console / Clear Target / Exit Immersive' },
    { key: 'Double Click', desc: 'Direct Camera Focus on Celestial Object in 3D' },
    { key: 'Scroll Wheel', desc: 'Cursor-Centered Deep Zoom' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="settings-modal shortcuts-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>⌨ SIMULATOR KEYBOARD SHORTCUTS</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="shortcuts-grid">
            {shortcuts.map((item, idx) => (
              <div className="shortcut-row" key={idx}>
                <kbd className="shortcut-key">{item.key}</kbd>
                <span className="shortcut-desc">{item.desc}</span>
              </div>
            ))}
          </div>

          <div className="adp-note" style={{ marginTop: '16px' }}>
            <strong>Flight Computer Tip:</strong> Press <kbd className="shortcut-key inline">I</kbd> anytime for a clean cinematic full-screen view without UI HUD panels.
          </div>
        </div>
      </div>
    </div>
  );
}
