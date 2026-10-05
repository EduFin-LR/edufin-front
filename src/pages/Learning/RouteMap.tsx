import { useMemo, type ReactNode } from 'react'
import type { Lesson } from '../../services/learningService'
import type { RouteTheme } from './routeThemes'
import { MAP_HEIGHT, positions, pathThrough, routeWidth, seeded, splitTitle, type Pt } from './routeLayout'
import robotFeliz from '../../assets/images/robotFeliz.png'

type Kind = 'lectura' | 'reto' | 'video' | 'final'

const KIND: Record<Lesson['lessonType'], Kind> = { READING: 'lectura', QUIZ: 'reto', VIDEO: 'video', FINAL: 'final' }
const TAG: Record<Kind, string> = { lectura: '', reto: 'RETO', video: 'VIDEO', final: 'CASO REAL' }
const FONT = '"Segoe UI", system-ui, sans-serif'
const MONO = '"JetBrains Mono", Consolas, monospace'
// ── Fondos de cada mundo ──────────────────────────────────────────────────────
// El fondo se dibuja mucho más allá del área de la ruta (el SVG tiene overflow visible),
// así al moverse o alejarse el fondo es uniforme en toda la pantalla.
const EXT = 4000
function Backdrop({ theme, width }: { theme: RouteTheme; width: number }) {
    const box = { x: -EXT, y: -EXT, width: width + EXT * 2, height: MAP_HEIGHT + EXT * 2 }
    const rnd = seeded(theme.moduleNum * 13)
    const base = <rect {...box} fill={theme.bg} />
    switch (theme.key) {
        case 'bus':
            return <>
                <defs><pattern id="rt-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#1A3125" /></pattern></defs>
                {base}<rect {...box} fill="url(#rt-grid)" />
            </>
        case 'chip':
            return <>
                <defs>
                    <pattern id="rt-traces" width="360" height="220" patternUnits="userSpaceOnUse">
                        <path d="M0 30 H110 l22 22 H230 M40 110 H160 l22 -22 H300 M0 180 H70 l22 22 H200 M220 160 H360" fill="none" stroke="#123D28" strokeWidth="3" />
                        <circle cx="230" cy="52" r="5" fill="#123D28" /><circle cx="300" cy="88" r="5" fill="#123D28" />
                    </pattern>
                </defs>
                {base}<rect {...box} fill="url(#rt-traces)" />
                <text x="24" y={MAP_HEIGHT - 16} fill="#3F7A5A" fontFamily={MONO} fontSize="11" letterSpacing="2">EDUFIN · REV 1.0 · M0{theme.moduleNum}</text>
            </>
        case 'flight':
            return <>
                <defs>
                    <pattern id="rt-dots" width="80" height="80" patternUnits="userSpaceOnUse">
                        {[[10, 14], [50, 6], [30, 38], [70, 46], [14, 62], [54, 70]].map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r="1.6" fill="#3A3880" />)}
                    </pattern>
                </defs>
                {base}<rect {...box} fill="url(#rt-dots)" />
            </>
        case 'plan':
            return <>
                <defs>
                    <pattern id="rt-bp" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#FFFFFF" strokeOpacity="0.05" /></pattern>
                    <pattern id="rt-bp2" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#FFFFFF" strokeOpacity="0.1" /></pattern>
                    <pattern id="rt-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="2" strokeOpacity="0.35" /></pattern>
                </defs>
                {base}<rect {...box} fill="url(#rt-bp)" /><rect {...box} fill="url(#rt-bp2)" />
            </>
        case 'stars':
            return <>
                <defs>
                    <pattern id="rt-starfield" width="420" height="420" patternUnits="userSpaceOnUse">
                        {Array.from({ length: 34 }, (_, k) => (
                            <circle key={k} cx={rnd() * 420} cy={rnd() * 420} r={rnd() * 1.4 + 0.3} fill="#FFFFFF" opacity={(0.15 + rnd() * 0.6).toFixed(2)} />
                        ))}
                    </pattern>
                </defs>
                {base}<rect {...box} fill="url(#rt-starfield)" />
                {/* algunas estrellas titilan cerca de la ruta */}
                {Array.from({ length: 14 }, (_, k) => (
                    <circle key={k} cx={rnd() * width} cy={rnd() * MAP_HEIGHT} r="1.3" fill="#FFFFFF" className="rt-twinkle" />
                ))}
            </>
        case 'summit': {
            const top = (x: number) => 420 - (Math.min(Math.max(x, 0), width) / width) * 300
            const ridge = (k: number) => `M${-EXT} ${top(0) + k * 18} L0 ${top(0) + k * 18} L${width * 0.35} ${top(width * 0.35) + 20 + k * 18} L${width * 0.6} ${top(width * 0.6) - 10 + k * 18} L${width * 0.85} ${top(width * 0.85) - 30 + k * 18} L${width} ${top(width) + 30 + k * 18} L${width + EXT} ${top(width) + 30 + k * 18}`
            return <>
                <defs>
                    {/* degradado en coordenadas del mapa: arriba y abajo se extiende el color del borde */}
                    <linearGradient id="rt-sky" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2={MAP_HEIGHT}><stop offset="0" stopColor="#2D3A6B" /><stop offset="1" stopColor="#8E5C86" /></linearGradient>
                </defs>
                <rect {...box} fill="url(#rt-sky)" />
                <path d={`${ridge(0)} V${MAP_HEIGHT + EXT} H${-EXT}Z`} fill="#3B3A72" />
                {[1, 2, 3, 4].map(k => <path key={k} d={ridge(k)} fill="none" stroke="#4C4A8A" strokeWidth="1.2" />)}
            </>
        }
        case 'market':
            return <>
                {base}
                {[0, 25, 50, 75, 100].map(v => {
                    const y = 380 - (v / 100) * 240
                    return <g key={v}>
                        <line x1="60" x2={width - 30} y1={y} y2={y} stroke="#1F3A2B" />
                        <text x="52" y={y + 4} textAnchor="end" fill="#6F8B7A" fontFamily={MONO} fontSize="11">{v}%</text>
                    </g>
                })}
            </>
    }
}

