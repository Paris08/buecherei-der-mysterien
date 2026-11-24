import { Link } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { useFavoriten, useGelesen } from '../lib/speicher'
import { aktennummer } from '../lib/utils'
import { Fahnen, FavoritKnopf, Grusel, Stempel } from '../components/Kleinteile'

function Karte({ a }) {
  return (
    <div className="karteikarte">
      <Link to={`/akte/${a.slug}`} className="kk-link" aria-label={a.titel} />
      <span className="kk-nr">{aktennummer(a.nummer)}</span>
      <span className="kk-titel"><strong>{a.titel}</strong></span>
      <span className="kk-meta">{[a.ort, a.jahr].filter(Boolean).join(', ')}</span>
      <span className="kk-stempel"><Stempel art="status" wert={a.status} klein /><Grusel wert={a.gruselfaktor} /></span>
      <Fahnen fahnen={a.fahnen} max={3} />
      <FavoritKnopf id={a.id} />
    </div>
  )
}

export default function Merkliste() {
  const { akten } = useDaten()
  const [fav] = useFavoriten()
  const [gelesen] = useGelesen()
  const gemerkt = akten.filter((a) => fav.includes(a.id))
  const zuletzt = akten.filter((a) => gelesen[a.id]).sort((x, y) => gelesen[y.id] - gelesen[x.id]).slice(0, 8)

  return (
    <div className="schmal-seite">
      <h1 className="seiten-titel">Merkliste</h1>
      {gemerkt.length ? (
        <div className="karteikasten">{gemerkt.map((a) => <Karte key={a.id} a={a} />)}</div>
      ) : (
        <div className="leer">
          <p>Du hast noch keine Akte gemerkt. Tippe in einer Akte auf „Merken“, dann landet sie hier.</p>
          <Link className="knopf knopf-leise" to="/">Zur Bibliothek</Link>
        </div>
      )}
      {zuletzt.length > 0 && (
        <>
          <h2 className="seiten-untertitel">Zuletzt zu Ende gelesen</h2>
          <div className="karteikasten">{zuletzt.map((a) => <Karte key={a.id} a={a} />)}</div>
        </>
      )}
    </div>
  )
}
