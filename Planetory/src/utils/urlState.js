import { getDaysSinceJ2000, j2000DaysToDate } from './dateUtils.js';

/**
 * URL Parameter Simulation State Serialization & Restore (PART 8, Req 49, 50)
 */

export function parseURLState() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);

  const dateParam = params.get('date');
  const objectParam = params.get('object');
  const speedParam = params.get('speed');
  const scaleParam = params.get('scale');

  let simTimeDays = null;
  if (dateParam) {
    const parsedDate = new Date(dateParam);
    if (!isNaN(parsedDate.getTime())) {
      simTimeDays = getDaysSinceJ2000(parsedDate);
    }
  }

  return {
    simTimeDays,
    objectId: objectParam || null,
    speedMultiplier: speedParam ? Number(speedParam) : null,
    scaleMode: scaleParam || null
  };
}

let lastUrlUpdateTime = 0;

export function updateURLState({ simTimeDays, selectedObjectId, speedMultiplier, scaleMode }) {
  if (typeof window === 'undefined') return;

  // Throttle URL history updates to at most once per 1000ms to prevent browser IPC flooding
  const now = Date.now();
  if (now - lastUrlUpdateTime < 1000) return;
  lastUrlUpdateTime = now;

  const url = new URL(window.location.href);
  const params = url.searchParams;

  if (simTimeDays != null) {
    const date = j2000DaysToDate(simTimeDays);
    params.set('date', date.toISOString());
  } else {
    params.delete('date');
  }

  if (selectedObjectId) {
    params.set('object', selectedObjectId);
  } else {
    params.delete('object');
  }

  if (speedMultiplier !== undefined && speedMultiplier !== 1) {
    params.set('speed', speedMultiplier.toString());
  } else {
    params.delete('speed');
  }

  if (scaleMode && scaleMode !== 'balanced') {
    params.set('scale', scaleMode);
  } else {
    params.delete('scale');
  }

  window.history.replaceState({}, '', `${url.pathname}?${params.toString()}`);
}
