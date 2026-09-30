/**
 * planetaryDetails.js - Authoritative Planetary Interiors, Atmospheres, Rings, Topography & Mission Histories
 * Provides scientific data for cutaways, atmospheric graphs, ring maps, storm analysis, and mission timelines.
 */

export const PLANETARY_DETAILS = {
  sun: {
    interior: [
      { name: 'Core', depthKm: '0 - 175,000 km', tempK: '15,000,000 K', desc: 'Nuclear fusion engine fusing 600M tons of hydrogen per second into helium.', color: '#ffffff' },
      { name: 'Radiative Zone', depthKm: '175,000 - 490,000 km', tempK: '7,000,000 K', desc: 'Photons bounce for 100,000 years to travel outward.', color: '#ffb703' },
      { name: 'Convective Zone', depthKm: '490,000 - 696,000 km', tempK: '2,000,000 K', desc: 'Giant plasma convection currents carry heat to the surface.', color: '#ff6b00' },
      { name: 'Photosphere', depthKm: 'Surface Layer', tempK: '5,778 K', desc: 'Visible solar surface featuring sunspots and granulation.', color: '#ffea00' },
      { name: 'Chromosphere & Corona', depthKm: 'Outer Atmosphere', tempK: '1,000,000 - 3,000,000 K', desc: 'Superheated solar atmosphere launching the solar wind.', color: '#ff3d00' }
    ],
    atmosphere: {
      scaleHeightKm: 270,
      surfacePressureBar: 'N/A (Gaseous)',
      layers: [
        { altitudeKm: 0, tempK: 5778, pressureBar: 0.12, composition: 'H (73.4%), He (24.9%)' },
        { altitudeKm: 500, tempK: 4100, pressureBar: 1e-4, composition: 'H, He, ionized metals' },
        { altitudeKm: 2000, tempK: 20000, pressureBar: 1e-8, composition: 'Protons, Electrons' },
        { altitudeKm: 10000, tempK: 1500000, pressureBar: 1e-12, composition: 'Solar Wind Plasma' }
      ]
    },
    magneticField: {
      strengthGauss: '1 - 1000 G (Sunspots)',
      dipoleTiltDeg: 7.25,
      polarityReversalYears: 11,
      features: '11-year solar cycle, magnetic flux ropes, coronal mass ejections (CMEs).'
    },
    missions: [
      { name: 'SOHO', year: 1995, agency: 'NASA / ESA', type: 'Orbiter', desc: 'Continuous solar halo orbit monitoring.' },
      { name: 'SDO', year: 2010, agency: 'NASA', type: 'Orbiter', desc: 'Ultra-HD solar atmosphere magnetic field imaging.' },
      { name: 'Parker Solar Probe', year: 2018, agency: 'NASA', type: 'Flyby/Probe', desc: 'Closest human object to Sun, touching solar corona.' }
    ]
  },

  mercury: {
    interior: [
      { name: 'Solid Inner Core', depthKm: '0 - 1,000 km', tempK: '1,800 K', desc: 'Dense metallic iron core.', color: '#8d99ae' },
      { name: 'Molten Outer Core', depthKm: '1,000 - 2,000 km', tempK: '1,500 K', desc: 'Liquid iron-nickel core generating weak dynamo.', color: '#d90429' },
      { name: 'Silicate Mantle', depthKm: '2,000 - 2,400 km', tempK: '800 K', desc: 'Thin rocky silicate mantle.', color: '#6c757d' },
      { name: 'Silicate Crust', depthKm: '0 - 35 km', tempK: '100 - 700 K', desc: 'Heavily cratered surface with contraction lobate scarps.', color: '#495057' }
    ],
    atmosphere: {
      scaleHeightKm: 15,
      surfacePressureBar: '10⁻¹⁵ bar (Exosphere)',
      layers: [
        { altitudeKm: 0, tempK: 440, pressureBar: 1e-15, composition: 'Na (29%), O (42%), He (6%), H (22%)' }
      ]
    },
    magneticField: {
      strengthGauss: '0.003 G (1% Earth)',
      dipoleTiltDeg: 4.5,
      features: 'Global magnetic field shielding exosphere from solar wind sputtering.'
    },
    missions: [
      { name: 'Mariner 10', year: 1974, agency: 'NASA', type: 'Flyby', desc: 'First flyby imaging 45% of Mercury.' },
      { name: 'MESSENGER', year: 2011, agency: 'NASA', type: 'Orbiter', desc: 'First Mercury orbiter, discovered polar water ice.' },
      { name: 'BepiColombo', year: 2025, agency: 'ESA / JAXA', type: 'Orbiter', desc: 'Dual orbiter studying magnetic field & magnetosphere.' }
    ]
  },

  venus: {
    interior: [
      { name: 'Metallic Core', depthKm: '0 - 3,000 km', tempK: '4,000 K', desc: 'Iron-nickel core, no strong internal dynamo.', color: '#b7094c' },
      { name: 'Silicate Mantle', depthKm: '3,000 - 6,000 km', tempK: '2,500 K', desc: 'Convecting rocky silicate mantle.', color: '#e07a5f' },
      { name: 'Volcanic Crust', depthKm: '0 - 50 km', tempK: '737 K', desc: 'Basaltic crust dominated by tens of thousands of volcanoes.', color: '#892b1e' }
    ],
    atmosphere: {
      scaleHeightKm: 15.9,
      surfacePressureBar: '92 bar (92× Earth)',
      layers: [
        { altitudeKm: 0, tempK: 737, pressureBar: 92.0, composition: 'CO₂ (96.5%), N₂ (3.5%)' },
        { altitudeKm: 30, tempK: 490, pressureBar: 9.5, composition: 'Dense CO₂ fog' },
        { altitudeKm: 50, tempK: 340, pressureBar: 1.0, composition: 'Sulfuric acid cloud deck (Earth-like pressure)' },
        { altitudeKm: 70, tempK: 230, pressureBar: 0.04, composition: 'Upper haze deck, super-rotation winds (360 km/h)' }
      ]
    },
    magneticField: {
      strengthGauss: '0 (Induced Magnetosphere)',
      features: 'No internal dynamo. Solar wind interacts directly with ionosphere.'
    },
    missions: [
      { name: 'Venera 7', year: 1970, agency: 'USSR', type: 'Lander', desc: 'First successful landing & data transmit from another planet.' },
      { name: 'Magellan', year: 1989, agency: 'NASA', type: 'Orbiter', desc: 'Mapped 98% of Venus surface via synthetic aperture radar.' },
      { name: 'Akatsuki', year: 2015, agency: 'JAXA', type: 'Orbiter', desc: 'Studying atmospheric super-rotation and gravity waves.' }
    ]
  },

  earth: {
    interior: [
      { name: 'Solid Inner Core', depthKm: '0 - 1,220 km', tempK: '5,700 K', desc: 'Solid iron-nickel alloy crystalline sphere.', color: '#f8f9fa' },
      { name: 'Liquid Outer Core', depthKm: '1,220 - 3,480 km', tempK: '4,500 K', desc: 'Convecting liquid iron generating geomagnetic field.', color: '#ffb703' },
      { name: 'Lower Mantle', depthKm: '3,480 - 5,700 km', tempK: '3,000 K', desc: 'Solid silicate rock undergoing slow thermal convection.', color: '#d97706' },
      { name: 'Upper Mantle & Asthenosphere', depthKm: '5,700 - 6,330 km', tempK: '1,200 K', desc: 'Viscous mantle driving plate tectonics.', color: '#059669' },
      { name: 'Oceanic & Continental Crust', depthKm: '0 - 70 km', tempK: '290 K', desc: 'Tectonically active crust supporting liquid water ocean.', color: '#0284c7' }
    ],
    atmosphere: {
      scaleHeightKm: 8.5,
      surfacePressureBar: '1.013 bar',
      layers: [
        { altitudeKm: 0, tempK: 288, pressureBar: 1.013, composition: 'N₂ (78%), O₂ (21%), Ar (0.9%), CO₂ (0.04%)' },
        { altitudeKm: 12, tempK: 216, pressureBar: 0.19, composition: 'Tropopause / Commercial Aviation level' },
        { altitudeKm: 50, tempK: 270, pressureBar: 0.001, composition: 'Stratosphere / Ozone layer' },
        { altitudeKm: 85, tempK: 180, pressureBar: 1e-5, composition: 'Mesosphere / Noctilucent clouds' },
        { altitudeKm: 500, tempK: 1200, pressureBar: 1e-10, composition: 'Thermosphere / ISS & Aurora borealis' }
      ]
    },
    magneticField: {
      strengthGauss: '0.25 - 0.65 G',
      dipoleTiltDeg: 11.3,
      features: 'Strong magnetosphere deflecting solar wind, creating Van Allen radiation belts.'
    },
    missions: [
      { name: 'Landsat 1', year: 1972, agency: 'NASA / USGS', type: 'Earth Observer', desc: 'First continuous multispectral satellite observation of Earth.' },
      { name: 'GRACE', year: 2002, agency: 'NASA / DLR', type: 'Gravity Mapper', desc: 'Mapped Earth gravity field anomalies and polar ice loss.' },
      { name: 'Sentinel Fleet', year: 2014, agency: 'ESA Copernicus', type: 'Constellation', desc: 'Global environmental monitoring satellite fleet.' }
    ]
  },

  mars: {
    interior: [
      { name: 'Liquid Iron Core', depthKm: '0 - 1,830 km', tempK: '2,000 K', desc: 'Iron-nickel-sulfur core confirmed by NASA InSight.', color: '#e63946' },
      { name: 'Silicate Mantle', depthKm: '1,830 - 3,340 km', tempK: '1,500 K', desc: 'Solid silicate mantle with low mantle convection.', color: '#f4a261' },
      { name: 'Basaltic Crust', depthKm: '0 - 50 km', tempK: '210 K', desc: 'Iron oxide rich basalt crust giving red appearance.', color: '#a71d31' }
    ],
    atmosphere: {
      scaleHeightKm: 11.1,
      surfacePressureBar: '0.006 bar (0.6% Earth)',
      layers: [
        { altitudeKm: 0, tempK: 210, pressureBar: 0.0063, composition: 'CO₂ (95.3%), N₂ (2.6%), Ar (1.9%)' },
        { altitudeKm: 20, tempK: 180, pressureBar: 0.0008, composition: 'Dust haze deck & water ice clouds' },
        { altitudeKm: 80, tempK: 130, pressureBar: 1e-6, composition: 'Upper atmosphere carbon dioxide haze' }
      ]
    },
    magneticField: {
      strengthGauss: '0 (Remnant Crustal Fields)',
      features: 'Lost global dynamo 4 billion years ago. Remnant magnetized crustal patches in southern hemisphere.'
    },
    topography: [
      { name: 'Olympus Mons', type: 'Shield Volcano', stat: '21.9 km high (3× Everest)', desc: 'Largest volcano in Solar System.' },
      { name: 'Valles Marineris', type: 'Canyon System', stat: '4,000 km long, 7 km deep', desc: 'Grand canyon spanning 20% of planet circumference.' },
      { name: 'Hellas Planitia', type: 'Impact Basin', stat: '2,300 km diameter', desc: 'Giant impact basin with highest atmospheric pressure on Mars.' }
    ],
    missions: [
      { name: 'Viking 1 & 2', year: 1976, agency: 'NASA', type: 'Lander/Orbiter', desc: 'First successful Mars landers conducting biology experiments.' },
      { name: 'Curiosity Rover', year: 2012, agency: 'NASA / JPL', type: 'Rover', desc: 'Explored Gale Crater, confirmed ancient habitable lakebed.' },
      { name: 'Perseverance & Ingenuity', year: 2021, agency: 'NASA / JPL', type: 'Rover & Helicopter', desc: 'Collecting sample tubes in Jezero Crater; 72 powered helicopter flights.' }
    ]
  },

  jupiter: {
    interior: [
      { name: 'Dense Heavy-Element Core', depthKm: '0 - 10,000 km', tempK: '36,000 K', desc: 'Fuzzy, diluted core of rock, ice & heavy elements (10-25 Earth masses).', color: '#f8fafc' },
      { name: 'Liquid Metallic Hydrogen', depthKm: '10,000 - 50,000 km', tempK: '20,000 K', desc: 'Liquid hydrogen pressurized into electrical conductor, generating magnetic field.', color: '#00f0ff' },
      { name: 'Liquid Molecular Hydrogen', depthKm: '50,000 - 67,000 km', tempK: '6,000 K', desc: 'Liquid molecular hydrogen and helium fluid sea.', color: '#3b82f6' },
      { name: 'Gaseous Atmosphere', depthKm: '0 - 3,000 km', tempK: '165 - 300 K', desc: 'Ammonia, ammonium hydrosulfide, and water ice clouds.', color: '#f59e0b' }
    ],
    atmosphere: {
      scaleHeightKm: 27,
      surfacePressureBar: '1 bar (cloud tops) to >10,000 bar',
      layers: [
        { altitudeKm: 0, tempK: 165, pressureBar: 1.0, composition: 'Ammonia ice clouds (NH₃)' },
        { altitudeKm: -30, tempK: 210, pressureBar: 2.2, composition: 'Ammonium hydrosulfide clouds (NH₄SH)' },
        { altitudeKm: -70, tempK: 300, pressureBar: 5.0, composition: 'Water ice & liquid water cloud layer (H₂O)' },
        { altitudeKm: -150, tempK: 450, pressureBar: 20.0, composition: 'H₂ (89.8%), He (10.2%) interior fluid' }
      ]
    },
    magneticField: {
      strengthGauss: '4.2 - 14 G (20,000× Earth momentum)',
      features: 'Largest structure in Solar System. Magnetotail extends beyond Saturn orbit. Io flux tube triggers powerful UV auroras.'
    },
    storm: {
      name: 'Great Red Spot',
      diameterKm: 16350,
      windSpeedKmH: 640,
      latitude: '22° South',
      ageYears: '>350 years',
      desc: 'Anticyclonic storm larger than Earth, persistent since at least 1665.'
    },
    missions: [
      { name: 'Pioneer 10 & 11', year: 1973, agency: 'NASA', type: 'Flyby', desc: 'First flyby of Jupiter, mapped radiation belts.' },
      { name: 'Galileo', year: 1995, agency: 'NASA / JPL', type: 'Orbiter & Atmospheric Probe', desc: '8-year Jupiter orbiter, dropped probe 150 km into Jovian atmosphere.' },
      { name: 'Juno', year: 2016, agency: 'NASA / JPL', type: 'Polar Orbiter', desc: 'Polar orbit measuring gravitational field, core dilution, and magnetosphere.' },
      { name: 'JUICE', year: 2023, agency: 'ESA', type: 'Orbiter', desc: 'En route to explore icy moons Ganymede, Callisto, and Europa.' }
    ]
  },

  saturn: {
    interior: [
      { name: 'Rock & Ice Core', depthKm: '0 - 15,000 km', tempK: '11,700 K', desc: 'Dense rocky ice core (9-22 Earth masses).', color: '#ffffff' },
      { name: 'Liquid Metallic Hydrogen', depthKm: '15,000 - 35,000 km', tempK: '9,000 K', desc: 'Conducting metallic hydrogen layer generating magnetic field.', color: '#38bdf8' },
      { name: 'Liquid Molecular Hydrogen', depthKm: '35,000 - 58,000 km', tempK: '3,000 K', desc: 'Liquid molecular hydrogen with helium rain showers.', color: '#fbbf24' },
      { name: 'Upper Atmosphere', depthKm: '0 - 2,000 km', tempK: '134 - 200 K', desc: 'Golden haze of ammonia clouds and equatorial jet streams.', color: '#d97706' }
    ],
    atmosphere: {
      scaleHeightKm: 59.5,
      surfacePressureBar: '1 bar (cloud tops)',
      layers: [
        { altitudeKm: 0, tempK: 134, pressureBar: 1.0, composition: 'Ammonia haze (NH₃)' },
        { altitudeKm: -50, tempK: 180, pressureBar: 2.5, composition: 'Ammonium hydrosulfide (NH₄SH)' },
        { altitudeKm: -120, tempK: 270, pressureBar: 10.0, composition: 'Water ice cloud deck (H₂O)' },
        { altitudeKm: -250, tempK: 400, pressureBar: 40.0, composition: 'H₂ (96.3%), He (3.25%)' }
      ]
    },
    rings: {
      totalSpanKm: '282,000 km',
      thicknessMeters: '10 meters',
      massKg: '1.5 × 10¹⁹ kg',
      composition: '99% Pure Water Ice (particles 1 cm to 10 m)',
      mainRings: [
        { name: 'D Ring', innerRadiusKm: 66900, outerRadiusKm: 74510, desc: 'Faint innermost ring near Saturn cloud tops.' },
        { name: 'C Ring', innerRadiusKm: 74658, outerRadiusKm: 92000, desc: 'Transparent ring containing Maxwell division.' },
        { name: 'B Ring', innerRadiusKm: 92000, outerRadiusKm: 117580, desc: 'Broadest, densest, and brightest ring with spokes.' },
        { name: 'Cassini Division', innerRadiusKm: 117580, outerRadiusKm: 122170, desc: '4,800 km wide gap cleared by Mimas 2:1 orbital resonance.' },
        { name: 'A Ring', innerRadiusKm: 122170, outerRadiusKm: 136775, desc: 'Outer bright ring featuring Encke Gap and Keeler Gap.' },
        { name: 'F Ring', innerRadiusKm: 140180, outerRadiusKm: 140680, desc: 'Narrow braided ring shepherd by Prometheus and Pandora.' },
        { name: 'E Ring', innerRadiusKm: 180000, outerRadiusKm: 480000, desc: 'Diffuse ring continuously replenished by Enceladus geysers.' }
      ]
    },
    magneticField: {
      strengthGauss: '0.21 G (Aligned with rotation axis)',
      dipoleTiltDeg: 0.0,
      features: 'Uniquely axisymmetric magnetic field with zero dipole tilt.'
    },
    missions: [
      { name: 'Pioneer 11', year: 1979, agency: 'NASA', type: 'Flyby', desc: 'First flyby of Saturn, discovered F Ring.' },
      { name: 'Voyager 1 & 2', year: 1980, agency: 'NASA', type: 'Flyby', desc: 'High-res ring imaging, Titan atmospheric close approach.' },
      { name: 'Cassini-Huygens', year: 2004, agency: 'NASA / ESA / ASI', type: 'Orbiter & Lander', desc: '13-year mission, landed Huygens probe on Titan, discovered Enceladus ocean.' },
      { name: 'Dragonfly', year: 2028, agency: 'NASA / APL', type: 'Rotorcraft Lander', desc: 'Nuclear-powered octocopter landing on Titan in 2034.' }
    ]
  },

  uranus: {
    interior: [
      { name: 'Rocky Core', depthKm: '0 - 4,000 km', tempK: '5,000 K', desc: 'Small silicate-iron core (0.55 Earth mass).', color: '#e0e1dd' },
      { name: 'Icy Mantle (Hot Fluid)', depthKm: '4,000 - 20,000 km', tempK: '3,000 K', desc: 'Hot, dense liquid fluid of water, ammonia & methane ("ice giant").', color: '#70e000' },
      { name: 'Hydrogen-Helium Atmosphere', depthKm: '20,000 - 25,360 km', tempK: '59 - 100 K', desc: 'Methane-rich atmosphere imparting cyan-blue tint.', color: '#3a86ff' }
    ],
    atmosphere: {
      scaleHeightKm: 27.7,
      surfacePressureBar: '1 bar (cloud tops)',
      layers: [
        { altitudeKm: 0, tempK: 59, pressureBar: 1.0, composition: 'Methane ice clouds (CH₄)' },
        { altitudeKm: -50, tempK: 80, pressureBar: 2.0, composition: 'Ammonia ice clouds' },
        { altitudeKm: -150, tempK: 150, pressureBar: 10.0, composition: 'H₂ (83%), He (15%), CH₄ (2.3%)' }
      ]
    },
    magneticField: {
      strengthGauss: '0.23 G',
      dipoleTiltDeg: 59.0,
      features: 'Extremely tilted magnetic dipole offset from center by 1/3 planet radius.'
    },
    missions: [
      { name: 'Voyager 2', year: 1986, agency: 'NASA', type: 'Flyby', desc: 'Only spacecraft to visit Uranus, discovering 10 moons & 2 rings.' }
    ]
  },

  neptune: {
    interior: [
      { name: 'Silicate-Iron Core', depthKm: '0 - 4,500 km', tempK: '5,400 K', desc: 'Rocky metallic core (1.2 Earth masses).', color: '#f8fafc' },
      { name: 'Superheated Ionic Ocean', depthKm: '4,500 - 20,000 km', tempK: '3,500 K', desc: 'Superheated liquid ocean of water, ammonia & methane ice.', color: '#0284c7' },
      { name: 'Atmosphere & Cloud Layer', depthKm: '20,000 - 24,622 km', tempK: '55 - 120 K', desc: 'Dynamic deep blue atmosphere with fastest winds in Solar System.', color: '#1d4ed8' }
    ],
    atmosphere: {
      scaleHeightKm: 20,
      surfacePressureBar: '1 bar (cloud tops)',
      layers: [
        { altitudeKm: 0, tempK: 55, pressureBar: 1.0, composition: 'Methane ice clouds, supersonic winds (2,100 km/h)' },
        { altitudeKm: -50, tempK: 80, pressureBar: 3.0, composition: 'Ammonia & hydrogen sulfide clouds' },
        { altitudeKm: -150, tempK: 160, pressureBar: 15.0, composition: 'H₂ (80%), He (19%), CH₄ (1.5%)' }
      ]
    },
    magneticField: {
      strengthGauss: '0.14 G',
      dipoleTiltDeg: 47.0,
      features: 'Strongly tilted and asymmetric magnetic field generated by thin shell fluid layer.'
    },
    missions: [
      { name: 'Voyager 2', year: 1989, agency: 'NASA', type: 'Flyby', desc: 'Discovered Great Dark Spot and Triton active nitrogen geysers.' }
    ]
  },

  moon: {
    interior: [
      { name: 'Metallic Core', depthKm: '0 - 330 km', tempK: '1,600 K', desc: 'Small liquid iron core (20% of radius).', color: '#ffb703' },
      { name: 'Partial Melt Layer', depthKm: '330 - 480 km', tempK: '1,400 K', desc: 'Partially molten mantle boundary.', color: '#d97706' },
      { name: 'Lunar Mantle', depthKm: '480 - 1,690 km', tempK: '1,000 K', desc: 'Olivine and pyroxene mantle.', color: '#4b5563' },
      { name: 'Anorthositic Crust', depthKm: '0 - 50 km', tempK: '250 K', desc: 'Light maria basalt & highland regolith.', color: '#9ca3af' }
    ],
    missions: [
      { name: 'Luna 2', year: 1959, agency: 'USSR', type: 'Impactor', desc: 'First human artifact to impact another celestial body.' },
      { name: 'Apollo 11', year: 1969, agency: 'NASA', type: 'Human Landing', desc: 'First crewed landing on Moon (Neil Armstrong, Buzz Aldrin).' },
      { name: 'LRO', year: 2009, agency: 'NASA', type: 'Orbiter', desc: 'Sub-meter mapping of lunar surface & water ice pockets.' },
      { name: 'Chandrayaan-3', year: 2023, agency: 'ISRO', type: 'Lander / Rover', desc: 'First historic soft landing near Lunar South Pole.' }
    ]
  }
};

/**
 * Derives scientific human weight (N and kg-force) on target body
 */
export function calculateHumanWeightOnBody(massKgHuman, targetGravityMs2) {
  if (!targetGravityMs2 || targetGravityMs2 <= 0) return { weightN: 0, weightKgForce: 0, ratioToEarth: 0 };
  const weightN = massKgHuman * targetGravityMs2;
  const weightKgForce = weightN / 9.80665;
  const ratioToEarth = targetGravityMs2 / 9.80665;
  return { weightN, weightKgForce, ratioToEarth };
}

/**
 * Calculates Hill Sphere radius (AU and km)
 * R_hill ≈ a * (m / (3 * M_sun))^(1/3)
 */
export function calculateHillSphereRadius(aAu, massKgBody, massKgParent = 1.989e30) {
  if (!aAu || !massKgBody || aAu <= 0 || massKgBody <= 0) return { rHillAu: null, rHillKm: null };
  const ratio = massKgBody / (3 * massKgParent);
  const rHillAu = aAu * Math.cbrt(ratio);
  const rHillKm = rHillAu * 149597870.7;
  return { rHillAu, rHillKm };
}
