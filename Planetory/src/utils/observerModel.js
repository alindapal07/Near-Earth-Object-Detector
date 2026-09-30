/**
 * Reusable Observer Model & Observatory Presets (PART 9, Req 4, 5, 6)
 */

export const DEFAULT_OBSERVER = {
  id: 'greenwich',
  name: 'Royal Observatory Greenwich',
  latitudeDeg: 51.4769,
  longitudeDeg: -0.0005,
  elevationMeters: 47,
  timezone: 'UTC',
  locationName: 'Greenwich, London, UK'
};

export const OBSERVATORY_PRESETS = [
  DEFAULT_OBSERVER,
  {
    id: 'mauna_kea',
    name: 'Mauna Kea Observatory',
    latitudeDeg: 19.8207,
    longitudeDeg: -155.4681,
    elevationMeters: 4207,
    timezone: 'HST',
    locationName: 'Mauna Kea, Hawaii, USA'
  },
  {
    id: 'paranal',
    name: 'Paranal Observatory (ESO VLT)',
    latitudeDeg: -24.6272,
    longitudeDeg: -70.4042,
    elevationMeters: 2635,
    timezone: 'CLT',
    locationName: 'Atacama Desert, Chile'
  },
  {
    id: 'la_silla',
    name: 'La Silla Observatory',
    latitudeDeg: -29.2563,
    longitudeDeg: -70.7380,
    elevationMeters: 2400,
    timezone: 'CLT',
    locationName: 'Coquimbo Region, Chile'
  },
  {
    id: 'kitt_peak',
    name: 'Kitt Peak National Observatory',
    latitudeDeg: 31.9583,
    longitudeDeg: -111.5967,
    elevationMeters: 2096,
    timezone: 'MST',
    locationName: 'Arizona, USA'
  },
  {
    id: 'tokyo',
    name: 'National Astronomical Observatory of Japan',
    latitudeDeg: 35.6762,
    longitudeDeg: 139.6503,
    elevationMeters: 50,
    timezone: 'JST',
    locationName: 'Mitaka, Tokyo, Japan'
  },
  {
    id: 'sydney',
    name: 'Sydney Observatory',
    latitudeDeg: -33.8596,
    longitudeDeg: 151.2049,
    elevationMeters: 42,
    timezone: 'AEST',
    locationName: 'Sydney, Australia'
  }
];

export function validateObserver(obs) {
  if (!obs) return DEFAULT_OBSERVER;
  const lat = Math.max(-90, Math.min(90, Number(obs.latitudeDeg || 0)));
  const lon = Math.max(-180, Math.min(180, Number(obs.longitudeDeg || 0)));
  const elev = Math.max(0, Number(obs.elevationMeters || 0));

  return {
    ...obs,
    latitudeDeg: lat,
    longitudeDeg: lon,
    elevationMeters: elev
  };
}
