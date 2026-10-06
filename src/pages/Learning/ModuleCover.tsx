import type { CSSProperties, ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { RouteTheme, ThemeKey } from './routeThemes'
import { seeded } from './routeLayout'

const MONO = '"JetBrains Mono", Consolas, monospace'
const FONT = '"Segoe UI", system-ui, sans-serif'

// ── Ilustraciones (viewBox 1000×420, el arte vive a la derecha para dejar espacio al título) ──
function BusArt() {
    const rnd = seeded(11)
    return <>
        <defs><linearGradient id="cv-bus" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#0F1C2E" /><stop offset="1" stopColor="#173452" /></linearGradient></defs>
        <rect width="1000" height="420" fill="url(#cv-bus)" />
        {Array.from({ length: 14 }, (_, i) => { const h = 60 + rnd() * 120; return <rect key={i} x={380 + i * 48} y={330 - h} width="40" height={h} fill="#1C3A5C" opacity="0.7" /> })}
        <rect y="330" width="1000" height="90" fill="#0A1422" />
        <path d="M0 376 H1000" stroke="#F2C14E" strokeWidth="4" strokeDasharray="34 26" />
        <path d="M560 70 H720 L760 110 H950" fill="none" stroke="#3A9E52" strokeWidth="8" strokeLinecap="round" />
        {[[560, 70], [640, 70], [720, 70], [790, 110], [870, 110], [950, 110]].map(([x, y], i) =>
            <circle key={i} cx={x} cy={y} r={i === 5 ? 10 : 7} fill={i < 2 ? '#3A9E52' : '#0F1C2E'} stroke="#fff" strokeWidth="3" />)}
        <g className="cv-drive">
            <rect x="420" y="210" width="400" height="120" rx="20" fill="#3A9E52" />
            <rect x="420" y="300" width="400" height="14" fill="#2A7A3E" />
            {Array.from({ length: 6 }, (_, i) => <rect key={i} x={440 + i * 56} y="228" width="48" height="46" rx="7" fill="#CDEFD8" opacity="0.92" />)}
            <rect x="780" y="228" width="30" height="70" rx="6" fill="#CDEFD8" />
            <rect x="430" y="196" width="160" height="22" rx="6" fill="#0A1422" />
            <text x="440" y="212" fill="#F2C14E" fontFamily={MONO} fontSize="13" fontWeight="700">L1 · PRESUPUESTO</text>
            {[500, 740].map(x => <g key={x}><circle cx={x} cy="332" r="26" fill="#0A0F18" /><circle cx={x} cy="332" r="10" fill="#5E6E66" /></g>)}
        </g>
        <rect x="902" y="150" width="8" height="180" fill="#C9D3DD" />
        <rect x="856" y="150" width="100" height="84" rx="14" fill="#FFFFFF" />
        <circle cx="906" cy="184" r="22" fill="#3A9E52" />
        <text x="906" y="191" textAnchor="middle" fill="#fff" fontFamily={MONO} fontSize="18" fontWeight="700">L1</text>
        <text x="906" y="224" textAnchor="middle" fill="#16241C" fontFamily={MONO} fontSize="10" fontWeight="700" letterSpacing="1">PARADERO</text>
    </>
}

function FlightArt({ n }: { n: number }) {
    const rnd = seeded(18)
    const dots: ReactElement[] = []
    for (let y = 20; y < 420; y += 18) for (let x = 380; x < 1000; x += 18) {
        const dx = (x - 700) / 300, dy = (y - 200) / 160
        if (dx * dx + dy * dy < 1 && rnd() > 0.35) dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#5C59B8" opacity="0.7" />)
    }
    return <>
        <defs><linearGradient id="cv-fl" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#1B1A47" /><stop offset="1" stopColor="#2E2C7A" /></linearGradient></defs>
        <rect width="1000" height="420" fill="url(#cv-fl)" />
        {dots}
        <path d="M470 330 Q700 40 940 150" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 10" className="cv-draw" />
        <circle cx="470" cy="330" r="8" fill="#A9A6F2" /><circle cx="940" cy="150" r="10" fill="#FFD86B" />
        <g transform="translate(860 112) rotate(22)">
            <path d="M-22 0 L18 -3 Q26 0 18 3 L-22 0Z M-2 -1 L-12 -18 H-6 L8 -1Z M-2 1 L-12 18 H-6 L8 1Z M-20 0 L-26 -9 H-22 L-14 0Z" fill="#FFFFFF" />
        </g>
        <rect x="540" y="250" width="400" height="130" rx="16" fill="#FFFFFF" />
        <line x1="820" x2="820" y1="258" y2="372" stroke="#C9C7EE" strokeWidth="2" strokeDasharray="4 6" />
        <text x="566" y="284" fill="#7D7BB8" fontFamily={MONO} fontSize="11" fontWeight="700" letterSpacing="1">PASE DE ABORDAR · MÓDULO 0{n}</text>
        <text x="566" y="330" fill="#1B1A47" fontFamily={FONT} fontSize="34" fontWeight="800">LIM → META</text>
        <text x="566" y="360" fill="#5E5C9A" fontFamily={FONT} fontSize="14">Pasajero: tú</text>
        <text x="880" y="300" textAnchor="middle" fill="#7D7BB8" fontFamily={MONO} fontSize="10" fontWeight="700">PUERTA</text>
        <text x="880" y="336" textAnchor="middle" fill="#45429A" fontFamily={MONO} fontSize="30" fontWeight="700">0{n}</text>
    </>
}

function PlanArt({ n }: { n: number }) {
    return <>
        <rect width="1000" height="420" fill="#1D4F91" />
        {Array.from({ length: 51 }, (_, i) => <line key={`v${i}`} x1={i * 20} x2={i * 20} y1="0" y2="420" stroke="#fff" opacity={i % 5 ? 0.05 : 0.12} />)}
        {Array.from({ length: 22 }, (_, i) => <line key={`h${i}`} x1="0" x2="1000" y1={i * 20} y2={i * 20} stroke="#fff" opacity={i % 5 ? 0.05 : 0.12} />)}
        <path d="M540 90 H940 V360 H540 Z M740 90 V220 M540 220 H690 M790 220 H940 M740 280 V360" fill="none" stroke="#FFFFFF" strokeWidth="4" className="cv-draw" />
        <path d="M690 220 A50 50 0 0 1 740 270" stroke="#FFFFFF" strokeWidth="2" fill="none" opacity="0.8" />
        <path d="M540 66 H940 M540 58 V74 M940 58 V74" stroke="#BFD6F5" strokeWidth="1.5" fill="none" />
        <text x="740" y="58" textAnchor="middle" fill="#BFD6F5" fontFamily={MONO} fontSize="12">12.40 m</text>
        {[['SALA', 640, 160], ['DORMITORIO', 840, 160], ['COCINA', 640, 300], ['BAÑO', 840, 320]].map(([s, x, y]) =>
            <text key={s} x={x} y={y} textAnchor="middle" fill="#DCE9FB" fontFamily={MONO} fontSize="12" letterSpacing="1.5">{s}</text>)}
        <g transform="rotate(-12 470 320)" opacity="0.9">
            <circle cx="470" cy="320" r="54" fill="none" stroke="#FFD86B" strokeWidth="3" />
            <text x="470" y="314" textAnchor="middle" fill="#FFD86B" fontFamily={MONO} fontSize="12" fontWeight="700">MÓDULO 0{n}</text>
            <text x="470" y="334" textAnchor="middle" fill="#FFD86B" fontFamily={MONO} fontSize="12" fontWeight="700">APROBADO</text>
        </g>
        <text x="560" y="390" fill="#BFD6F5" fontFamily={MONO} fontSize="12">Cuota estimada: S/ 1,150 / mes · TCEA 12.8%</text>
    </>
}

function SummitArt() {
    return <>
        <defs><linearGradient id="cv-sm" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#2D3A6B" /><stop offset="0.55" stopColor="#C46D7A" /><stop offset="1" stopColor="#F7B26B" /></linearGradient></defs>
        <rect width="1000" height="420" fill="url(#cv-sm)" />
        <circle cx="820" cy="300" r="70" fill="#FFD9A0" opacity="0.6" />
        <path d="M300 420 L520 200 L600 260 L720 120 L840 230 L1000 160 V420Z" fill="#6B5B95" opacity="0.75" />
        <path d="M380 420 L640 150 L700 190 L760 80 L880 220 L1000 260 V420Z" fill="#3B3A72" />
        <path d="M760 80 L728 138 L748 130 L762 146 L780 128 L800 136Z" fill="#F4F1FF" />
        <path d="M440 420 Q560 360 600 300 T700 190 T760 84" fill="none" stroke="#FFD86B" strokeWidth="3" strokeDasharray="6 8" className="cv-draw" />
        <line x1="760" x2="760" y1="84" y2="40" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M760 40 L792 50 L760 60Z" fill="#F59E6B" />
        <text x="800" y="44" fill="#FFF4E8" fontFamily={MONO} fontSize="13" fontWeight="700">META · 65 AÑOS</text>
        <path d="M0 420 L0 380 Q200 350 420 400 L460 420Z" fill="#25305A" />
    </>
}

// Velas generadas una sola vez (semilla fija), fuera del render
const CANDLES = (() => {
    const rnd = seeded(25)
    const out: { x: number; up: boolean; o: number; c: number; hi: number; lo: number }[] = []
    let v = 320
    for (let i = 0; i < 16; i++) {
        const x = 400 + i * 36, up = rnd() > 0.22, o = v
        const c = up ? v - (12 + rnd() * 26) : v + (8 + rnd() * 16)
        out.push({ x, up, o, c, hi: Math.min(o, c) - 6 - rnd() * 10, lo: Math.max(o, c) + 6 + rnd() * 10 })
        v = c
    }
    return out
})()

function MarketArt({ n }: { n: number }) {
    const candles = CANDLES
    return <>
        <rect width="1000" height="420" fill="#12241B" />
        {[60, 110, 160, 210, 260, 310, 360].map(y => <line key={y} x1="0" x2="1000" y1={y} y2={y} stroke="#1F3A2B" />)}
        {candles.map((k, i) => <g key={i}>
            <line x1={k.x + 10} x2={k.x + 10} y1={k.hi} y2={k.lo} stroke={k.up ? '#3A9E52' : '#E5484D'} strokeWidth="2" />
            <rect x={k.x} y={Math.min(k.o, k.c)} width="20" height={Math.max(4, Math.abs(k.c - k.o))} rx="2"
                fill={k.up ? '#3A9E52' : '#E5484D'} className="cv-rise" style={{ animationDelay: `${i * 60}ms` }} />
        </g>)}
        <path d={'M' + candles.map(k => `${k.x + 10} ${k.c}`).join(' L')} fill="none" stroke="#B7B4FF" strokeWidth="3" opacity="0.8" className="cv-draw" />
        <rect x="800" y="40" width="160" height="44" rx="10" fill="#45429A" />
        <text x="880" y="69" textAnchor="middle" fill="#fff" fontFamily={MONO} fontSize="16" fontWeight="700">EDU{n} ▲ +38%</text>
    </>
}

function StarsArt() {
    const rnd = seeded(31)
    const C = [[520, 320], [600, 250], [700, 280], [760, 190], [860, 140], [920, 70]]
    return <>
        <defs>
            <radialGradient id="cv-st" cx="0.7" cy="0.4" r="0.8"><stop offset="0" stopColor="#1A2160" /><stop offset="1" stopColor="#050816" /></radialGradient>
            <filter id="cv-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <rect width="1000" height="420" fill="url(#cv-st)" />
        {Array.from({ length: 160 }, (_, i) => <circle key={i} cx={rnd() * 1000} cy={rnd() * 420} r={rnd() * 1.6 + 0.3} fill="#FFFFFF"
            opacity={(0.2 + rnd() * 0.7).toFixed(2)} className={rnd() > 0.8 ? 'rt-twinkle' : undefined} />)}
        <path d={'M' + C.map(p => p.join(' ')).join(' L')} fill="none" stroke="#FFD86B" strokeWidth="2" opacity="0.7" className="cv-draw" />
        {C.map(([x, y], i) => <g key={i}>
            <circle cx={x} cy={y} r={i === 5 ? 14 : 8} fill="#FFD86B" filter="url(#cv-glow)" />
            <circle cx={x} cy={y} r={i === 5 ? 6 : 3.5} fill="#FFFFFF" />
        </g>)}
        <text x="930" y="104" fill="#FFD86B" fontFamily={MONO} fontSize="12" fontWeight="700" letterSpacing="2">META</text>
    </>
}

function ChipArt({ n }: { n: number }) {
    const cx = 700, cy = 210
    return <>
        <rect width="1000" height="420" fill="#0A2618" />
        {Array.from({ length: 10 }, (_, i) => { const y = 40 + i * 36; return <path key={i} d={`M0 ${y} H${120 + ((i * 97) % 160)} l24 24 H${300 + ((i * 61) % 120)}`} fill="none" stroke="#123D28" strokeWidth="3" /> })}
        {Array.from({ length: 8 }, (_, k) => {
            const a = (k * Math.PI) / 4, x2 = cx + Math.cos(a) * 300, y2 = cy + Math.sin(a) * 190
            return <g key={k}>
                <path d={`M${cx} ${cy} L${x2} ${y2}`} stroke="#1F5A3C" strokeWidth="6" />
                <path d={`M${cx} ${cy} L${x2} ${y2}`} stroke="#7CF0A6" strokeWidth="2.5" strokeDasharray="10 30" className="rt-flow" opacity="0.9" />
            </g>
        })}
        {Array.from({ length: 9 }, (_, i) => { const k = i - 4; return <g key={k} fill="#C9A227">
            <rect x={cx + k * 24 - 4} y={cy - 150} width="8" height="22" /><rect x={cx + k * 24 - 4} y={cy + 128} width="8" height="22" />
            <rect x={cx - 150} y={cy + k * 24 - 4} width="22" height="8" /><rect x={cx + 128} y={cy + k * 24 - 4} width="22" height="8" />
        </g> })}
        <rect x={cx - 130} y={cy - 130} width="260" height="260" rx="20" fill="#0F1F17" stroke="#7CF0A6" strokeWidth="3" />
        <rect x={cx - 96} y={cy - 96} width="192" height="192" rx="12" fill="none" stroke="#2F8A5C" strokeWidth="2" />
        <text x={cx} y={cy + 22} textAnchor="middle" fill="#7CF0A6" fontFamily={MONO} fontSize="64" fontWeight="700">M0{n}</text>
        <text x={cx} y={cy + 62} textAnchor="middle" fill="#4F8F6C" fontFamily={MONO} fontSize="13" letterSpacing="2">EDUFIN · SEGURIDAD</text>
        <circle cx={cx - 110} cy={cy - 110} r="6" fill="#7CF0A6" />
    </>
}

// Ilustración de cada mundo (también se usa en la tarjeta del inicio)
export function CoverArt({ k, n }: { k: ThemeKey; n: number }) {
    switch (k) {
        case 'bus':    return <BusArt />
        case 'flight': return <FlightArt n={n} />
        case 'plan':   return <PlanArt n={n} />
        case 'summit': return <SummitArt />
        case 'market': return <MarketArt n={n} />
        case 'stars':  return <StarsArt />
        case 'chip':   return <ChipArt n={n} />
    }
}


// Pantalla de carga del módulo: su portada mientras llega la ruta
export default function ModuleCover({ theme, topicName, lessonCount, hasFinal }: {
    theme: RouteTheme
    topicName: string
    lessonCount: number | null      // null mientras la ruta aún no llega
    hasFinal: boolean
}) {
    const light = !!theme.coverLight
    return (
        <motion.div
            className={`module-cover ${light ? 'module-cover--light' : ''}`}
            style={{ '--cv-scrim': theme.cover, '--cv-accent': theme.line } as CSSProperties}
            role="status"
            aria-live="polite"
            aria-label={`Cargando el módulo ${theme.moduleNum}: ${topicName}`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35 }}
        >
            <svg className="module-cover-art" viewBox="0 0 1000 420" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">
                <CoverArt k={theme.key} n={theme.moduleNum} />
            </svg>
            <div className="module-cover-scrim" />
            <div className="module-cover-text">
                <motion.span className="module-cover-eyebrow" style={{ color: theme.line }}
                    initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                    Módulo {String(theme.moduleNum).padStart(2, '0')} · {theme.world}
                </motion.span>
                <motion.h1 className="module-cover-title" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}>
                    {topicName}
                </motion.h1>
                <motion.p className="module-cover-sub" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}>
                    {lessonCount === null
                        ? 'Preparando tu ruta…'
                        : `${lessonCount} ${lessonCount === 1 ? 'lección' : 'lecciones'}${hasFinal ? ' · 1 caso real' : ''}`}
                </motion.p>
                <motion.div className="module-cover-loader" aria-hidden="true"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}>
                    <i />
                </motion.div>
            </div>
        </motion.div>
    )
}
