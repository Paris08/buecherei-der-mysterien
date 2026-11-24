import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { BEREICHE, TYPEN } from '../lib/konstanten'
import { landName, KONTINENTE } from '../lib/geo'
import { useEinstellungen, useGelesen, useSpeicher } from '../lib/speicher'
import { aehnlicheAkten, aktennummer, jahreHer, lesezeit, seitenAufteilen } from '../lib/utils'
import { Fahnen, FavoritKnopf, Fliesstext, Grusel, Polaroid, Stempel } from '../components/Kleinteile'
import { AehnlicheAkten, Beweise, Quellen, Theorien, Zeitleiste } from '../components/AktenTeile'
import Blaetterbuch from '../components/Blaetterbuch'
import { useZufallsAkte } from '../components/Kopf'

function Steckbrief({ akte, ueber }) {
  const zeilen = [
    ['Art', `${TYPEN[akte.typ]}, ${BEREICHE[akte.bereich]}`],
    ueber && ['Sammelakte', <Link key="u" to={`/sammlung/${ueber.slug}`}>{ueber.titel}</Link>],
    akte.beteiligte && ['Beteiligte', akte.beteiligte],
    (akte.ort || akte.land) && ['Ort', [akte.ort, landName(akte.land)].filter(Boolean).join(', ')],
    akte.kontinent && ['Region', KONTINENTE[akte.kontinent]],
    akte.jahr != null && ['Jahr', `${akte.jahr}${akte.zeitraum ? ` (${akte.zeitraum})` : ''}, ${jahreHer(akte.jahr)}`],
    ['Lesezeit', `etwa ${lesezeit(akte)} Minuten`],
  ].filter(Boolean)
  return (
    <dl className="steckbrief">
      {zeilen.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  )
}

function Deckblatt({ akte }) {
  return (
    <div className="deckblatt">
      <div className="deckblatt-kopf">
        <span className="akten-nr">{aktennummer(akte.nummer)}</span>
        <span className="vertraulich">{akte.typ === 'mysterium' ? 'Ermittlungsakte' : 'Bericht'}</span>
      </div>
      <h1 className="akte-titel">{akte.titel}</h1>
      {akte.untertitel && <p className="akte-untertitel">{akte.untertitel}</p>}
      <div className="deckblatt-mitte">
        <Polaroid akte={akte} beschriftung={[akte.ort, akte.jahr].filter(Boolean).join(', ')} />
        <div className="deckblatt-stempel">
          <Stempel art="status" wert={akte.status} />
          <Stempel art="echtheit" wert={akte.echtheit} />
        </div>
      </div>
      <div className="deckblatt-fuss">
        <div>
          <small>Gruselfaktor</small>
          <Grusel wert={akte.gruselfaktor} mitText />
        </div>
        <Fahnen fahnen={akte.fahnen} />
      </div>
    </div>
  )
}

function Abschnitt({ titel, children }) {
  return (
    <section className="abschnitt">
      <h2 className="abschnitt-titel">{titel}</h2>
      {children}
    </section>
  )
}

export default function AkteSeite() {
  const { slug } = useParams()
  const { akten, ueberById, laedt, istAdmin, aktePerSlug } = useDaten()
  const akte = aktePerSlug(slug)
  const [e] = useEinstellungen()
  const [, markieren] = useGelesen()
  const [spoilerOk, setSpoilerOk] = useSpeicher('bdm:spoiler', {})
  const zufall = useZufallsAkte()
  const ende = useRef(null)
  const [schmal, setSchmal] = useState(() => window.matchMedia('(max-width: 720px)').matches)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px)')
    const f = () => setSchmal(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  useEffect(() => {
    if (akte) document.title = `${akte.titel} – Bücherei der Mysterien`
    return () => { document.title = 'Bücherei der Mysterien' }
  }, [akte])

  const gelesen = useCallback(() => akte && markieren(akte.id), [akte]) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll-Modus: gelesen, wenn das Ende sichtbar wird
  useEffect(() => {
    if (!ende.current || e.lesemodus !== 'scrollen') return
    const io = new IntersectionObserver(([x]) => x.isIntersecting && gelesen())
    io.observe(ende.current)
    return () => io.disconnect()
  })

  const ueber = akte ? ueberById[akte.ueberakte_id] : null
  const aehnliche = useMemo(() => (akte ? aehnlicheAkten(akte, akten) : []), [akte, akten])

  const seiten = useMemo(() => {
    if (!akte) return []
    const s = []
    s.push({ titel: 'Deckblatt', register: 'Deckblatt', inhalt: <Deckblatt akte={akte} /> })
    s.push({
      titel: 'Kurzbericht', register: 'Kurzbericht',
      inhalt: (
        <Abschnitt titel="Kurzbericht">
          <div className="kurzbericht"><Fliesstext text={akte.zusammenfassung || 'Noch keine Zusammenfassung.'} /></div>
          <Steckbrief akte={akte} ueber={ueber} />
        </Abschnitt>
      ),
    })
    const berichtSeiten = seitenAufteilen(akte.inhalt || '', schmal ? 900 : 1500)
    berichtSeiten.forEach((ps, i) => s.push({
      titel: `Bericht ${berichtSeiten.length > 1 ? `(${i + 1}/${berichtSeiten.length})` : ''}`,
      register: i === 0 ? 'Bericht' : null,
      inhalt: (
        <Abschnitt titel={i === 0 ? 'Bericht' : `Bericht, Fortsetzung`}>
          <div className="bericht"><Fliesstext absatzListe={ps} /></div>
        </Abschnitt>
      ),
    }))
    if (akte.zeitleiste?.length) s.push({ titel: 'Zeitleiste', register: 'Zeitleiste', inhalt: <Abschnitt titel="Zeitleiste"><Zeitleiste eintraege={akte.zeitleiste} jahr={akte.jahr} /></Abschnitt> })
    if (akte.beweise?.length) s.push({ titel: 'Beweise', register: 'Beweise', inhalt: <Abschnitt titel="Beweisstücke"><Beweise beweise={akte.beweise} /></Abschnitt> })
    if (akte.theorien?.length) s.push({
      titel: 'Theorien', register: 'Theorien',
      inhalt: (
        <Abschnitt titel={akte.status === 'geloest' ? 'Erklärungen' : 'Theorien'}>
          <Theorien theorien={akte.theorien} />
          <Link to={`/akte/${akte.slug}/brett`} className="knopf brett-link">Selbst ermitteln: Ermittlungsbrett öffnen</Link>
        </Abschnitt>
      ),
    })
    s.push({
      titel: 'Quellen', register: 'Quellen',
      inhalt: (
        <>
          <Abschnitt titel="Quellen"><Quellen quellen={akte.quellen} /></Abschnitt>
          {aehnliche.length > 0 && <Abschnitt titel="Ähnliche Akten"><p className="leise">Gleiche Fähnchen, Region oder Stimmung:</p><AehnlicheAkten akten={aehnliche} /></Abschnitt>}
          <div className="akte-ende">
            <span className="stempel stempel-ende">Ende der Akte</span>
            <button className="knopf knopf-leise" onClick={() => zufall(akten.filter((a) => a.id !== akte.id))}>Nächste zufällige Akte</button>
          </div>
        </>
      ),
    })
    return s
  }, [akte, ueber, aehnliche, schmal, akten, zufall])

  if (laedt) return <div className="laden">Akte wird aus dem Archiv geholt …</div>
  if (!akte) return <div className="leer-seite"><h1>Diese Akte existiert nicht.</h1><p><Link to="/">Zurück in die Bibliothek</Link></p></div>

  const spoilerSperre = akte.spoiler && !spoilerOk[akte.id]

  return (
    <div className="akte-seite" key={akte.id}>
      <div className="akte-leiste">
        <nav className="brotkrumen" aria-label="Pfad">
          <Link to="/">Bibliothek</Link>
          <span>{BEREICHE[akte.bereich]}</span>
          {ueber && <Link to={`/sammlung/${ueber.slug}`}>{ueber.titel}</Link>}
        </nav>
        <div className="akte-aktionen">
          <FavoritKnopf id={akte.id} mitText />
          {akte.theorien?.length > 0 && <Link className="knopf-icon" to={`/akte/${akte.slug}/brett`}>Ermittlungsbrett</Link>}
          {akte.lat != null && <Link className="knopf-icon" to={`/karte?akte=${akte.slug}`}>Auf der Karte</Link>}
          {istAdmin && <Link className="knopf-icon admin" to={`/akte/${akte.slug}/bearbeiten`}>Bearbeiten</Link>}
        </div>
      </div>

      <div className={`ordner ${spoilerSperre ? 'gesperrt' : ''}`}>
        <div className="ordner-reiter" aria-hidden="true">
          {(akte.fahnen || []).slice(0, 4).map((f, i) => <span key={f} style={{ '--i': i }}>{f}</span>)}
        </div>
        <div className="ordner-deckel" aria-hidden="true"><span>{aktennummer(akte.nummer)}</span></div>
        {e.lesemodus === 'blaettern' ? (
          <Blaetterbuch seiten={seiten} wenigBewegung={e.wenigBewegung} onEnde={gelesen} />
        ) : (
          <div className="stapel">
            {seiten.map((s, i) => (
              <article className="blatt blatt-gestapelt" key={i} id={s.register ? `teil-${s.register}` : undefined}>
                <div className="blatt-inhalt">{s.inhalt}</div>
              </article>
            ))}
            <div ref={ende} />
          </div>
        )}

        {spoilerSperre && (
          <div className="spoiler-schleier" role="dialog" aria-labelledby="spoiler-titel">
            <div className="spoiler-karte">
              <span className="stempel stempel-spoiler">Spoiler</span>
              <h2 id="spoiler-titel">Diese Akte verrät die Handlung.</h2>
              <p>
                {ueber ? <>Hier stehen Wendungen und das Ende aus <strong>{ueber.titel}</strong>.</> : 'Hier stehen Wendungen und das Ende der Geschichte.'} Wenn du es noch schauen willst, lies besser später weiter.
              </p>
              <div className="spoiler-knoepfe">
                <button className="knopf" onClick={() => setSpoilerOk((s) => ({ ...s, [akte.id]: true }))}>Trotzdem öffnen</button>
                <Link className="knopf knopf-leise" to={ueber ? `/sammlung/${ueber.slug}` : '/'}>Zurück</Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
