import { hash } from '../lib/utils'

// Stilisierte, selbst gezeichnete Bild-Motive als Ersatz, solange eine Akte kein eigenes Foto hat.
const formen = {
  berg: (
    <>
      <path d="M0 210 L70 120 L105 150 L160 70 L230 160 L260 135 L320 200 L320 240 L0 240Z" fill="#cfc3a8" opacity=".55" />
      <path d="M160 70 L182 98 L170 96 L160 110 L150 95 L140 99Z" fill="#efe6d2" opacity=".7" />
      <path d="M120 212 L140 188 L160 212Z" fill="#2a211a" />
      <path d="M140 188 L140 212" stroke="#d9c49a" strokeWidth="1" opacity=".5" />
      <g fill="#2a211a" opacity=".8">
        <circle cx="205" cy="222" r="2.2" /><circle cx="222" cy="226" r="2.2" /><circle cx="240" cy="221" r="2.2" />
      </g>
    </>
  ),
  hof: (
    <>
      <rect y="205" width="320" height="35" fill="#cfc3a8" opacity=".35" />
      <path d="M90 205 L90 150 L150 115 L210 150 L210 205Z" fill="#2a211a" />
      <path d="M210 205 L210 160 L265 160 L265 205Z" fill="#1d1712" />
      <path d="M205 160 L238 138 L270 160Z" fill="#1d1712" />
      <rect x="140" y="160" width="14" height="18" fill="#e3a64a" opacity=".55" />
      <g stroke="#2a211a" strokeWidth="3"><path d="M40 205 L40 140 M30 160 L50 150 M28 178 L52 170" /></g>
      <g fill="#2a211a" opacity=".6"><circle cx="290" cy="215" r="1.6" /><circle cx="280" cy="222" r="1.6" /><circle cx="270" cy="229" r="1.6" /><circle cx="258" cy="234" r="1.6" /></g>
    </>
  ),
  schiff: (
    <>
      <path d="M0 190 Q40 180 80 190 T160 190 T240 190 T320 190 L320 240 L0 240Z" fill="#2a211a" opacity=".7" />
      <path d="M100 185 L230 185 L215 200 L112 200Z" fill="#1d1712" />
      <path d="M160 70 L160 185 M120 95 L120 185" stroke="#1d1712" strokeWidth="3" />
      <path d="M163 75 Q200 110 163 150Z M163 120 Q195 150 163 180Z" fill="#cfc3a8" opacity=".55" />
      <path d="M117 100 Q90 130 117 160Z" fill="#cfc3a8" opacity=".45" />
    </>
  ),
  eisberg: (
    <>
      <path d="M0 175 L320 175 L320 240 L0 240Z" fill="#1d1712" opacity=".8" />
      <path d="M40 175 L80 110 L105 125 L130 90 L170 175Z" fill="#efe6d2" opacity=".75" />
      <path d="M30 175 L80 225 L150 215 L185 175Z" fill="#cfc3a8" opacity=".2" />
      <path d="M210 170 L300 170 L292 160 L218 160Z" fill="#2a211a" />
      <g fill="#2a211a"><rect x="235" y="140" width="7" height="20" /><rect x="252" y="140" width="7" height="20" /><rect x="269" y="140" width="7" height="20" /></g>
      <g fill="#e3a64a" opacity=".6"><circle cx="230" cy="165" r="1.3" /><circle cx="245" cy="165" r="1.3" /><circle cx="260" cy="165" r="1.3" /><circle cx="275" cy="165" r="1.3" /></g>
    </>
  ),
  buch: (
    <>
      <path d="M60 80 L160 95 L260 80 L260 200 L160 215 L60 200Z" fill="#cfc3a8" opacity=".6" />
      <path d="M160 95 L160 215" stroke="#2a211a" strokeWidth="2" />
      <g stroke="#2a211a" strokeWidth="1.4" fill="none" opacity=".7">
        <path d="M78 110 q8 -6 16 0 t16 0 t16 0 t16 0" /><path d="M78 125 q8 -6 16 0 t16 0 t16 0" /><path d="M78 140 q8 -6 16 0 t16 0 t16 0 t16 0" />
        <circle cx="210" cy="140" r="26" /><path d="M210 114 L210 166 M184 140 L236 140" />
        <path d="M190 185 q10 -16 20 0 q10 16 20 0" />
      </g>
    </>
  ),
  gestalt: (
    <>
      <rect y="200" width="320" height="40" fill="#cfc3a8" opacity=".3" />
      <circle cx="160" cy="95" r="18" fill="#1d1712" />
      <path d="M135 205 L140 130 Q160 115 180 130 L185 205Z" fill="#1d1712" />
      <path d="M180 140 L200 170" stroke="#1d1712" strokeWidth="9" strokeLinecap="round" />
      <rect x="196" y="168" width="16" height="11" fill="#efe6d2" opacity=".7" transform="rotate(20 204 173)" />
      <path d="M60 205 L60 120 L50 120 L72 100 L94 120 L84 120 L84 205Z" fill="#2a211a" opacity=".6" />
    </>
  ),
  floete: (
    <>
      <path d="M0 200 L320 200 L320 240 L0 240Z" fill="#2a211a" opacity=".5" />
      <path d="M200 200 L200 100 Q220 80 240 100 L240 200Z" fill="#1d1712" />
      <g fill="#1d1712">
        {[60, 85, 108, 128, 146].map((x, i) => (
          <g key={x}><circle cx={x} cy={170 - i * 2} r={6 - i * 0.4} /><path d={`M${x - 5} ${200} L${x - 4} ${176 - i * 2} L${x + 4} ${176 - i * 2} L${x + 5} 200Z`} /></g>
        ))}
      </g>
      <path d="M182 118 L156 150" stroke="#d9c49a" strokeWidth="3" />
      <g fill="none" stroke="#e3a64a" strokeWidth="1.4" opacity=".7"><path d="M150 140 q-10 -10 -4 -22" /><path d="M140 145 q-16 -12 -8 -30" /></g>
    </>
  ),
  hoehle: (
    <>
      <path d="M0 240 L0 90 Q80 40 160 60 Q250 40 320 100 L320 240Z" fill="#2a211a" opacity=".8" />
      <path d="M110 240 Q110 120 160 115 Q210 120 210 240Z" fill="#0d0907" />
      <g fill="#e3a64a" opacity=".5"><circle cx="160" cy="175" r="2" /><circle cx="160" cy="175" r="10" opacity=".25" /></g>
      <g stroke="#1d1712" strokeWidth="5"><path d="M30 240 L45 130 M290 240 L275 140" /></g>
    </>
  ),
  wald: (
    <>
      <rect y="205" width="320" height="35" fill="#1d1712" />
      {[20, 55, 95, 210, 250, 290].map((x, i) => (
        <path key={x} d={`M${x} 210 L${x} ${60 + (i % 3) * 18}`} stroke="#1d1712" strokeWidth={8 + (i % 2) * 4} />
      ))}
      <g stroke="#2a211a" strokeWidth="2.5" fill="none">
        <path d="M150 120 L170 120 M160 105 L160 150 M150 150 L170 150 M140 112 L180 140 M180 112 L140 140" />
      </g>
      <g fill="#efe6d2" opacity=".5"><circle cx="128" cy="190" r="1.5" /><circle cx="196" cy="190" r="1.5" /></g>
    </>
  ),
  reaktor: (
    <>
      <rect y="200" width="320" height="40" fill="#1d1712" />
      <path d="M60 200 L60 120 L170 120 L170 200Z" fill="#2a211a" />
      <path d="M170 200 L170 140 L250 140 L250 200Z" fill="#1d1712" />
      <path d="M200 140 L208 40 L222 40 L230 140Z" fill="#2a211a" />
      <path d="M95 120 L110 100 L125 112 L140 95 L150 120Z" fill="#1d1712" />
      <g fill="#cfc3a8" opacity=".25"><circle cx="118" cy="80" r="22" /><circle cx="140" cy="60" r="16" /><circle cx="100" cy="55" r="12" /></g>
      <g fill="#e3a64a" opacity=".4"><circle cx="118" cy="106" r="6" /></g>
    </>
  ),
  auge: (
    <>
      <path d="M60 140 Q160 50 260 140 Q160 230 60 140Z" fill="#cfc3a8" opacity=".5" />
      <circle cx="160" cy="140" r="38" fill="#2a211a" />
      <circle cx="160" cy="140" r="14" fill="#0d0907" />
      <circle cx="170" cy="130" r="5" fill="#efe6d2" opacity=".7" />
    </>
  ),
}

export default function Motiv({ motiv = 'auge', seed = '' }) {
  const h = hash(seed)
  const id = `k${h % 100000}`
  return (
    <svg className="motiv" viewBox="0 0 320 240" role="img" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`${id}g`} cx={`${30 + (h % 40)}%`} cy="30%" r="90%">
          <stop offset="0" stopColor="#8a7458" />
          <stop offset=".55" stopColor="#4a3b2c" />
          <stop offset="1" stopColor="#1a130e" />
        </radialGradient>
        <filter id={`${id}n`}>
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed={h % 50} />
          <feColorMatrix values="0 0 0 0 0.1  0 0 0 0 0.07  0 0 0 0 0.05  0 0 0 .55 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <rect width="320" height="240" fill={`url(#${id}g)`} />
      {formen[motiv] || formen.auge}
      <rect width="320" height="240" filter={`url(#${id}n)`} fill="#000" />
      <rect width="320" height="240" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="30" />
    </svg>
  )
}
