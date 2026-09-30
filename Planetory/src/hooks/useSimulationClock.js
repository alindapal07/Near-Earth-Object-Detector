import { useState, useEffect, useRef } from 'react';
import { getDaysSinceJ2000 } from '../utils/dateUtils';

/**
 * Single Authoritative Simulation Clock Hook (PART 8)
 * Manages continuous simulation time (days since J2000), speeds (-1e6x to +1e6x),
 * modes (LIVE, PAUSED, FORWARD, REVERSE), and date seeking.
 */
export function useSimulationClock(initialLive = false) {
  const [isLive, setIsLive] = useState(initialLive);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [simTimeDays, setSimTimeDaysState] = useState(getDaysSinceJ2000(new Date()));
  
  const lastRealTime = useRef(performance.now());
  const requestRef = useRef();

  useEffect(() => {
    const updateTime = () => {
      const now = performance.now();
      const deltaMs = now - lastRealTime.current;
      lastRealTime.current = now;

      if (isLive) {
        setSimTimeDaysState(getDaysSinceJ2000(new Date()));
      } else if (!isPaused) {
        // simulationSpeed of 1 = 1 day per real second
        // Negative speedMultiplier = reverse time propagation
        const timeStepDays = (deltaMs / 1000) * speedMultiplier;
        setSimTimeDaysState(prev => prev + timeStepDays);
      }
      
      requestRef.current = requestAnimationFrame(updateTime);
    };

    requestRef.current = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isLive, isPaused, speedMultiplier]);

  const toggleLive = () => {
    setIsLive(prev => {
      if (!prev) {
        setSimTimeDaysState(getDaysSinceJ2000(new Date()));
        setIsPaused(false);
        setSpeedMultiplier(1);
      }
      return !prev;
    });
  };

  const syncToNow = () => {
    setIsLive(true);
    setIsPaused(false);
    setSpeedMultiplier(1);
    setSimTimeDaysState(getDaysSinceJ2000(new Date()));
  };

  const setSpeed = (speed) => {
    setIsLive(false);
    setIsPaused(false);
    setSpeedMultiplier(speed);
  };

  const togglePause = () => {
    if (isLive) {
      setIsLive(false);
    }
    setIsPaused(prev => !prev);
  };

  const seekToDays = (days) => {
    setIsLive(false);
    setSimTimeDaysState(Number(days));
  };

  const seekToDate = (date) => {
    setIsLive(false);
    setSimTimeDaysState(getDaysSinceJ2000(date));
  };

  const stepTime = (stepCount, unit = 'day') => {
    setIsLive(false);
    let deltaDays = 0;
    if (unit === 'minute') deltaDays = stepCount / (24 * 60);
    else if (unit === 'hour') deltaDays = stepCount / 24;
    else if (unit === 'day') deltaDays = stepCount;
    else if (unit === 'year') deltaDays = stepCount * 365.25;

    setSimTimeDaysState(prev => prev + deltaDays);
  };

  return {
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
  };
}

