import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDaten } from '../lib/daten'

export default function Anmelden() {
  const { session, istAdmin } = useDaten()
  const [modus, setModus] = useState('anmelden')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [meldung, setMeldung] = useState(null)
  const [laeuft, setLaeuft] = useState(false)

  if (session) return istAdmin ? <Navigate to="/" /> : (
    <div className="schmal-seite"><h1 className="seiten-titel">Angemeldet</h1><p>Du bist angemeldet. Bearbeiten können nur Archivare.</p></div>
  )

  const absenden = async (e) => {
    e.preventDefault()
    setLaeuft(true)
    setMeldung(null)
    const { error } = modus === 'anmelden'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin } })
    setLaeuft(false)
    if (error) {
      setMeldung({ art: 'fehler', text: error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort stimmt nicht.' : error.message === 'Email not confirmed' ? 'Bitte bestätige zuerst den Link in deiner E-Mail.' : error.message })
    } else if (modus === 'registrieren') {
      setMeldung({ art: 'ok', text: 'Fast geschafft: Bestätige den Link in deiner E-Mail und melde dich dann hier an.' })
      setModus('anmelden')
    }
  }

  return (
    <div className="schmal-seite anmelden">
      <h1 className="seiten-titel">Archivzugang</h1>
      <p className="leise">Lesen kann jeder. Zum Anlegen und Bearbeiten von Akten brauchst du einen Archivar-Zugang.</p>
      <div className="abteilungen" role="tablist">
        <button role="tab" aria-selected={modus === 'anmelden'} className={modus === 'anmelden' ? 'aktiv' : ''} onClick={() => setModus('anmelden')}>Anmelden</button>
        <button role="tab" aria-selected={modus === 'registrieren'} className={modus === 'registrieren' ? 'aktiv' : ''} onClick={() => setModus('registrieren')}>Konto erstellen</button>
      </div>
      <form className="formular" onSubmit={absenden}>
        <label>E-Mail<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Passwort<input type="password" required minLength={6} autoComplete={modus === 'anmelden' ? 'current-password' : 'new-password'} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        {meldung && <p className={meldung.art === 'fehler' ? 'hinweis-fehler' : 'hinweis-ok'}>{meldung.text}</p>}
        <button className="knopf" disabled={laeuft}>{laeuft ? 'Einen Moment …' : modus === 'anmelden' ? 'Anmelden' : 'Konto erstellen'}</button>
      </form>
    </div>
  )
}
