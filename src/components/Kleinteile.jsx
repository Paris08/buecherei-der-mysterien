import { ECHTHEIT, fahnenFarbe, GRUSEL_TEXT, STATUS } from '../lib/konstanten'
import { absaetze, hash } from '../lib/utils'
import { useFavoriten } from '../lib/speicher'
import Motiv from './Motiv'

export function Stempel({ art, wert, klein }) {
  if (!wert) return null
  const text = art === 'status' ? STATUS[wert] : ECHTHEIT[wert]
  const drehung = (hash(wert + art) % 9) - 6
  return (
    <span className={`stempel stempel-${art} stempel-${wert} ${klein ? 'stempel-klein' : ''}`} style={{ '--dreh': `${drehung}deg` }}>
      {text}
    </span>
  )
}

export function Fahnen({ fahnen = [], max }) {
  const liste = max ? fahnen.slice(0, max) : fahnen
  return (
    <span className="fahnen">
      {liste.map((f) => (
        <span key={f} className="fahne" style={{ '--farbe': fahnenFarbe(f) }}>{f}</span>
      ))}
    </span>
  )
}

export function Grusel({ wert = 1, mitText }) {
  return (
    <span className="grusel" title={`Gruselfaktor ${wert} von 5 – ${GRUSEL_TEXT[wert]}`} aria-label={`Gruselfaktor ${wert} von 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 22" className={i <= wert ? 'an' : 'aus'} aria-hidden="true">
          <path d="M10 1C4.8 1 1.5 4.6 1.5 9c0 2.7 1.3 4.6 3 5.7V18c0 1 .7 1.8 1.6 1.8h7.8c.9 0 1.6-.8 1.6-1.8v-3.3c1.7-1.1 3-3 3-5.7C18.5 4.6 15.2 1 10 1z" />
          <circle cx="6.6" cy="9.6" r="2.1" className="loch" /><circle cx="13.4" cy="9.6" r="2.1" className="loch" />
          <path d="M9 13.2l1-1.8 1 1.8z" className="loch" />
        </svg>
      ))}
      {mitText && <span className="grusel-text">{GRUSEL_TEXT[wert]}</span>}
    </span>
  )
}

export function Polaroid({ akte, beschriftung }) {
  const dreh = (hash(akte.slug) % 7) - 3
  return (
    <figure className="polaroid" style={{ '--dreh': `${dreh}deg` }}>
      <span className="bueroklammer" aria-hidden="true" />
      <div className="polaroid-bild">
        {akte.bild_url ? <img src={akte.bild_url} alt={akte.titel} loading="lazy" /> : <Motiv motiv={akte.motiv} seed={akte.slug} />}
      </div>
      <figcaption>{beschriftung ?? akte.ort ?? akte.titel}</figcaption>
      {akte.bild_url && akte.bild_credit && <small className="bild-credit">Bild: {akte.bild_credit}</small>}
    </figure>
  )
}

function inline(text) {
  const teile = []
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g
  let last = 0, m, i = 0
  while ((m = re.exec(text))) {
    if (m.index > last) teile.push(text.slice(last, m.index))
    const t = m[0]
    teile.push(t.startsWith('**') ? <strong key={i++}>{t.slice(2, -2)}</strong> : <em key={i++}>{t.slice(1, -1)}</em>)
    last = m.index + t.length
  }
  if (last < text.length) teile.push(text.slice(last))
  return teile
}

export function Fliesstext({ text, absatzListe }) {
  const ps = absatzListe || absaetze(text)
  return ps.map((p, i) => {
    if (p.startsWith('## ')) return <h3 key={i} className="zwischentitel">{p.slice(3)}</h3>
    if (p.startsWith('> ')) return <blockquote key={i}>{inline(p.slice(2))}</blockquote>
    return <p key={i}>{inline(p)}</p>
  })
}

export function FavoritKnopf({ id, mitText }) {
  const [fav, toggle] = useFavoriten()
  const aktiv = fav.includes(id)
  return (
    <button type="button" className={`knopf-icon fav ${aktiv ? 'aktiv' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(id) }} aria-pressed={aktiv} title={aktiv ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4.5L6 21z" /></svg>
      {mitText && <span>{aktiv ? 'Gemerkt' : 'Merken'}</span>}
    </button>
  )
}
