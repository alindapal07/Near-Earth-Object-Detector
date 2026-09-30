import React, { useState, useRef, useEffect } from 'react';
import SolarSystem from './components/SolarSystem';
import TopHeader from './components/TopHeader';
import SpaceObjectSearch from './components/SpaceObjectSearch';
import SimulationControls from './components/SimulationControls';
import ObjectIntelligencePanel from './components/ObjectIntelligencePanel';
import EventIntelligencePanel from './components/EventIntelligencePanel';
import Timeline from './components/timeline/Timeline';
import SpaceDataFactoryModal from './components/SpaceDataFactoryModal';
import CelestialEventsModal from './components/CelestialEventsModal';
import SettingsModal from './components/SettingsModal';
import ComparisonModal from './components/visualization/ComparisonModal';
import ObservatorySettingsModal from './components/ObservatorySettingsModal';
import FloatingBottomBar from './components/FloatingBottomBar';
import TargetReticle from './components/TargetReticle';
import ShortcutsModal from './components/ShortcutsModal';
import LoadingScreen from './components/LoadingScreen';
import NotificationOverlay from './components/NotificationOverlay';
import MissionTelemetryPanel from './components/MissionTelemetryPanel';
import MissionPlannerModal from './components/MissionPlannerModal';
import CameraControlOverlay from './components/CameraControlOverlay';
import ObservatoryControlPanel from './components/ObservatoryControlPanel';
import MovablePanel from './components/MovablePanel';
import NEOExplorerModal from './components/NEOExplorerModal';  // Part 35

import { useHUDLayout } from './hooks/useHUDLayout';
import { useSimulationClock } from './hooks/useSimulationClock';
import { useSpaceData } from './hooks/useSpaceData';
import { eclipticToThree } from './utils/coordinateTransform';
import { calculateHeliocentricPosition } from './utils/orbitalMath';
import { parseURLState, updateURLState } from './utils/urlState';
import { DEFAULT_OBSERVER } from './utils/observerModel';
import './App.css';

