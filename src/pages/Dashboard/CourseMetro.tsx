import type { ThemeKey, RouteTheme } from '../Learning/routeThemes'
import type { DashboardLearningPath } from '../../types/auth'
import robotFeliz from '../../assets/images/robotFeliz.png'
import './CourseMetro.css'

const FONT = '"Segoe UI", system-ui, sans-serif'

// Ícono de cada mundo, dibujado en un cuadro de 24×24 centrado en (0,0)
const GLYPH: Record<ThemeKey, { d: string; stroked: boolean }> = {
    bus:    { stroked: false, d: 'M-8 -7h16a2 2 0 0 1 2 2v10h-20v-10a2 2 0 0 1 2-2z M-6 -4h5v4h-5z M1 -4h5v4h-5z M-6 6a2 2 0 1 0 0.1 0z M6 6a2 2 0 1 0 0.1 0z' },
    flight: { stroked: false, d: 'M-10 1 L8 -2 Q12 0 8 2 L-10 1Z M-1 0 L-6 -9 H-3 L4 0Z M-1 1 L-6 10 H-3 L4 1Z' },
    plan:   { stroked: true,  d: 'M-9 9 V-2 L0 -9 L9 -2 V9 Z M-3 9 V3 H3 V9' },
    summit: { stroked: true,  d: 'M-10 8 L-3 -4 L1 2 L5 -7 L11 8 Z M5 -7 V-11 L9 -10 L5 -9' },
    market: { stroked: true,  d: 'M-9 8 V-9 M-9 8 H10 M-6 4 L-2 -1 L2 2 L8 -6' },
    stars:  { stroked: false, d: 'M0 -9 L2.6 -3 L9 -2.6 L4 1.6 L5.6 8 L0 4.6 L-5.6 8 L-4 1.6 L-9 -2.6 L-2.6 -3 Z' },
    chip:   { stroked: true,  d: 'M-6 -6 H6 V6 H-6 Z M-3 -9 V-6 M3 -9 V-6 M-3 6 V9 M3 6 V9 M-9 -3 H-6 M-9 3 H-6 M6 -3 H9 M6 3 H9' },
}

const STEP = 140, START = 80, HIGH = 100, LOW = 150, HEIGHT = 262
// Patrón bajo, bajo, alto, alto… para que las etiquetas de arriba y abajo no choquen
const rowY = (i: number) => (Math.floor(i / 2) % 2 === 1 ? HIGH : LOW)

function splitName(name: string) {
    if (name.length <= 16) return [name]
    const w = name.split(' '), half = Math.ceil(w.length / 2)
    return [w.slice(0, half).join(' '), w.slice(half).join(' ')]
}

export interface MetroModule { course: DashboardLearningPath; theme: RouteTheme }

// Los módulos del curso como una línea de metro: una estación por módulo
export default function CourseMetro({ modules, selectedId, onSelect }: {
    modules:    MetroModule[]
    selectedId: string | null
    onSelect:   (topicId: string) => void
}) {
    const width = Math.max(1000, START * 2 + Math.max(0, modules.length - 1) * STEP)
    const pts = modules.map((_, i) => ({ x: START + i * STEP, y: rowY(i) }))
    const currentIdx = modules.findIndex(m => m.course.status === 'IN_PROGRESS' || m.course.status === 'UNLOCKED')

    return (
        <svg className="course-metro-svg" viewBox={`0 0 ${width} ${HEIGHT}`} role="group" aria-label="Mapa de los módulos del curso">
            {/* Tramos: cada uno toma el color del módulo al que llega; si está bloqueado, gris */}
            {pts.slice(1).map((b, k) => {
                const a = pts[k], d = Math.abs(b.y - a.y)
                const path = a.y === b.y ? `M${a.x} ${a.y} L${b.x} ${b.y}` : `M${a.x} ${a.y} L${b.x - d} ${a.y} L${b.x} ${b.y}`
                const target = modules[k + 1]
                const reached = target.course.status !== 'LOCKED'
                return <path key={k} d={path} fill="none" stroke={reached ? target.theme.brand : undefined} className={reached ? undefined : 'metro-track-off'} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            })}

            {modules.map(({ course, theme }, i) => {
                const { x, y } = pts[i]
                const locked = course.status === 'LOCKED'
                const done = course.status === 'COMPLETED'
                const current = i === currentIdx
                const selected = course.topicId === selectedId
                const glyph = GLYPH[theme.key]
                const iconColor = locked ? 'var(--color-text-faint)' : '#FFFFFF'
                const up = y === HIGH
                const lines = splitName(course.topicName)
                // Arriba, el bloque de texto termina antes de la estación aunque el nombre ocupe 2 líneas
                const ly = up ? y - 50 - lines.length * 16 : y + 28
                const sub = done ? 'Completado' : current ? `${course.completedLessons}/${course.totalLessons} · en curso` : locked ? 'Bloqueado' : `${course.completedLessons}/${course.totalLessons}`
                const select = () => onSelect(course.topicId)

                return (
                    <g key={course.topicId} className="metro-stn" tabIndex={0} role="button"
                        aria-pressed={selected}
                        aria-label={`Módulo ${theme.moduleNum}: ${course.topicName}. ${done ? 'Completado' : locked ? 'Bloqueado' : 'En curso'}`}
                        onClick={select}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select() } }}>
                        {current && <circle cx={x} cy={y} r="26" fill={theme.brand} className="metro-pulse" />}
                        {selected && <circle cx={x} cy={y} r="31" fill="none" className="metro-selected" strokeWidth="2" strokeDasharray="4 4" />}
                        <circle cx={x} cy={y} r="24" fill={locked ? undefined : theme.brand} strokeWidth="4" className={`metro-ring ${locked ? 'metro-ring--locked' : ''}`} />
                        <path d={glyph.d} transform={`translate(${x} ${y})`}
                            style={glyph.stroked ? { fill: 'none', stroke: iconColor } : { fill: iconColor, stroke: 'none' }}
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {done && <g>
                            <circle cx={x + 18} cy={y - 18} r="9" fill="#E3A008" stroke="#fff" strokeWidth="2" />
                            <path d={`M${x + 14} ${y - 18}l3 3 5-6`} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </g>}

                        <g>
                            <text x={x} y={ly + 16} textAnchor="middle" className="metro-name" fontFamily={FONT} fontSize="13.5" fontWeight="800">
                                {lines.map((l, k) => <tspan key={k} x={x} dy={k ? '1.2em' : 0}>{l}</tspan>)}
                            </text>
                            <text x={x} y={ly + 18 + lines.length * 16} textAnchor="middle" className="metro-sub" fontFamily={FONT} fontSize="11.5">{sub}</text>
                        </g>
                        {/* área de clic más generosa */}
                        <circle cx={x} cy={y} r="34" fill="transparent" />
                    </g>
                )
            })}

            {/* El robot acompaña al módulo en curso */}
            {currentIdx >= 0 && (
                <g className="metro-bob" pointerEvents="none">
                    <image href={robotFeliz} x={pts[currentIdx].x - 62} y={pts[currentIdx].y - 50} width="44" height="44" />
                </g>
            )}
        </svg>
    )
}
