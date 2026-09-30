/**
 * spacecraftMissions.js - Authoritative Spacecraft & Historic Mission Catalog
 * Defines mission telemetry, orbital trajectories, operators, targets, and mission timeline events.
 */

export const SPACECRAFT_MISSIONS = [
  {
    id: 'voyager-1',
    name: 'Voyager 1',
    type: 'SPACECRAFT',
    category: 'INTERSTELLAR PROBE',
    operator: 'NASA / JPL',
    launchDate: '1977-09-05',
    status: 'ACTIVE - INTERSTELLAR MEDIUM',
    target: 'Interstellar Space (Oort Cloud bound)',
    massKg: 825,
    distanceAu: 163.2,
    velocityKmS: 16.9,
    provenance: 'NASA / JPL HORIZONS',
    description: 'First human-made object to venture into interstellar space, carrying the Golden Record.',
    events: [
      { epoch: -8152, date: '1977-09-05', type: 'LAUNCH', title: 'Titan IIIE Launch', description: 'Launched from Cape Canaveral LC-41.' },
      { epoch: -7602, date: '1979-03-05', type: 'FLYBY', title: 'Jupiter Flyby', description: 'Closest approach to Jupiter at 349,000 km. Discovered Jovian ring system.' },
      { epoch: -6989, date: '1980-11-12', type: 'FLYBY', title: 'Saturn & Titan Flyby', description: 'Flyby of Saturn & Titan, trajectory bent out of ecliptic plane.' },
      { epoch: 4621, date: '2012-08-25', type: 'MANEUVER', title: 'Heliopause Crossing', description: 'Crossed heliopause into interstellar space at 121 AU.' }
    ]
  },
  {
    id: 'voyager-2',
    name: 'Voyager 2',
    type: 'SPACECRAFT',
    category: 'INTERSTELLAR PROBE',
    operator: 'NASA / JPL',
    launchDate: '1977-08-20',
    status: 'ACTIVE - INTERSTELLAR MEDIUM',
    target: 'Interstellar Space',
    massKg: 825,
    distanceAu: 136.5,
    velocityKmS: 15.3,
    provenance: 'NASA / JPL HORIZONS',
    description: 'Only spacecraft to visit all four outer giant planets (Jupiter, Saturn, Uranus, Neptune).',
    events: [
      { epoch: -8168, date: '1977-08-20', type: 'LAUNCH', title: 'Launch', description: 'Launched 16 days before Voyager 1.' },
      { epoch: -7472, date: '1979-07-09', type: 'FLYBY', title: 'Jupiter Flyby', description: 'Discovered active volcanism on Io.' },
      { epoch: -6707, date: '1981-08-26', type: 'FLYBY', title: 'Saturn Flyby', description: 'Gravity assist maneuver towards Uranus.' },
      { epoch: -5089, date: '1986-01-24', type: 'FLYBY', title: 'Uranus Flyby', description: 'First and only spacecraft visit to Uranus.' },
      { epoch: -3781, date: '1989-08-25', type: 'FLYBY', title: 'Neptune & Triton Flyby', description: 'Discovered Triton geysers.' }
    ]
  },
  {
    id: 'new-horizons',
    name: 'New Horizons',
    type: 'SPACECRAFT',
    category: 'OUTER SYSTEM PROBE',
    operator: 'NASA / JHUAPL',
    launchDate: '2006-01-19',
    status: 'ACTIVE - KUIPER BELT',
    target: 'Pluto & Kuiper Belt Objects',
    massKg: 478,
    distanceAu: 57.8,
    velocityKmS: 13.8,
    provenance: 'NASA / JPL SBDB',
    description: 'First spacecraft to explore Pluto and Arrokoth in the Kuiper Belt.',
    events: [
      { epoch: 2210, date: '2006-01-19', type: 'LAUNCH', title: 'Atlas V Launch', description: 'Fastest spacecraft launch speed at 16.26 km/s.' },
      { epoch: 2614, date: '2007-02-28', type: 'FLYBY', title: 'Jupiter Gravity Assist', description: 'Increased speed by 4 km/s via Jupiter gravity assist.' },
      { epoch: 5673, date: '2015-07-14', type: 'FLYBY', title: 'Historic Pluto Flyby', description: 'High-resolution images of Sputnik Planitia glacier.' },
      { epoch: 6940, date: '2019-01-01', type: 'FLYBY', title: 'Arrokoth Flyby', description: 'Explored contact binary planetesimal 486958 Arrokoth.' }
    ]
  },
  {
    id: 'jwst',
    name: 'James Webb Space Telescope (JWST)',
    type: 'SPACECRAFT',
    category: 'SPACE OBSERVATORY',
    operator: 'NASA / ESA / CSA / STScI',
    launchDate: '2021-12-25',
    status: 'ACTIVE - SUN-EARTH L2 HALO ORBIT',
    target: 'Sun-Earth L2 Lagrange Point',
    massKg: 6161,
    distanceAu: 0.01, // ~1.5 million km from Earth
    velocityKmS: 0.2,
    provenance: 'STScI / NASA HORIZONS',
    description: 'Premier infrared astronomy observatory positioned in halo orbit at Sun-Earth L2.',
    events: [
      { epoch: 8028, date: '2021-12-25', type: 'LAUNCH', title: 'Ariane 5 Launch', description: 'Perfect insertion into L2 transfer arc from Kourou.' },
      { epoch: 8058, date: '2022-01-24', type: 'ORBIT_INSERTION', title: 'L2 Insertion Burn', description: 'Entered halo orbit around Sun-Earth L2 point.' }
    ]
  },
  {
    id: 'cassini',
    name: 'Cassini-Huygens',
    type: 'SPACECRAFT',
    category: 'SATURN ORBITER',
    operator: 'NASA / JPL / ESA / ASI',
    launchDate: '1997-10-15',
    status: 'MISSION COMPLETE (2017)',
    target: 'Saturn & Titan',
    massKg: 5712,
    distanceAu: 9.54,
    velocityKmS: 6.2,
    provenance: 'NASA / JPL HISTORIC',
    description: 'Flagship Saturn orbiter; landed Huygens probe on Titan and discovered Enceladus ocean geysers.',
    events: [
      { epoch: -808, date: '1997-10-15', type: 'LAUNCH', title: 'Titan IVB Launch', description: 'Launched on Venus-Venus-Earth-Jupiter Gravity Assist trajectory.' },
      { epoch: 1643, date: '2004-07-01', type: 'ORBIT_INSERTION', title: 'Saturn Orbit Insertion', description: 'Main engine burn into Saturn orbit.' },
      { epoch: 1839, date: '2005-01-14', type: 'LANDING', title: 'Huygens Titan Landing', description: 'ESA Huygens probe landed successfully on Titan surface.' },
      { epoch: 6467, date: '2017-09-15', type: 'MISSION_END', title: 'Grand Finale Impact', description: 'Atmospheric entry into Saturn atmosphere to protect moons.' }
    ]
  },
  {
    id: 'perseverance',
    name: 'Mars 2020 Perseverance Rover',
    type: 'SPACECRAFT',
    category: 'MARS ROVER',
    operator: 'NASA / JPL',
    launchDate: '2020-07-30',
    status: 'ACTIVE - MARS SURFACE (JEZERO CRATER)',
    target: 'Mars (Jezero Crater)',
    massKg: 1025,
    distanceAu: 1.52,
    velocityKmS: 0.0,
    provenance: 'NASA / JPL HORIZONS',
    description: 'Exploring Jezero Crater on Mars, caching astrobiology samples, and operating Ingenuity helicopter.',
    events: [
      { epoch: 7515, date: '2020-07-30', type: 'LAUNCH', title: 'Atlas V 541 Launch', description: 'Launched on Interplanetary Earth-Mars transfer arc.' },
      { epoch: 7719, date: '2021-02-18', type: 'LANDING', title: '7 Minutes of Terror Landing', description: 'Sky crane touchdown inside Jezero Crater.' }
    ]
  },
  {
    id: 'artemis-1',
    name: 'Artemis I (Orion)',
    type: 'SPACECRAFT',
    category: 'LUNAR FLIGHT TEST',
    operator: 'NASA / ESA',
    launchDate: '2022-11-16',
    status: 'MISSION COMPLETE (2022)',
    target: 'Moon Distant Retrograde Orbit',
    massKg: 26520,
    distanceAu: 0.0028,
    velocityKmS: 1.1,
    provenance: 'NASA ARTEMIS EPHEMERIS',
    description: 'Uncrewed flight test of SLS rocket and Orion spacecraft to Distant Retrograde Lunar Orbit.',
    events: [
      { epoch: 8354, date: '2022-11-16', type: 'LAUNCH', title: 'SLS Maiden Launch', description: 'SLS rocket launched Orion towards the Moon.' },
      { epoch: 8363, date: '2022-11-25', type: 'ORBIT_INSERTION', title: 'Lunar DRO Insertion', description: 'Entered Distant Retrograde Orbit around the Moon.' },
      { epoch: 8379, date: '2022-12-11', type: 'MISSION_END', title: 'Pacific Ocean Splashdown', description: 'Successful skip-entry re-entry into Pacific Ocean.' }
    ]
  },
  {
    id: 'apollo-11',
    name: 'Apollo 11 (Columbia & Eagle)',
    type: 'SPACECRAFT',
    category: 'HISTORIC LUNAR LANDING',
    operator: 'NASA',
    launchDate: '1969-07-16',
    status: 'HISTORIC (1969)',
    target: 'Moon (Mare Tranquillitatis)',
    massKg: 45700,
    distanceAu: 0.0025,
    velocityKmS: 1.0,
    provenance: 'NASA HISTORIC CATALOG',
    description: 'First manned lunar landing mission commanded by Neil Armstrong and Buzz Aldrin.',
    events: [
      { epoch: -11126, date: '1969-07-16', type: 'LAUNCH', title: 'Saturn V Launch', description: 'Launched from LC-39A at Kennedy Space Center.' },
      { epoch: -11122, date: '1969-07-20', type: 'LANDING', title: 'Lunar Touchdown', description: 'Eagle Lunar Module landed at Sea of Tranquility.' }
    ]
  }
];
