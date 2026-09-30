import React, { useState, useEffect, useCallback } from 'react';
import { fetchNeoFeed, searchNEOs, fetchEarthApproaches, fetchRiskSummary } from '../../api/neoApi.js';

const NEOSearchPanel = ({ onSelectNEO, selectedNEOId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('feed');
  const [sortBy, setSortBy] = useState('date');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (filterMode === 'feed') {
        const feed = await fetchNeoFeed();
        data = feed?.objects || [];
      } else if (filterMode === 'search') {
        const search = await searchNEOs(searchQuery);
        data = search?.objects || [];
      } else if (filterMode === 'pha') {
        const feed = await fetchNeoFeed();
        data = feed?.objects?.filter(o => o.isPha) || [];
      } else if (filterMode === 'approaches') {
        const approaches = await fetchEarthApproaches();
        data = approaches?.approaches || [];
      } else if (filterMode === 'sentry') {
        const sentry = await fetchRiskSummary();
        data = sentry?.objects || [];
      }
      setResults(data);
    } catch (err) {
      setError('DATA UNAVAILABLE');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [filterMode, searchQuery, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, filterMode, page, fetchResults]);

  const tabs = [
    { id: 'feed', label: '7-DAY FEED' },
    { id: 'search', label: 'SEARCH' },
    { id: 'pha', label: 'PHA ONLY' },
    { id: 'approaches', label: 'APPROACHES' },
    { id: 'sentry', label: 'SENTRY RISK' }
  ];

  return (
    <div style={{ background: 'rgba(2, 4, 10, 0.95)', color: '#e0e8ff', height: '100%', display: 'flex', flexDirection: 'column' }} className="neo-search-panel">
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {tabs.map(tab => (
          <div key={tab.id}
            onClick={() => setFilterMode(tab.id)}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              borderBottom: filterMode === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
              color: filterMode === tab.id ? '#00f0ff' : '#8892a4',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
            {tab.label}
          </div>
        ))}
      </div>
      
      {filterMode === 'search' && (
        <div style={{ padding: '16px' }}>
          <input 
            type="text" 
            placeholder="Search NEO name or designation..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px',
              outline: 'none'
            }}
          />
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#00f0ff' }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#ff3d00', fontWeight: 'bold' }}>{error}</div>
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8892a4' }}>No results found.</div>
        ) : (
          results.map((item, idx) => {
            const isSelected = selectedNEOId === item.id;
            const isPHA = item.isPha;
            const isSentry = item.sentryMonitored || item.probability !== undefined;
            const riskProb = item.probability || 0;
            const distLD = item.distAu ? (item.distAu * 389.26).toFixed(2) : '--';
            const distAU = item.distAu ? parseFloat(item.distAu).toFixed(5) : '--';
            const vel = item.velocityKmS ? parseFloat(item.velocityKmS).toFixed(1) : '--';

            let riskDotColor = '#4caf50'; // none
            if (riskProb > 0) riskDotColor = '#ff3d00'; // nonzero IP
            else if (isSentry) riskDotColor = '#ff8c00'; // sentry

            return (
              <div key={item.id || idx} onClick={() => onSelectNEO(item)} style={{
                background: isSelected ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: isSelected ? '#00f0ff' : 'rgba(255,255,255,0.05)',
                borderLeft: isSelected ? '4px solid #00f0ff' : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '6px', padding: '12px', cursor: 'pointer',
                boxShadow: isSelected ? '0 0 10px rgba(0,240,255,0.2)' : 'none',
                transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{item.name || 'Unknown'}</span>
                    <span style={{ marginLeft: '8px', fontSize: '10px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{item.designation || item.id || ''}</span>
                  </div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: riskDotColor, marginTop: '4px' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '6px', margin: '8px 0' }}>
                  <span style={{ fontSize: '10px', background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 6px', borderRadius: '4px' }}>NEO</span>
                  {isPHA && <span style={{ fontSize: '10px', background: 'rgba(255, 183, 3, 0.1)', color: '#ffb703', padding: '2px 6px', borderRadius: '4px' }}>PHA</span>}
                  {isSentry && <span style={{ fontSize: '10px', background: 'rgba(255, 140, 0, 0.1)', color: '#ff8c00', padding: '2px 6px', borderRadius: '4px' }}>SENTRY</span>}
                </div>

                <div style={{ fontSize: '12px', color: '#8892a4', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>{item.date ? new Date(item.date).toLocaleDateString() : 'Date N/A'}</div>
                  <div>Distance: {distLD} LD / {distAU} AU</div>
                  <div>Velocity: {vel} km/s</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NEOSearchPanel;
