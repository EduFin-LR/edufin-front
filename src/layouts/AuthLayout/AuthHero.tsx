import robotFeliz from '../../assets/images/robotFeliz.png'
import './AuthHero.css'

// Ilustración del panel derecho (login, registro, recuperar contraseña).
// Es un ejemplo de cómo se ve la app: los datos son ilustrativos, no del usuario.
const ROUTE = [
    { title: '¿Por qué ahorrar?',     kind: 'lesson', state: 'done' },
    { title: '¿Ahorro o gasto?',      kind: 'quiz',   state: 'done' },
    { title: 'Fondo de emergencia',   kind: 'lesson', state: 'current' },
    { title: 'Metas SMART',           kind: 'lesson', state: 'locked' },
    { title: 'Caso real: tu viaje',   kind: 'final',  state: 'locked' },
] as const

function CoinsPlant() {
    // Pila de monedas con una planta que brota: «tu dinero crece»
    const coins = [0, 1, 2, 3, 4]
    return (
        <svg viewBox="0 0 160 170" aria-hidden="true">
            <path d="M80 92 C80 70 78 55 80 34" fill="none" stroke="#3FBF62" strokeWidth="5" strokeLinecap="round" />
            <path d="M80 58 C62 52 50 38 52 22 C70 24 80 38 80 58Z" fill="#4CC46B" />
            <path d="M81 46 C96 36 112 34 124 40 C116 56 98 60 81 46Z" fill="#3FBF62" />
            <path d="M80 58 C66 50 58 40 54 28" fill="none" stroke="#2F9E4F" strokeWidth="1.6" />
            {coins.map(i => {
                const y = 150 - i * 13
                return (
                    <g key={i}>
                        <ellipse cx="80" cy={y + 6} rx="52" ry="14" fill="#B57F06" />
                        <rect x="28" y={y - 6} width="104" height="12" fill="#C98D07" />
                        <ellipse cx="80" cy={y - 6} rx="52" ry="14" fill={i === 4 ? '#F5C04A' : '#E3A008'} />
                        {i === 4 && <ellipse cx="80" cy={y - 6} rx="36" ry="8" fill="none" stroke="#FFE08A" strokeWidth="2.5" />}
                    </g>
                )
            })}
        </svg>
    )
}

function RouteIcon({ kind, state }: { kind: string; state: string }) {
    const done = state === 'done'
    if (kind === 'final') return <span className={`ah-stn ah-stn--final ${state}`} />
    if (kind === 'quiz')  return <span className={`ah-stn ah-stn--quiz ${state}`}>{done && '✓'}</span>
    return <span className={`ah-stn ${state}`}>{done && '✓'}</span>
}

export default function AuthHero() {
    return (
        <div className="ah" aria-hidden="true">
            <div className="ah-stage">
                {/* Teléfono con la ruta */}
                <div className="ah-phone">
                    <div className="ah-notch" />
                    <div className="ah-screen">
                        <div className="ah-status"><span>9:41</span><span>●●● ▮</span></div>
                        <p className="ah-hello">Hola, Ana 👋</p>
                        <div className="ah-next">
                            <small>Módulo 02 · Ahorro</small>
                            <b>Fondo de emergencia</b>
                            <div className="ah-bar"><i /></div>
                            <span className="ah-btn">Continuar →</span>
                        </div>
                        <p className="ah-sec">Tu ruta</p>
                        <ol className="ah-route">
                            {ROUTE.map(r => (
                                <li key={r.title} className={r.state}>
                                    <RouteIcon kind={r.kind} state={r.state} />
                                    <span>{r.title}</span>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Tarjetas flotantes */}
                <div className="ah-card ah-card--streak">
                    <span className="ah-emoji">🔥</span>
                    <div><b>6 días</b><small>de racha</small></div>
                </div>
                <div className="ah-card ah-card--xp">
                    <span className="ah-xp">+120 XP</span>
                    <small>Reto completado</small>
                </div>
                <div className="ah-card ah-card--goal">
                    <small>Meta · Viaje de fin de ciclo</small>
                    <b>S/ 816 <span>de S/ 1,200</span></b>
                    <div className="ah-bar ah-bar--gold"><i /></div>
                </div>

                <div className="ah-coins"><CoinsPlant /></div>

                {/* Robot con el mensaje */}
                <div className="ah-bubble">¡Aprende, juega y conquista tus metas financieras!</div>
                <img className="ah-robot" src={robotFeliz} alt="" />
            </div>
        </div>
    )
}
