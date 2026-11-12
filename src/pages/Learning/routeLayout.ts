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

// Patrón bajo, alto, alto, bajo, bajo… para que las etiquetas no choquen
const row = (i: number, hi: number, lo: number) => (Math.floor((i + 1) / 2) % 2 === 1 ? hi : lo)

// En celular los mapas se dibujan de arriba hacia abajo (se recorren deslizando).
// La cumbre y el gráfico se quedan horizontales: su gracia es subir hasta la meta.
export const V_WIDTH = 360
const V_TOP = 120
const V_STEP: Partial<Record<RouteLayout, number>> = { metro: 130, arcs: 150, rooms: 125, constellation: 140 }
export const hasVertical = (layout: RouteLayout) => layout in V_STEP
// Columnas de la línea del metro vertical
const V_METRO_X = [84, 140]
// Columna de nombres a la derecha del camino (metro y constelación)
export const V_LABEL_X = V_METRO_X[1] + 26

function verticalPositions(layout: RouteLayout, n: number): Pt[] {
    const step = V_STEP[layout] ?? 140
    const rnd = seeded(7)
    return Array.from({ length: n }, (_, i) => {
        const y = V_TOP + i * step
        switch (layout) {
            // la línea quiebra de un lado a otro; los nombres van a la derecha
            case 'metro':         return { x: row(i, V_METRO_X[1], V_METRO_X[0]), y }
            // zigzag entre dos columnas
            case 'arcs':          return { x: i % 2 ? 250 : 110, y }
            case 'rooms':         return { x: row(i, 250, 110), y }
            // estrellas dispersas a la izquierda, sin cruzar los nombres
            default:              return { x: 60 + rnd() * 80, y }
        }
    })
}

// Cumbre y gráfico: sube, baja un poco, vuelve a subir… sin tocar el inicio ni la meta
const dip = (i: number, n: number, step: number) => (i % 2 === 1 && i < n - 1 ? step * 1.6 : 0)

export function positions(layout: RouteLayout, n: number, vertical = false): Pt[] {
    if (vertical) return verticalPositions(layout, n)
    const step = STEP[layout]
    const rnd = seeded(7)
    return Array.from({ length: n }, (_, i) => {
        const x = START_X + i * step
        switch (layout) {
            case 'metro':         return { x, y: row(i, 210, 320) }
            case 'rooms':         return { x, y: row(i, 190, 320) }
            case 'arcs':          return { x, y: (i % 2 ? 220 : 330) + (i % 3) * 8 }
            case 'chart':         return { x, y: 380 - ((i + 1) / n) * 240 + dip(i, n, 240 / n) }
            case 'constellation': return { x, y: 190 + rnd() * 150 }
            case 'trail':         return { x, y: 390 - (n > 1 ? i * (250 / (n - 1)) : 0) + dip(i, n, 250 / Math.max(1, n - 1)) }
        }
    })
}

export function segment(layout: RouteLayout, a: Pt, b: Pt, vertical = false): string {
    if (vertical) {
        // El vuelo sale de lado y baja hasta la siguiente escala
        if (layout === 'arcs') return ` Q${b.x} ${a.y} ${b.x} ${b.y}`
        // metro: baja recto y cambia de columna en diagonal, como en la versión horizontal
        if (layout === 'metro' && a.x !== b.x) return ` L${a.x} ${b.y - Math.abs(b.x - a.x)} L${b.x} ${b.y}`
        // plano: pasillo que baja y luego cruza a la siguiente sala
        if (layout === 'rooms') return ` L${a.x} ${b.y} L${b.x} ${b.y}`
        return ` L${b.x} ${b.y}`
    }
    if (layout === 'metro' && a.y !== b.y) {
        const d = Math.abs(b.y - a.y)
        return ` L${b.x - d} ${a.y} L${b.x} ${b.y}`
    }
    if (layout === 'rooms') return ` L${b.x} ${a.y} L${b.x} ${b.y}`
    if (layout === 'arcs') return ` Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 70} ${b.x} ${b.y}`
    return ` L${b.x} ${b.y}`
}

export function pathThrough(layout: RouteLayout, pts: Pt[], upTo: number, start?: Pt, vertical = false) {
    if (pts.length === 0 || upTo < 0) return ''
    const first = start ?? pts[0]
    let d = `M${first.x} ${first.y}`
    if (start) d += segment(layout, start, pts[0], vertical)
    for (let i = 1; i <= upTo && i < pts.length; i++) d += segment(layout, pts[i - 1], pts[i], vertical)
    return d
}

export function routeWidth(layout: RouteLayout, n: number) {
    return Math.max(1000, START_X * 2 + Math.max(0, n - 1) * STEP[layout])
}

// Tamaño del lienzo de la ruta (ancho x alto)
export function mapSize(layout: RouteLayout, n: number, vertical = false) {
    if (!vertical) return { w: routeWidth(layout, n), h: MAP_HEIGHT }
    return { w: V_WIDTH, h: Math.max(600, V_TOP * 2 + Math.max(0, n - 1) * (V_STEP[layout] ?? 140)) }
}

// Centro de las estrellas de un reto, según dónde va su etiqueta
export function starsPoint(layout: RouteLayout, p: Pt, vertical = false): Pt {
    if (vertical) {
        if (layout === 'arcs') return { x: p.x, y: p.y + 54 }
        if (layout === 'rooms') return { x: p.x, y: p.y - 20 }
        return { x: V_LABEL_X + 70, y: p.y }
    }
    if (layout === 'rooms') return { x: p.x, y: p.y - 20 }
    if (layout === 'metro' && p.y < 260) return { x: p.x, y: p.y + 31 }
    return { x: p.x, y: p.y - 30 }
}
