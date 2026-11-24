import countries from 'i18n-iso-countries'
import de from 'i18n-iso-countries/langs/de.json'
import { countries as countryData } from 'countries-list'

countries.registerLocale(de)

export const KONTINENTE = {
  EU: 'Europa',
  AS: 'Asien',
  AF: 'Afrika',
  NA: 'Nordamerika',
  SA: 'Südamerika',
  OC: 'Ozeanien',
  AN: 'Antarktis',
  MEER: 'Weltmeere',
}

// Grobe Ausschnitte für die Karte
export const KONTINENT_BOUNDS = {
  EU: [[34, -25], [71, 45]],
  AS: [[-11, 25], [78, 180]],
  AF: [[-36, -20], [38, 55]],
  NA: [[7, -170], [83, -50]],
  SA: [[-56, -82], [13, -34]],
  OC: [[-48, 110], [0, 180]],
  AN: [[-90, -180], [-60, 180]],
  MEER: [[-60, -180], [75, 180]],
}

export const landName = (code) => (code ? countries.getName(code, 'de') || code : '')

export const kontinentVonLand = (code) => {
  if (!code) return null
  return countryData[code]?.continent || null
}

export const alleLaender = () =>
  Object.entries(countries.getNames('de', { select: 'official' }))
    .map(([code, name]) => ({ code, name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'de'))

export const numericZuAlpha2 = (num) => countries.numericToAlpha2(String(num).padStart(3, '0'))
