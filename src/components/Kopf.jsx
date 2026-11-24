import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDaten } from '../lib/daten'
import { supabase } from '../lib/supabase'
import Einstellungen from './Einstellungen'

export function useZufallsAkte() {
  const { akten } = useDaten()
  const nav = useNavigate()
  return (auswahl) => {
    const pool = auswahl?.length ? auswahl : akten
    if (!pool.length) return
    const a = pool[Math.floor(Math.random() * pool.length)]
    nav(`/akte/${a.slug}`, { state: { gezogen: true } })
  }
}

export default function Kopf() {
  const { session, istAdmin } = useDaten()
  const [offen, setOffen] = useState(false)
  const [menue, setMenue] = useState(false)
  const zufall = useZufallsAkte()

  return (
    <header className="kopf">
      <Link to="/" className="marke" onClick={() => setMenue(false)}>
        <svg viewBox="0 0 32 40" aria-hidden="true" className="kerze">
          <path className="flamme" d="M16 2c-2.4 4.6-5 6.4-5 10a5 5 0 0 0 10 0c0-3.6-2.6-5.4-5-10z" />
          <rect x="11.5" y="17" width="9" height="19" rx="1.5" />
        </svg>
        <span>Bücherei der Mysterien</span>
      </Link>

      <button className="menue-knopf" onClick={() => setMenue((m) => !m)} aria-expanded={menue} aria-controls="hauptnav">
        <span /><span /><span /><span className="sr">Menü</span>
      </button>

      <nav id="hauptnav" className={menue ? 'offen' : ''} onClick={() => setMenue(false)}>
        <NavLink to="/" end>Bibliothek</NavLink>
        <NavLink to="/karte">Karte</NavLink>
        <NavLink to="/favoriten">Merkliste</NavLink>
        <NavLink to="/community">Community-Hub <small className="bald">bald</small></NavLink>
        {istAdmin && <NavLink to="/admin/neu" className="nav-neu">Neue Akte</NavLink>}
      </nav>

      <div className="kopf-aktionen">
        <button className="knopf-icon" onClick={() => zufall()} title="Zufällige Akte ziehen">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1.4" /><circle cx="16" cy="8" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="8" cy="16" r="1.4" /><circle cx="16" cy="16" r="1.4" /></svg>
          <span className="nur-breit">Zufall</span>
        </button>
        <button className="knopf-icon" onClick={() => setOffen(true)} title="Einstellungen">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>
          <span className="sr">Einstellungen</span>
        </button>
        {session ? (
          <button className="knopf-icon" onClick={() => supabase.auth.signOut()} title={istAdmin ? 'Als Archivar angemeldet – abmelden' : 'Abmelden'}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" /></svg>
            <span className="nur-breit">{istAdmin ? 'Archivar' : 'Abmelden'}</span>
          </button>
        ) : (
          <Link className="knopf-icon" to="/anmelden" title="Anmelden">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="12" r="4" /><path d="M13 12h8M18 12v3M21 12v2" /></svg>
            <span className="nur-breit">Anmelden</span>
          </Link>
        )}
      </div>
      {offen && <Einstellungen onClose={() => setOffen(false)} />}
    </header>
  )
}
