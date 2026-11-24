export const TYPEN = { mysterium: 'Mysterium', story: 'Story' }

export const BEREICHE = {
  wahre_begebenheit: 'Wahre Begebenheit',
  film_serie: 'Film & Serie',
  fantasy_legende: 'Fantasy & Legende',
}

export const STATUS = {
  ungeloest: 'Ungelöst',
  teilweise: 'Teilweise gelöst',
  geloest: 'Gelöst',
}

export const ECHTHEIT = {
  belegt: 'Belegt',
  legende: 'Legende',
  fiktion: 'Fiktion',
}

// Fähnchen mit Farbe. Eigene Fähnchen sind erlaubt und bekommen eine neutrale Farbe.
export const FAHNEN = {
  Horror: '#9b1f1a',
  Verstörend: '#6b2350',
  Tragisch: '#4a4f78',
  Übernatürlich: '#5d3f8c',
  Rätselhaft: '#3d6b52',
  Interessant: '#2c6a7a',
  Spannend: '#a5561b',
  Lustig: '#b8902a',
}
export const fahnenFarbe = (f) => FAHNEN[f] || '#6e6253'

export const MOTIVE = {
  auge: 'Auge',
  berg: 'Berg & Zelt',
  hof: 'Einsamer Hof',
  schiff: 'Segelschiff',
  eisberg: 'Eisberg',
  buch: 'Altes Buch',
  gestalt: 'Gestalt',
  floete: 'Flöte',
  hoehle: 'Höhle',
  wald: 'Wald',
  reaktor: 'Reaktor',
}

export const QUELLEN_ARTEN = ['Offiziell', 'Wissenschaft', 'Forum', 'Volksmund', 'Spekulation']
export const BEWEIS_ARTEN = ['Fund', 'Dokument', 'Foto', 'Zeugenaussage', 'Spur', 'Gutachten']

export const GRUSEL_TEXT = {
  1: 'Harmlos',
  2: 'Unheimlich',
  3: 'Beklemmend',
  4: 'Verstörend',
  5: 'Nicht allein lesen',
}
