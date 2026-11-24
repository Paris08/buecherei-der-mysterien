import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import { feature } from 'topojson-client'
import welt from 'world-atlas/countries-50m.json'
import { useDaten } from '../lib/daten'
import { BEREICHE, FAHNEN, STATUS, TYPEN, GRUSEL_TEXT } from '../lib/konstanten'
import { KONTINENTE, KONTINENT_BOUNDS, kontinentVonLand, landName, numericZuAlpha2 } from '../lib/geo'
import { aktennummer, jahreHer } from '../lib/utils'
import { Grusel } from '../components/Kleinteile'

window.L = L

// Ringe, die über die Datumsgrenze springen, durchgehend machen (sonst entstehen Streifen quer über die Karte)
const entwirren = (ring) => {
  const out = [ring[0]]
  for (let i = 1; i < ring.length; i++) {
    let [lng, lat] = ring[i]
    const prev = out[i - 1][0]
    while (lng - prev > 180) lng -= 360
    while (lng - prev < -180) lng += 360
    out.push([lng, lat])
  }
  return out
}
const geomEntwirren = (g) => g.type === 'Polygon'
  ? { ...g, coordinates: g.coordinates.map(entwirren) }
  : { ...g, coordinates: g.coordinates.map((p) => p.map(entwirren)) }

const LAENDER = feature(welt, welt.objects.countries).features
  .map((f) => ({ ...f, geometry: geomEntwirren(f.geometry), code: numericZuAlpha2(f.id) }))
  .filter((f) => f.code && f.code !== 'AQ')

const pinFarbe = (a) => {
  if (a.typ === 'story') return '#8d97a6'
  if (a.status === 'geloest') return '#d9c49a'
  if (a.status === 'teilweise') return '#d68a2e'
  return '#c0261e'
}

const pinIcon = (a, aktiv) => L.divIcon({
  className: `nadel ${a.gruselfaktor >= 5 ? 'nadel-puls' : ''} ${aktiv ? 'nadel-aktiv' : ''}`,
  html: `<svg viewBox="0 0 30 46" aria-hidden="true"><ellipse cx="17" cy="44" rx="6" ry="2" fill="rgba(0,0,0,.45)"/><path d="M15 18 L17 44" stroke="#c9c2b4" stroke-width="1.6"/><circle cx="15" cy="12" r="10" fill="${pinFarbe(a)}"/><circle cx="11.5" cy="8.5" r="3" fill="rgba(255,255,255,.35)"/></svg>`,
  iconSize: [30, 46],
  iconAnchor: [17, 44],
  popupAnchor: [-2, -40],
})

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function popupHtml(a) {
  const kurz = (a.zusammenfassung || '').replace(/\s+/g, ' ').slice(0, 170)
  return `<div class="pop">
    <span class="pop-nr">${aktennummer(a.nummer)}</span>
    <strong class="pop-titel">${esc(a.titel)}</strong>
    <span class="pop-meta">${esc([a.ort, landName(a.land)].filter(Boolean).join(', '))}${a.jahr != null ? `<br>${a.jahr}, ${jahreHer(a.jahr)}` : ''}</span>
    <span class="pop-stempel">${a.status ? `<span class="stempel stempel-klein stempel-status stempel-${a.status}">${STATUS[a.status]}</span>` : `<span class="stempel stempel-klein stempel-story">${TYPEN[a.typ]}</span>`}</span>
    <span class="pop-grusel">Gruselfaktor ${a.gruselfaktor}: ${GRUSEL_TEXT[a.gruselfaktor]}</span>
    <p>${esc(kurz)}${kurz.length >= 170 ? ' …' : ''}</p>
    <a href="/akte/${a.slug}" data-intern class="pop-link">Akte öffnen</a>
  </div>`
}