function App() {
  const [selectedObject, setSelectedObject] = useState(null);
  const [targetObject, setTargetObject] = useState(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [scaleMode, setScaleMode] = useState('balanced');
  const [showMoons, setShowMoons] = useState(true);
  const [showOrbitLines, setShowOrbitLines] = useState(true);
  const [showStars, setShowStars] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  // PART 9, 10 & 29 Observatory States
  const [appMode, setAppMode] = useState('SOLAR_SYSTEM'); // 'SOLAR_SYSTEM' | 'OBSERVATORY' | 'MISSION'
  const [observer, setObserver] = useState(DEFAULT_OBSERVER);
  const [coordFrame, setCoordFrame] = useState('EQUATORIAL');
  const [epoch, setEpoch] = useState('J2000');
  const [applyRefraction, setApplyRefraction] = useState(false);
  const [nightSkyMode, setNightSkyMode] = useState(false);
  const [fovDeg, setFovDeg] = useState(60);
  const [isObservatoryModalOpen, setIsObservatoryModalOpen] = useState(false);
  const [skyToggles, setSkyToggles] = useState({ showConstellations: true, showGrid: true });

  const [isBottomNavExpanded, setIsBottomNavExpanded] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isCleanView, setIsCleanView] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // PART 7 & 8 States
  const [showVectors, setShowVectors] = useState(false);
  const [showTrails, setShowTrails] = useState('short');
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareObjA, setCompareObjA] = useState(null);

  const [isFactoryOpen, setIsFactoryOpen] = useState(false);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Part 35 — NEO Explorer
  const [isNEOExplorerOpen, setIsNEOExplorerOpen] = useState(false);
  const solarSystemRef = useRef(null);

  const spaceData = useSpaceData();

  // PART 16: Centralized Movable HUD Layout Manager Hook
  const {
    layoutState,
    updatePanelPosition,
    togglePanelMinimize,
    togglePanelVisibility,
    bringToFront,
    setLayoutProfile,
    resetLayout,
    setHudLocked,
    toggleEditMode
  } = useHUDLayout();

  const {
    simTimeDays,
    isLive,
    isPaused,
    speedMultiplier,
    toggleLive,
    togglePause,
    setSpeed,
    syncToNow,
    seekToDays,
    seekToDate,
    stepTime
  } = useSimulationClock(false);

  // 1. Initial URL state restore (Req 49, 50)
  useEffect(() => {
    const urlState = parseURLState();
    if (urlState.simTimeDays != null) {
      seekToDays(urlState.simTimeDays);
    }
    if (urlState.speedMultiplier != null) {
      setSpeed(urlState.speedMultiplier);
    }
    if (urlState.scaleMode != null) {
      setScaleMode(urlState.scaleMode);
    }
  }, []);

  // 2. Sync URL state changes
  useEffect(() => {
    updateURLState({
      simTimeDays,
      selectedObjectId: selectedObject?.id,
      speedMultiplier,
      scaleMode
    });
  }, [simTimeDays, selectedObject?.id, speedMultiplier, scaleMode]);

  // 3. Global Keyboard Shortcuts (PART 10, 11 & 16)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const key = e.key.toUpperCase();

      // PART 16 Layout Shortcuts: Alt+1..4 & Ctrl+Shift+L
      if (e.altKey && e.key === '1') {
        setLayoutProfile('DEFAULT');
        return;
      } else if (e.altKey && e.key === '2') {
        setLayoutProfile('COMPACT');
        return;
      } else if (e.altKey && e.key === '3') {
        setLayoutProfile('SCIENTIFIC');
        return;
      } else if (e.altKey && e.key === '4') {
        setLayoutProfile('MISSION');
        return;
      } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'L') {
        e.preventDefault();
        toggleEditMode();
        return;
      }

      if (e.key === '?') {
        setIsShortcutsOpen(prev => !prev);
      } else if (key === 'B') {
        setIsBottomNavExpanded(prev => !prev);
      } else if (key === 'I') {
        setIsImmersive(prev => !prev);
      } else if (key === 'C') {
        setIsCleanView(prev => !prev);
      } else if (key === 'O') {
        const next = !showOrbitLines;
        setShowOrbitLines(next);
        if (solarSystemRef.current?.engineRef?.current) {
          solarSystemRef.current.engineRef.current.setOrbitLinesVisible(next);
        }
      } else if (key === 'L') {
        setShowMoons(prev => !prev);
      } else if (key === 'M') {
        setAppMode(prev => {
          if (prev === 'SOLAR_SYSTEM') return 'OBSERVATORY';
          if (prev === 'OBSERVATORY') return 'MISSION';
          return 'SOLAR_SYSTEM';
        });
      } else if (key === 'F') {
        if (selectedObject && solarSystemRef.current) {
          solarSystemRef.current.focusOnObject(selectedObject.id);
        }
      } else if (key === 'N') {
        // Part 35: Toggle NEO Explorer
        setIsNEOExplorerOpen(prev => !prev);
      } else if (key === 'R' || e.code === 'Home') {
        handleResetCamera();
      } else if (e.key === ']' || e.key === '+' || e.key === '=') {
        const presets = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];
        const curAbs = Math.abs(speedMultiplier);
        const sign = speedMultiplier < 0 ? -1 : 1;
        let idx = presets.findIndex(p => p >= curAbs);
        if (idx === -1) idx = presets.length - 1;
        else if (idx < presets.length - 1) idx++;
        setSpeed(presets[idx] * sign);
      } else if (e.key === '[' || e.key === '-') {
        const presets = [0.1, 1, 10, 100, 1000, 10000, 100000, 1000000];
        const curAbs = Math.abs(speedMultiplier);
        const sign = speedMultiplier < 0 ? -1 : 1;
        let idx = presets.findIndex(p => p >= curAbs);
        if (idx > 0) idx--;
        else if (idx === -1) idx = 0;
        setSpeed(presets[idx] * sign);
      } else if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (key === 'ESCAPE' || e.code === 'Escape') {
        // Hierarchical Escape Priority
        if (isNEOExplorerOpen) {
          setIsNEOExplorerOpen(false);
        } else if (isSettingsOpen || isEventsOpen || isFactoryOpen || isCompareOpen || isObservatoryModalOpen || isShortcutsOpen || isPlannerOpen) {
          setIsSettingsOpen(false);
          setIsEventsOpen(false);
          setIsFactoryOpen(false);
          setIsCompareOpen(false);
          setIsObservatoryModalOpen(false);
          setIsShortcutsOpen(false);
          setIsPlannerOpen(false);
        } else if (isSearchOpen) {
          setIsSearchOpen(false);
        } else if (isInfoPanelOpen) {
          setIsInfoPanelOpen(false);
        } else if (selectedObject || targetObject) {
          handleResetCamera();
        } else if (selectedEvent) {
          setSelectedEvent(null);
        } else if (isImmersive) {
          setIsImmersive(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSettingsOpen, isEventsOpen, isFactoryOpen, isCompareOpen, isObservatoryModalOpen, isShortcutsOpen, isPlannerOpen, isSearchOpen,
    isInfoPanelOpen, selectedObject, targetObject, selectedEvent, isImmersive, showOrbitLines, togglePause, speedMultiplier, setSpeed, setLayoutProfile, toggleEditMode
  ]);

  // Handle object selection & camera focus (Req 1, 2, 4)
  const handleSelectObject = (obj) => {
    setSelectedObject(obj);
    setTargetObject(obj);
    setSelectedEvent(null);

    if (!obj) {
      setIsInfoPanelOpen(false);
      setIsFollowing(false);
      if (solarSystemRef.current) {
        solarSystemRef.current.setFollowObject(false);
        solarSystemRef.current.resetCamera();
      }
      return;
    }

    setIsInfoPanelOpen(true);
    togglePanelVisibility('object', true); // Force layout visibility to true on selection

    if (solarSystemRef.current) {
      if (
        obj.type === 'Planet' || 
        obj.type === 'Dwarf Planet' || 
        obj.id === 'sun' || 
        obj.id === 'earth' || 
        obj.category === 'NATURAL SATELLITE' || 
        obj.type === 'Natural Satellite' ||
        obj.category === 'ARTIFICIAL SATELLITE' || 
        obj.parentPlanet ||
        obj.parentName
      ) {
        solarSystemRef.current.focusOnObject(obj.id);
      } else if (obj.a) {
        const pos = calculateHeliocentricPosition(obj, simTimeDays);
        const vec = eclipticToThree(pos);
        solarSystemRef.current.focusOnPosition(vec.x, vec.y, vec.z, 15);
        solarSystemRef.current.showTrajectoryForAsteroid(obj);
      }
    }
  };

  // Handle astronomical event selection
  const handleSelectEvent = (eventData) => {
    setSelectedEvent(eventData);
    setSelectedObject(null);
    setIsInfoPanelOpen(true);
    togglePanelVisibility('object', true);
    if (eventData.simTimeDays != null) {
      seekToDays(eventData.simTimeDays);
    }
    if (solarSystemRef.current && eventData.targetObjId) {
      solarSystemRef.current.focusOnObject(eventData.targetObjId);
    }
  };

  const handleSetTarget = (obj) => {
    setTargetObject(obj);
    if (!obj) {
      setIsFollowing(false);
      if (solarSystemRef.current) solarSystemRef.current.setFollowObject(false);
      return;
    }
    setSelectedObject(obj);
    setIsInfoPanelOpen(true);
    togglePanelVisibility('object', true);
    if (solarSystemRef.current) {
      solarSystemRef.current.focusOnObject(obj.id);
    }
  };

  const handleCloseInfoPanel = () => {
    setIsInfoPanelOpen(false);
    // CRITICAL: DO NOT deselect or untarget object! Object stays active & camera continues tracking!
  };

  const handleReopenInfoPanel = () => {
    if (selectedObject || targetObject) {
      setIsInfoPanelOpen(true);
      togglePanelVisibility('object', true);
    }
  };

  const handleToggleFollow = (enabled) => {
    setIsFollowing(enabled);
    if (solarSystemRef.current) {
      solarSystemRef.current.setFollowObject(enabled);
    }
  };

  const handleToggleVectors = (enabled) => {
    setShowVectors(enabled);
    if (solarSystemRef.current?.engineRef?.current?.sceneManager) {
      solarSystemRef.current.engineRef.current.sceneManager.setShowVectors(enabled);
    }
  };

  const handleToggleTrails = (mode) => {
    setShowTrails(mode);
    if (solarSystemRef.current?.engineRef?.current?.sceneManager) {
      solarSystemRef.current.engineRef.current.sceneManager.setShowTrails(mode);
    }
  };

  const handleOpenCompare = (obj) => {
    setCompareObjA(obj || selectedObject || spaceData.catalog[0]);
    setIsCompareOpen(true);
  };

  const handleResetCamera = () => {
    setSelectedObject(null);
    setSelectedEvent(null);
    setIsFollowing(false);
    if (solarSystemRef.current) {
      solarSystemRef.current.setFollowObject(false);
      solarSystemRef.current.resetCamera();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="app-container">
      {/* Startup Loading Splash (PART 11, Req 24) */}
      {isLoading && (
        <LoadingScreen onFinished={() => setIsLoading(false)} />
      )}

      {/* 3D Solar System Canvas — Always Full Viewport */}
      <SolarSystem
        ref={solarSystemRef}
        simTimeDays={simTimeDays}
        simulationSpeed={speedMultiplier}
        isPaused={isPaused}
        scaleMode={scaleMode}
        showMoons={showMoons}
        catalog={spaceData.catalog}
        appMode={appMode}
        observer={observer}
        skyToggles={skyToggles}
        onSelectObject={handleSelectObject}
        onDataStatus={() => {}}
      />
      
      {/* 3D Target Reticle Overlay (PART 11, Req 11) */}
      <TargetReticle 
        selectedObject={targetObject || selectedObject}
        solarSystemRef={solarSystemRef}
        simTimeDays={simTimeDays}
      />

      {/* HUD Notification Stack (PART 11, Req 22) */}
      <NotificationOverlay 
        simTimeDays={simTimeDays}
        onSelectEvent={handleSelectEvent}
      />

      {/* Immersive Mode Exit Button Overlay */}
      {isImmersive && (
        <button
          className="immersive-exit-btn"
          onClick={() => setIsImmersive(false)}
          title="Exit Immersive Mode (Esc or I)"
        >
          ✕ Exit Immersive View (Esc)
        </button>
      )}

      {/* HUD UI Layer — Floating overlays over 3D canvas */}
      {!isImmersive && (
        <div className="ui-layer">
          {/* Mission Control Top Bar */}
          <TopHeader 
            simTimeDays={simTimeDays}
            isPaused={isPaused}
            isLive={isLive}
            speedMultiplier={speedMultiplier}
            isBackendOnline={spaceData.isBackendOnline}
            neoCount={spaceData.neoFeed?.element_count}
            appMode={appMode}
            observer={observer}
            onModeChange={setAppMode}
            onOpenPlanner={() => setIsPlannerOpen(true)}
            onOpenEvents={() => setIsEventsOpen(true)}
            onOpenObservatorySettings={() => setIsObservatoryModalOpen(true)}
            onOpenFactory={() => setIsFactoryOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onResetCamera={handleResetCamera}
            onToggleImmersive={() => setIsImmersive(true)}
            onToggleFullscreen={handleToggleFullscreen}
            onToggleSearch={() => setIsSearchOpen(prev => !prev)}
            isSearchOpen={isSearchOpen}
            isEventsOpen={isEventsOpen}
            isFactoryOpen={isFactoryOpen}
            isEditMode={layoutState.isEditMode}
            isLocked={layoutState.isLocked}
            onToggleEditMode={toggleEditMode}
            onOpenNEO={() => setIsNEOExplorerOpen(true)}
            isNEOExplorerOpen={isNEOExplorerOpen}
          />

          {/* Astronomical Observatory Control Bar (PART 29) */}
          {appMode === 'OBSERVATORY' && (
            <ObservatoryControlPanel
              simTimeDays={simTimeDays}
              observer={observer}
              onSaveObserver={setObserver}
              coordFrame={coordFrame}
              onSetCoordFrame={setCoordFrame}
              epoch={epoch}
              onSetEpoch={setEpoch}
              applyRefraction={applyRefraction}
              onToggleRefraction={setApplyRefraction}
              nightSkyMode={nightSkyMode}
              onToggleNightSky={setNightSkyMode}
              fovDeg={fovDeg}
              onSetFovDeg={setFovDeg}
              skyToggles={skyToggles}
              onSaveSkyToggles={setSkyToggles}
              selectedObject={selectedObject || targetObject}
              solarSystemRef={solarSystemRef}
              onSeekToDate={seekToDate}
              isPaused={isPaused}
              onTogglePause={togglePause}
              onSetSpeed={setSpeed}
            />
          )}

          {/* Universal Search Overlay Panel */}
          {isSearchOpen && (
            <div className="left-panel" onWheel={(e) => e.stopPropagation()}>
              <SpaceObjectSearch 
                catalog={spaceData.catalog} 
                onSelect={handleSelectObject}
                onSelectEvent={handleSelectEvent}
                isSearchOpen={isSearchOpen}
                onCloseSearch={() => setIsSearchOpen(false)}
              />
            </div>
          )}

          {/* Floating Re-open Info Button when panel is closed but object is targeted (Req 1, 4) */}
          {!isCleanView && !isImmersive && !isInfoPanelOpen && (selectedObject || targetObject) && (
            <button
              className="floating-info-reopen-btn"
              onClick={handleReopenInfoPanel}
              title={`Re-open Info Panel for ${(selectedObject || targetObject).name || (selectedObject || targetObject).id}`}
            >
              ⓘ INFO — {((selectedObject || targetObject).name || (selectedObject || targetObject).id).toUpperCase()}
            </button>
          )}

          {/* Movable Object Intelligence / Telemetry Panel (Req 1, 4) */}
          {!isCleanView && isInfoPanelOpen && (selectedObject || selectedEvent) && (
            <MovablePanel
              id="object"
              title={selectedObject?.name ? selectedObject.name.toUpperCase() : selectedEvent ? 'CELESTIAL EVENT' : 'OBJECT INTELLIGENCE'}
              panelConfig={layoutState.panels.object}
              updatePanelPosition={updatePanelPosition}
              togglePanelMinimize={togglePanelMinimize}
              togglePanelVisibility={togglePanelVisibility}
              bringToFront={bringToFront}
              isLocked={layoutState.isLocked}
              isEditMode={layoutState.isEditMode}
              allowClose={true}
              onClose={handleCloseInfoPanel}
              positionOptions={['right-center', 'left-center', 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'free']}
            >
              {selectedObject && (selectedObject.type === 'SPACECRAFT' || selectedObject.category === 'INTERSTELLAR PROBE' || selectedObject.category === 'SPACE OBSERVATORY' || selectedObject.category === 'SATURN ORBITER' || selectedObject.category === 'MARS ROVER' || selectedObject.category === 'LUNAR FLIGHT TEST' || selectedObject.category === 'HISTORIC LUNAR LANDING') ? (
                <MissionTelemetryPanel
                  spacecraftId={selectedObject.id}
                  simTimeDays={simTimeDays}
                  onClose={handleCloseInfoPanel}
                  onSeekToDate={seekToDate}
                  onSelectTarget={handleSelectObject}
                />
              ) : selectedObject ? (
                <ObjectIntelligencePanel 
                  selectedObject={selectedObject}
                  simTimeDays={simTimeDays}
                  appMode={appMode}
                  observer={observer}
                  onModeChange={setAppMode}
                  onClose={handleCloseInfoPanel}
                  onFocus={(obj) => handleSelectObject(obj)}
                  onFollow={handleToggleFollow}
                  isFollowing={isFollowing}
                  onOpenCompare={handleOpenCompare}
                  onToggleVectors={handleToggleVectors}
                  showVectors={showVectors}
                  onToggleTrails={handleToggleTrails}
                  showTrails={showTrails}
                />
              ) : null}

              {selectedEvent && (
                <EventIntelligencePanel
                  eventData={selectedEvent}
                  onSeekToEvent={(ev) => handleSelectEvent(ev)}
                  onClose={() => { setSelectedEvent(null); setIsInfoPanelOpen(false); }}
                />
              )}
            </MovablePanel>
          )}

          {/* Movable Camera Control Console */}
          {!isCleanView && (
            <MovablePanel
              id="camera"
              title="CAMERA CONTROL"
              panelConfig={layoutState.panels.camera}
              updatePanelPosition={updatePanelPosition}
              togglePanelMinimize={togglePanelMinimize}
              togglePanelVisibility={togglePanelVisibility}
              bringToFront={bringToFront}
              isLocked={layoutState.isLocked}
              isEditMode={layoutState.isEditMode}
              allowClose={true}
              positionOptions={['bottom-left', 'bottom-right', 'left-center', 'right-center', 'top-left', 'free']}
            >
              <CameraControlOverlay
                solarSystemRef={solarSystemRef}
                selectedObject={selectedObject}
                isFollowing={isFollowing}
                appMode={appMode}
                onToggleFollow={handleToggleFollow}
                onResetCamera={handleResetCamera}
              />
            </MovablePanel>
          )}

          {/* Movable Simulator Control Console */}
          <MovablePanel
            id="simulator"
            title="SIMULATOR CONSOLE"
            panelConfig={layoutState.panels.simulator}
            updatePanelPosition={updatePanelPosition}
            togglePanelMinimize={togglePanelMinimize}
            togglePanelVisibility={togglePanelVisibility}
            bringToFront={bringToFront}
            isLocked={layoutState.isLocked}
            isEditMode={layoutState.isEditMode}
            allowClose={false}
            positionOptions={['bottom-center', 'bottom-left', 'bottom-right', 'top-center', 'free']}
          >
            <FloatingBottomBar
              isExpanded={isBottomNavExpanded}
              onToggleExpanded={setIsBottomNavExpanded}
              simTimeDays={simTimeDays}
              isLive={isLive}
              isPaused={isPaused}
              speedMultiplier={speedMultiplier}
              scaleMode={scaleMode}
              showMoons={showMoons}
              showOrbitLines={showOrbitLines}
              onToggleOrbitLines={(v) => {
                setShowOrbitLines(v);
                if (solarSystemRef.current?.engineRef?.current) {
                  solarSystemRef.current.engineRef.current.setOrbitLinesVisible(v);
                }
              }}
              showVectors={showVectors}
              onToggleVectors={handleToggleVectors}
              showTrails={showTrails}
              onToggleTrails={handleToggleTrails}
              showStars={showStars}
              onToggleStars={setShowStars}
              appMode={appMode}
              selectedObject={selectedObject}
              targetObject={targetObject}
              catalog={spaceData.catalog}
              isBackendOnline={spaceData.isBackendOnline}
              neoCount={spaceData.neoFeed?.element_count}
              onToggleLive={toggleLive}
              onTogglePause={togglePause}
              onSetSpeed={setSpeed}
              onSetScaleMode={setScaleMode}
              onToggleMoons={setShowMoons}
              onResetCamera={handleResetCamera}
              onSelectObject={handleSelectObject}
              onSelectTarget={handleSetTarget}
              seekToDays={seekToDays}
              seekToDate={seekToDate}
              syncToNow={syncToNow}
              stepTime={stepTime}
              onSelectEvent={handleSelectEvent}
              onModeChange={setAppMode}
              onOpenFactory={() => setIsFactoryOpen(true)}
            />
          </MovablePanel>
        </div>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      <ShortcutsModal 
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Observatory Settings & Location Modal */}
      <ObservatorySettingsModal
        isOpen={isObservatoryModalOpen}
        onClose={() => setIsObservatoryModalOpen(false)}
        observer={observer}
        onSaveObserver={setObserver}
        skyToggles={skyToggles}
        onSaveSkyToggles={setSkyToggles}
      />

      {/* Simulator Configuration Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        scaleMode={scaleMode}
        onSetScaleMode={setScaleMode}
        showOrbitLines={showOrbitLines}
        onToggleOrbitLines={(v) => {
          setShowOrbitLines(v);
          if (solarSystemRef.current?.engineRef?.current) {
            solarSystemRef.current.engineRef.current.setOrbitLinesVisible(v);
          }
        }}
        showMoons={showMoons}
        onToggleMoons={setShowMoons}
        showStars={showStars}
        onToggleStars={setShowStars}
        showVectors={showVectors}
        onToggleVectors={handleToggleVectors}
        showTrails={showTrails}
        onToggleTrails={handleToggleTrails}
        skyToggles={{
          ...skyToggles,
          layoutProfile: layoutState.profile,
          isEditMode: layoutState.isEditMode,
          isLocked: layoutState.isLocked,
          setLayoutProfile,
          resetLayout,
          setHudLocked,
          toggleEditMode
        }}
        onSaveSkyToggles={setSkyToggles}
      />

      {/* Space Data Factory Modal (Part 30) */}
      <SpaceDataFactoryModal
        isOpen={isFactoryOpen}
        onClose={() => setIsFactoryOpen(false)}
        spaceData={spaceData}
        simTimeDays={simTimeDays}
        seekToDate={seekToDate}
        seekToDays={seekToDays}
        solarSystemRef={solarSystemRef}
        onSelectObject={handleSelectObject}
        onModeChange={setAppMode}
        onOpenCompare={(objA, objB) => {
          setCompareObjA(objA || selectedObject || spaceData.catalog[0]);
          setIsCompareOpen(true);
        }}
        onOpenPlanner={() => setIsPlannerOpen(true)}
      />

      {/* Celestial Events Center Workspace Modal (PART 31) */}
      <CelestialEventsModal
        isOpen={isEventsOpen}
        onClose={() => setIsEventsOpen(false)}
        simTimeDays={simTimeDays}
        seekToDate={seekToDate}
        seekToDays={seekToDays}
        isPaused={isPaused}
        togglePause={togglePause}
        setSpeed={setSpeed}
        solarSystemRef={solarSystemRef}
        onSelectObject={handleSelectObject}
        onModeChange={setAppMode}
        onOpenPlanner={() => setIsPlannerOpen(true)}
      />

      {/* Two-Object Scientific Comparison Modal */}
      <ComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        initialObjA={compareObjA}
        catalog={spaceData.catalog}
        onFocusObject={handleSelectObject}
        simTimeDays={simTimeDays}
      />

      {/* Interplanetary Mission Planner Workspace */}
      <MissionPlannerModal
        isOpen={isPlannerOpen}
        onClose={() => setIsPlannerOpen(false)}
        simTimeDays={simTimeDays}
        seekToDate={seekToDate}
        catalog={spaceData.catalog}
        solarSystemRef={solarSystemRef}
        onSelectObject={handleSelectObject}
        isPaused={isPaused}
        onTogglePause={togglePause}
        onSetSpeed={setSpeed}
        onPlotTransfer={(orig, dest) => {
          if (solarSystemRef.current?.spacecraftRenderer) {
            solarSystemRef.current.spacecraftRenderer.renderHohmannTransferArc(orig, dest);
          }
        }}
      />

      {/* NEO Intelligence System (Part 35) — Press N or use button in header */}
      <NEOExplorerModal
        isOpen={isNEOExplorerOpen}
        onClose={() => setIsNEOExplorerOpen(false)}
        simTimeDays={simTimeDays}
        seekToDays={seekToDays}
        seekToDate={seekToDate}
        isPaused={isPaused}
        solarSystemRef={solarSystemRef}
        onSelectObject={handleSelectObject}
        onModeChange={setAppMode}
        onOpenPlanner={() => setIsPlannerOpen(true)}
      />
    </div>
  );
}

export default App;


