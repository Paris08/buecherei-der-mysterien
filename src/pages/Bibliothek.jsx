import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { BEREICHE, FAHNEN, STATUS, fahnenFarbe } from '../lib/konstanten'
import { useFavoriten, useGelesen, useSpeicher } from '../lib/speicher'
import { aktennummer, hash, jahreHer } from '../lib/utils'
import { useZufallsAkte } from '../components/Kopf'
import { Fahnen, FavoritKnopf, Grusel, Stempel } from '../components/Kleinteile'
import { landName } from '../lib/geo'

const LEDER = {
  mysterium: ['#3b1614', '#2c1a2b', '#1f2a24', '#33241a', '#2a1d14'],
  story: ['#4a3420', '#2b3341', '#3d3a22', '#40291f', '#2e2a26'],
}

function Ruecken({ akte, fav, gelesen }) {
  const h = hash(akte.slug)
  const farben = LEDER[akte.typ]
  const stil = {
    '--leder': farben[h % farben.length],
    '--hoehe': `${210 + (h % 60)}px`,
    '--breite': `${44 + (h % 4) * 6}px`,
    '--band': fahnenFarbe(akte.fahnen?.[0]),
    '--neigung': `${(h % 5) === 0 ? -3 : 0}deg`,
  }
  return (
    <Link to={`/akte/${akte.slug}`} className={`ruecken typ-${akte.typ}`} style={stil} title={`${akte.titel}${akte.jahr ? ` (${akte.jahr})` : ''}`}>
      <span className="ruecken-band" />
      <span className="ruecken-titel">{akte.titel}</span>
      <span className="ruecken-nr">{String(akte.nummer).padStart(3, '0')}</span>
      {akte.status === 'ungeloest' && <span className="lesezeichen" aria-label="ungelöst" />}
      {fav && <span className="ruecken-fav" aria-label="gemerkt">★</span>}
      {gelesen && <span className="ruecken-gelesen" aria-label="gelesen" />}
    </Link>
  )
}

function Karton({ ueber, anzahl }) {
  const h = hash(ueber.slug)
  return (
    <Link to={`/sammlung/${ueber.slug}`} className="karton" style={{ '--hoehe': `${200 + (h % 30)}px` }} title={`Sammelakte: ${ueber.titel}`}>
      <span className="karton-etikett">
        <small>Sammelakte</small>
        <strong>{ueber.titel}</strong>
        <small>{anzahl} {anzahl === 1 ? 'Akte' : 'Akten'}</small>
      </span>
    </Link>
  )
}

function Zeile({ akte, ueber }) {
  return (
    <div className="karteikarte">
      <Link to={`/akte/${akte.slug}`} className="kk-link" aria-label={akte.titel} />
      <span className="kk-nr">{aktennummer(akte.nummer)}</span>
      <span className="kk-titel">
        <strong>{akte.titel}</strong>
        {ueber && <small>aus der Sammelakte „{ueber.titel}“</small>}
      </span>
      <span className="kk-meta">
        {[akte.ort || landName(akte.land), akte.jahr && `${akte.jahr} (${jahreHer(akte.jahr)})`].filter(Boolean).join(', ')}
      </span>
      <span className="kk-stempel">
        <Stempel art="status" wert={akte.status} klein />
        <Grusel wert={akte.gruselfaktor} />
      </span>
      <Fahnen fahnen={akte.fahnen} max={3} />
      <FavoritKnopf id={akte.id} />
    </div>
  )
}

