import React, { useState, useEffect } from 'react';
import * as THREE from 'three';

export default function TargetReticle({ selectedObject, solarSystemRef, simTimeDays }) {
  const [screenPos, setScreenPos] = useState(null);

  useEffect(() => {
    if (!selectedObject || !solarSystemRef?.current?.engineRef?.current) {
      setScreenPos(null);
      return;
    }

    let animId;
    const engine = solarSystemRef.current.engineRef.current;

    const updatePosition = () => {
      const targetId = selectedObject.id || selectedObject.spkid || selectedObject.name;
      const mesh = engine.sceneManager?.getObjectMesh(targetId);

      if (mesh && engine.camera) {
        const worldPos = new THREE.Vector3();
        mesh.getWorldPosition(worldPos);

        const projected = worldPos.clone().project(engine.camera);

        // Check if object is in front of camera lens
        const isBehind = projected.z > 1.0;
        const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(projected.y * 0.5) + 0.5) * window.innerHeight;

        // Verify inside screen bounds with padding
        const inBounds = x >= -50 && x <= window.innerWidth + 50 && y >= -50 && y <= window.innerHeight + 50;

        if (!isBehind && inBounds) {
          setScreenPos({ x, y });
        } else {
          setScreenPos(null);
        }
      } else {
        setScreenPos(null);
      }

      animId = requestAnimationFrame(updatePosition);
    };

    animId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animId);
  }, [selectedObject, solarSystemRef, simTimeDays]);

  if (!selectedObject || !screenPos) return null;

  const name = selectedObject.name || selectedObject.fullName || selectedObject.designation || 'TARGET';
  const type = selectedObject.category || selectedObject.type || 'CELESTIAL BODY';

  return (
    <div 
      className="hud-target-reticle"
      style={{
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`
      }}
    >
      <div className="reticle-box">
        <span className="reticle-corner reticle-tl" />
        <span className="reticle-corner reticle-tr" />
        <span className="reticle-corner reticle-bl" />
        <span className="reticle-corner reticle-br" />
        <span className="reticle-crosshair-h" />
        <span className="reticle-crosshair-v" />
      </div>
      <div className="reticle-info-tag">
        <span className="r-tag-title">{name.toUpperCase()}</span>
        <span className="r-tag-sub">{type.toUpperCase()}</span>
      </div>
    </div>
  );
}
