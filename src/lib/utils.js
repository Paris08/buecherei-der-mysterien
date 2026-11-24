const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']

export const aktennummer = (n) => `Akte Nr. ${String(n ?? 0).padStart(4, '0')}`

export const woerter = (t = '') => (t.trim() ? t.trim().split(/\s+/).length : 0)
export const lesezeit = (akte) => {
  const w = woerter(akte.inhalt) + woerter(akte.zusammenfassung)
  return Math.max(1, Math.round(w / 200))
}

export const jahreHer = (jahr) => {
  if (jahr == null) return null
  const diff = new Date().getFullYear() - jahr
  if (diff <= 0) return 'dieses Jahr'
  if (diff === 1) return 'vor einem Jahr'
  return `vor ${diff} Jahren`
}

// Datum aus Zeitleiste: "1959", "1959-01", "1959-01-27" oder "1959-01-27T01:23"
export const parseDatum = (s) => {
  if (!s) return null
  const m = String(s).match(/^(-?\d{1,4})(?:-(\d{2}))?(?:-(\d{2}))?(?:T(\d{2}):(\d{2}))?/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  return {
    jahr: +y, monat: mo ? +mo : null, tag: d ? +d : null, stunde: h ? +h : null, minute: mi ? +mi : null,
    date: new Date(Date.UTC(+y, mo ? +mo - 1 : 0, d ? +d : 1, h ? +h : 0, mi ? +mi : 0)),
    genau: mo && d ? (h ? 'minute' : 'tag') : mo ? 'monat' : 'jahr',
  }
}

export const formatDatum = (s) => {
  const p = parseDatum(s)
  if (!p) return s || ''
  if (p.genau === 'jahr') return p.jahr < 0 ? `${-p.jahr} v. Chr.` : String(p.jahr)
  if (p.genau === 'monat') return `${MONATE[p.monat - 1]} ${p.jahr}`
  const basis = `${p.tag}. ${MONATE[p.monat - 1]} ${p.jahr}`
  return p.genau === 'minute' ? `${basis}, ${String(p.stunde).padStart(2, '0')}:${String(p.minute).padStart(2, '0')} Uhr` : basis
}

export const abstand = (a, b) => {
  const pa = parseDatum(a), pb = parseDatum(b)
  if (!pa || !pb) return null
  const ms = pb.date - pa.date
  if (ms <= 0) return null
  const grob = pa.genau === 'jahr' || pb.genau === 'jahr'
  const tage = ms / 86400000
  if (!grob && tage < 1) {
    const std = Math.round(ms / 3600000)
    if (std < 1) return `${Math.round(ms / 60000)} Minuten später`
    return std === 1 ? '1 Stunde später' : `${std} Stunden später`
  }
  if (!grob && tage < 60) {
    const t = Math.round(tage)
    return t === 1 ? '1 Tag später' : `${t} Tage später`
  }
  const jahre = pb.jahr - pa.jahr
  if (jahre < 2) {
    const monate = Math.round(tage / 30.44)
    return monate <= 1 ? 'etwa 1 Monat später' : `etwa ${monate} Monate später`
  }
  return `${jahre} Jahre später`
}

export const spanne = (zeitleiste = []) => {
  const daten = zeitleiste.map((z) => z.datum).filter((d) => parseDatum(d))
  if (daten.length < 2) return null
  const sortiert = [...daten].sort((a, b) => parseDatum(a).date - parseDatum(b).date)
  return abstand(sortiert[0], sortiert[sortiert.length - 1])?.replace(' später', '')
}

// Ähnliche Akten nach gemeinsamen Merkmalen
export const aehnlicheAkten = (akte, alle, n = 3) =>
  alle
    .filter((a) => a.id !== akte.id)
    .map((a) => {
      let s = 0
      s += (a.fahnen || []).filter((f) => (akte.fahnen || []).includes(f)).length * 3
      if (a.typ === akte.typ) s += 2
      if (a.bereich === akte.bereich) s += 2
      if (akte.status && a.status === akte.status) s += 2
      if (a.kontinent && a.kontinent === akte.kontinent) s += 1
      if (a.land && a.land === akte.land) s += 2
      s -= Math.abs((a.gruselfaktor || 1) - (akte.gruselfaktor || 1)) * 0.5
      if (a.ueberakte_id && a.ueberakte_id === akte.ueberakte_id) s += 4
      return { a, s }
    })
    .sort((x, y) => y.s - x.s)
    .slice(0, n)
    .map((x) => x.a)

// Einfaches Markdown: Absätze, ## Zwischenüberschriften, **fett**, *kursiv*, > Zitat
export const absaetze = (text = '') =>
  text
    .replace(/\r/g, '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)

// Text in Seiten für den Blätter-Modus aufteilen
export const seitenAufteilen = (text, maxZeichen = 1300) => {
  const ps = absaetze(text)
  const seiten = []
  let aktuell = [], laenge = 0
  for (const p of ps) {
    const istUeberschrift = p.startsWith('## ')
    if (aktuell.length && (laenge + p.length > maxZeichen || (istUeberschrift && laenge > maxZeichen * 0.45))) {
      seiten.push(aktuell)
      aktuell = []
      laenge = 0
    }
    aktuell.push(p)
    laenge += p.length
  }
  if (aktuell.length) seiten.push(aktuell)
  return seiten
}

export const hash = (s = '') => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return Math.abs(h)
}

export const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
