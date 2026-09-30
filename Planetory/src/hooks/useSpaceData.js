import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchNeoFeed, fetchAsteroidCatalog, fetchCloseApproaches, checkServerStatus } from '../api/spaceApi';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useSpaceData() {
  const [neoFeed, setNeoFeed] = useState({ objects: [], status: 'loading' });
  const [asteroidCatalog, setAsteroidCatalog] = useState({ objects: [], status: 'loading' });
  const [closeApproaches, setCloseApproaches] = useState({ approaches: [], status: 'loading' });
  const [serverStatus, setServerStatus] = useState({ online: false, checked: false });
  const [apiStatuses, setApiStatuses] = useState({
    nasaNeows: 'checking',
    jplSbdb: 'checking',
    jplCneos: 'checking',
    jplHorizons: 'checking',
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const loadAll = useCallback(async () => {
    // 1. Check server
    const status = await checkServerStatus();
    setServerStatus({ ...status, checked: true });

    if (!status.online) {
      setApiStatuses({ nasaNeows: 'offline', jplSbdb: 'offline', jplCneos: 'offline', jplHorizons: 'offline' });
      setNeoFeed({ objects: [], status: 'offline', error: 'Backend server not reachable' });
      setAsteroidCatalog({ objects: [], status: 'offline', error: 'Backend server not reachable' });
      setCloseApproaches({ approaches: [], status: 'offline', error: 'Backend server not reachable' });
      return;
    }

    // Update API statuses from server response
    if (status.apis) {
      setApiStatuses({
        nasaNeows: status.apis.nasaNeows?.configured ? 'connected' : 'offline',
        jplSbdb: status.apis.jplSbdb?.configured ? 'connected' : 'offline',
        jplCneos: status.apis.jplCneos?.configured ? 'connected' : 'offline',
        jplHorizons: status.apis.jplHorizons?.configured ? 'connected' : 'offline',
      });
    }

    // 2. Fetch NEO feed (NASA NeoWs)
    const neoResult = await fetchNeoFeed();
    setNeoFeed({
      objects: neoResult.objects || [],
      status: neoResult.error ? 'error' : 'live',
      error: neoResult.message,
      generatedAt: neoResult.generatedAt,
      fromCache: neoResult.fromCache
    });
    if (neoResult.error) {
      setApiStatuses(prev => ({ ...prev, nasaNeows: 'error' }));
    }

    // 3. Fetch NEO catalog from JPL SBDB
    const catalogResult = await fetchAsteroidCatalog({ group: 'neo', limit: 300 });
    setAsteroidCatalog({
      objects: catalogResult.objects || [],
      status: catalogResult.error ? 'error' : 'live',
      error: catalogResult.message,
      count: catalogResult.count,
      fromCache: catalogResult.fromCache
    });
    if (catalogResult.error) {
      setApiStatuses(prev => ({ ...prev, jplSbdb: 'error' }));
    }

    // 4. Fetch close approaches (JPL CNEOS)
    const cadResult = await fetchCloseApproaches({ distMax: '0.2', limit: 50 });
    setCloseApproaches({
      approaches: cadResult.approaches || [],
      status: cadResult.error ? 'error' : 'live',
      error: cadResult.message,
      fromCache: cadResult.fromCache
    });
    if (cadResult.error) {
      setApiStatuses(prev => ({ ...prev, jplCneos: 'error' }));
    }

    setLastUpdated(new Date().toISOString());
  }, []);

  useEffect(() => {
    loadAll();
    timerRef.current = setInterval(loadAll, REFRESH_INTERVAL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadAll]);

  return {
    neoFeed,
    asteroidCatalog,
    closeApproaches,
    serverStatus,
    apiStatuses,
    lastUpdated,
    refresh: loadAll
  };
}
