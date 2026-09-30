import React from 'react';

export default function DataStatus({ source }) {
  let statusText = 'INITIALIZING';
  let statusColor = 'yellow';
  
  if (source === 'live') {
    statusText = 'NASA DATA CONNECTED';
    statusColor = '#00ff00';
  } else if (source === 'cached' || source === 'offline-cache') {
    statusText = 'CACHED NASA DATA';
    statusColor = '#ffff00';
  } else if (source === 'offline') {
    statusText = 'NASA API OFFLINE';
    statusColor = '#ff0000';
  }

  return (
    <div className="data-status">
      <span style={{ color: statusColor, marginRight: '8px' }}>●</span>
      {statusText}
    </div>
  );
}
