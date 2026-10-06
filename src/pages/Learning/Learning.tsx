import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FaBook, FaPlay, FaLock, FaClipboardList, FaArrowLeft, FaTimes, FaTrophy, FaPlus, FaMinus, FaCrosshairs } from 'react-icons/fa'
import Logo from '../../components/Logo/Logo'
import progresoA  from '../../assets/images/ProgresoA.png'
import { getTopicLessons } from '../../services/learningService'
import type { TopicLessons, Lesson } from '../../services/learningService'
import { useAuth } from '../../context/AuthContext'
import { themeForTopic } from './routeThemes'
import RouteMap from './RouteMap'
import { MAP_HEIGHT, routeWidth, positions } from './routeLayout'
import { usePanZoom } from './usePanZoom'
import ModuleCover from './ModuleCover'
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen'
import './Learning.css'

// ── Colors por tipo ────────────────────────────────────────────────────────────
const NODE_COLORS = {
    QUIZ:    { bg:'#3b82f6', border:'#1d4ed8', glow:'rgba(59,130,246,0.45)', icon:'#fff' },
    VIDEO:   { bg:'#ec4899', border:'#be185d', glow:'rgba(236,72,153,0.45)', icon:'#fff' },
    READING: { bg:'#2db84f', border:'#1a8c3c', glow:'rgba(45,184,79,0.45)',  icon:'#fff' },
    FINAL:   { bg:'#f59e0b', border:'#b45309', glow:'rgba(245,158,11,0.55)', icon:'#fff' },
    LOCKED:  { bg:'#d1d5db', border:'#9ca3af', glow:'rgba(156,163,175,0.2)', icon:'#9ca3af' },
}

function NodeIcon({ type, locked }: { type: Lesson['lessonType']; locked: boolean }) {
    if (locked) return <FaLock />
    if (type === 'QUIZ')    return <FaClipboardList />
    if (type === 'VIDEO')   return <FaPlay />
    if (type === 'FINAL')   return <FaTrophy />
    return <FaBook />
}

// La portada del módulo funciona como pantalla de carga: se ve mientras llega la ruta
// y como mínimo este tiempo, para que no parpadee
const COVER_MIN_MS = 2000

