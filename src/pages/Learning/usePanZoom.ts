import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

// Mover y hacer zoom sobre el mapa de la ruta:
// - rueda del mouse / pellizco del trackpad: zoom hacia donde apunta el cursor
// - arrastrar con el mouse o un dedo: mover
// - dos dedos: pellizcar para zoom
// - límites: el mapa nunca se pierde de vista; si cabe entero, queda centrado

export interface View { x: number; y: number; s: number }

export const MAX_SCALE = 1.8
const MARGIN = 64              // cuánto puede pasarse el borde del mapa al llegar al final
const WHEEL_SPEED = 0.0015

interface Options {
    contentW:  number
    contentH:  number
    viewportW: number
    viewportH: number
    topInset:  number          // alto del encabezado flotante (el mapa no queda debajo)
    focusX:    number | null   // x de la lección actual: la vista inicial la centra
}

export function usePanZoom(ref: RefObject<HTMLDivElement | null>, opts: Options) {
    const { contentW, contentH, viewportW: vw, viewportH: vh, topInset, focusX } = opts
    // Se puede alejar hasta ver la ruta completa (sin bajar de 35%)
    const minScale = Math.min(1, Math.max(0.35, (vw - MARGIN * 2) / contentW))

    const clamp = useCallback((v: View): View => {
        const s = Math.min(MAX_SCALE, Math.max(minScale, v.s))
        const sw = contentW * s, sh = contentH * s
        const availH = vh - topInset
        const x = sw <= vw - MARGIN * 2
            ? (vw - sw) / 2
            : Math.min(MARGIN, Math.max(vw - sw - MARGIN, v.x))
        const y = sh <= availH - MARGIN
            ? topInset + (availH - sh) / 2
            : Math.min(topInset + MARGIN, Math.max(vh - sh - MARGIN, v.y))
        return { x, y, s }
    }, [minScale, contentW, contentH, vw, vh, topInset])

    // Mientras el usuario no mueva nada, la vista sigue a la lección actual
    const initial: View = { s: 1, x: focusX == null ? MARGIN : vw / 2 - focusX, y: 0 }
    const [manual, setManual] = useState<View | null>(null)
    const view = clamp(manual ?? initial)

    const [dragging, setDragging]   = useState(false)
    const [animating, setAnimating] = useState(false)
    const [touched, setTouched]     = useState(false)

    // Los manejadores nativos leen siempre la vista y los límites más recientes
    const viewRef  = useRef(view)
    const clampRef = useRef(clamp)
    useEffect(() => { viewRef.current = view; clampRef.current = clamp })

    const apply = useCallback((next: View) => {
        const v = clampRef.current(next)
        viewRef.current = v
        setManual(v)
    }, [])

    const zoomAt = useCallback((px: number, py: number, factor: number) => {
        const v = viewRef.current
        const s = clampRef.current({ ...v, s: v.s * factor }).s   // escala ya limitada: el punto bajo el cursor no se mueve
        const k = s / v.s
        apply({ s, x: px - (px - v.x) * k, y: py - (py - v.y) * k })
    }, [apply])

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const pointers = new Map<number, { x: number; y: number }>()
        let drag:  { x: number; y: number; view: View } | null = null
        let pinch: { dist: number; mid: { x: number; y: number }; view: View } | null = null

        const local = (e: { clientX: number; clientY: number }) => {
            const r = el.getBoundingClientRect()
            return { x: e.clientX - r.left, y: e.clientY - r.top }
        }
        const twoFinger = () => {
            const [a, b] = [...pointers.values()]
            return { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } }
        }

        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const p = local(e)
            zoomAt(p.x, p.y, Math.exp(-e.deltaY * WHEEL_SPEED * (e.ctrlKey ? 4 : 1)))
            setTouched(true)
        }
        const onDown = (e: PointerEvent) => {
            if (e.button !== 0) return
            // Clic en una lección o en los botones: no es arrastre (si no, el clic no llegaría)
            if ((e.target as Element).closest('.rt-node, .map-controls, button')) return
            el.setPointerCapture(e.pointerId)
            pointers.set(e.pointerId, local(e))
            if (pointers.size === 1) {
                drag = { ...local(e), view: viewRef.current }
                setDragging(true)
            } else if (pointers.size === 2) {
                drag = null
                pinch = { ...twoFinger(), view: viewRef.current }
            }
            setTouched(true)
        }
        const onMove = (e: PointerEvent) => {
            if (!pointers.has(e.pointerId)) return
            pointers.set(e.pointerId, local(e))
            if (pinch && pointers.size >= 2) {
                const { dist, mid } = twoFinger()
                const v = pinch.view
                const s = clampRef.current({ ...v, s: v.s * (dist / pinch.dist) }).s
                const k = s / v.s
                apply({ s, x: mid.x - (pinch.mid.x - v.x) * k, y: mid.y - (pinch.mid.y - v.y) * k })
            } else if (drag) {
                const p = local(e)
                apply({ s: drag.view.s, x: drag.view.x + p.x - drag.x, y: drag.view.y + p.y - drag.y })
            }
        }
        const onUp = (e: PointerEvent) => {
            pointers.delete(e.pointerId)
            if (pointers.size < 2) pinch = null
            if (pointers.size === 1) {
                const [p] = [...pointers.values()]
                drag = { ...p, view: viewRef.current }
            }
            if (pointers.size === 0) { drag = null; setDragging(false) }
        }

        el.addEventListener('wheel', onWheel, { passive: false })
        el.addEventListener('pointerdown', onDown)
        el.addEventListener('pointermove', onMove)
        el.addEventListener('pointerup', onUp)
        el.addEventListener('pointercancel', onUp)
        return () => {
            el.removeEventListener('wheel', onWheel)
            el.removeEventListener('pointerdown', onDown)
            el.removeEventListener('pointermove', onMove)
            el.removeEventListener('pointerup', onUp)
            el.removeEventListener('pointercancel', onUp)
        }
    }, [ref, zoomAt, apply])

    // Botones: zoom desde el centro y volver a la lección actual, con transición suave
    const animate = useCallback((fn: () => void) => {
        setAnimating(true)
        fn()
        window.setTimeout(() => setAnimating(false), 260)
    }, [])
    const zoomIn  = useCallback(() => animate(() => zoomAt(vw / 2, (vh + topInset) / 2, 1.25)), [animate, zoomAt, vw, vh, topInset])
    const zoomOut = useCallback(() => animate(() => zoomAt(vw / 2, (vh + topInset) / 2, 0.8)), [animate, zoomAt, vw, vh, topInset])
    const recenter = useCallback(() => animate(() => setManual(null)), [animate])

    return {
        view, dragging, animating, touched,
        canZoomIn: view.s < MAX_SCALE - 0.01, canZoomOut: view.s > minScale + 0.01,
        zoomIn, zoomOut, recenter,
    }
}
