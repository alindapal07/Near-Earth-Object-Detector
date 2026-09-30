/**
 * Authoritative Constellations Line Segments & Metadata (PART 9, Req 22, 23, 24)
 * Defines star pair connections for major constellations.
 */

export const CONSTELLATIONS = [
  {
    id: 'orion',
    name: 'Orion (The Hunter)',
    region: 'Celestial Equator',
    description: 'Prominent winter constellation featuring Betelgeuse, Rigel, Bellatrix, and Orion\'s Belt.',
    lines: [
      ['betelgeuse', 'bellatrix'],
      ['bellatrix', 'rigel'],
      ['rigel', 'saiph'],
      ['saiph', 'betelgeuse'],
      ['alnitak', 'alnilam'],
      ['alnilam', 'mintaka'],
      ['betelgeuse', 'alnitak'],
      ['bellatrix', 'mintaka']
    ]
  },
  {
    id: 'ursa_major',
    name: 'Ursa Major (The Great Bear / Big Dipper)',
    region: 'Northern Sky',
    description: 'Circumpolar northern constellation containing the Big Dipper pointer stars to Polaris.',
    lines: [
      ['dubhe', 'merak'],
      ['merak', 'phecda'],
      ['phecda', 'megrez'],
      ['megrez', 'alioth'],
      ['alioth', 'mizar'],
      ['mizar', 'alkaid'],
      ['dubhe', 'megrez']
    ]
  },
  {
    id: 'ursa_minor',
    name: 'Ursa Minor (The Little Bear / Little Dipper)',
    region: 'Northern Sky',
    description: 'Northern polar constellation ending at Polaris (The North Star).',
    lines: [
      ['polaris', 'yildun'],
      ['yildun', 'uroid'],
      ['uroid', 'kochab'],
      ['kochab', 'pherkad']
    ]
  },
  {
    id: 'crux',
    name: 'Crux (The Southern Cross)',
    region: 'Southern Sky',
    description: 'Famous southern cross constellation pointing toward South Celestial Pole.',
    lines: [
      ['acrux', 'gacrux'],
      ['mimosa', 'delta_crucis']
    ]
  },
  {
    id: 'scorpius',
    name: 'Scorpius (The Scorpion)',
    region: 'Southern Sky',
    description: 'Zodiac constellation anchored by red supergiant Antares and sting stars Shaula and Sargas.',
    lines: [
      ['antares', 'graffias'],
      ['antares', 'dschubba'],
      ['antares', 'wei'],
      ['wei', 'sargas'],
      ['sargas', 'shaula']
    ]
  },
  {
    id: 'cassiopeia',
    name: 'Cassiopeia (The Queen)',
    region: 'Northern Sky',
    description: 'Distinctive W-shaped northern circumpolar constellation.',
    lines: [
      ['schedar', 'caph'],
      ['schedar', 'navi'],
      ['navi', 'ksora'],
      ['ksora', 'segin']
    ]
  },
  {
    id: 'cygnus',
    name: 'Cygnus (The Swan / Northern Cross)',
    region: 'Northern Sky',
    description: 'Summer triangle constellation anchored by blue-white supergiant Deneb.',
    lines: [
      ['deneb', 'albireo'],
      ['sadr', 'gienah'],
      ['sadr', 'fawaris']
    ]
  },
  {
    id: 'leo',
    name: 'Leo (The Lion)',
    region: 'Zodiac / Equatorial',
    description: 'Zodiac constellation shaped like a resting lion, anchored by blue star Regulus.',
    lines: [
      ['regulus', 'algieba'],
      ['algieba', 'zigma'],
      ['zigma', 'denebola'],
      ['denebola', 'chertan'],
      ['chertan', 'regulus']
    ]
  },
  {
    id: 'taurus',
    name: 'Taurus (The Bull)',
    region: 'Zodiac / Northern Sky',
    description: 'Zodiac constellation containing orange giant Aldebaran, Hyades, and Pleiades cluster.',
    lines: [
      ['aldebaran', 'elnath'],
      ['aldebaran', 'tianguan']
    ]
  }
];
