import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import SimulationEngine from '../engine/SimulationEngine';
import { getCometData } from '../api/nasaApi';

const SolarSystem = forwardRef(function SolarSystem({
  simTimeDays,
  simulationSpeed,
  isPaused,
  scaleMode,
  catalog,
  showMoons = true,
  appMode = 'SOLAR_SYSTEM',
  observer,
  skyToggles,
  onSelectObject,
  onDataStatus
}, ref) {
  const containerRef = useRef(null);
  const engineRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusOnObject: (id) => {
      if (engineRef.current) engineRef.current.focusOnObject(id);
    },
    focusOnPosition: (x, y, z, dist) => {
      if (engineRef.current) engineRef.current.focusOnPosition(x, y, z, dist);
    },
    setFollowObject: (enabled) => {
      if (engineRef.current) engineRef.current.setFollowObject(enabled);
    },
    resetCamera: () => {
      if (engineRef.current) engineRef.current.resetCamera();
    },
    showTrajectoryForAsteroid: (ast) => {
      if (engineRef.current) engineRef.current.showTrajectoryForAsteroid(ast);
    },
    setAppMode: (mode) => {
      if (engineRef.current) engineRef.current.setAppMode(mode);
    },
    setObserver: (obs) => {
      if (engineRef.current) engineRef.current.setObserver(obs);
    },
    // ── Mission Control APIs ─────────────────────────────────────────────────
    plotMissionTrajectory: (transferResult) => {
      if (engineRef.current) engineRef.current.plotMissionTrajectory(transferResult);
    },
    clearMission: () => {
      if (engineRef.current) engineRef.current.clearMission();
    },
    setMissionVelocityVectors: (enabled) => {
      if (engineRef.current) engineRef.current.setMissionVelocityVectors(enabled);
    },
    setMissionSOI: (enabled) => {
      if (engineRef.current) engineRef.current.setMissionSOI(enabled);
    },
    focusActiveMission: () => {
      if (engineRef.current) engineRef.current.focusActiveMission();
    },
    focusMissionOverview: () => {
      if (engineRef.current) engineRef.current.focusMissionOverview();
    },
    followSpacecraft: () => {
      if (engineRef.current) engineRef.current.followSpacecraft();
    },
    // ── NEO Orbit APIs (Part 35) ─────────────────────────────────────────────
    renderNEOOrbit: (neoObj, simTimeDays) => {
      if (engineRef.current) engineRef.current.renderNEOOrbit(neoObj, simTimeDays);
    },
    clearNEO: () => {
      if (engineRef.current) engineRef.current.clearNEO();
    },
    focusNEO: () => {
      if (engineRef.current) engineRef.current.focusNEO();
    },
    renderEarthEncounter: (neoObj, approach, simTimeDays) => {
      if (engineRef.current) engineRef.current.renderEarthEncounter(neoObj, approach, simTimeDays);
    },
    focusNEOOverview: () => {
      if (engineRef.current) engineRef.current.focusNEOOverview();
    },
    setNEOUncertaintyVisible: (visible) => {
      if (engineRef.current) engineRef.current.setNEOUncertaintyVisible(visible);
    },
    // raw engine access (for Mission Control diagnostics)
    getEngine: () => engineRef.current
  }));

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new SimulationEngine(containerRef.current, onSelectObject);
    engine.init();
    engineRef.current = engine;

    if (appMode) engine.setAppMode(appMode);
    if (observer) engine.setObserver(observer);
    if (skyToggles) engine.setSkyToggles(skyToggles);

    // Load comets
    getCometData().then(({ data, source }) => {
      if (engineRef.current) {
        engineRef.current.addComets(data);
        if (onDataStatus) onDataStatus(source);
      }
    });

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  // Sync app mode
  useEffect(() => {
    if (engineRef.current && appMode) {
      engineRef.current.setAppMode(appMode);
    }
  }, [appMode]);

  // Sync observer location
  useEffect(() => {
    if (engineRef.current && observer) {
      engineRef.current.setObserver(observer);
    }
  }, [observer]);

  // Sync sky toggles
  useEffect(() => {
    if (engineRef.current && skyToggles) {
      engineRef.current.setSkyToggles(skyToggles);
    }
  }, [skyToggles]);

  // Sync catalog asteroids
  useEffect(() => {
    if (engineRef.current && catalog && catalog.length > 0) {
      engineRef.current.loadCatalogAsteroids(catalog);
    }
  }, [catalog]);

  // Sync moons visibility
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMoonsVisible(showMoons);
    }
  }, [showMoons]);

  // Sync clock
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSimulationTime(simTimeDays);
    }
  }, [simTimeDays]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setSpeed(simulationSpeed);
    }
  }, [simulationSpeed]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setPaused(isPaused);
    }
  }, [isPaused]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setScaleMode(scaleMode);
    }
  }, [scaleMode]);

  return (
    <div 
      ref={containerRef} 
      style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }} 
    />
  );
});

export default SolarSystem;