// ── Nodos ─────────────────────────────────────────────────────────────────────
// Candado pequeño: el bloqueo se indica en el nodo, el título se mantiene legible
function LockGlyph({ x, y, color }: { x: number; y: number; color: string }) {
    return (
        <g transform={`translate(${x} ${y})`} aria-hidden="true">
            <path d="M-3 -1 V-3.4 a3 3 0 0 1 6 0 V-1" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <rect x="-4.5" y="-1" width="9" height="7" rx="1.6" fill={color} />
        </g>
    )
}

interface NodeProps { theme: RouteTheme; kind: Kind; status: 'done' | 'current' | 'open' | 'locked'; p: Pt }

function NodeShape({ theme, kind, status, p }: NodeProps) {
    const { x, y } = p
    const locked = status === 'locked', done = status === 'done', active = done || status === 'current'

    if (theme.key === 'chip') {
        const LIVE = '#7CF0A6'
        if (kind === 'final') return <g>
            <rect x={x - 26} y={y - 26} width="52" height="52" rx="6" fill="#10251A" stroke={active ? LIVE : theme.lock} strokeWidth="3" className="rt-ring" />
            {[-1, 0, 1].map(k => <g key={k}><rect x={x + k * 12 - 2} y={y - 33} width="4" height="7" fill="#C9A227" /><rect x={x + k * 12 - 2} y={y + 26} width="4" height="7" fill="#C9A227" /></g>)}
            <text x={x} y={y + 4} textAnchor="middle" fill="#7FA893" fontFamily={MONO} fontSize="11" fontWeight="700">CPU</text>
        </g>
        const reto = kind === 'reto', w = reto ? 28 : 38, h = reto ? 28 : 24
        return <g>
            {[-1, 0, 1].map(k => <g key={k}><rect x={x + k * 10 - 2} y={y - h / 2 - 6} width="4" height="6" fill="#C9A227" /><rect x={x + k * 10 - 2} y={y + h / 2} width="4" height="6" fill="#C9A227" /></g>)}
            <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="4" fill={done ? '#123B27' : theme.nodeBg} stroke={active ? LIVE : theme.lock} strokeWidth="2.5" className="rt-ring" transform={reto ? `rotate(45 ${x} ${y})` : undefined} />
            {locked
                ? <LockGlyph x={x} y={y - 1} color={theme.muted} />
                : <circle cx={x} cy={y} r="4" fill={done ? LIVE : status === 'current' ? '#F5C04A' : '#29523D'} filter={active ? 'url(#rt-glow)' : undefined} />}
        </g>
    }

    if (theme.key === 'stars') {
        const col = locked ? theme.lock : theme.line
        const r = kind === 'final' ? 13 : kind === 'reto' ? 9 : 8
        if (kind === 'final') {
            const pts = Array.from({ length: 10 }, (_, k) => {
                const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r * 0.45 : r
                return `${x + Math.cos(a) * rr},${y + Math.sin(a) * rr}`
            }).join(' ')
            return <polygon points={pts} fill={done ? col : theme.nodeBg} stroke={col} strokeWidth="2.5" className="rt-ring" />
        }
        return kind === 'reto'
            ? <rect x={x - r} y={y - r} width={2 * r} height={2 * r} rx="2" transform={`rotate(45 ${x} ${y})`} fill={done ? col : theme.nodeBg} stroke={col} strokeWidth="2.5" className="rt-ring" filter={active ? 'url(#rt-glow)' : undefined} />
            : <g>
                <circle cx={x} cy={y} r={locked ? r + 3 : r} fill={done ? col : theme.nodeBg} stroke={col} strokeWidth="2.5" className="rt-ring" filter={active ? 'url(#rt-glow)' : undefined} />
                {locked
                    ? <LockGlyph x={x} y={y - 1} color={theme.muted} />
                    : kind === 'video' && <path d={`M${x - 2} ${y - 4}L${x + 4} ${y}L${x - 2} ${y + 4}Z`} fill={col} />}
            </g>
    }

    // Gramática común: círculo = lección, rombo = reto, cápsula = caso real
    const stroke = locked ? theme.lock : kind === 'reto' ? theme.accent : theme.line
    const fill = done ? (kind === 'reto' ? theme.accent : theme.done) : theme.nodeBg
    const small = theme.layout === 'chart'
    return <g>
        {kind === 'final' ? <>
            <rect x={x - 22} y={y - 13} width="44" height="26" rx="13" fill={done ? theme.done : theme.nodeBg} stroke={locked ? theme.lock : theme.fg} strokeWidth="4" className="rt-ring" />
            <circle cx={x - 8} cy={y} r="4" fill={theme.line} /><circle cx={x + 8} cy={y} r="4" fill={theme.accent} />
        </> : kind === 'reto' ? (
            <rect x={x - (small ? 8 : 11)} y={y - (small ? 8 : 11)} width={small ? 16 : 22} height={small ? 16 : 22} rx="4" transform={`rotate(45 ${x} ${y})`} fill={fill} stroke={stroke} strokeWidth={small ? 3 : 4} className="rt-ring" />
        ) : <>
            <circle cx={x} cy={y} r={small ? 8 : 12} fill={fill} stroke={stroke} strokeWidth={small ? 3 : 4} className="rt-ring" />
            {kind === 'video' && !done && !locked && <path d={`M${x - 3} ${y - 5}L${x + 5} ${y}L${x - 3} ${y + 5}Z`} fill={theme.line} />}
        </>}
        {locked && kind !== 'final' && !small && <LockGlyph x={x} y={y - 1} color={theme.muted} />}
        {done && kind !== 'final' && !small && (
            <path d={`M${x - 5} ${y}l3.5 3.5 6.5-7`} fill="none" stroke={theme.nodeBg} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        )}
    </g>
}