export default function Karte() {
  const { akten, laedt } = useDaten()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const container = useRef(null)
  const karte = useRef(null)
  const cluster = useRef(null)
  const maske = useRef(null)
  const marker = useRef({})
  const [bereit, setBereit] = useState(false)
  const [panelOffen, setPanelOffen] = useState(() => window.innerWidth > 820)

  const [kontinent, setKontinent] = useState('')
  const [land, setLand] = useState('')
  const [typ, setTyp] = useState('')
  const [status, setStatus] = useState('')
  const [bereich, setBereich] = useState('')
  const [fahne, setFahne] = useState('')
  const [grusel, setGrusel] = useState(1)
  const [suche, setSuche] = useState('')

  const mitOrt = useMemo(() => akten.filter((a) => a.lat != null && a.lng != null), [akten])
  const jahre = mitOrt.map((a) => a.jahr).filter((j) => j != null)
  const minJahr = jahre.length ? Math.min(...jahre) : 1000
  const maxJahr = jahre.length ? Math.max(...jahre) : 2025
  const [vonJahr, setVonJahr] = useState(null)
  const [bisJahr, setBisJahr] = useState(null)
  const von = vonJahr ?? minJahr, bis = bisJahr ?? maxJahr

  const regionVon = (a) => a.kontinent || kontinentVonLand(a.land) || ''

  const sichtbar = useMemo(() => mitOrt.filter((a) => {
    if (kontinent && regionVon(a) !== kontinent) return false
    if (land && a.land !== land) return false
    if (typ && a.typ !== typ) return false
    if (status && a.status !== status) return false
    if (bereich && a.bereich !== bereich) return false
    if (fahne && !a.fahnen?.includes(fahne)) return false
    if ((a.gruselfaktor || 1) < grusel) return false
    if (a.jahr != null && (a.jahr < von || a.jahr > bis)) return false
    if (suche && !`${a.titel} ${a.ort} ${a.beteiligte}`.toLowerCase().includes(suche.toLowerCase())) return false
    return true
  }), [mitOrt, kontinent, land, typ, status, bereich, fahne, grusel, von, bis, suche])

  // Länder, die zur gewählten Region gehören (für den Land-Filter)
  const laenderInRegion = useMemo(() => {
    if (!kontinent || kontinent === 'MEER') return []
    const zaehler = {}
    mitOrt.forEach((a) => { if (a.land) zaehler[a.land] = (zaehler[a.land] || 0) + 1 })
    return LAENDER.filter((f) => kontinentVonLand(f.code) === kontinent)
      .map((f) => ({ code: f.code, name: landName(f.code), n: zaehler[f.code] || 0 }))
      .filter((x, i, arr) => arr.findIndex((y) => y.code === x.code) === i)
      .sort((x, y) => (y.n - x.n) || x.name.localeCompare(y.name, 'de'))
  }, [kontinent, mitOrt])

  // Karte einmal aufbauen
  useEffect(() => {
    let abbruch = false
    import('leaflet.markercluster').then(() => {
      if (abbruch || karte.current) return
      const m = L.map(container.current, {
        zoomControl: false, worldCopyJump: false, minZoom: 2, maxZoom: 9,
        maxBounds: [[-75, -200], [85, 200]], maxBoundsViscosity: 0.8,
        preferCanvas: true, attributionControl: true, zoomSnap: 0.5,
      }).setView([30, 10], 2)
      L.control.zoom({ position: 'bottomright' }).addTo(m)
      m.attributionControl.setPrefix(false).addAttribution('Kartendaten: Natural Earth (gemeinfrei)')
      // Gradnetz wie auf einer alten Seekarte
      const netz = []
      for (let lng = -180; lng <= 180; lng += 15) netz.push([[-85, lng], [85, lng]])
      for (let lat = -75; lat <= 75; lat += 15) netz.push([[lat, -180], [lat, 180]])
      const svg = L.svg({ padding: 0.5 })
      L.polyline(netz, { renderer: svg, color: '#5d6f8f', weight: 0.6, opacity: 0.2, dashArray: '2 6', interactive: false }).addTo(m)
      L.polyline([[0, -180], [0, 180]], { renderer: svg, color: '#8fa3c4', weight: 0.8, opacity: 0.25, interactive: false }).addTo(m)
      // Landmassen selbst gezeichnet
      const renderer = L.canvas({ padding: 0.3 })
      L.geoJSON({ type: 'FeatureCollection', features: LAENDER }, {
        renderer,
        style: () => ({ color: '#4b4436', weight: 0.7, fillColor: '#1b1813', fillOpacity: 1 }),
        onEachFeature: (f, layer) => {
          layer.bindTooltip(landName(f.code), { sticky: true, direction: 'top', className: 'land-tip', opacity: 1 })
          layer.on('mouseover', () => layer.setStyle({ fillColor: '#2a2419', color: '#8a7652' }))
          layer.on('mouseout', () => layer.setStyle({ fillColor: '#1b1813', color: '#4b4436' }))
        },
      }).addTo(m)
      cluster.current = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 46,
        iconCreateFunction: (c) => L.divIcon({ className: 'siegel', html: `<span>${c.getChildCount()}</span>`, iconSize: [40, 40] }),
      }).addTo(m)
      karte.current = m
      setBereit(true)
    })
    const klick = (e) => {
      const a = e.target.closest('a[data-intern]')
      if (a) { e.preventDefault(); nav(a.getAttribute('href')) }
    }
    const el = container.current
    el.addEventListener('click', klick)
    return () => {
      abbruch = true
      el.removeEventListener('click', klick)
      karte.current?.remove()
      karte.current = null
    }
  }, [nav])

  // Pins aktualisieren
  useEffect(() => {
    if (!bereit) return
    cluster.current.clearLayers()
    marker.current = {}
    sichtbar.forEach((a) => {
      const mk = L.marker([a.lat, a.lng], { icon: pinIcon(a), title: a.titel, riseOnHover: true })
      mk.bindPopup(popupHtml(a), { className: 'pop-zettel', maxWidth: 260, minWidth: 220 })
      cluster.current.addLayer(mk)
      marker.current[a.slug] = mk
    })
  }, [bereit, sichtbar])

  // Region abdunkeln und hinzoomen
  useEffect(() => {
    if (!bereit) return
    const m = karte.current
    if (maske.current) { m.removeLayer(maske.current); maske.current = null }
    let auswahl = []
    if (land) auswahl = LAENDER.filter((f) => f.code === land)
    else if (kontinent && kontinent !== 'MEER') auswahl = LAENDER.filter((f) => kontinentVonLand(f.code) === kontinent)
    if (auswahl.length) {
      const loecher = []
      auswahl.forEach((f) => {
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
        polys.forEach((p) => loecher.push(p[0].map(([lng, lat]) => [lat, lng])))
      })
      const aussen = [[-89, -540], [89, -540], [89, 540], [-89, 540]]
      const nebel = L.polygon([aussen, ...loecher], { stroke: false, fillColor: '#0a0605', fillOpacity: 0.82, interactive: false })
      const rand = L.polyline(loecher, land
        ? { color: '#e3a64a', weight: 1.6, opacity: 0.9, interactive: false, dashArray: '5 5' }
        : { color: '#e3a64a', weight: 0.6, opacity: 0.25, interactive: false })
      maske.current = L.layerGroup([nebel, rand]).addTo(m)
      const b = land ? rand.getBounds() : L.latLngBounds(KONTINENT_BOUNDS[kontinent])
      m.flyToBounds(b, { padding: [30, 30], duration: 0.9, maxZoom: 7 })
    } else if (kontinent === 'MEER') {
      m.flyToBounds(KONTINENT_BOUNDS.MEER, { duration: 0.9 })
    } else {
      m.flyTo([30, 10], 2, { duration: 0.9 })
    }
  }, [bereit, kontinent, land])

  // ?akte=slug direkt öffnen
  useEffect(() => {
    const slug = params.get('akte')
    if (!bereit || !slug || !marker.current[slug]) return
    const mk = marker.current[slug]
    cluster.current.zoomToShowLayer(mk, () => mk.openPopup())
  }, [bereit, params, sichtbar])

  const zeige = (a) => {
    const mk = marker.current[a.slug]
    if (!mk) return
    if (window.innerWidth <= 820) setPanelOffen(false)
    cluster.current.zoomToShowLayer(mk, () => mk.openPopup())
  }

  const zufallsOrt = () => sichtbar.length && zeige(sichtbar[Math.floor(Math.random() * sichtbar.length)])

  const zuruecksetzen = () => {
    setKontinent(''); setLand(''); setTyp(''); setStatus(''); setBereich(''); setFahne(''); setGrusel(1); setSuche(''); setVonJahr(null); setBisJahr(null)
  }

  const regionen = Object.entries(KONTINENTE).map(([k, n]) => ({ k, n, z: mitOrt.filter((a) => regionVon(a) === k).length }))

  return (
    <div className="karten-seite">
      <div ref={container} className="karte" aria-label="Weltkarte der Fundorte" />

      <button className="panel-knopf" onClick={() => setPanelOffen((p) => !p)} aria-expanded={panelOffen}>
        {panelOffen ? (window.innerWidth > 820 ? 'Filter ausblenden' : 'Karte zeigen') : `Filter und Fundorte (${sichtbar.length})`}
      </button>

      <aside className={`karten-panel ${panelOffen ? 'offen' : ''}`} aria-label="Filter und Fundorte">
        <h1 className="panel-titel">Fundorte</h1>
        <p className="panel-zaehler">{laedt ? 'Lade Akten …' : `${sichtbar.length} von ${mitOrt.length} Nadeln sichtbar`}</p>

        <div className="panel-gruppe">
          <label>Region
            <select value={kontinent} onChange={(e) => { setKontinent(e.target.value); setLand('') }}>
              <option value="">Ganze Welt</option>
              {regionen.map((r) => <option key={r.k} value={r.k}>{r.n}{r.z ? ` (${r.z})` : ''}</option>)}
            </select>
          </label>
          {laenderInRegion.length > 0 && (
            <label>Land
              <select value={land} onChange={(e) => setLand(e.target.value)}>
                <option value="">Ganz {KONTINENTE[kontinent]}</option>
                {laenderInRegion.map((l) => <option key={l.code} value={l.code}>{l.name}{l.n ? ` (${l.n})` : ''}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="panel-gruppe zwei">
          <label>Art
            <select value={typ} onChange={(e) => setTyp(e.target.value)}>
              <option value="">Alle</option>
              {Object.entries(TYPEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Alle</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Bereich
            <select value={bereich} onChange={(e) => setBereich(e.target.value)}>
              <option value="">Alle</option>
              {Object.entries(BEREICHE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Fähnchen
            <select value={fahne} onChange={(e) => setFahne(e.target.value)}>
              <option value="">Alle</option>
              {Object.keys(FAHNEN).map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
        </div>

        <div className="panel-gruppe">
          <label className="grusel-filter">
            <span>Gruselfaktor ab</span>
            <input type="range" min="1" max="5" value={grusel} onChange={(e) => setGrusel(+e.target.value)} />
            <Grusel wert={grusel} />
          </label>
          {jahre.length > 1 && (
            <div className="zeitraum">
              <span>Zeitraum: {von} bis {bis}</span>
              <input type="range" min={minJahr} max={maxJahr} value={von} onChange={(e) => setVonJahr(Math.min(+e.target.value, bis))} aria-label="Von Jahr" />
              <input type="range" min={minJahr} max={maxJahr} value={bis} onChange={(e) => setBisJahr(Math.max(+e.target.value, von))} aria-label="Bis Jahr" />
            </div>
          )}
          <label>Suche<input type="search" value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="Titel, Ort, Person" /></label>
        </div>

        <div className="panel-knoepfe">
          <button className="knopf knopf-leise" onClick={zufallsOrt} disabled={!sichtbar.length}>Zufälliger Fundort</button>
          <button className="filter-zuruecksetzen" onClick={zuruecksetzen}>Zurücksetzen</button>
        </div>

        <ul className="fundliste">
          {sichtbar.map((a) => (
            <li key={a.id}>
              <button onClick={() => zeige(a)}>
                <i className="punkt" style={{ background: pinFarbe(a) }} />
                <span>
                  <strong>{a.titel}</strong>
                  <small>{[landName(a.land) || KONTINENTE[a.kontinent], a.jahr].filter(Boolean).join(', ')}</small>
                </span>
                <span className="fund-art">{a.status ? STATUS[a.status] : TYPEN[a.typ]}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="legende">
          <span><i className="punkt" style={{ background: '#c0261e' }} /> Ungelöst</span>
          <span><i className="punkt" style={{ background: '#d68a2e' }} /> Teilweise gelöst</span>
          <span><i className="punkt" style={{ background: '#d9c49a' }} /> Gelöst</span>
          <span><i className="punkt" style={{ background: '#8d97a6' }} /> Story</span>
          <span><i className="punkt puls" /> Gruselfaktor 5 pulsiert</span>
        </div>
      </aside>
    </div>
  )
}
