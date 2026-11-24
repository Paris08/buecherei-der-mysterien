import { useSyncExternalStore } from 'react'

// Kleiner lokaler Speicher (pro Gerät) für Favoriten, Gelesen, Einstellungen, Ermittlungsbretter.
const lesen = (key, fallback) => {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
const schreiben = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* Speicher nicht verfügbar */ }
}

const zuhoerer = new Set()
const cache = {}
const melden = () => zuhoerer.forEach((f) => f())

export function useSpeicher(key, fallback) {
  if (!(key in cache)) cache[key] = lesen(key, fallback)
  const wert = useSyncExternalStore(
    (f) => { zuhoerer.add(f); return () => zuhoerer.delete(f) },
    () => cache[key],
  )
  const setzen = (neu) => {
    cache[key] = typeof neu === 'function' ? neu(cache[key]) : neu
    schreiben(key, cache[key])
    melden()
  }
  return [wert, setzen]
}

export const STANDARD_EINSTELLUNGEN = {
  lesemodus: 'blaettern', // oder 'scrollen'
  atmosphaere: true, // Hauptschalter für alle Effekte
  kerzen: true, // Kerzenflackern & wanderndes Licht
  koernung: true, // Filmkörnung
  vignette: true, // dunkle Ränder & Lichtflackern
  nebel: true, // ziehender Nebel
  gruselEffekte: true, // roter Rand & Herzschlag bei hohem Gruselfaktor
  schrift: 'normal', // klein | normal | gross
  wenigBewegung: false,
}

export function useEinstellungen() {
  const [e, setE] = useSpeicher('bdm:einstellungen', STANDARD_EINSTELLUNGEN)
  return [{ ...STANDARD_EINSTELLUNGEN, ...e }, (teil) => setE((alt) => ({ ...STANDARD_EINSTELLUNGEN, ...alt, ...teil }))]
}

export function useFavoriten() {
  const [fav, setFav] = useSpeicher('bdm:favoriten', [])
  const toggle = (id) => setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))
  return [fav, toggle]
}

export function useGelesen() {
  const [g, setG] = useSpeicher('bdm:gelesen', {})
  const markieren = (id) => setG((alt) => ({ ...alt, [id]: Date.now() }))
  return [g, markieren]
}
