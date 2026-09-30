import React, { useState } from 'react';

const NASA_GALLERY_CATALOG = {
  saturn: [
    { id: 'sat-1', title: 'Cassini Grand Finale Saturn', observatory: 'Cassini Spacecraft', year: 2017, url: '/textures/saturnmap.jpg', caption: 'Natural color composite of Saturn and its rings taken by Cassini before atmospheric entry.' },
    { id: 'sat-2', title: 'Hubble OPAL Saturn Portrait', observatory: 'Hubble Space Telescope', year: 2021, url: 'https://images-assets.nasa.gov/image/PIA24840/PIA24840~medium.jpg', caption: 'Hubble Outer Planet Atmospheres Legacy (OPAL) program crisp view of Saturnian storm bands.' },
    { id: 'sat-3', title: 'Cassini Titan & Enceladus', observatory: 'Cassini ISS', year: 2015, url: 'https://images-assets.nasa.gov/image/PIA17218/PIA17218~medium.jpg', caption: 'Titan and ocean moon Enceladus silhouetted against Saturn ring plane.' }
  ],
  jupiter: [
    { id: 'jup-1', title: 'Juno Great Red Spot Close-up', observatory: 'JunoCam / NASA', year: 2018, url: 'https://images-assets.nasa.gov/image/PIA21980/PIA21980~medium.jpg', caption: 'High-contrast perijove image of Jupiter Great Red Spot swirling cloud bands.' },
    { id: 'jup-2', title: 'JWST Infrared Jupiter', observatory: 'James Webb Space Telescope', year: 2022, url: 'https://images-assets.nasa.gov/image/PIA25425/PIA25425~medium.jpg', caption: 'NIRCam composite showing Jovian aurorae, haze layers, and faint ring system.' }
  ],
  earth: [
    { id: 'ear-1', title: 'DSCOVR Epic Earth Disc', observatory: 'DSCOVR / NASA', year: 2022, url: '/textures/earthmap1k.jpg', caption: 'Full sunlit hemisphere of Earth captured from L1 Lagrange Point.' },
    { id: 'ear-2', title: 'Apollo 17 Earthrise', observatory: 'Apollo 17 / NASA', year: 1972, url: 'https://images-assets.nasa.gov/image/AS17-148-22727/AS17-148-22727~medium.jpg', caption: 'Classic Earthrise over the lunar horizon.' }
  ],
  mars: [
    { id: 'mar-1', title: 'MRO Valles Marineris', observatory: 'Mars Reconnaissance Orbiter', year: 2020, url: 'https://images-assets.nasa.gov/image/PIA00407/PIA00407~medium.jpg', caption: 'Viking mosaic of the giant Martian canyon system Valles Marineris.' }
  ]
};

/**
 * ScientificImageGallery.jsx - NASA / Observatory Image Gallery Module
 * Scrollable NASA gallery featuring Hubble, JWST, Cassini, Voyager, Juno images with metadata & fullscreen modal.
 */
export default function ScientificImageGallery({ selectedObj }) {
  const [activeModalImg, setActiveModalImg] = useState(null);

  const objId = selectedObj?.id || 'saturn';
  const images = NASA_GALLERY_CATALOG[objId] || NASA_GALLERY_CATALOG['saturn'];

  return (
    <div className="sci-widget nasa-gallery-widget sci-panel-v7">
      <div className="widget-title font-mono">📸 NASA / OBSERVATORY IMAGE GALLERY</div>

      <div className="gallery-scroll-row font-mono">
        {images.map(img => (
          <div key={img.id} className="gallery-card" onClick={() => setActiveModalImg(img)}>
            <div className="gallery-thumb-wrap">
              <img src={img.url} alt={img.title} className="gallery-thumb-img" onError={(e) => { e.target.src = '/textures/saturnmap.jpg'; }} />
              <span className="gallery-tag font-mono">{img.observatory}</span>
            </div>
            <div className="gallery-card-body">
              <div className="gallery-card-title">{img.title}</div>
              <div className="gallery-card-meta text-cyan">{img.year} · {img.observatory}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Image Preview Modal */}
      {activeModalImg && (
        <div className="gallery-modal-overlay" onClick={() => setActiveModalImg(null)}>
          <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setActiveModalImg(null)}>✕</button>
            <img src={activeModalImg.url} alt={activeModalImg.title} className="gallery-modal-img" />
            <div className="gallery-modal-info font-mono">
              <h3 className="text-cyan">{activeModalImg.title}</h3>
              <p className="text-amber">OBSERVATORY: {activeModalImg.observatory} ({activeModalImg.year})</p>
              <p className="gallery-caption">{activeModalImg.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