// ── Etiqueta (tipo + título) ──────────────────────────────────────────────────
function Label({ theme, kind, lines, x, y, anchor = 'middle', size = 15 }: {
    theme: RouteTheme; kind: Kind; lines: string[]; x: number; y: number; anchor?: 'start' | 'middle' | 'end'; size?: number
}) {
    return <g>
        {TAG[kind] && <text x={x} y={y - 4} textAnchor={anchor} fill={theme.tag} fontFamily={MONO} fontSize="10" fontWeight="700" letterSpacing="1.4">{TAG[kind]}</text>}
        <text x={x} y={y + 14} textAnchor={anchor} fill={theme.fg} fontFamily={theme.font ?? FONT} fontSize={theme.upper ? size - 3 : size} fontWeight="700">
            {lines.map((l, i) => <tspan key={i} x={x} dy={i ? '1.2em' : 0}>{theme.upper ? l.toUpperCase() : l}</tspan>)}
        </text>
    </g>
}

// ── Mapa ──────────────────────────────────────────────────────────────────────
export default function RouteMap({ theme, lessons, currentIdx, lastReachedIdx, onSelect }: {
    theme: RouteTheme
    lessons: Lesson[]
    currentIdx: number
    lastReachedIdx: number
    onSelect: (l: Lesson) => void
}) {
    const { layout } = theme
    const pts   = useMemo(() => positions(layout, lessons.length), [layout, lessons.length])
    const width = routeWidth(layout, lessons.length)
    const origin = layout === 'chart' && pts.length ? { x: pts[0].x - 70, y: 380 } : undefined
    const fullPath = pathThrough(layout, pts, pts.length - 1, origin)
    const donePath = pathThrough(layout, pts, lastReachedIdx, origin)

    return (
        <svg className="rt-svg" viewBox={`0 0 ${width} ${MAP_HEIGHT}`} width={width} height={MAP_HEIGHT} overflow="visible" role="group" aria-label={`Ruta del módulo ${theme.moduleNum}`}>
            <defs>
                <filter id="rt-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="rt-area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3A9E52" stopOpacity="0.28" /><stop offset="1" stopColor="#3A9E52" stopOpacity="0" /></linearGradient>
            </defs>
            <Backdrop theme={theme} width={width} />

            {/* Meta del gráfico de mercado */}
            {layout === 'chart' && pts.length > 0 && <>
                <line x1="60" x2={width - 30} y1={140} y2={140} stroke={theme.accent} strokeWidth="1.5" strokeDasharray="6 6" />
                <rect x="70" y="110" width="148" height="22" rx="6" fill="#45429A" />
                <text x="144" y="125" textAnchor="middle" fill="#fff" fontFamily={MONO} fontSize="11" fontWeight="700">META · CASO REAL</text>
                {donePath && <path d={`${donePath} L${pts[Math.max(0, lastReachedIdx)].x} 380 L${origin!.x} 380Z`} fill="url(#rt-area)" />}
            </>}

            {/* Camino completo y tramo recorrido */}
            {layout === 'rooms'
                ? <><path d={fullPath} fill="none" stroke={theme.track} strokeWidth="14" />{donePath && <path d={donePath} fill="none" stroke={theme.line} strokeWidth="14" />}</>
                : <>
                    <path d={fullPath} fill="none" stroke={theme.track}
                        strokeWidth={layout === 'metro' ? 12 : layout === 'trail' ? 3 : 2.5}
                        strokeDasharray={layout === 'arcs' || layout === 'chart' ? '6 8' : layout === 'trail' ? '2 9' : undefined}
                        strokeLinejoin="round" strokeLinecap="round" opacity={layout === 'trail' ? 0.7 : 1} />
                    {donePath && <path d={donePath} fill="none" stroke={theme.line}
                        strokeWidth={layout === 'metro' ? 12 : layout === 'chart' ? 4 : layout === 'trail' ? 5 : 3}
                        strokeLinejoin="round" strokeLinecap="round" />}
                </>}
            {theme.key === 'chip' && donePath && (
                <path d={donePath} fill="none" stroke="#7CF0A6" strokeWidth="3" strokeDasharray="12 28" strokeLinecap="round" className="rt-flow" filter="url(#rt-glow)" />
            )}
            {layout === 'trail' && pts.length > 0 && (() => {
                const top = pts[pts.length - 1]
                return <g>
                    <line x1={top.x} x2={top.x} y1={top.y - 16} y2={top.y - 56} stroke="#FFFFFF" strokeWidth="3" />
                    <path d={`M${top.x} ${top.y - 56} L${top.x + 30} ${top.y - 46} L${top.x} ${top.y - 36}Z`} fill={theme.line} />
                </g>
            })()}

            {/* Nodos */}
            {lessons.map((lesson, i) => {
                const p = pts[i]
                const kind = KIND[lesson.lessonType] ?? 'lectura'
                const status = lesson.status === 'COMPLETED' ? 'done' : i === currentIdx ? 'current' : lesson.status === 'LOCKED' ? 'locked' : 'open'
                const locked = status === 'locked'
                // Lo lejano se ve borroso; la meta (caso real) siempre se ve
                const lines = splitTitle(lesson.title)
                const upper = p.y < 260

                let label: ReactNode
                if (layout === 'rooms') {
                    const fin = kind === 'final', w = fin ? 160 : 132, h = fin ? 84 : 70
                    label = <g>
                        {status === 'current' && <rect x={p.x - w / 2 - 8} y={p.y - h / 2 - 8} width={w + 16} height={h + 16} rx="6" fill="none" stroke="#FFD86B" strokeWidth="2" strokeDasharray="6 5" />}
                        <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} fill={theme.nodeBg} stroke={locked ? theme.lock : '#FFFFFF'} strokeWidth={fin ? 4 : 3} strokeDasharray={kind === 'reto' ? '10 4' : undefined} className="rt-ring" />
                        {status === 'done' && <rect x={p.x - w / 2} y={p.y - h / 2} width={w} height={h} fill="url(#rt-hatch)" />}
                        {locked && !fin && <LockGlyph x={p.x + w / 2 - 12} y={p.y + h / 2 - 12} color={theme.muted} />}
                        <g>
                            <text x={p.x} y={p.y - h / 2 + 16} textAnchor="middle" fill={kind === 'reto' || fin ? theme.tag : '#BFD6F5'} fontFamily={MONO} fontSize="10" fontWeight="700" letterSpacing="1.2">
                                {(TAG[kind] || 'AMBIENTE') + ' · ' + String(i + 1).padStart(2, '0')}
                            </text>
                            <text x={p.x} y={p.y + (lines.length > 1 ? 4 : 12)} textAnchor="middle" fill={theme.fg} fontFamily={FONT} fontSize="13" fontWeight="700">
                                {lines.map((l, k) => <tspan key={k} x={p.x} dy={k ? '1.2em' : 0}>{l}</tspan>)}
                            </text>
                        </g>
                    </g>
                } else {
                    let lx = p.x, ly = p.y + 42, anchor: 'start' | 'middle' | 'end' = 'middle', size = 15
                    if (layout === 'metro') ly = upper ? p.y - 62 : p.y + 42
                    if (layout === 'arcs') { ly = p.y + 56; size = 14 }
                    if (layout === 'constellation') { ly = p.y + 36; size = 15 }
                    if (layout === 'chart') { ly = 404; size = 13 }
                    if (layout === 'trail') { lx = kind === 'final' ? p.x - 14 : p.x + 20; ly = kind === 'final' ? p.y - 58 : p.y + 24; anchor = kind === 'final' ? 'end' : 'start'; size = 13 }
                    label = <g>
                        <Label theme={theme} kind={kind} lines={lines} x={lx} y={ly} anchor={anchor} size={size} />
                        {layout === 'arcs' && <text x={p.x} y={p.y + 34} textAnchor="middle" fill={theme.muted} fontFamily={MONO} fontSize="10" fontWeight="700">M{theme.moduleNum}·{String(i + 1).padStart(2, '0')}</text>}
                        {layout === 'chart' && <line x1={p.x} x2={p.x} y1={380} y2={386} stroke={theme.lock} />}
                    </g>
                }

                return (
                    <g key={lesson.id} className="rt-node" tabIndex={0} role="button"
                        aria-label={`${lesson.title} · ${status === 'done' ? 'completada' : locked ? 'bloqueada' : 'disponible'}`}
                        onClick={() => onSelect(lesson)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(lesson) } }}
                        onPointerDown={e => e.stopPropagation()}>
                        {status === 'current' && layout !== 'rooms' && <circle cx={p.x} cy={p.y} r="14" fill={theme.line} className="rt-pulse" />}
                        {layout !== 'rooms' && <NodeShape theme={theme} kind={kind} status={status} p={p} />}
                        {label}
                        {/* área de clic más generosa */}
                        <circle cx={p.x} cy={p.y} r="26" fill="transparent" />
                    </g>
                )
            })}

            {/* El robot marca dónde estás */}
            {currentIdx >= 0 && pts[currentIdx] && (
                <g className="rt-bob" pointerEvents="none">
                    <image href={robotFeliz}
                        x={pts[currentIdx].x - (layout === 'rooms' ? 113 : 86)}
                        y={pts[currentIdx].y - (layout === 'rooms' ? 46 : 50)}
                        width={layout === 'rooms' ? 48 : 58} height={layout === 'rooms' ? 48 : 58} />
                </g>
            )}
        </svg>
    )
}
