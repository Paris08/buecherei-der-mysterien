import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Kopf from './components/Kopf'
import { useEinstellungen } from './lib/speicher'
import Bibliothek from './pages/Bibliothek'
import AkteSeite from './pages/AkteSeite'
import UeberAkteSeite from './pages/UeberAkteSeite'
import Merkliste from './pages/Merkliste'
import Community from './pages/Community'
import Anmelden from './pages/Anmelden'

const Karte = lazy(() => import('./pages/Karte'))
const Brett = lazy(() => import('./pages/Brett'))
const Editor = lazy(() => import('./pages/Editor'))

export default function App() {
  const [e] = useEinstellungen()
  const { pathname } = useLocation()

  useEffect(() => {
    document.documentElement.dataset.atmosphaere = e.atmosphaere ? 'an' : 'aus'
    document.documentElement.dataset.bewegung = e.wenigBewegung ? 'wenig' : 'normal'
    document.documentElement.dataset.schrift = e.schrift
  }, [e])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <>
      <a href="#inhalt" className="skip">Zum Inhalt springen</a>
      <Kopf />
      <main id="inhalt">
        <Suspense fallback={<div className="laden">Die Kerze wird angezündet …</div>}>
          <Routes>
            <Route path="/" element={<Bibliothek />} />
            <Route path="/akte/:slug" element={<AkteSeite />} />
            <Route path="/akte/:slug/brett" element={<Brett />} />
            <Route path="/akte/:slug/bearbeiten" element={<Editor />} />
            <Route path="/sammlung/:slug" element={<UeberAkteSeite />} />
            <Route path="/karte" element={<Karte />} />
            <Route path="/favoriten" element={<Merkliste />} />
            <Route path="/community" element={<Community />} />
            <Route path="/anmelden" element={<Anmelden />} />
            <Route path="/admin/neu" element={<Editor />} />
            <Route path="*" element={<div className="leer-seite"><h1>Diese Akte existiert nicht.</h1><p>Vielleicht wurde sie vernichtet. Oder sie wurde nie angelegt.</p></div>} />
          </Routes>
        </Suspense>
      </main>
      <div className="nebel" aria-hidden="true"><i /><i /></div>
      <div className="vignette" aria-hidden="true" />
      <div className="koernung" aria-hidden="true" />
    </>
  )
}
