import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import L from 'leaflet'
import { supabase, BILDER_BUCKET } from '../lib/supabase'
import { useDaten } from '../lib/daten'
import { BEREICHE, BEWEIS_ARTEN, ECHTHEIT, FAHNEN, GRUSEL_TEXT, MOTIVE, QUELLEN_ARTEN, STATUS, TYPEN, fahnenFarbe } from '../lib/konstanten'
import { alleLaender, kontinentVonLand, KONTINENTE } from '../lib/geo'
import { slugify } from '../lib/utils'
import { Polaroid } from '../components/Kleinteile'

const LEER = {
  titel: '', untertitel: '', slug: '', typ: 'mysterium', status: 'ungeloest', bereich: 'wahre_begebenheit', echtheit: 'belegt',
  fahnen: [], gruselfaktor: 3, beteiligte: '', ort: '', land: '', kontinent: '', lat: null, lng: null, jahr: '', zeitraum: '',
  zusammenfassung: '', inhalt: '', zeitleiste: [], beweise: [], theorien: [], quellen: [], bild_url: '', bild_credit: '', motiv: 'auge',
  spoiler: false, ueberakte_id: null, veroeffentlicht: true,
}

const LISTEN = {
  zeitleiste: { titel: 'Zeitleiste', neu: { datum: '', titel: '', text: '', wichtig: false }, felder: [['datum', 'Datum (1959, 1959-02 oder 1959-02-01)'], ['titel', 'Was passierte'], ['text', 'Details', 'lang'], ['wichtig', 'Wichtig (aufs Brett)', 'check']] },
  beweise: { titel: 'Beweisstücke', neu: { titel: '', art: 'Fund', beschreibung: '' }, felder: [['titel', 'Bezeichnung'], ['art', 'Art', BEWEIS_ARTEN], ['beschreibung', 'Beschreibung', 'lang']] },
  theorien: { titel: 'Theorien', neu: { titel: '', quelle: 'Forum', plausibilitaet: 3, beschreibung: '' }, felder: [['titel', 'Theorie'], ['quelle', 'Herkunft', QUELLEN_ARTEN], ['plausibilitaet', 'Plausibilität 1–5', 'zahl'], ['beschreibung', 'Erklärung', 'lang']] },
  quellen: { titel: 'Quellen', neu: { titel: '', url: '' }, felder: [['titel', 'Titel'], ['url', 'Link']] },
}

function ListenEditor({ name, wert, onChange }) {
  const def = LISTEN[name]
  const setzen = (i, feld, v) => onChange(wert.map((e, j) => (j === i ? { ...e, [feld]: v } : e)))
  const schieben = (i, d) => {
    const n = [...wert]; const [x] = n.splice(i, 1); n.splice(i + d, 0, x); onChange(n)
  }
  return (
    <fieldset className="listen-editor">
      <legend>{def.titel} <small>({wert.length})</small></legend>
      {wert.map((e, i) => (
        <div key={i} className="listen-eintrag">
          {def.felder.map(([f, label, art]) => (
            <label key={f} className={art === 'lang' ? 'breit' : art === 'check' ? 'check' : ''}>
              {art === 'check' ? (
                <><input type="checkbox" checked={!!e[f]} onChange={(ev) => setzen(i, f, ev.target.checked)} /> {label}</>
              ) : (
                <>
                  {label}
                  {Array.isArray(art) ? (
                    <select value={e[f] || ''} onChange={(ev) => setzen(i, f, ev.target.value)}>{art.map((o) => <option key={o}>{o}</option>)}</select>
                  ) : art === 'lang' ? (
                    <textarea rows={3} value={e[f] || ''} onChange={(ev) => setzen(i, f, ev.target.value)} />
                  ) : art === 'zahl' ? (
                    <input type="number" min="1" max="5" value={e[f] ?? 3} onChange={(ev) => setzen(i, f, +ev.target.value)} />
                  ) : (
                    <input value={e[f] || ''} onChange={(ev) => setzen(i, f, ev.target.value)} />
                  )}
                </>
              )}
            </label>
          ))}
          <div className="eintrag-knoepfe">
            <button type="button" onClick={() => schieben(i, -1)} disabled={i === 0} aria-label="Nach oben">↑</button>
            <button type="button" onClick={() => schieben(i, 1)} disabled={i === wert.length - 1} aria-label="Nach unten">↓</button>
            <button type="button" className="entfernen" onClick={() => onChange(wert.filter((_, j) => j !== i))}>Entfernen</button>
          </div>
        </div>
      ))}
      <button type="button" className="knopf knopf-leise" onClick={() => onChange([...wert, { ...def.neu }])}>Eintrag hinzufügen</button>
    </fieldset>
  )
}

