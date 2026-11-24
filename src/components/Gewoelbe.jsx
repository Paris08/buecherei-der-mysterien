// Gotische Bibliothekshalle als Hintergrund für den Eingangsbereich. Selbst gezeichnet.
const regal = (x, y, b, h, reihen, key) => {
  const brett = h / reihen
  const buecher = []
  for (let r = 0; r < reihen; r++) {
    let bx = x + 3
    let i = 0
    while (bx < x + b - 6) {
      const w = 3 + ((r * 7 + i * 13 + key) % 5)
      const hh = brett - 6 - ((r * 3 + i * 5 + key) % 6)
      buecher.push(<rect key={`${r}-${i}`} x={bx} y={y + r * brett + (brett - hh) - 2} width={w} height={hh} className={`buch b${(r + i + key) % 4}`} />)
      bx += w + 1
      i++
    }
  }
  return (
    <g key={key}>
      <rect x={x} y={y} width={b} height={h} className="regal-hg" />
      {buecher}
      {Array.from({ length: reihen + 1 }, (_, r) => <rect key={`s${r}`} x={x - 2} y={y + r * brett - 2} width={b + 4} height={3} className="regal-brett-svg" />)}
    </g>
  )
}

export default function Gewoelbe() {
  return (
    <svg className="gewoelbe" viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="g-licht" cx="50%" cy="18%" r="55%">
          <stop offset="0" stopColor="#f0c27a" stopOpacity=".28" />
          <stop offset=".35" stopColor="#c58a3c" stopOpacity=".08" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="g-mond" cx="50%" cy="10%" r="60%">
          <stop offset="0" stopColor="#7f95bd" stopOpacity=".22" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="g-boden" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d0f15" />
          <stop offset="1" stopColor="#050609" />
        </linearGradient>
        <filter id="g-glut" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="5" /></filter>
        <pattern id="g-fliesen" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="skewX(-30) scale(1 .35)">
          <rect width="30" height="30" fill="#1a1510" /><rect x="30" y="30" width="30" height="30" fill="#1a1510" />
        </pattern>
      </defs>

      <rect width="1200" height="760" fill="url(#g-mond)" />
      {/* Hintergrund-Spitzbogen mit Fenster */}
      <path d="M380 470 L380 210 Q380 40 600 10 Q820 40 820 210 L820 470Z" className="bogen-hinten" />
      <path d="M470 220 Q470 110 600 80 Q730 110 730 220 L730 300 L470 300Z" className="fenster" />
      <g className="masswerk">
        <path d="M600 80 L600 300 M470 220 L730 220 M535 300 L535 150 M665 300 L665 150" />
        <circle cx="600" cy="160" r="38" /><circle cx="600" cy="160" r="18" />
      </g>
      {/* Balkon mit Geländer */}
      <rect x="300" y="300" width="600" height="14" className="balkon" />
      <g className="gelaender">
        {Array.from({ length: 41 }, (_, i) => <path key={i} d={`M${310 + i * 14.5} 300 L${310 + i * 14.5} 262`} />)}
        <path d="M305 262 L895 262" />
      </g>
      {/* Mittleres Regal und Tisch */}
      {regal(470, 330, 260, 190, 6, 1)}
      <path d="M520 560 L680 560 L690 574 L510 574Z" className="tisch" />
      <path d="M528 574 L528 640 M672 574 L672 640" className="tisch-bein" />
      <rect x="580" y="546" width="40" height="14" className="buchoffen" />
      {/* Seitliche Regale */}
      {regal(170, 360, 150, 220, 6, 2)}
      {regal(880, 360, 150, 220, 6, 3)}
      {regal(40, 300, 90, 330, 9, 4)}
      {regal(1070, 300, 90, 330, 9, 5)}
      {/* Säulen */}
      {[[330, 0], [140, 0], [850, 0], [1040, 0]].map(([x]) => (
        <g key={x} className="saeule">
          <rect x={x} y="120" width="30" height="560" />
          <rect x={x - 8} y="660" width="46" height="30" />
          <rect x={x - 6} y="110" width="42" height="18" />
          <path d={`M${x + 15} 120 Q${x + 15} 40 ${x > 600 ? x + 120 : x - 90} 0`} className="rippe" />
        </g>
      ))}
      {/* Boden */}
      <rect x="0" y="690" width="1200" height="70" fill="url(#g-boden)" />
      <rect x="0" y="690" width="1200" height="70" fill="url(#g-fliesen)" opacity=".5" />
      {/* Kronleuchter */}
      <g className="leuchter">
        <path d="M600 0 L600 150" className="kette" />
        <path d="M540 190 Q600 225 660 190 M555 172 Q600 200 645 172 M600 150 L600 215" className="arme" />
        {[[540, 180], [560, 165], [600, 160], [640, 165], [660, 180]].map(([x, y], i) => (
          <g key={i} className={`flamme-g f${i}`}>
            <circle cx={x} cy={y} r="14" fill="#f2b75c" filter="url(#g-glut)" opacity=".55" />
            <path d={`M${x} ${y - 9} q-4 6 0 10 q4 -4 0 -10z`} fill="#ffe3a6" />
            <rect x={x - 2.5} y={y + 1} width="5" height="12" fill="#d9c49a" />
          </g>
        ))}
      </g>
      {/* Kandelaber links und rechts */}
      {[250, 950].map((x, k) => (
        <g key={x} className="kandelaber">
          <path d={`M${x} 690 L${x} 610 M${x - 24} 600 Q${x} 625 ${x + 24} 600 M${x} 610 L${x} 595`} />
          {[-24, 0, 24].map((dx, i) => (
            <g key={i} className={`flamme-g f${i + k * 2}`}>
              <circle cx={x + dx} cy={588} r="11" fill="#f2b75c" filter="url(#g-glut)" opacity=".5" />
              <path d={`M${x + dx} 580 q-3 5 0 8 q3 -3 0 -8z`} fill="#ffe3a6" />
            </g>
          ))}
        </g>
      ))}
      <rect width="1200" height="760" fill="url(#g-licht)" className="licht" />
    </svg>
  )
}
