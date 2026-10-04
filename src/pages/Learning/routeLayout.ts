import type { RouteLayout } from './routeThemes'

// Geometría de la ruta: dónde va cada nodo y cómo se conectan, según el tipo de mapa

export const MAP_HEIGHT = 460
const START_X = 110

export type Pt = { x: number; y: number }

// Generador pseudoaleatorio con semilla fija: el mapa se ve igual en cada visita
export function seeded(seed: number) {
    let s = seed
    return () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
}

// Divide un título largo en dos líneas parecidas
export function splitTitle(title: string, max = 16): string[] {
    if (title.length <= max) return [title]
    const words = title.split(' ')
    let best = 1, diff = Infinity
    for (let k = 1; k < words.length; k++) {
        const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length)
        if (d < diff) { diff = d; best = k }
    }
    const lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
    return lines.map(l => (l.length > max + 6 ? l.slice(0, max + 4) + '…' : l))
}

// ── Posiciones y conectores por tipo de mapa ──────────────────────────────────
const STEP: Record<RouteLayout, number> = { metro: 150, rooms: 175, arcs: 160, chart: 150, constellation: 150, trail: 150 }

export function positions(layout: RouteLayout, n: number): Pt[] {
    const step = STEP[layout]
    const rnd = seeded(7)
    // Patrón bajo, alto, alto, bajo, bajo… para que las etiquetas no choquen
    const row = (i: number, hi: number, lo: number) => (Math.floor((i + 1) / 2) % 2 === 1 ? hi : lo)
    return Array.from({ length: n }, (_, i) => {
        const x = START_X + i * step
        switch (layout) {
            case 'metro':         return { x, y: row(i, 210, 320) }
            case 'rooms':         return { x, y: row(i, 190, 320) }
            case 'arcs':          return { x, y: (i % 2 ? 220 : 330) + (i % 3) * 8 }
            case 'chart':         return { x, y: 380 - ((i + 1) / n) * 240 }
            case 'constellation': return { x, y: 190 + rnd() * 150 }
            case 'trail':         return { x, y: 390 - (n > 1 ? i * (250 / (n - 1)) : 0) }
        }
    })
}

export function segment(layout: RouteLayout, a: Pt, b: Pt): string {
    if (layout === 'metro' && a.y !== b.y) {
        const d = Math.abs(b.y - a.y)
        return ` L${b.x - d} ${a.y} L${b.x} ${b.y}`
    }
    if (layout === 'rooms') return ` L${b.x} ${a.y} L${b.x} ${b.y}`
    if (layout === 'arcs') return ` Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 70} ${b.x} ${b.y}`
    return ` L${b.x} ${b.y}`
}

export function pathThrough(layout: RouteLayout, pts: Pt[], upTo: number, start?: Pt) {
    if (pts.length === 0 || upTo < 0) return ''
    const first = start ?? pts[0]
    let d = `M${first.x} ${first.y}`
    if (start) d += segment(layout, start, pts[0])
    for (let i = 1; i <= upTo && i < pts.length; i++) d += segment(layout, pts[i - 1], pts[i])
    return d
}

export function routeWidth(layout: RouteLayout, n: number) {
    return Math.max(1000, START_X * 2 + Math.max(0, n - 1) * STEP[layout])
}
