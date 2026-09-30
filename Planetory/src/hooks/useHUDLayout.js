import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'planetory.hud.layout.v1';

export const DOCK_ZONES = {
  'bottom-center': { name: 'Bottom Center', getCoords: (vw, vh, pw, ph) => ({ x: (vw - pw) / 2, y: vh - ph - 16 }) },
  'bottom-left':   { name: 'Bottom Left',   getCoords: (vw, vh, pw, ph) => ({ x: 20, y: vh - ph - 24 }) },
  'bottom-right':  { name: 'Bottom Right',  getCoords: (vw, vh, pw, ph) => ({ x: vw - pw - 20, y: vh - ph - 24 }) },
  'right-center':  { name: 'Right Center',  getCoords: (vw, vh, pw, ph) => ({ x: vw - pw - 20, y: 68 }) },
  'left-center':   { name: 'Left Center',   getCoords: (vw, vh, pw, ph) => ({ x: 20, y: 68 }) },
  'top-left':      { name: 'Top Left',      getCoords: (vw, vh, pw, ph) => ({ x: 20, y: 60 }) },
  'top-center':    { name: 'Top Center',    getCoords: (vw, vh, pw, ph) => ({ x: (vw - pw) / 2, y: 60 }) },
  'top-right':     { name: 'Top Right',     getCoords: (vw, vh, pw, ph) => ({ x: vw - pw - 20, y: 60 }) },
};

const DEFAULT_PANEL_CONFIGS = {
  simulator: {
    id: 'simulator',
    title: 'SIMULATOR CONSOLE',
    anchor: 'bottom-center',
    isDocked: true,
    isMinimized: false,
    isVisible: true,
    zIndex: 1100,
    x: null,
    y: null
  },
  camera: {
    id: 'camera',
    title: 'CAMERA CONTROL',
    anchor: 'bottom-left',
    isDocked: true,
    isMinimized: false,
    isVisible: true,
    zIndex: 1100,
    x: null,
    y: null
  },
  object: {
    id: 'object',
    title: 'OBJECT INTELLIGENCE',
    anchor: 'right-center',
    isDocked: true,
    isMinimized: false,
    isVisible: true,
    zIndex: 1100,
    x: null,
    y: null
  }
};

const DEFAULT_LAYOUT_STATE = {
  profile: 'DEFAULT',
  isLocked: false,
  isEditMode: false,
  panels: DEFAULT_PANEL_CONFIGS
};