// ── Animación XP volando al contador del header ────────────────────────────
function XpFlyIn({ xp, from, targetRef, onDone, onCountUp }: {
    xp: number
    from: number
    targetRef: React.RefObject<HTMLDivElement | null>
    onDone: () => void
    onCountUp: (val: number) => void
}) {
    const N = Math.min(10, Math.max(4, Math.floor(xp / 12) + 3))
    const [target, setTarget] = useState<{ x: number; y: number } | null>(null)
    const [stars] = useState(() =>
        Array.from({ length: N }, (_, i) => ({
            id: i,
            ox: (Math.random() - 0.5) * 200,
            oy: 60 + Math.random() * 100,
            delay: 0.25 + i * 0.09,
        }))
    )

    const doneRef = useRef(false)
    const cb = useCallback(onDone, [])
    const countCb = useCallback(onCountUp, [])

    useEffect(() => {
        const el = targetRef.current
        if (!el) return
        const rect = el.getBoundingClientRect()
        setTarget({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })

        // Primera estrella llega ~delay[0] + 0.88s después del inicio
        const firstArrival = (0.25 + 0.88) * 1000
        const last = 0.25 + (N - 1) * 0.09 + 0.95
        const countDuration = last * 1000 - firstArrival  // tiempo desde primera hasta última

        // Animar el contador desde `from` hasta `from + xp`
        const countTimer = setTimeout(() => {
            let startTs: number | null = null
            let raf: number
            const step = (ts: number) => {
                if (!startTs) startTs = ts
                const elapsed = ts - startTs
                const progress = Math.min(elapsed / Math.max(countDuration, 600), 1)
                countCb(Math.round(from + progress * xp))
                if (progress < 1) raf = requestAnimationFrame(step)
            }
            raf = requestAnimationFrame(step)
            return () => cancelAnimationFrame(raf)
        }, firstArrival)

        const doneTimer = setTimeout(() => {
            if (!doneRef.current) { doneRef.current = true; cb() }
        }, last * 1000 + 400)

        return () => { clearTimeout(countTimer); clearTimeout(doneTimer) }
    }, [])

    if (!target) return null

    const cx = typeof window !== 'undefined' ? window.innerWidth / 2 : 300
    const cy = typeof window !== 'undefined' ? window.innerHeight * 0.54 : 400

    return (
        <div className="xp-fly-wrap" aria-hidden>
            <motion.div
                className="xp-fly-badge"
                style={{ left: cx, top: cy }}
                initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1.1, 0.7], y: ['-50%', '-75%', '-75%', '-75%'] }}
                transition={{ duration: 0.95, delay: 0.05 }}
            >
                +{xp} XP ★
            </motion.div>

            {stars.map(s => {
                const sx = cx + s.ox
                const sy = cy + s.oy
                return (
                    <motion.span
                        key={s.id}
                        className="xp-fly-star"
                        style={{ left: sx, top: sy }}
                        initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                        animate={{
                            x: target.x - sx,
                            y: target.y - sy,
                            scale: [0, 1.3, 0.7],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{ duration: 0.88, delay: s.delay, ease: [0.25, 0.1, 0.25, 1] }}
                    >★</motion.span>
                )
            })}
        </div>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Learning() {
    const navigate      = useNavigate()
    const { topicId }   = useParams<{ topicId: string }>()
    const { profile, refreshProfile } = useAuth()
    // El dashboard envía el nombre del módulo para mostrar su portada sin esperar al servidor
    const location      = useLocation()
    const nameHint      = (location.state as { topicName?: string } | null)?.topicName

    const [topic,    setTopic]    = useState<TopicLessons | null>(null)
    const [selected, setSelected] = useState<Lesson | null>(null)
    const [minElapsed, setMinElapsed] = useState(false)
    const [loadFailed, setLoadFailed] = useState(false)
    const [viewport, setViewport] = useState({ width: 600, height: 530 })
    const viewportRef = useRef<HTMLDivElement>(null)
    const headerRef   = useRef<HTMLElement>(null)
    const xpRef       = useRef<HTMLDivElement>(null)
    const [headerBottom, setHeaderBottom] = useState(100)
    const [pendingXp,   setPendingXp]   = useState(0)
    const [xpAnimDone,  setXpAnimDone]  = useState(false)
    const [xpBefore,    setXpBefore]    = useState<number | null>(null)
    const [xpDisplayed, setXpDisplayed] = useState<number | null>(null)

    // Tamaño del área visible (para limitar el arrastre), medido fuera del render
    useEffect(() => {
        const el = viewportRef.current
        if (!el) return
        const measure = () => setViewport({ width: el.clientWidth, height: el.clientHeight })
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    // El encabezado flota sobre el mapa: su borde inferior real es el límite superior del mapa
    useEffect(() => {
        const el = headerRef.current
        if (!el) return
        const measure = () => setHeaderBottom(el.offsetTop + el.offsetHeight)
        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    useEffect(() => {
        if (!topicId) return
        getTopicLessons(topicId)
            .then(r => setTopic(r.data))
            .catch(() => setLoadFailed(true))
    }, [topicId])

    useEffect(() => {
        const t = setTimeout(() => setMinElapsed(true), COVER_MIN_MS)
        return () => clearTimeout(t)
    }, [])

    // Leer XP ganada al volver del quiz y refrescar perfil
    useEffect(() => {
        const stored = parseInt(sessionStorage.getItem('pendingXp') || '0')
        if (stored > 0) {
            sessionStorage.removeItem('pendingXp')
            const currentXp = parseInt(localStorage.getItem('profile')
                ? (JSON.parse(localStorage.getItem('profile')!).totalPoints ?? 0)
                : 0)
            setXpBefore(currentXp)
            setXpDisplayed(currentXp)
            setPendingXp(stored)
            refreshProfile()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const baseLessons = topic?.lessons ?? []

    // El FINAL es dinámico: no existe como Lesson persistida.
    // Por eso agregamos un nodo virtual al final de la ruta.
    const hasPersistedFinal = baseLessons.some(l => l.lessonType === 'FINAL')
    const allBaseLessonsCompleted =
        baseLessons.length > 0 &&
        baseLessons.every(l => l.status === 'COMPLETED')

    const virtualFinal: Lesson | null =
        topicId && !hasPersistedFinal
            ? {
                id: `final-${topicId}`,
                title: 'Evaluación final',
                content: 'Completa la evaluación final del módulo.',
                videoUrl: '',
                lessonOrder:
                    baseLessons.reduce(
                        (max, lesson) => Math.max(max, lesson.lessonOrder),
                        0
                    ) + 1,
                lessonType: 'FINAL',
                status: allBaseLessonsCompleted ? 'UNLOCKED' : 'LOCKED',
            }
            : null

    const lessons = virtualFinal
        ? [...baseLessons, virtualFinal]
        : baseLessons

    const moduleName = topic?.topicName ?? nameHint
    const theme   = themeForTopic(moduleName, topic?.category)
    const loading = !(minElapsed && (topic || loadFailed))

    // índice del primer nodo que el usuario puede o está trabajando (no completado ni bloqueado)
    const currentIdx = lessons.findIndex(l => l.status !== 'COMPLETED' && l.status !== 'LOCKED')

    // índice del último nodo desbloqueado (COMPLETED o primer UNLOCKED)
    const lastUnlockedIdx = Math.max(
        lessons.findLastIndex(l => l.status === 'COMPLETED'),
        currentIdx,
    )

    const canvasWidth  = routeWidth(theme.layout, lessons.length)
    const canvasHeight = MAP_HEIGHT

    // Mover y hacer zoom; la vista inicial queda centrada en la lección actual
    const focusIdx = currentIdx >= 0 ? currentIdx : Math.max(0, lastUnlockedIdx)
    const pz = usePanZoom(viewportRef, {
        contentW: canvasWidth, contentH: canvasHeight,
        viewportW: viewport.width, viewportH: viewport.height,
        topInset: headerBottom + 8,
        focusX: lessons.length ? positions(theme.layout, lessons.length)[focusIdx].x : null,
    })

    // stats del header
    const completed = baseLessons.filter(
        l => l.status === 'COMPLETED'
    ).length
    const progressPct =
        baseLessons.length > 0
            ? Math.round((completed / baseLessons.length) * 100)
            : 0
    const level        = profile?.currentLevel ?? 1
    const xp           = profile?.totalPoints  ?? 0
    const xpShown      = xpDisplayed !== null ? xpDisplayed : xp

    return (
        <div className="learning-page" style={{ '--rt-hud': theme.hud, '--rt-hud-fg': theme.hudFg, '--rt-line': theme.line } as React.CSSProperties}>

            {/* ── Encabezado ── */}
            <header ref={headerRef} className="learning-header learning-header--themed">
                <button className="learning-back" onClick={() => navigate('/dashboard')} aria-label="Volver al inicio">
                    <FaArrowLeft /><span>Volver</span>
                </button>

                <div className="learning-course-info">
                    <p className="learning-module-tag">Módulo {String(theme.moduleNum).padStart(2, '0')} · {theme.world}</p>
                    <h1 className="learning-course-name">{moduleName ?? '…'}</h1>
                    <div className="learning-progress-row">
                        <div className="learning-progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Avance del módulo">
                            <div className="learning-progress-fill" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="learning-progress-pct">{completed} de {baseLessons.length} lecciones · {progressPct}%</span>
                    </div>
                </div>

                <div ref={xpRef} className={`learning-xp${xpAnimDone ? ' learning-xp--pulse' : ''}`}>
                    <div className="learning-level-wrap">
                        <img src={progresoA} alt="" className="learning-level-img" />
                        <span className="learning-level-num">{level}</span>
                    </div>
                    <span className="learning-xp-val">{xpShown} XP</span>
                </div>

                <Logo className="dash-logo learning-logo" />
            </header>

            {/* ── Map viewport ── */}
            <div ref={viewportRef} className={`map-viewport ${pz.dragging ? 'map-viewport--dragging' : ''}`} style={{ background: theme.bg, visibility: loading ? 'hidden' : 'visible' }}>
                <div
                    className={`map-canvas ${pz.animating ? 'map-canvas--animating' : ''}`}
                    style={{
                        width: canvasWidth * pz.view.s,
                        height: canvasHeight * pz.view.s,
                        transform: `translate3d(${pz.view.x}px, ${pz.view.y}px, 0)`,
                    }}
                >
                    <RouteMap
                        theme={theme}
                        lessons={lessons}
                        currentIdx={currentIdx}
                        lastReachedIdx={lastUnlockedIdx}
                        onSelect={setSelected}
                    />
                </div>

                <AnimatePresence>
                    {!pz.touched && (
                        <motion.div className="map-hint" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                            <span className="map-hint-desktop">Arrastra para moverte · Rueda o pellizca para acercar</span>
                            <span className="map-hint-mobile">Arrastra para moverte · Pellizca para acercar</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="map-controls" role="group" aria-label="Zoom del mapa" onPointerDown={e => e.stopPropagation()}>
                    <button onClick={pz.zoomIn} disabled={!pz.canZoomIn} aria-label="Acercar"><FaPlus /></button>
                    <button onClick={pz.zoomOut} disabled={!pz.canZoomOut} aria-label="Alejar"><FaMinus /></button>
                    <button onClick={pz.recenter} aria-label="Centrar en la lección actual"><FaCrosshairs /></button>
                </div>
            </div>

            {/* ── Portada del módulo como pantalla de carga ── */}
            <AnimatePresence>
                {loading && moduleName && (
                    <ModuleCover
                        theme={theme}
                        topicName={moduleName}
                        lessonCount={topic ? lessons.length : null}
                        hasFinal={lessons.some(l => l.lessonType === 'FINAL')}
                    />
                )}
            </AnimatePresence>
            {/* Si se entra por enlace directo, aún no se sabe qué módulo es: carga genérica */}
            <LoadingScreen visible={loading && !moduleName} message="Cargando tu ruta…" />

            {/* ── Animación XP ── */}
            {pendingXp > 0 && !xpAnimDone && !loading && xpBefore !== null && (
                <XpFlyIn
                    xp={pendingXp}
                    from={xpBefore}
                    targetRef={xpRef}
                    onCountUp={setXpDisplayed}
                    onDone={() => { setXpAnimDone(true); setXpDisplayed(null) }}
                />
            )}

            {/* ── Lesson modal ── */}
            <AnimatePresence>
                {selected && (() => {
                    const isVideo  = selected.lessonType === 'VIDEO' && !!selected.videoUrl
                    const colors   = NODE_COLORS[selected.lessonType] ?? NODE_COLORS.READING
                    const isLocked = selected.status === 'LOCKED'
                    return (
                        <motion.div
                            className="lesson-overlay"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            onClick={() => setSelected(null)}
                        >
                            <motion.div
                                className={`lesson-modal ${isVideo ? 'lesson-modal--video' : ''}`}
                                initial={{ y: 10, opacity: 0, scale: 0.98 }}
                                animate={{ y: 0,  opacity: 1, scale: 1    }}
                                exit={{ y: 6, opacity: 0, scale: 0.98 }}
                                transition={{ type: 'spring', stiffness: 900, damping: 40 }}
                                onClick={e => e.stopPropagation()}
                            >
                                <button className="lesson-modal-close" onClick={() => setSelected(null)}><FaTimes /></button>

                                {/* Video embed */}
                                {isVideo && (
                                    <motion.div
                                        className="lesson-video-wrap"
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.18, duration: 0.4 }}
                                    >
                                        <iframe
                                            className="lesson-video-iframe"
                                            src={selected.videoUrl}
                                            title={selected.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </motion.div>
                                )}

                                {/* Icon (only for non-video) */}
                                {!isVideo && (
                                    <div className="lesson-modal-icon" style={{
                                        background: colors.bg,
                                        boxShadow:  `0 8px 24px ${colors.glow}`,
                                    }}>
                                        <NodeIcon type={selected.lessonType} locked={isLocked} />
                                    </div>
                                )}

                                {/* Video type badge */}
                                {isVideo && (
                                    <div className="lesson-video-badge">
                                        <span className="lesson-video-dot" />
                                        Video
                                    </div>
                                )}

                                <div className="lesson-modal-body">
                                    <h3 className="lesson-modal-title">{selected.title}</h3>
                                    <p className="lesson-modal-desc">{selected.content}</p>
                                    {selected.status === 'COMPLETED' && <span className="lesson-modal-badge-done">✅ Completada</span>}
                                </div>

                                <button
                                    className={`btn ${isLocked ? '' : 'btn-primary'} lesson-modal-btn`}
                                    disabled={isLocked}
                                    style={isLocked ? { background: '#9ca3af', color: '#fff', cursor: 'not-allowed' } : {}}
                                    onClick={() => {
                                        if (isLocked) return

                                        if (selected.lessonType === 'FINAL') {
                                            navigate(`/quiz/final-${topicId}`, { state: { lessonType: 'FINAL', topicId } })
                                            return
                                        }

                                        navigate(`/quiz/${selected.id}`, { state: { lessonType: selected.lessonType } })
                                    }}
                                >
                                    {isLocked                        ? '🔒 Bloqueada'
                                    : selected.status === 'COMPLETED' ? (isVideo ? '▶ Ver otra vez' : 'Repasar lección')
                                    :                                   (isVideo ? '▶ Ver video'     : 'Iniciar lección')}
                                </button>
                            </motion.div>
                        </motion.div>
                    )
                })()}
            </AnimatePresence>
        </div>
    )
}
