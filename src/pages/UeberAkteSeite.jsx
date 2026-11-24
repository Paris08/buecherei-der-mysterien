import { Link, useParams } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { aktennummer } from '../lib/utils'
import { Fahnen, Grusel, Stempel } from '../components/Kleinteile'

export default function UeberAkteSeite() {
  const { slug } = useParams()
  const { ueberakten, akten, laedt, istAdmin } = useDaten()
  const ueber = ueberakten.find((u) => u.slug === slug)
  if (laedt) return <div className="laden">Der Karton wird geöffnet …</div>
  if (!ueber) return <div className="leer-seite"><h1>Diese Sammelakte gibt es nicht.</h1><Link to="/">Zurück</Link></div>
  const inhalt = akten.filter((a) => a.ueberakte_id === ueber.id)

  return (
    <div className="sammlung">
      <div className="sammlung-kopf">
        <span className="karton-label">Sammelakte</span>
        <h1>{ueber.titel}</h1>
        <p className="sammlung-meta">{[ueber.art === 'serie' ? 'Serie' : ueber.art === 'buch' ? 'Buch' : 'Film', ueber.jahr].filter(Boolean).join(', ')}</p>
        {ueber.beschreibung && <p className="sammlung-text">{ueber.beschreibung}</p>}
        {inhalt.some((a) => a.spoiler) && <p className="sammlung-spoiler">Einige Akten in diesem Karton enthalten Spoiler. Sie fragen dich vor dem Öffnen.</p>}
      </div>
      <div className="mappen">
        {inhalt.map((a) => (
          <Link key={a.id} to={`/akte/${a.slug}`} className="mappe">
            <span className="mappe-reiter">{aktennummer(a.nummer)}</span>
            <strong>{a.titel}</strong>
            {a.untertitel && <small>{a.untertitel}</small>}
            <span className="mappe-meta">
              <Stempel art="status" wert={a.status} klein />
              {a.spoiler && <span className="stempel stempel-spoiler stempel-klein">Spoiler</span>}
            </span>
            <Grusel wert={a.gruselfaktor} />
            <Fahnen fahnen={a.fahnen} max={3} />
          </Link>
        ))}
        {istAdmin && <Link to={`/admin/neu?sammlung=${ueber.slug}`} className="mappe mappe-neu">Neue Akte in diesen Karton legen</Link>}
      </div>
    </div>
  )
}