export function useHUDLayout() {
  const [layoutState, setLayoutState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.panels) {
          return {
            ...DEFAULT_LAYOUT_STATE,
            ...parsed,
            panels: {
              ...DEFAULT_PANEL_CONFIGS,
              ...parsed.panels
            }
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load HUD layout from localStorage:', e);
    }
    return DEFAULT_LAYOUT_STATE;
  });

  // Save layout changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layoutState));
    } catch (e) {
      console.warn('Failed to save HUD layout:', e);
    }
  }, [layoutState]);

  // Handle window resize position validation
  useEffect(() => {
    const handleResize = () => {
      setLayoutState(prev => {
        const updatedPanels = { ...prev.panels };
        let changed = false;

        Object.keys(updatedPanels).forEach(id => {
          const p = updatedPanels[id];
          if (!p.isDocked && p.x != null && p.y != null) {
            const maxX = Math.max(10, window.innerWidth - 100);
            const maxY = Math.max(10, window.innerHeight - 60);
            const clampedX = Math.min(Math.max(10, p.x), maxX);
            const clampedY = Math.min(Math.max(10, p.y), maxY);
            if (clampedX !== p.x || clampedY !== p.y) {
              updatedPanels[id] = { ...p, x: clampedX, y: clampedY };
              changed = true;
            }
          }
        });

        return changed ? { ...prev, panels: updatedPanels } : prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update position of a single panel
  const updatePanelPosition = useCallback((panelId, { x, y, anchor, isDocked }) => {
    setLayoutState(prev => {
      const current = prev.panels[panelId] || DEFAULT_PANEL_CONFIGS[panelId];
      const updated = {
        ...current,
        x: x !== undefined ? x : current.x,
        y: y !== undefined ? y : current.y,
        anchor: anchor !== undefined ? anchor : current.anchor,
        isDocked: isDocked !== undefined ? isDocked : current.isDocked
      };

      return {
        ...prev,
        profile: 'CUSTOM',
        panels: {
          ...prev.panels,
          [panelId]: updated
        }
      };
    });
  }, []);

  // Toggle minimize state
  const togglePanelMinimize = useCallback((panelId) => {
    setLayoutState(prev => {
      const current = prev.panels[panelId];
      if (!current) return prev;

      return {
        ...prev,
        panels: {
          ...prev.panels,
          [panelId]: {
            ...current,
            isMinimized: !current.isMinimized
          }
        }
      };
    });
  }, []);

  // Toggle visibility (supports optional explicit forceState boolean)
  const togglePanelVisibility = useCallback((panelId, forceState) => {
    setLayoutState(prev => {
      const current = prev.panels[panelId];
      if (!current) return prev;

      return {
        ...prev,
        panels: {
          ...prev.panels,
          [panelId]: {
            ...current,
            isVisible: forceState !== undefined ? forceState : !current.isVisible
          }
        }
      };
    });
  }, []);

  // Bring panel to front (Z-Index elevation)
  const bringToFront = useCallback((panelId) => {
    setLayoutState(prev => {
      const highestZ = Math.max(...Object.values(prev.panels).map(p => p.zIndex || 1100));
      const current = prev.panels[panelId];
      if (!current || current.zIndex === highestZ + 1) return prev;

      return {
        ...prev,
        panels: {
          ...prev.panels,
          [panelId]: {
            ...current,
            zIndex: highestZ + 1
          }
        }
      };
    });
  }, []);

  // Set preset profile (DEFAULT, COMPACT, SCIENTIFIC, MISSION)
  const setLayoutProfile = useCallback((profileName) => {
    setLayoutState(prev => {
      if (profileName === 'DEFAULT') {
        return { ...DEFAULT_LAYOUT_STATE, profile: 'DEFAULT' };
      }

      if (profileName === 'COMPACT') {
        return {
          ...prev,
          profile: 'COMPACT',
          panels: {
            simulator: { ...DEFAULT_PANEL_CONFIGS.simulator, isMinimized: true },
            camera: { ...DEFAULT_PANEL_CONFIGS.camera, isMinimized: true },
            object: { ...DEFAULT_PANEL_CONFIGS.object, isVisible: false }
          }
        };
      }

      if (profileName === 'SCIENTIFIC') {
        return {
          ...prev,
          profile: 'SCIENTIFIC',
          panels: {
            simulator: { ...DEFAULT_PANEL_CONFIGS.simulator, isMinimized: false },
            camera: { ...DEFAULT_PANEL_CONFIGS.camera, isMinimized: false },
            object: { ...DEFAULT_PANEL_CONFIGS.object, isVisible: true, isMinimized: false }
          }
        };
      }

      if (profileName === 'MISSION') {
        return {
          ...prev,
          profile: 'MISSION',
          panels: {
            simulator: { ...DEFAULT_PANEL_CONFIGS.simulator, anchor: 'bottom-center', isDocked: true },
            camera: { ...DEFAULT_PANEL_CONFIGS.camera, anchor: 'bottom-left', isDocked: true },
            object: { ...DEFAULT_PANEL_CONFIGS.object, anchor: 'right-center', isDocked: true }
          }
        };
      }

      return prev;
    });
  }, []);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    setLayoutState(DEFAULT_LAYOUT_STATE);
  }, []);

  // Toggle HUD Lock
  const setHudLocked = useCallback((locked) => {
    setLayoutState(prev => ({ ...prev, isLocked: locked }));
  }, []);

  // Toggle Edit Mode
  const toggleEditMode = useCallback(() => {
    setLayoutState(prev => ({ ...prev, isEditMode: !prev.isEditMode }));
  }, []);

  return {
    layoutState,
    updatePanelPosition,
    togglePanelMinimize,
    togglePanelVisibility,
    bringToFront,
    setLayoutProfile,
    resetLayout,
    setHudLocked,
    toggleEditMode
  };
}