export default function Bibliothek() {
  const { akten, ueberById, laedt, fehler } = useDaten()
  const [fav] = useFavoriten()
  const [gelesen] = useGelesen()
  const zufall = useZufallsAkte()
  const [ansicht, setAnsicht] = useSpeicher('bdm:ansicht', 'regal')
  const [abteilung, setAbteilung] = useState('alle')
  const [suche, setSuche] = useState('')
  const [status, setStatus] = useState('')
  const [fahnen, setFahnen] = useState([])
  const [grusel, setGrusel] = useState(1)

  const gefiltert = useMemo(() => {
    const q = suche.trim().toLowerCase()
    return akten.filter((a) => {
      if (abteilung !== 'alle' && a.typ !== abteilung) return false
      if (status && a.status !== status) return false
      if (fahnen.length && !fahnen.every((f) => a.fahnen?.includes(f))) return false
      if ((a.gruselfaktor || 1) < grusel) return false
      if (q) {
        const heu = [a.titel, a.untertitel, a.beteiligte, a.ort, landName(a.land), a.zusammenfassung, ueberById[a.ueberakte_id]?.titel, ...(a.fahnen || [])].join(' ').toLowerCase()
        if (!heu.includes(q)) return false
      }
      return true
    })
  }, [akten, abteilung, status, fahnen, grusel, suche, ueberById])

  const anzahlUngeloest = akten.filter((a) => a.status === 'ungeloest').length
  const filterAktiv = suche || status || fahnen.length || grusel > 1

  const regale = Object.entries(BEREICHE).map(([key, name]) => {
    const inBereich = gefiltert.filter((a) => a.bereich === key)
    const einzeln = inBereich.filter((a) => !a.ueberakte_id)
    const kartons = {}
    inBereich.filter((a) => a.ueberakte_id).forEach((a) => { kartons[a.ueberakte_id] = (kartons[a.ueberakte_id] || 0) + 1 })
    return { key, name, einzeln, kartons, alle: inBereich }
  })

  return (
    <div className="bibliothek">
      <section className="atrium">
        <h1 className="atrium-titel">Bücherei<br /><span>der</span> Mysterien</h1>
        <p className="atrium-text">
          Ein Archiv ungeklärter Fälle und wahrer Geschichten. Manche Akten sind geschlossen, andere warten seit Jahrhunderten auf jemanden, der sie zu Ende liest.
        </p>
        <div className="atrium-aktionen">
          <button className="knopf knopf-gross" onClick={() => zufall(gefiltert)}>Zufällige Akte ziehen</button>
          <Link className="knopf knopf-leise" to="/karte">Fundorte auf der Karte</Link>
        </div>
        {!laedt && <p className="atrium-zaehler">{akten.length} Akten im Archiv, davon {anzahlUngeloest} ungelöst.</p>}
      </section>

      <section className="lesesaal" aria-label="Akten durchsuchen">
        <div className="abteilungen" role="tablist">
          {[['alle', 'Alle Akten'], ['mysterium', 'Mysterien'], ['story', 'Storys']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={abteilung === k} className={abteilung === k ? 'aktiv' : ''} onClick={() => { setAbteilung(k); if (k === 'story') setStatus('') }}>
              {l}
            </button>
          ))}
        </div>
        <p className="abteilung-erklaerung">
          {abteilung === 'mysterium' && 'Mysterien sind Fälle, die sich bis heute niemand vollständig erklären kann.'}
          {abteilung === 'story' && 'Storys sind Geschichten, die erklärbar sind und genau so passiert sind.'}
          {abteilung === 'alle' && 'Mysterien sind unerklärt, Storys sind erklärbar. Beides steht hier im selben Regal.'}
        </p>

        <div className="filterleiste">
          <label className="suchfeld">
            <span className="sr">Suche</span>
            <input type="search" placeholder="Name, Ort, Person …" value={suche} onChange={(e) => setSuche(e.target.value)} />
          </label>
          {abteilung !== 'story' && (
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              <option value="">Jeder Status</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
          <label className="grusel-filter">
            <span>Mindestens</span>
            <input type="range" min="1" max="5" value={grusel} onChange={(e) => setGrusel(+e.target.value)} aria-label="Mindest-Gruselfaktor" />
            <Grusel wert={grusel} />
          </label>
          <div className="ansicht-wahl" role="radiogroup" aria-label="Ansicht">
            <button role="radio" aria-checked={ansicht === 'regal'} className={ansicht === 'regal' ? 'aktiv' : ''} onClick={() => setAnsicht('regal')}>Regal</button>
            <button role="radio" aria-checked={ansicht === 'liste'} className={ansicht === 'liste' ? 'aktiv' : ''} onClick={() => setAnsicht('liste')}>Karteikasten</button>
          </div>
        </div>
        <div className="fahnen-filter" aria-label="Nach Fähnchen filtern">
          {Object.keys(FAHNEN).map((f) => (
            <button key={f} className={`fahne ${fahnen.includes(f) ? 'aktiv' : ''}`} style={{ '--farbe': fahnenFarbe(f) }} aria-pressed={fahnen.includes(f)} onClick={() => setFahnen((x) => (x.includes(f) ? x.filter((y) => y !== f) : [...x, f]))}>
              {f}
            </button>
          ))}
          {filterAktiv && <button className="filter-zuruecksetzen" onClick={() => { setSuche(''); setStatus(''); setFahnen([]); setGrusel(1) }}>Filter zurücksetzen</button>}
        </div>
      </section>

      {fehler && <p className="hinweis-fehler">Das Archiv ist gerade nicht erreichbar: {fehler}</p>}
      {laedt && <div className="laden">Die Regale werden abgestaubt …</div>}

      {!laedt && gefiltert.length === 0 && (
        <div className="leer">
          <p>Keine Akte passt zu deinen Filtern.</p>
          <button className="knopf knopf-leise" onClick={() => { setSuche(''); setStatus(''); setFahnen([]); setGrusel(1); setAbteilung('alle') }}>Alle Akten zeigen</button>
        </div>
      )}

      {ansicht === 'regal' ? (
        <div className="regale">
          {regale.filter((r) => r.alle.length).map((r) => (
            <section key={r.key} className="regal" aria-label={r.name}>
              <h2 className="regal-schild">{r.name}<small>{r.alle.length}</small></h2>
              <div className="regal-brett">
                <div className="regal-reihe">
                  {r.einzeln.map((a) => <Ruecken key={a.id} akte={a} fav={fav.includes(a.id)} gelesen={!!gelesen[a.id]} />)}
                  {Object.entries(r.kartons).map(([id, n]) => ueberById[id] && <Karton key={id} ueber={ueberById[id]} anzahl={n} />)}
                </div>
              </div>
            </section>
          ))}
          <p className="regal-legende">
            <span><i className="leg-band" /> Rotes Lesezeichen: Fall ungelöst</span>
            <span><i className="leg-karton" /> Karton: Sammelakte zu einem Film oder einer Serie</span>
            <span><i className="leg-gelesen" /> Eselsohr: schon gelesen</span>
          </p>
        </div>
      ) : (
        <div className="karteikasten">
          {gefiltert.map((a) => <Zeile key={a.id} akte={a} ueber={ueberById[a.ueberakte_id]} />)}
        </div>
      )}
    </div>
  )
}
