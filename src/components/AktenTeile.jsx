import { Link } from 'react-router-dom'
import { abstand, formatDatum, jahreHer, parseDatum, spanne } from '../lib/utils'
import { Fahnen, Grusel, Stempel } from './Kleinteile'

export function Zeitleiste({ eintraege = [], jahr }) {
  const sortiert = [...eintraege].sort((a, b) => (parseDatum(a.datum)?.date ?? 0) - (parseDatum(b.datum)?.date ?? 0))
  const dauer = spanne(sortiert)
  return (
    <div className="zeitleiste">
      <div className="zeit-kopf">
        {jahr != null && <div><strong>{jahreHer(jahr)}</strong><small>seit {jahr}</small></div>}
        {dauer && <div><strong>{dauer}</strong><small>vom ersten bis zum letzten Eintrag</small></div>}
        <div><strong>{sortiert.length}</strong><small>Einträge</small></div>
      </div>
      <ol>
        {sortiert.map((z, i) => {
          const luecke = i > 0 ? abstand(sortiert[i - 1].datum, z.datum) : null
          return (
            <li key={i} className={z.wichtig ? 'wichtig' : ''}>
              {luecke && <span className="luecke">{luecke}</span>}
              <time>{formatDatum(z.datum)}</time>
              <strong>{z.titel}</strong>
              {z.text && <p>{z.text}</p>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

const BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export function Beweise({ beweise = [] }) {
  return (
    <ul className="beweise">
      {beweise.map((b, i) => (
        <li key={i} className="beweis">
          <span className="beweis-schild">Beweisstück {BUCHSTABEN[i] || i + 1}</span>
          {b.art && <span className="beweis-art">{b.art}</span>}
          <strong>{b.titel}</strong>
          <p>{b.beschreibung}</p>
        </li>
      ))}
    </ul>
  )
}

export function Theorien({ theorien = [] }) {
  return (
    <ul className="theorien">
      {theorien.map((t, i) => (
        <li key={i} className="theorie">
          <div className="theorie-kopf">
            <strong>{t.titel}</strong>
            {t.quelle && <span className={`quelle-art q-${(t.quelle || '').toLowerCase()}`}>{t.quelle}</span>}
          </div>
          <p>{t.beschreibung}</p>
          {t.plausibilitaet != null && (
            <div className="plausi" aria-label={`Plausibilität ${t.plausibilitaet} von 5`}>
              <span>Plausibilität</span>
              <span className="plausi-balken"><i style={{ width: `${(t.plausibilitaet / 5) * 100}%` }} /></span>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Quellen({ quellen = [] }) {
  if (!quellen.length) return <p className="leise">Für diese Akte sind noch keine Quellen hinterlegt.</p>
  return (
    <ol className="quellen">
      {quellen.map((q, i) => (
        <li key={i}>{q.url ? <a href={q.url} target="_blank" rel="noreferrer">{q.titel || q.url}</a> : q.titel}</li>
      ))}
    </ol>
  )
}

export function AehnlicheAkten({ akten }) {
  if (!akten.length) return null
  return (
    <ul className="aehnliche">
      {akten.map((a) => (
        <li key={a.id}>
          <Link to={`/akte/${a.slug}`}>
            <strong>{a.titel}</strong>
            <span className="aehnlich-meta">
              <Stempel art="status" wert={a.status} klein />
              <Grusel wert={a.gruselfaktor} />
            </span>
            <Fahnen fahnen={a.fahnen} max={2} />
          </Link>
        </li>
      ))}
    </ul>
  )
}
