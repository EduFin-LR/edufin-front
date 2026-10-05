// Cada módulo de Edufin tiene su propio "mundo" visual. Todos comparten la misma
// gramática (círculo = lección, rombo = reto, cápsula = caso real); solo cambia la piel.

export type ThemeKey = 'bus' | 'flight' | 'plan' | 'summit' | 'market' | 'stars' | 'chip'
export type RouteLayout = 'metro' | 'chart' | 'arcs' | 'rooms' | 'constellation' | 'trail'

export interface RouteTheme {
    key:       ThemeKey
    moduleNum: number
    world:     string        // nombre del mundo
    word:      string        // cómo se cuentan las paradas en este mundo
    layout:    RouteLayout
    // Colores del mapa
    bg:        string
    fg:        string        // texto principal
    muted:     string        // texto de nodos bloqueados
    track:     string        // camino pendiente
    line:      string        // camino recorrido
    done:      string        // relleno de nodo completado
    accent:    string        // retos y caso real
    tag:       string        // etiqueta RETO / VIDEO / CASO REAL
    nodeBg:    string        // relleno de nodo pendiente
    lock:      string        // borde de nodo bloqueado
    hud:       string        // fondo del encabezado
    hudFg:     string
    font?:     string
    upper?:    boolean       // títulos en mayúsculas (placa)
    // Portada y mapa del curso
    brand:     string        // color de la estación del módulo en el inicio
    cover:     string        // color base de la ilustración (degradado detrás del título)
    coverLight?: boolean     // ilustración clara: el texto va oscuro
}

const MONO = '"JetBrains Mono", Consolas, monospace'

export const THEMES: Record<ThemeKey, RouteTheme> = {
    bus: {
        brand: '#3A9E52', cover: '#0F1C2E',
        key: 'bus', moduleNum: 1, world: 'Ruta de bus', word: 'Paradas', layout: 'metro',
        bg: '#12241B', fg: '#E8F3EC', muted: '#6F8B7A', track: '#24392D', line: '#3FBF62', done: '#3FBF62',
        accent: '#8E88F0', tag: '#B7B4FF', nodeBg: '#12241B', lock: '#36503F', hud: 'rgba(21,41,31,0.92)', hudFg: '#E8F3EC',
    },
    flight: {
        brand: '#6C63D9', cover: '#1B1A47',
        key: 'flight', moduleNum: 2, world: 'Plan de vuelo', word: 'Escalas', layout: 'arcs',
        bg: '#1B1A47', fg: '#ECEBFF', muted: '#7D7BB8', track: '#5C59B8', line: '#FFD86B', done: '#FFD86B',
        accent: '#A9A6F2', tag: '#FFD86B', nodeBg: '#1B1A47', lock: '#4A478F', hud: 'rgba(20,19,58,0.92)', hudFg: '#ECEBFF',
    },
    plan: {
        brand: '#1D4F91', cover: '#1D4F91',
        key: 'plan', moduleNum: 3, world: 'Plano', word: 'Ambientes', layout: 'rooms',
        bg: '#1D4F91', fg: '#FFFFFF', muted: '#8FB0DD', track: '#5D8BC9', line: '#FFFFFF', done: '#FFFFFF',
        accent: '#FFD86B', tag: '#FFD86B', nodeBg: '#1D4F91', lock: '#5D8BC9', hud: 'rgba(23,63,117,0.92)', hudFg: '#EAF2FF',
    },
    summit: {
        brand: '#F59E6B', cover: '#2D3A6B',
        key: 'summit', moduleNum: 4, world: 'Cumbre', word: 'Campamentos', layout: 'trail',
        bg: '#2D3A6B', fg: '#FFF4E8', muted: '#B7B4E0', track: '#FFF4E8', line: '#F59E6B', done: '#F59E6B',
        accent: '#A9A6F2', tag: '#FFD3B0', nodeBg: '#2D3A6B', lock: '#6E6BA8', hud: 'rgba(37,48,90,0.92)', hudFg: '#FFF4E8',
    },
    market: {
        brand: '#6C63D9', cover: '#12241B',
        key: 'market', moduleNum: 5, world: 'Gráfico de mercado', word: 'Dominio', layout: 'chart',
        bg: '#12241B', fg: '#E8F3EC', muted: '#6F8B7A', track: '#2E5A3E', line: '#3FBF62', done: '#3FBF62',
        accent: '#8E88F0', tag: '#B7B4FF', nodeBg: '#12241B', lock: '#36503F', hud: 'rgba(21,41,31,0.92)', hudFg: '#E8F3EC',
    },
    stars: {
        brand: '#C9A227', cover: '#050816',
        key: 'stars', moduleNum: 6, world: 'Constelación', word: 'Estrellas', layout: 'constellation',
        bg: '#070B22', fg: '#E6E9FF', muted: '#5E66A8', track: '#2B3270', line: '#FFD86B', done: '#FFD86B',
        accent: '#FFD86B', tag: '#FFD86B', nodeBg: '#070B22', lock: '#3A4180', hud: 'rgba(11,16,48,0.92)', hudFg: '#E6E9FF',
        upper: true,
    },
    chip: {
        brand: '#2F8A5C', cover: '#0A2618',
        key: 'chip', moduleNum: 7, world: 'Circuito', word: 'Chips', layout: 'metro',
        bg: '#0C2E1E', fg: '#CFEFDC', muted: '#5F8A72', track: '#1F5A3C', line: '#2F8A5C', done: '#7CF0A6',
        accent: '#E5C35A', tag: '#E5C35A', nodeBg: '#0F1F17', lock: '#3B6A51', hud: 'rgba(8,35,22,0.92)', hudFg: '#D9F7E4',
        font: MONO, upper: true,
    },
}

// El backend no envía el número de módulo, así que se reconoce por el nombre del tema
const MATCHERS: [ThemeKey, RegExp][] = [
    ['chip',   /sistema financiero|seguridad|fraude|estafa/],
    ['summit', /pension|jubilacion|\bafp\b|\bonp\b/],
    ['plan',   /credito|deuda|prestamo/],
    ['market', /inversion|invertir/],
    ['bus',    /ingreso|presupuesto|sueldo/],
    ['flight', /ahorro/],
]

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function themeForTopic(topicName = '', category = ''): RouteTheme {
    const text = normalize(`${topicName} ${category}`)
    const match = MATCHERS.find(([, re]) => re.test(text))
    return THEMES[match ? match[0] : 'stars']
}
