import { useCallback, useEffect, useRef, useState } from 'react'

// Akten-Seiten zum Umblättern (Wischen, Pfeiltasten, Knöpfe, Register).
export default function Blaetterbuch({ seiten, wenigBewegung, onEnde, startSeite = 0 }) {
  const [idx, setIdx] = useState(startSeite)
  const [anim, setAnim] = useState(null)
  const start = useRef(null)
  const flaeche = useRef(null)

  const gehe = useCallback((ziel) => {
    if (anim || ziel === idx || ziel < 0 || ziel >= seiten.length) return
    if (wenigBewegung) { setIdx(ziel); return }
    setAnim({ richtung: ziel > idx ? 'vor' : 'zurueck', von: idx, nach: ziel })
  }, [anim, idx, seiten.length, wenigBewegung])

  useEffect(() => {
    const taste = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight') gehe(idx + 1)
      if (e.key === 'ArrowLeft') gehe(idx - 1)
    }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [gehe, idx])

  useEffect(() => {
    if (idx === seiten.length - 1) onEnde?.()
    flaeche.current?.querySelectorAll('.blatt-inhalt').forEach((el) => { el.scrollTop = 0 })
  }, [idx, seiten.length, onEnde])

  const fertig = () => { if (anim) { setIdx(anim.nach); setAnim(null) } }

  const unten = anim ? (anim.richtung === 'vor' ? anim.nach : anim.von) : idx
  const oben = anim ? (anim.richtung === 'vor' ? anim.von : anim.nach) : null

  const blatt = (i, klasse = '') => (
    <article className={`blatt ${klasse}`} key={`${i}-${klasse}`} onAnimationEnd={klasse ? fertig : undefined} aria-hidden={klasse === 'blatt-weg' ? 'true' : undefined}>
      <div className="blatt-inhalt">{seiten[i].inhalt}</div>
      <footer className="blatt-fuss">
        <span>{seiten[i].titel}</span>
        <span>Blatt {i + 1} von {seiten.length}</span>
      </footer>
    </article>
  )

  const register = seiten.map((s, i) => ({ ...s, i })).filter((s) => s.register)

  return (
    <div className="blaetterbuch">
      <nav className="register" aria-label="Register">
        {register.map((s) => {
          const naechstes = register.find((r) => r.i > s.i)
          const aktiv = idx >= s.i && (!naechstes || idx < naechstes.i)
          return (
            <button key={s.i} className={aktiv ? 'aktiv' : ''} onClick={() => gehe(s.i)} aria-current={aktiv ? 'page' : undefined}>
              {s.register}
            </button>
          )
        })}
      </nav>

      <div
        className="blatt-flaeche"
        ref={flaeche}
        onPointerDown={(e) => { if (e.pointerType !== 'mouse') start.current = { x: e.clientX, y: e.clientY } }}
        onPointerUp={(e) => {
          if (!start.current) return
          const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y
          start.current = null
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) gehe(dx < 0 ? idx + 1 : idx - 1)
        }}
      >
        {blatt(unten)}
        {oben != null && blatt(oben, anim.richtung === 'vor' ? 'blatt-weg' : 'blatt-her')}
        {idx < seiten.length - 1 && !anim && (
          <button className="eselsohr" onClick={() => gehe(idx + 1)} aria-label="Umblättern" title="Umblättern" />
        )}
      </div>

      <div className="blaetter-steuerung">
        <button className="knopf knopf-leise" onClick={() => gehe(idx - 1)} disabled={idx === 0}>Zurückblättern</button>
        <div className="punkte" aria-hidden="true">
          {seiten.map((_, i) => <i key={i} className={i === idx ? 'aktiv' : ''} />)}
        </div>
        <button className="knopf" onClick={() => gehe(idx + 1)} disabled={idx === seiten.length - 1}>Umblättern</button>
      </div>
    </div>
  )
}
