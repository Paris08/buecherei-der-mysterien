import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useEinstellungen } from '../lib/speicher'

function Auswahl({ name, wert, optionen, onChange }) {
  return (
    <div className="segment" role="radiogroup" aria-label={name}>
      {optionen.map(([w, label, hinweis]) => (
        <button key={w} type="button" role="radio" aria-checked={wert === w} className={wert === w ? 'aktiv' : ''} onClick={() => onChange(w)}>
          <strong>{label}</strong>
          {hinweis && <small>{hinweis}</small>}
        </button>
      ))}
    </div>
  )
}

export default function Einstellungen({ onClose }) {
  const [e, setE] = useEinstellungen()
  useEffect(() => {
    const esc = (ev) => ev.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  return createPortal(
    <div className="modal-hg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="einst-titel" onClick={(ev) => ev.stopPropagation()}>
        <h2 id="einst-titel">Einstellungen</h2>

        <section>
          <h3>So liest du Akten</h3>
          <Auswahl
            name="Lesemodus"
            wert={e.lesemodus}
            onChange={(v) => setE({ lesemodus: v })}
            optionen={[
              ['blaettern', 'Umblättern', 'Seite für Seite, wischen oder Pfeiltasten'],
              ['scrollen', 'Scrollen', 'Die ganze Akte untereinander'],
            ]}
          />
        </section>

        <section>
          <h3>Schriftgröße in Akten</h3>
          <Auswahl name="Schriftgröße" wert={e.schrift} onChange={(v) => setE({ schrift: v })} optionen={[['klein', 'Klein'], ['normal', 'Normal'], ['gross', 'Groß']]} />
        </section>

        <section className="schalter-liste">
          <label className="schalter schalter-haupt">
            <input type="checkbox" checked={e.atmosphaere} onChange={(ev) => setE({ atmosphaere: ev.target.checked })} />
            <span>
              <strong>Atmosphäre</strong>
              <small>Hauptschalter für alle Effekte unten</small>
            </span>
          </label>
          <div className={`unterschalter ${e.atmosphaere ? '' : 'aus'}`}>
            {[
              ['kerzen', 'Kerzenflackern', 'Flammen, Kronleuchter und Kerzenschein auf dem Papier'],
              ['koernung', 'Filmkörnung', 'Leichtes Rauschen wie auf altem Film'],
              ['vignette', 'Vignette', 'Dunkle Ränder und das Licht, das ab und zu flackert'],
              ['nebel', 'Nebel', 'Langsam ziehender Nebel am unteren Rand'],
              ['gruselEffekte', 'Gruselfaktor-Effekte', 'Roter Rand ab Stufe 4, Herzschlag bei Stufe 5'],
            ].map(([k, titel, text]) => (
              <label key={k} className="schalter">
                <input type="checkbox" disabled={!e.atmosphaere} checked={e[k]} onChange={(ev) => setE({ [k]: ev.target.checked })} />
                <span><strong>{titel}</strong><small>{text}</small></span>
              </label>
            ))}
          </div>
          <label className="schalter">
            <input type="checkbox" checked={e.wenigBewegung} onChange={(ev) => setE({ wenigBewegung: ev.target.checked })} />
            <span>
              <strong>Weniger Bewegung</strong>
              <small>Keine Animationen, Seiten wechseln ohne Umblättern</small>
            </span>
          </label>
        </section>

        <p className="modal-hinweis">Einstellungen, Merkliste und Ermittlungsbretter werden nur auf diesem Gerät gespeichert.</p>
        <button className="knopf" onClick={onClose}>Fertig</button>
      </div>
    </div>,
    document.body,
  )
}
