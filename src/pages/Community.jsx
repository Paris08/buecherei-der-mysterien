import { BEREICHE, FAHNEN } from '../lib/konstanten'

// Vorbereitet, aber noch nicht in Nutzung. Die Datenbank-Tabelle "community_einreichungen" existiert bereits,
// Einreichungen sind per RLS aber gesperrt, bis der Hub freigeschaltet wird.
export default function Community() {
  return (
    <div className="schmal-seite community">
      <div className="absperrband" aria-hidden="true"><span>Noch nicht in Nutzung</span><span>Noch nicht in Nutzung</span><span>Noch nicht in Nutzung</span></div>
      <h1 className="seiten-titel">Community-Hub</h1>
      <p className="community-intro">
        Hier sollen später Leser eigene Mysterien und Storys einreichen können. Jede Einreichung landet zuerst beim Archivar, wird geprüft und kommt erst dann ins Regal.
      </p>

      <ol className="ablauf">
        <li><strong>Einreichen</strong><span>Titel, Kategorie, Fähnchen, Ort, Jahr und die Geschichte selbst.</span></li>
        <li><strong>Prüfen</strong><span>Der Archivar liest gegen, ergänzt Quellen und Zeitleiste.</span></li>
        <li><strong>Einsortieren</strong><span>Die Akte bekommt eine Nummer und landet in der Bibliothek und auf der Karte.</span></li>
      </ol>

      <form className="formular gesperrt-form" aria-disabled="true" onSubmit={(e) => e.preventDefault()}>
        <fieldset disabled>
          <legend>Vorschau des Einreichungsformulars</legend>
          <label>Titel<input placeholder="Wie heißt dein Mysterium?" /></label>
          <div className="zwei-spalten">
            <label>Art<select><option>Mysterium</option><option>Story</option></select></label>
            <label>Bereich<select>{Object.values(BEREICHE).map((b) => <option key={b}>{b}</option>)}</select></label>
          </div>
          <label>Fähnchen<select multiple size={3}>{Object.keys(FAHNEN).map((f) => <option key={f}>{f}</option>)}</select></label>
          <div className="zwei-spalten">
            <label>Ort<input placeholder="Stadt, Land" /></label>
            <label>Jahr<input placeholder="z. B. 1959" /></label>
          </div>
          <label>Deine Geschichte<textarea rows={5} placeholder="Was ist passiert?" /></label>
          <button className="knopf">Einreichen</button>
        </fieldset>
      </form>
    </div>
  )
}
