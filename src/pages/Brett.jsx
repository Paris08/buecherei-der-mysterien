import { useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { useSpeicher } from '../lib/speicher'
import { formatDatum, hash } from '../lib/utils'
import Motiv from '../components/Motiv'

const BREITE = { akte: 230, person: 170, beweis: 190, theorie: 220, zeit: 160, notiz: 170 }
const BRETT_B = 1500, BRETT_H = 1050

function erzeugeKarten(akte) {
  const k = []
  k.push({ id: 'akte', art: 'akte', titel: akte.titel, text: [akte.ort, akte.jahr].filter(Boolean).join(', ') })
  ;(akte.beteiligte || '').split(/;|\n/).map((s) => s.trim()).filter(Boolean).slice(0, 6)
    .forEach((p, i) => k.push({ id: `p${i}`, art: 'person', titel: p }))
  ;(akte.beweise || []).forEach((b, i) => k.push({ id: `b${i}`, art: 'beweis', titel: b.titel, text: b.beschreibung, label: `Beweisstück ${'ABCDEFGHIJ'[i] || i + 1}` }))
  ;(akte.theorien || []).forEach((t, i) => k.push({ id: `t${i}`, art: 'theorie', titel: t.titel, text: t.beschreibung, label: t.quelle }))
  const wichtig = (akte.zeitleiste || []).filter((z) => z.wichtig)
  ;(wichtig.length ? wichtig : (akte.zeitleiste || []).slice(0, 4)).slice(0, 5)
    .forEach((z, i) => k.push({ id: `z${i}`, art: 'zeit', titel: formatDatum(z.datum), text: z.titel }))
  return k
}

function startPosition(karte, i, n) {
  if (karte.art === 'akte') return { x: BRETT_B / 2 - BREITE.akte / 2, y: BRETT_H / 2 - 110 }
  const winkel = (i / n) * Math.PI * 2 - Math.PI / 2
  const ring = karte.art === 'theorie' ? 1 : karte.art === 'zeit' ? 0.62 : 0.8
  const rx = 600 * ring, ry = 400 * ring
  const jitter = (hash(karte.id) % 40) - 20
  return {
    x: Math.max(10, Math.min(BRETT_B - 240, BRETT_B / 2 + Math.cos(winkel) * rx - BREITE[karte.art] / 2 + jitter)),
    y: Math.max(10, Math.min(BRETT_H - 200, BRETT_H / 2 + Math.sin(winkel) * ry - 60 + jitter)),
  }
}

export default function Brett() {
  const { slug } = useParams()
  const { aktePerSlug, laedt } = useDaten()
  const akte = aktePerSlug(slug)
  const [zustand, setZustand] = useSpeicher(`bdm:brett:${slug}`, { pos: {}, faeden: [], notizen: [], urteil: null })
  const [fadenModus, setFadenModus] = useState(false)
  const [fadenStart, setFadenStart] = useState(null)
  const [zoom, setZoom] = useState(() => (window.innerWidth < 760 ? 0.6 : 0.9))
  const [neueNotiz, setNeueNotiz] = useState('')
  const zug = useRef(null)

  const karten = useMemo(() => {
    if (!akte) return []
    const basis = erzeugeKarten(akte)
    const eigene = (zustand.notizen || []).map((n) => ({ id: n.id, art: 'notiz', titel: n.text, eigen: true }))
    return [...basis, ...eigene]
  }, [akte, zustand.notizen])

  if (laedt) return <div className="laden">Das Brett wird aufgehängt …</div>
  if (!akte) return <div className="leer-seite"><h1>Akte nicht gefunden.</h1><Link to="/">Zurück</Link></div>

  const n = karten.length - 1
  const pos = (k, i) => zustand.pos?.[k.id] || startPosition(k, i, n)
  const posById = Object.fromEntries(karten.map((k, i) => [k.id, pos(k, i)]))
  const nadel = (id) => {
    const k = karten.find((x) => x.id === id)
    const p = posById[id]
    if (!k || !p) return null
    return { x: p.x + BREITE[k.art] / 2, y: p.y + 10 }
  }

  const runter = (e, k) => {
    if (fadenModus) return
    if (e.target.closest('button')) return
    e.preventDefault()
    const p = posById[k.id]
    zug.current = { id: k.id, sx: e.clientX, sy: e.clientY, px: p.x, py: p.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const bewegen = (e) => {
    const z = zug.current
    if (!z) return
    const x = Math.max(0, Math.min(BRETT_B - 120, z.px + (e.clientX - z.sx) / zoom))
    const y = Math.max(0, Math.min(BRETT_H - 80, z.py + (e.clientY - z.sy) / zoom))
    setZustand((s) => ({ ...s, pos: { ...s.pos, [z.id]: { x, y } } }))
  }
  const hoch = () => { zug.current = null }

  const klickKarte = (k) => {
    if (!fadenModus) return
    if (!fadenStart) { setFadenStart(k.id); return }
    if (fadenStart !== k.id) {
      const paar = [fadenStart, k.id].sort()
      setZustand((s) => s.faeden.some((f) => f[0] === paar[0] && f[1] === paar[1]) ? s : { ...s, faeden: [...s.faeden, paar] })
    }
    setFadenStart(null)
  }

  const fadenLoeschen = (i) => setZustand((s) => ({ ...s, faeden: s.faeden.filter((_, j) => j !== i) }))
  const notizAnheften = (e) => {
    e.preventDefault()
    if (!neueNotiz.trim()) return
    const id = `n${Date.now()}`
    setZustand((s) => ({ ...s, notizen: [...(s.notizen || []), { id, text: neueNotiz.trim() }], pos: { ...s.pos, [id]: { x: 60 + Math.random() * 200, y: 60 + Math.random() * 120 } } }))
    setNeueNotiz('')
  }
  const notizEntfernen = (id) => setZustand((s) => ({ ...s, notizen: s.notizen.filter((x) => x.id !== id), faeden: s.faeden.filter((f) => !f.includes(id)) }))
  const urteilen = (id) => setZustand((s) => ({ ...s, urteil: s.urteil === id ? null : id }))
  const aufraeumen = () => { if (confirm('Brett zurücksetzen? Deine Fäden, Notizen und Positionen werden entfernt.')) setZustand({ pos: {}, faeden: [], notizen: [], urteil: null }) }

  const urteilKarte = karten.find((k) => k.id === zustand.urteil)

  return (
    <div className="brett-seite">
      <div className="brett-leiste">
        <div>
          <Link to={`/akte/${akte.slug}`} className="zurueck-link">Zurück zur Akte</Link>
          <h1>Ermittlungsbrett: {akte.titel}</h1>
          <p className="leise">Zieh die Zettel herum, spann rote Fäden zwischen allem, was zusammengehört, und fälle dein Urteil. Alles bleibt auf diesem Gerät gespeichert.</p>
        </div>
        <div className="brett-werkzeuge">
          <button className={`knopf ${fadenModus ? '' : 'knopf-leise'}`} aria-pressed={fadenModus} onClick={() => { setFadenModus((f) => !f); setFadenStart(null) }}>
            {fadenModus ? (fadenStart ? 'Zweiten Zettel wählen' : 'Ersten Zettel wählen') : 'Roten Faden spannen'}
          </button>
          <form onSubmit={notizAnheften} className="notiz-form">
            <input value={neueNotiz} onChange={(e) => setNeueNotiz(e.target.value)} placeholder="Eigene Vermutung …" maxLength={140} aria-label="Eigene Notiz" />
            <button className="knopf knopf-leise">Anheften</button>
          </form>
          <label className="zoom">Zoom<input type="range" min="0.4" max="1.3" step="0.05" value={zoom} onChange={(e) => setZoom(+e.target.value)} /></label>
          <button className="filter-zuruecksetzen" onClick={aufraeumen}>Brett leeren</button>
        </div>
        {urteilKarte && <p className="urteil">Dein Urteil: <strong>{urteilKarte.titel}</strong></p>}
      </div>

      <div className="brett-rahmen">
        <div className="brett" style={{ width: BRETT_B * zoom, height: BRETT_H * zoom }}>
          <div className="brett-innen" style={{ width: BRETT_B, height: BRETT_H, transform: `scale(${zoom})` }} onPointerMove={bewegen} onPointerUp={hoch} onPointerCancel={hoch}>
            <svg className="faeden" width={BRETT_B} height={BRETT_H}>
              {zustand.faeden.map(([a, b], i) => {
                const p1 = nadel(a), p2 = nadel(b)
                if (!p1 || !p2) return null
                const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2 + Math.min(80, Math.hypot(p2.x - p1.x, p2.y - p1.y) * 0.12)
                const d = `M${p1.x},${p1.y} Q${mx},${my} ${p2.x},${p2.y}`
                return (
                  <g key={i} onClick={() => fadenLoeschen(i)} className="faden">
                    <path d={d} className="faden-hit" />
                    <path d={d} className="faden-linie" />
                    <title>Faden durchschneiden</title>
                  </g>
                )
              })}
            </svg>
            {karten.map((k, i) => {
              const p = pos(k, i)
              return (
                <div
                  key={k.id}
                  className={`zettel zettel-${k.art} ${fadenStart === k.id ? 'gewaehlt' : ''} ${fadenModus ? 'faden-modus' : ''} ${zustand.urteil === k.id ? 'verurteilt' : ''}`}
                  style={{ left: p.x, top: p.y, width: BREITE[k.art], '--dreh': `${(hash(k.id + slug) % 7) - 3}deg` }}
                  onPointerDown={(e) => runter(e, k)}
                  onClick={() => klickKarte(k)}
                >
                  <span className="reisszwecke" aria-hidden="true" />
                  {k.art === 'akte' && <div className="zettel-foto"><Motiv motiv={akte.motiv} seed={akte.slug} /></div>}
                  {k.label && <span className="zettel-label">{k.label}</span>}
                  <strong>{k.titel}</strong>
                  {k.text && <p>{k.text.length > 160 ? `${k.text.slice(0, 160)} …` : k.text}</p>}
                  {k.art === 'theorie' && (
                    <button className={`urteil-knopf ${zustand.urteil === k.id ? 'aktiv' : ''}`} onClick={(e) => { e.stopPropagation(); urteilen(k.id) }}>
                      {zustand.urteil === k.id ? 'Mein Urteil' : 'Daran glaube ich'}
                    </button>
                  )}
                  {k.eigen && <button className="notiz-weg" onClick={(e) => { e.stopPropagation(); notizEntfernen(k.id) }} aria-label="Notiz abnehmen">×</button>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