function OrtWahl({ lat, lng, onChange }) {
  const el = useRef(null)
  const karte = useRef(null)
  const mk = useRef(null)
  useEffect(() => {
    const m = L.map(el.current, { worldCopyJump: true }).setView(lat != null ? [lat, lng] : [30, 10], lat != null ? 5 : 2)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd' }).addTo(m)
    m.on('click', (e) => onChange(+e.latlng.lat.toFixed(5), +e.latlng.wrap().lng.toFixed(5)))
    karte.current = m
    return () => m.remove()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!karte.current) return
    if (mk.current) { mk.current.remove(); mk.current = null }
    if (lat != null && lng != null) {
      mk.current = L.circleMarker([lat, lng], { radius: 8, color: '#e3a64a', fillColor: '#c0261e', fillOpacity: 1 }).addTo(karte.current)
    }
  }, [lat, lng])
  return <div ref={el} className="ort-karte" aria-label="Klicke auf die Karte, um den Fundort zu setzen" />
}

export default function Editor() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { istAdmin, session, aktePerSlug, ueberakten, neuLaden, laedt } = useDaten()
  const bestehend = slug ? aktePerSlug(slug) : null
  const [a, setA] = useState(null)
  const [slugManuell, setSlugManuell] = useState(false)
  const [speichert, setSpeichert] = useState(false)
  const [meldung, setMeldung] = useState(null)
  const [neueUeber, setNeueUeber] = useState(null)
  const [eigeneFahne, setEigeneFahne] = useState('')
  const laender = useRef(alleLaender()).current

  useEffect(() => {
    if (laedt) return
    if (bestehend) { setA({ ...LEER, ...bestehend, jahr: bestehend.jahr ?? '' }); setSlugManuell(true) }
    else if (!slug) {
      const s = params.get('sammlung')
      const u = s && ueberakten.find((x) => x.slug === s)
      setA({ ...LEER, ...(u ? { ueberakte_id: u.id, bereich: 'film_serie', echtheit: 'fiktion', spoiler: true } : {}) })
    }
  }, [laedt, bestehend?.id, slug]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!laedt && !session) return <Navigate to="/anmelden" />
  if (!laedt && session && !istAdmin) return <div className="schmal-seite"><h1 className="seiten-titel">Kein Zugriff</h1><p>Nur Archivare dürfen Akten bearbeiten.</p></div>
  if (!a) return <div className="laden">Der Schreibtisch wird vorbereitet …</div>

  const setz = (teil) => setA((x) => ({ ...x, ...teil }))
  const toggleFahne = (f) => setz({ fahnen: a.fahnen.includes(f) ? a.fahnen.filter((x) => x !== f) : [...a.fahnen, f] })

  const bildHochladen = async (datei) => {
    if (!datei) return
    setMeldung({ art: 'ok', text: 'Bild wird hochgeladen …' })
    const pfad = `${a.slug || slugify(a.titel) || 'akte'}/${Date.now()}-${datei.name.replace(/[^a-z0-9.]/gi, '_')}`
    const { error } = await supabase.storage.from(BILDER_BUCKET).upload(pfad, datei, { upsert: true })
    if (error) { setMeldung({ art: 'fehler', text: `Upload fehlgeschlagen: ${error.message}` }); return }
    const { data } = supabase.storage.from(BILDER_BUCKET).getPublicUrl(pfad)
    setz({ bild_url: data.publicUrl })
    setMeldung({ art: 'ok', text: 'Bild hochgeladen. Speichern nicht vergessen.' })
  }

  const speichern = async (e) => {
    e.preventDefault()
    setSpeichert(true)
    setMeldung(null)
    let ueberId = a.ueberakte_id
    if (neueUeber?.titel) {
      const { data, error } = await supabase.from('ueberakten').insert({ titel: neueUeber.titel, slug: slugify(neueUeber.titel), art: neueUeber.art, jahr: neueUeber.jahr || null, beschreibung: neueUeber.beschreibung || null }).select().single()
      if (error) { setSpeichert(false); setMeldung({ art: 'fehler', text: `Sammelakte: ${error.message}` }); return }
      ueberId = data.id
    }
    const datensatz = {
      ...a,
      slug: a.slug || slugify(a.titel),
      status: a.typ === 'story' ? null : a.status,
      jahr: a.jahr === '' ? null : +a.jahr,
      land: a.land || null,
      kontinent: a.kontinent || kontinentVonLand(a.land) || null,
      ueberakte_id: ueberId || null,
      bild_url: a.bild_url || null,
    }
    delete datensatz.id; delete datensatz.nummer; delete datensatz.created_at; delete datensatz.updated_at
    const q = bestehend ? supabase.from('akten').update(datensatz).eq('id', bestehend.id) : supabase.from('akten').insert(datensatz)
    const { error } = await q
    setSpeichert(false)
    if (error) { setMeldung({ art: 'fehler', text: error.message.includes('duplicate') ? 'Diese Kurzadresse ist schon vergeben. Bitte eine andere wählen.' : error.message }); return }
    await neuLaden()
    nav(`/akte/${datensatz.slug}`)
  }

  const loeschen = async () => {
    if (!bestehend || !confirm(`„${bestehend.titel}“ endgültig löschen? Das kann nicht rückgängig gemacht werden.`)) return
    const { error } = await supabase.from('akten').delete().eq('id', bestehend.id)
    if (error) { setMeldung({ art: 'fehler', text: error.message }); return }
    await neuLaden()
    nav('/')
  }

  return (
    <div className="editor">
      <div className="editor-kopf">
        <h1 className="seiten-titel">{bestehend ? `Akte bearbeiten` : 'Neue Akte anlegen'}</h1>
        {bestehend && <Link to={`/akte/${bestehend.slug}`} className="zurueck-link">Zur Akte, ohne zu speichern</Link>}
      </div>

      <form className="formular editor-formular" onSubmit={speichern}>
        <fieldset>
          <legend>Grunddaten</legend>
          <label>Titel<input required value={a.titel} onChange={(e) => setz({ titel: e.target.value, ...(slugManuell ? {} : { slug: slugify(e.target.value) }) })} /></label>
          <label>Untertitel<input value={a.untertitel || ''} onChange={(e) => setz({ untertitel: e.target.value })} placeholder="optional" /></label>
          <label>Kurzadresse<input value={a.slug} onChange={(e) => { setSlugManuell(true); setz({ slug: slugify(e.target.value) }) }} /><small>/akte/{a.slug || '…'}</small></label>
          <div className="drei-spalten">
            <label>Art<select value={a.typ} onChange={(e) => setz({ typ: e.target.value })}>{Object.entries(TYPEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            {a.typ === 'mysterium' && <label>Status<select value={a.status || 'ungeloest'} onChange={(e) => setz({ status: e.target.value })}>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>}
            <label>Bereich<select value={a.bereich} onChange={(e) => setz({ bereich: e.target.value })}>{Object.entries(BEREICHE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Echtheit<select value={a.echtheit} onChange={(e) => setz({ echtheit: e.target.value })}>{Object.entries(ECHTHEIT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
          <label className="grusel-filter">
            <span>Gruselfaktor {a.gruselfaktor}: {GRUSEL_TEXT[a.gruselfaktor]}</span>
            <input type="range" min="1" max="5" value={a.gruselfaktor} onChange={(e) => setz({ gruselfaktor: +e.target.value })} />
          </label>
          <div className="fahnen-filter">
            {[...new Set([...Object.keys(FAHNEN), ...a.fahnen])].map((f) => (
              <button type="button" key={f} className={`fahne ${a.fahnen.includes(f) ? 'aktiv' : ''}`} style={{ '--farbe': fahnenFarbe(f) }} aria-pressed={a.fahnen.includes(f)} onClick={() => toggleFahne(f)}>{f}</button>
            ))}
            <span className="eigene-fahne">
              <input value={eigeneFahne} onChange={(e) => setEigeneFahne(e.target.value)} placeholder="Eigenes Fähnchen" aria-label="Eigenes Fähnchen" />
              <button type="button" onClick={() => { if (eigeneFahne.trim()) { toggleFahne(eigeneFahne.trim()); setEigeneFahne('') } }}>Hinzufügen</button>
            </span>
          </div>
        </fieldset>

        <fieldset>
          <legend>Film, Serie oder Buch</legend>
          <label>Sammelakte
            <select value={neueUeber ? '__neu' : a.ueberakte_id || ''} onChange={(e) => { if (e.target.value === '__neu') setNeueUeber({ titel: '', art: 'serie' }); else { setNeueUeber(null); setz({ ueberakte_id: e.target.value || null }) } }}>
              <option value="">Keine (Einzelakte)</option>
              {ueberakten.map((u) => <option key={u.id} value={u.id}>{u.titel}</option>)}
              <option value="__neu">Neue Sammelakte anlegen …</option>
            </select>
          </label>
          {neueUeber && (
            <div className="drei-spalten">
              <label>Titel des Films/der Serie<input value={neueUeber.titel} onChange={(e) => setNeueUeber({ ...neueUeber, titel: e.target.value })} /></label>
              <label>Art<select value={neueUeber.art} onChange={(e) => setNeueUeber({ ...neueUeber, art: e.target.value })}><option value="film">Film</option><option value="serie">Serie</option><option value="buch">Buch</option></select></label>
              <label>Jahr<input value={neueUeber.jahr || ''} onChange={(e) => setNeueUeber({ ...neueUeber, jahr: e.target.value })} /></label>
              <label className="breit">Beschreibung<textarea rows={2} value={neueUeber.beschreibung || ''} onChange={(e) => setNeueUeber({ ...neueUeber, beschreibung: e.target.value })} /></label>
            </div>
          )}
          <label className="check"><input type="checkbox" checked={a.spoiler} onChange={(e) => setz({ spoiler: e.target.checked })} /> Enthält Spoiler (Leser werden vorher gewarnt)</label>
        </fieldset>

        <fieldset>
          <legend>Wer, wo, wann</legend>
          <label>Beteiligte<input value={a.beteiligte || ''} onChange={(e) => setz({ beteiligte: e.target.value })} placeholder="Mehrere mit Semikolon trennen" /></label>
          <div className="drei-spalten">
            <label>Ort<input value={a.ort || ''} onChange={(e) => setz({ ort: e.target.value })} /></label>
            <label>Land
              <select value={a.land || ''} onChange={(e) => setz({ land: e.target.value, kontinent: kontinentVonLand(e.target.value) || a.kontinent })}>
                <option value="">Kein Land (z. B. auf See)</option>
                {laender.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </label>
            <label>Region
              <select value={a.kontinent || ''} onChange={(e) => setz({ kontinent: e.target.value })}>
                <option value="">Automatisch</option>
                {Object.entries(KONTINENTE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Jahr<input type="number" value={a.jahr} onChange={(e) => setz({ jahr: e.target.value })} /></label>
            <label>Zeitraum<input value={a.zeitraum || ''} onChange={(e) => setz({ zeitraum: e.target.value })} placeholder="z. B. Januar bis Mai 1959" /></label>
          </div>
          <p className="feld-hinweis">Fundort: Klicke auf die Karte. {a.lat != null && <>Gesetzt auf {a.lat}, {a.lng}. <button type="button" className="link-knopf" onClick={() => setz({ lat: null, lng: null })}>Entfernen</button></>}</p>
          <OrtWahl lat={a.lat} lng={a.lng} onChange={(lat, lng) => setz({ lat, lng })} />
        </fieldset>

        <fieldset>
          <legend>Bild</legend>
          <div className="bild-bereich">
            <Polaroid akte={{ ...a, slug: a.slug || 'neu' }} beschriftung="Vorschau" />
            <div>
              <label>Foto hochladen<input type="file" accept="image/*" onChange={(e) => bildHochladen(e.target.files?.[0])} /></label>
              <label>oder Bild-Link<input value={a.bild_url || ''} onChange={(e) => setz({ bild_url: e.target.value })} placeholder="https://…" /></label>
              <label>Bildnachweis<input value={a.bild_credit || ''} onChange={(e) => setz({ bild_credit: e.target.value })} placeholder="z. B. Wikimedia Commons, gemeinfrei" /></label>
              <label>Gezeichnetes Motiv (wenn kein Foto)
                <select value={a.motiv || 'auge'} onChange={(e) => setz({ motiv: e.target.value })}>{Object.entries(MOTIVE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </label>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Texte</legend>
          <label>Kurzbericht (Zusammenfassung)<textarea rows={5} value={a.zusammenfassung || ''} onChange={(e) => setz({ zusammenfassung: e.target.value })} /></label>
          <label>Ausführlicher Bericht
            <textarea rows={18} value={a.inhalt || ''} onChange={(e) => setz({ inhalt: e.target.value })} />
            <small>Leerzeile = neuer Absatz. „## “ am Zeilenanfang = Zwischenüberschrift. **fett**, *kursiv*, „&gt; “ = Zitat.</small>
          </label>
        </fieldset>

        {Object.keys(LISTEN).map((k) => <ListenEditor key={k} name={k} wert={a[k] || []} onChange={(v) => setz({ [k]: v })} />)}

        <fieldset>
          <legend>Sichtbarkeit</legend>
          <label className="check"><input type="checkbox" checked={a.veroeffentlicht} onChange={(e) => setz({ veroeffentlicht: e.target.checked })} /> Veröffentlicht (sonst nur für Archivare sichtbar)</label>
        </fieldset>

        {meldung && <p className={meldung.art === 'fehler' ? 'hinweis-fehler' : 'hinweis-ok'}>{meldung.text}</p>}
        <div className="editor-knoepfe">
          <button className="knopf knopf-gross" disabled={speichert}>{speichert ? 'Wird gespeichert …' : bestehend ? 'Änderungen speichern' : 'Akte anlegen'}</button>
          {bestehend && <button type="button" className="knopf-gefahr" onClick={loeschen}>Akte löschen</button>}
        </div>
      </form>
    </div>
  )
}
