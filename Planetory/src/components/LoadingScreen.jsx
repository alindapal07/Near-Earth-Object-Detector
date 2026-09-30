import React, { useState, useEffect } from 'react';

export default function LoadingScreen({ onFinished }) {
  const [step, setStep] = useState(0);

  const messages = [
    "INITIALIZING CELESTIAL ENGINE...",
    "LOADING PLANETARY KEPLERIAN EPHEMERIDES...",
    "CONFIGURING SATELLITE SYSTEM HIERARCHY...",
    "SYNCHRONIZING JPL HORIZONS DATA FEED...",
    "MOUNTING ASTRONOMICAL COORDINATE ENGINE...",
    "SYSTEM READY"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev < messages.length - 1) return prev + 1;
        clearInterval(timer);
        setTimeout(() => {
          if (onFinished) onFinished();
        }, 300);
        return prev;
      });
    }, 240);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="loading-screen-overlay">
      <div className="loading-splash-card">
        <h1 className="splash-title">PLANETORY</h1>
        <p className="splash-sub">ASTRONOMICAL SPACE SIMULATOR & EPHEMERIS ENGINE</p>
        
        <div className="splash-progress-wrap">
          <div 
            className="splash-progress-bar"
            style={{ width: `${((step + 1) / messages.length) * 100}%` }}
          />
        </div>

        <div className="splash-status-text font-mono">
          {messages[step]}
        </div>
      </div>
    </div>
  );
}
